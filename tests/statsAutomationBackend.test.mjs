// Local-only backend contract tests. All Firebase modules are synthetic; no ADC/network.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as crypto from 'node:crypto';
import * as core from '../src/services/statsAutomation.js';
import { validDate } from '../src/services/statsLogic.js';
const requireBackend = createRequire(process.env.FANT_STATS_BACKEND_PACKAGE || new URL('../../fantapet-inventory/functions/package.json', import.meta.url));
const ts = requireBackend('typescript');

test('an already sent quantity warning is enriched by duplicate evidence without a second confirm on subsequent runs', async () => {
  const e = await backend({ approvedRelease: true });
  e.records.set('productionStatsAutomation/control', e.config);
  e.addRecipient('owner', 'owner'); e.addRecipient('office', 'office');
  for (const id of ['a', 'b']) e.records.set('bagLogs/' + id, { id, date: '2026-10-22', type: 'incoming', bagTypeId: 'b', qty: 96000 });
  const old = { kind: 'quantity', key: 'existing-quantity-key', state: 'open', firstSeen: '2026-10-22', episode: 1,
    notificationLevel: 2, escalation: 0, title: '기존 수량 확인', target: 'stats', recipientRoles: ['office', 'owner'],
    acknowledgements: { office: 'read' }, evidence: { source: 'bagLogs/b', itemId: 'bagLogs:b', date: '2026-10-22',
      qty: 96000, baseline: 96, ratio: 1000, samples: 6, unit: '장', stage: '봉투' } };
  await e.api.deliverStatsIssue(old, e.config);
  e.records.set('productionStatsAutomation/liveState', { issues: { [old.key]: old } });
  for (const [path, row] of e.records) if (path.startsWith('confirmRequests/')) {
    row.approverAcknowledgedAt = 'READ'; row.status = '확인'; row.replies = ['기존 대화'];
  }
  const result = await e.api.runStatsShadow(); assert.equal(result.actualDeliveries, 0);
  const first = structuredClone([...e.records].filter(([p]) => p.startsWith('confirmRequests/')));
  assert.equal(first.length, 2);
  for (const [, row] of first) { assert.match(row.body, /중복|여러 건/); assert.equal(row.status, '확인'); assert.deepEqual(row.replies, ['기존 대화']); }
  assert.equal((await e.api.runStatsShadow()).actualDeliveries, 0);
  assert.deepEqual([...e.records].filter(([p]) => p.startsWith('confirmRequests/')), first);
});

test('new receipt-integrity alerts: daily/concurrent retries preserve existing read and conversation history', async () => {
  for (const brokenCancel of [false, true]) {
    const e = await backend({ approvedRelease: true });
    e.records.set('productionStatsAutomation/control', e.config);
    e.addRecipient('owner', 'owner'); e.addRecipient('office', 'office');
    const original = { id: 'a', date: '2026-10-22', type: 'incoming', bagTypeId: 'b', qty: 96000 };
    const second = { ...original, id: 'b' };
    e.records.set('bagLogs/a', original); e.records.set('bagLogs/b', second);
    e.records.set('bagTypes/b', { currentQty: 192000 });
    e.records.set('equipmentParts/p', { replacementIntervalDays: 90 });
    if (brokenCancel) e.records.set('bagLogs/cancel_v1_b', { ...second, id: 'cancel_v1_b', type: 'adjust',
      qty: -95000, before: 192000, after: 97000, manualMovement: { version: 1, kind: 'cancel', cancelOf: 'b',
        originalKind: 'receipt', enteredAmount: -95000, reason: '중복 취소', changesStock: true } });
    const operational = new Map([...e.records].filter(([path]) => !path.startsWith('productionStats')));
    assert.equal((await e.api.runStatsShadow()).actualDeliveries, 2);
    const confirms = [...e.records].filter(([p]) => p.startsWith('confirmRequests/'));
    for (const [, row] of confirms) {
      row.approverAcknowledgedAt = 'READ'; row.status = '확인'; row.answer = '확인합니다';
      row.replies = [{ uid: 'office', text: '기존 대화', at: 'before' }];
    }
    const before = structuredClone(confirms);
    const retries = await Promise.all([e.api.runStatsShadow(), e.api.runStatsShadow(), e.api.runStatsShadow()]);
    assert.ok(retries.every(r => r.actualDeliveries === 0));
    assert.deepEqual([...e.records].filter(([p]) => p.startsWith('confirmRequests/')), before);
    for (const [path, row] of operational) assert.deepEqual(e.records.get(path), row);
    assert.ok(e.writes.every(p => p.startsWith('productionStatsAutomation') || p.startsWith('confirmRequests/')));
    assert.ok(!e.writes.some(p => p.startsWith('activityLogs/') || p.startsWith('productionStatsDeliveries/')));
  }
});

async function backend({ approvedRelease = false } = {}) {
  const records = new Map(), users = new Map(), writes = [], reads = [];
  const clone = v => v == null ? v : structuredClone(v);
  const get = (obj, path) => path.split('.').reduce((v, k) => v?.[k], obj);
  const doc = path => ({ path, get: async () => snapshot(path), update: async patch => {
    assert.ok(records.has(path)); records.set(path, { ...records.get(path), ...clone(patch) }); writes.push(path);
  } });
  function snapshot(path) { return { id: path.split('/').at(-1), ref: doc(path), exists: records.has(path), data: () => clone(records.get(path)) }; }
  function collection(path, filters = []) { return { path, filters,
    where: (field, op, value) => collection(path, [...filters, { field, op, value }]),
    get: async () => querySnapshot({ path, filters }) }; }
  function querySnapshot(ref) {
    reads.push(ref.path);
    return { docs: [...records.keys()].filter(path => path.split('/').slice(0, -1).join('/') === ref.path
      && ref.filters.every(f => f.op === 'in' ? f.value.includes(get(records.get(path), f.field)) : get(records.get(path), f.field) === f.value)).map(snapshot) };
  }
  // Serialize transactions to model conflict retries without exposing a real SDK.
  let queue = Promise.resolve();
  const db = { doc, collection, runTransaction: (fn, options) => {
    const work = queue.then(async () => {
      const staged = [];
      const tx = { get: async ref => { reads.push(ref.path); return ref.filters ? querySnapshot(ref) : snapshot(ref.path); },
        set: (ref, value) => staged.push(() => { records.set(ref.path, clone(value)); writes.push(ref.path); }),
        create: (ref, value) => staged.push(() => { assert.ok(!records.has(ref.path), 'create-only conflict'); records.set(ref.path, clone(value)); writes.push(ref.path); }),
        update: (ref, value) => staged.push(() => { assert.ok(records.has(ref.path)); records.set(ref.path, { ...records.get(ref.path), ...clone(value) }); writes.push(ref.path); }) };
      const result = await fn(tx);
      if (options?.readOnly) assert.equal(staged.length, 0);
      staged.forEach(write => write()); return result;
    });
    queue = work.catch(() => {}); return work;
  } };
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ['2026-10-22T03:00:00Z'])); }
    static now() { return Date.parse('2026-10-22T03:00:00Z'); } }
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const context = vm.createContext({ console, Date: FixedDate, Buffer, structuredClone, process: { env: { PRODUCTION_STATS_CONFIRM_DELIVERY: approvedRelease ? 'enabled' : '' } } });
  const mocks = {
    'node:crypto': crypto,
    'firebase-admin/auth': { getAuth: () => ({ getUser: async uid => { if (!users.has(uid)) throw Error('missing auth'); return clone(users.get(uid)); } }) },
    'firebase-admin/firestore': { getFirestore: () => db, FieldValue: { serverTimestamp: () => 'SERVER_TIME' } },
    'firebase-functions/v2/https': { onCall: (_, handler) => handler, HttpsError },
    'firebase-functions/v2/scheduler': { onSchedule: (_, handler) => handler },
    'firebase-functions/v2/firestore': { onDocumentCreated: (_, handler) => handler },
    './statsAutomation.js': { ...core, DELIVERY_RELEASED: approvedRelease },
    './statsLogic.js': { validDate },
  };
  const source = ts.transpileModule(await readFile('integrations/productionStats/server.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = new vm.SourceTextModule(source, { context });
  await module.link(id => {
    const exports = mocks[id]; if (!exports) throw Error('Unexpected/live import: ' + id);
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [k, v] of Object.entries(exports)) this.setExport(k, v); }, { context });
  });
  await module.evaluate();
  const api = module.namespace;
  function addRecipient(uid, role, overrides = {}) {
    const profile = { displayName: uid, status: '재직', payrollCompany: '판타펫', teamType: role === 'owner' ? '기타' : '사무', ...overrides };
    records.set('users/' + uid, profile);
    users.set(uid, { disabled: false, customClaims: { app: ['operations', 'production'],
      roles: { operations: { role: role === 'owner' ? '대표' : '직원' }, production: role === 'owner' ? 'admin' : 'office' } } });
  }
  const config = { mode: 'live', deliveryEnabled: true, ownerUid: 'owner', activationDate: '2026-10-22', validatedVersion: core.AUTOMATION_VERSION };
  const item = { kind: 'shortage', key: 'shortage:egg', episode: 1, escalation: 0, popup: true,
    title: '계란 소진 위험 검토', recipientRoles: ['office', 'owner'], target: 'stats',
    evidence: { itemId: 'eggLogs:egg', qty: 1, unit: '개', calendarDailyMean: 6, estimatedDaysLeft: 1 / 6, note: '추정' } };
  return { api, records, users, writes, reads, addRecipient, config, item };
}

test('invalid correction evidence aborts statistics without touching confirms, inventory or equipment records', async () => {
  const e = await backend({ approvedRelease: true });
  e.records.set('productionStatsAutomation/control', e.config);
  const protectedRows = {
    'confirmRequests/existing': { body: '기존 본문', approverAcknowledgedAt: 'seen', comments: ['대화'], statsSource: { key: 'unchanged', episode: 1 } },
    'equipmentParts/part': { replacementIntervalDays: 90, replacedAt: '2026-09-01' },
    'bagTypes/bag': { currentQty: 1234, minimumQty: 100 },
  };
  for (const [path, value] of Object.entries(protectedRows)) e.records.set(path, structuredClone(value));
  e.records.set('statsCorrections/bad', { schemaVersion: 1, id: 'bad', kind: 'excludeSupply', status: 'active',
    source: 'meatLogs/missing', reason: 'stale basis', changesStock: false,
    evidence: [{ path: 'meatLogs/missing', expected: { id: 'missing', delta: 1000 } }] });
  await assert.rejects(e.api.runStatsShadow(), /통계 정정/);
  assert.equal(e.writes.length, 0);
  for (const [path, value] of Object.entries(protectedRows)) assert.deepEqual(e.records.get(path), value);
});

test('missing server release environment blocks delivery even with live configuration and direct handler call', async () => {
  const e = await backend();
  const result = await e.api.deliverStatsIssue(e.item, e.config, () => { throw Error('Recipient lookup must not run'); });
  assert.equal(result.state, 'blocked'); assert.equal(e.reads.length, 0); assert.equal(e.writes.length, 0);
  e.records.set('productionStatsAutomation/control', e.config);
  assert.equal((await e.api.runStatsShadow()).state, 'disabled'); assert.equal(e.writes.length, 0);
});
test('shadow daily evaluates source in read-only snapshot, writes only verification collections', async () => {
  const e = await backend(); e.records.set('productionStatsAutomation/control', { mode: 'shadow', shadowEnabled: true });
  const result = await e.api.runStatsShadow();
  assert.equal(result.actualDeliveries, 0);
  assert.ok(e.writes.length > 0);
  assert.ok(e.writes.every(p => p.startsWith('productionStatsAutomation/') || p.startsWith('productionStatsAutomationReports/')));
});
test('missing control disables schedule without scanning operational sources', async () => {
  const e = await backend(); assert.equal((await e.api.runStatsShadow()).state, 'disabled');
  assert.equal(e.writes.length, 0); assert.ok(!e.reads.includes('meatLogs'));
});
test('synthetic approved release: retries and simultaneous attempts create one private request per recipient', async () => {
  const e = await backend({ approvedRelease: true }); e.addRecipient('office', 'office'); e.addRecipient('owner', 'owner');
  e.records.set('productionStatsAutomation/control', e.config);
  await Promise.all([e.api.deliverStatsIssue(e.item, e.config), e.api.deliverStatsIssue(e.item, e.config)]);
  await e.api.deliverStatsIssue(e.item, e.config);
  const requests = [...e.records].filter(([p]) => p.startsWith('confirmRequests/'));
  assert.equal(requests.length, 2);
  assert.ok(requests.every(([, d]) => d.boardPublic === false && d.participantUids.length === 2));
  const office = requests.find(([, d]) => d.approverUid === 'office'); office[1].acknowledgedUids = ['office'];
  await e.api.deliverStatsIssue(e.item, e.config);
  assert.deepEqual(e.records.get(office[0]).acknowledgedUids, ['office']);
  assert.equal(requests.find(([, d]) => d.approverUid === 'owner')[1].acknowledgedUids, undefined);
});
test('invalid or disabled recipient aborts whole delivery and validates actual operations claims', async () => {
  for (const broken of ['disabled', 'otherCompany', 'wrongClaim', 'resigned']) {
    const e = await backend({ approvedRelease: true }); e.addRecipient('office', 'office'); e.addRecipient('owner', 'owner');
    if (broken === 'disabled') e.users.get('owner').disabled = true;
    if (broken === 'otherCompany') e.records.get('users/owner').payrollCompany = '은수';
    if (broken === 'wrongClaim') e.users.get('owner').customClaims.roles.operations.role = '직원';
    if (broken === 'resigned') e.records.get('users/owner').status = '퇴사';
    e.records.set('productionStatsAutomation/control', e.config);
    await assert.rejects(e.api.deliverStatsIssue(e.item, e.config)); assert.equal(e.writes.length, 0);
  }
});
test('release control is rechecked inside transaction before any delivery write', async () => {
  const e = await backend({ approvedRelease: true }); e.addRecipient('office', 'office'); e.addRecipient('owner', 'owner');
  e.records.set('productionStatsAutomation/control', { ...e.config, deliveryEnabled: false });
  await assert.rejects(e.api.deliverStatsIssue(e.item, e.config)); assert.equal(e.writes.length, 0);
});
test('an existing mismatched fixed-ID request aborts delivery without overwriting or partial recipients', async () => {
  const e = await backend({ approvedRelease: true }); e.addRecipient('office', 'office'); e.addRecipient('owner', 'owner');
  e.records.set('productionStatsAutomation/control', e.config);
  const id = 'stats-' + crypto.createHash('sha256').update(core.deliveryIdentity(e.item, 'owner')).digest('hex');
  e.records.set('confirmRequests/' + id, { approverUid: 'other', body: 'preserve' });
  await assert.rejects(e.api.deliverStatsIssue(e.item, e.config));
  assert.equal(e.writes.length, 0); assert.equal(e.records.get('confirmRequests/' + id).body, 'preserve');
});
test('confirm-only contract has no popup handlers or delivery documents, even for production-authorized recipients', async () => {
  const e = await backend({ approvedRelease: true }); e.addRecipient('office', 'office'); e.addRecipient('owner', 'owner');
  e.records.set('productionStatsAutomation/control', e.config);
  await e.api.deliverStatsIssue(e.item, e.config);
  assert.equal(e.api.productionStatsInbox, undefined);
  assert.equal(e.api.acknowledgeProductionStatsPopup, undefined);
  assert.ok(e.writes.every(p => p.startsWith('confirmRequests/')));
  assert.ok(!e.reads.includes('productionStatsDeliveries'));
  const recipients = await e.api.resolveStatsRecipients('owner');
  assert.ok(recipients.every(r => !('popup' in r)));
});


test('existing acknowledged confirm receives adjustment context in place with zero new deliveries', async () => {
  const e=await backend({approvedRelease:true});e.addRecipient('office','office');e.addRecipient('owner','owner');
  e.item.kind='quantity';e.records.set('productionStatsAutomation/control',e.config);
  await e.api.deliverStatsIssue(e.item,e.config);
  const first=[...e.records].find(([p,d])=>p.startsWith('confirmRequests/')&&d.approverUid==='office');
  Object.assign(first[1],{acknowledgedUids:['office'],acknowledgements:[{uid:'office',at:'seen'}],replies:[{text:'보존'}]});
  const preserved=structuredClone(first[1]);
  e.item.evidence.followingAdjustments=[{source:'meatLogs/adjust',at:'2026-10-22T05:14:33Z',before:47.5,after:475,unit:'kg',staff:'박형수',reason:'실수'}];
  assert.equal((await e.api.deliverStatsIssue(e.item,e.config)).created,0);
  const updated=e.records.get(first[0]);assert.match(updated.body,/47.5kg → 475kg/);
  for(const key of ['acknowledgedUids','acknowledgements','replies','contentRevision','lastActorUid','createdAt','status','statsSource']) assert.deepEqual(updated[key],preserved[key]);
  const writes=e.writes.length;await e.api.deliverStatsIssue(e.item,e.config);assert.equal(e.writes.length,writes);
  assert.equal([...e.records.keys()].filter(p=>p.startsWith('confirmRequests/')).length,2);
});


async function adjustmentBackend(withRequests=true) {
  const e=await backend({approvedRelease:true});e.addRecipient('office','office');e.addRecipient('owner','owner');
  e.records.set('productionStatsAutomation/control',e.config);
  e.item.kind='quantity';e.item.key=JSON.stringify(['quantity',['meatLogs/receipt','meatLogs:heart','원료']]);
  e.item.evidence={date:'2026-10-22',qty:47.5,baseline:960,samples:7,unit:'kg',source:'meatLogs/receipt'};
  e.records.set('meatLogs/receipt',{type:'frozenIncoming',meatTypeId:'heart',meatStockId:'lot',stage:'frozen',date:'2026-10-22',timestamp:'2026-10-22T05:13:58Z',delta:47500});
  e.records.set('meatLogs/adjustment',{type:'adjust',meatTypeId:'heart',meatStockId:'lot',stage:'frozen',date:'2026-10-22',timestamp:'2026-10-22T05:14:33Z',before:47500,after:475000,delta:427500,staff:'박형수',reason:'실수'});
  if(withRequests)await e.api.deliverStatsIssue(e.item,e.config);
  return e;
}

test('adjustment event immediately enriches only existing confirms, duplicate/concurrent events do not resend',async()=>{
  const e=await adjustmentBackend();const requests=[...e.records].filter(([p])=>p.startsWith('confirmRequests/'));
  Object.assign(requests[0][1],{acknowledgedUids:['office'],acknowledgements:[{uid:'office',at:'seen'}],replies:[{text:'보존'}]});
  const before=structuredClone(requests[0][1]);
  const event={params:{logId:'adjustment'},data:{data:()=>e.records.get('meatLogs/adjustment')}};
  const results=await Promise.all([e.api.onProductionStatsAdjustmentCreated(event),e.api.onProductionStatsAdjustmentCreated(event)]);
  assert.equal(results.reduce((n,r)=>n+r.updated,0),2);assert.ok(results.every(r=>r.created===0));
  const after=e.records.get(requests[0][0]);assert.match(after.body,/47.5kg → 475kg/);assert.match(after.body,/박형수/);
  for(const key of ['acknowledgedUids','acknowledgements','replies','statsSource','status','contentRevision','lastActorUid','createdAt'])assert.deepEqual(after[key],before[key]);
  const writes=e.writes.length;assert.equal((await e.api.enrichStatsForAdjustment('adjustment')).updated,0);assert.equal(e.writes.length,writes);
  assert.equal([...e.records.keys()].filter(p=>p.startsWith('confirmRequests/')).length,2);
  assert.ok(e.writes.every(p=>p.startsWith('confirmRequests/')));
  assert.ok(!e.reads.includes('productions')&&!e.reads.includes('productionStatsAutomation/liveState'));
});

test('adjustment event with no prior alert never creates one; other types, disabled control and resolved requests are untouched',async()=>{
  const e=await adjustmentBackend(false);assert.equal((await e.api.enrichStatsForAdjustment('adjustment')).updated,0);assert.equal(e.writes.length,0);
  const reads=e.reads.length;await e.api.onProductionStatsAdjustmentCreated({params:{logId:'receipt'},data:{data:()=>({type:'frozenIncoming'})}});assert.equal(e.reads.length,reads);
  const f=await adjustmentBackend();const count=f.writes.length;
  for(const [path,row]of f.records)if(path.startsWith('confirmRequests/'))row.cancelled=true;
  assert.equal((await f.api.enrichStatsForAdjustment('adjustment')).updated,0);assert.equal(f.writes.length,count);
  f.records.set('productionStatsAutomation/control',{...f.config,deliveryEnabled:false});
  assert.equal((await f.api.enrichStatsForAdjustment('adjustment')).updated,0);assert.equal(f.writes.length,count);
});

test('out-of-order adjustment events refresh from the latest stock history and cannot revert newer context',async()=>{
  const e=await adjustmentBackend();e.records.set('meatLogs/later',{...e.records.get('meatLogs/adjustment'),timestamp:'2026-10-22T06:00:00Z',before:475000,after:400000,delta:-75000,reason:'후속 조정'});
  assert.equal((await e.api.enrichStatsForAdjustment('later')).updated,2);
  const body=[...e.records].find(([p])=>p.startsWith('confirmRequests/'))[1].body;
  assert.match(body,/475kg → 400kg/);assert.equal((await e.api.enrichStatsForAdjustment('adjustment')).updated,0);
  assert.equal([...e.records].find(([p])=>p.startsWith('confirmRequests/'))[1].body,body);
});
