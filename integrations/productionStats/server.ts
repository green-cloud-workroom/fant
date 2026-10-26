// Installed into the shared functions source by scripts/syncStatsAutomationBackend.mjs.
// No production deployment or enabling is performed by that script.
import { createHash } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, type QuerySnapshot } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { validDate } from './statsLogic.js';
import { evaluateStatsAutomation, reconcileIssues, provenResolutions, confirmPayload, deliveryIdentity,
  AUTOMATION_VERSION, AUTOMATION_SOURCES, planStatsDeliveries, confirmAdjustmentPatch, followingStockAdjustments,
  normalIssueFingerprint, normalResolutionReason } from './statsAutomation.js';

type Data = Record<string, any>;
type Recipient = { uid: string; name: string; role: 'office' | 'owner' };
const REGION = 'asia-northeast3';
const SOURCES = AUTOMATION_SOURCES;
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const todayKST = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const configRef = () => getFirestore().doc('productionStatsAutomation/control');
const allowedCompany = (p: Data) => p.payrollCompany === '판타펫' || p.workCompanies?.includes('판타펫');

export async function resolveStatsRecipients(ownerUid: string): Promise<Recipient[]> {
  if (!ownerUid || ownerUid.includes('/')) throw Error('대표 수신자 설정이 필요합니다.');
  const db = getFirestore();
  const office = await db.collection('users').where('teamType', '==', '사무').get();
  const officeDocs = office.docs.filter(s => allowedCompany(s.data()) && ['재직', '수습'].includes(s.data().status));
  if (!officeDocs.length) throw Error('사무팀 수신자가 없습니다.');
  const proposed = [...officeDocs.filter(s => s.id !== ownerUid).map(s => ({ uid: s.id, role: 'office' as const })),
    { uid: ownerUid, role: 'owner' as const }];
  const recipients = await Promise.all(proposed.map(async ({ uid, role }) => {
    const [authUser, snapshot] = await Promise.all([getAuth().getUser(uid), db.doc('users/' + uid).get()]);
    const p = snapshot.data(), claims = authUser.customClaims;
    const operationsRole = claims?.roles?.operations?.role;
    if (!p || authUser.disabled || !allowedCompany(p) || !['재직', '수습'].includes(p.status)
      || !claims?.app?.includes('operations') || (role === 'owner' ? operationsRole !== '대표'
        : p.teamType !== '사무' || !['직원', '팀장'].includes(operationsRole))) throw Error('수신자 계정·권한 검증 실패');
    return { uid, name: String(p.displayName || uid), role };
  }));
  if (!recipients.some(r => r.role === 'office') || new Set(recipients.map(r => r.uid)).size !== recipients.length) throw Error('수신자 구성 오류');
  return recipients;
}

export async function readStatsSnapshot() {
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const snapshots = await Promise.all(SOURCES.map(name => tx.get(db.collection(name))));
    return Object.fromEntries(snapshots.map((s, i) => [SOURCES[i]!, s.docs.map(d => ({ ...d.data(), id: d.id }))]));
  }, { readOnly: true });
}

export async function previewStatsForServer(today = todayKST()) {
  const data = await readStatsSnapshot();
  return evaluateStatsAutomation(data, { today, complete: true } as any);
}
// Personal-confirm delivery requires a server-only release environment AND Admin-only configuration.
// do not reuse broadly client-writable settings/systemValues for release control.
function deliveryAllowed(config: Data) {
  return process.env.PRODUCTION_STATS_CONFIRM_DELIVERY === 'enabled' && config.deliveryEnabled === true && config.mode === 'live'
    && config.validatedVersion === AUTOMATION_VERSION && validDate(config.activationDate)
    && config.activationDate <= todayKST();
}

export async function deliverStatsIssue(item: Data, config: Data, resolve = resolveStatsRecipients) {
  if (!deliveryAllowed(config)) return { state: 'blocked', reason: '검증 완료 전 실제 발송 차단' };
  const recipients = await resolve(config.ownerUid); // resolve ALL before writing any
  const selected = recipients.filter(r => item.recipientRoles.includes(r.role));
  if (!selected.length) throw Error('수신자가 없습니다.');
  const db = getFirestore(), today = todayKST();
  const ids = selected.map(r => 'stats-' + hash(deliveryIdentity(item, r.uid)));
  const created = await db.runTransaction(async tx => {
    const control = (await tx.get(configRef())).data() || {};
    if (!deliveryAllowed(control)) throw Error('발송 차단 상태입니다.');
    const requests = await Promise.all(ids.map(id => tx.get(db.doc('confirmRequests/' + id))));
    const state = (await tx.get(db.doc('productionStatsAutomation/liveState'))).data();
    const latest = state?.issues?.[item.key];
    // A queued evaluator cannot re-send a concurrently closed/replaced episode.
    if (item.kind !== 'weekly' && latest && (latest.state !== 'open' || latest.episode !== item.episode)) return 0;
    let count = 0;
    for (const [index, recipient] of selected.entries()) {
      const id = ids[index]!;
      const old = requests[index]!.data();
      if (old && (old.approverUid !== recipient.uid || old.requesterUid !== 'system:production-stats'
        || old.statsSource?.key !== item.key || old.statsSource?.episode !== item.episode
        || old.statsSource?.escalation !== (item.escalation || 0)
        || (old.statsSource?.notificationLevel || 0) !== (item.notificationLevel || 0) || old.boardPublic !== false)) throw Error('기존 컨펌 식별 불일치');
      if (!requests[index]!.exists) { tx.create(db.doc('confirmRequests/' + id), {
        ...confirmPayload(item, recipient, today, id), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); count++; }
      else {
        const contextPatch = confirmAdjustmentPatch(old, item);
        if (contextPatch) tx.update(db.doc('confirmRequests/' + id), { ...contextPatch, updatedAt: FieldValue.serverTimestamp() });
      }
    }
    return count;
  });
  return { state: 'delivered', recipients: selected.length, created };
}

// Explicit human disposition, independent of read/ack/status/replies. No alert creation.
export async function resolveStatsIssue(request: Data, resolve = resolveStatsRecipients) {
  if (!request.auth) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  const input = request.data || {}, uid = request.auth.uid;
  if (!['inspect', 'normal'].includes(input.action) || typeof input.requestId !== 'string'
    || !/^stats-[a-f0-9]{64}$/.test(input.requestId)) throw new HttpsError('invalid-argument', '잘못된 요청입니다.');
  const db = getFirestore(), config = (await configRef().get()).data() || {};
  const recipients = await resolve(config.ownerUid);
  const actor = recipients.find(r => r.uid === uid);
  if (!actor) throw new HttpsError('permission-denied', '대표·사무팀 수신자만 종결할 수 있습니다.');
  return db.runTransaction(async tx => {
    const ref = db.doc('confirmRequests/' + input.requestId), stateRef = db.doc('productionStatsAutomation/liveState');
    const [snapshot, state, control] = await Promise.all([tx.get(ref), tx.get(stateRef), tx.get(configRef())]);
    if (control.data()?.ownerUid !== config.ownerUid) throw new HttpsError('aborted', '수신 설정이 변경됐습니다. 다시 열어주세요.');
    const old = snapshot.data(), source = old?.statsSource, issues = state.data()?.issues || {}, item = issues[source?.key];
    if (!old || old.requesterUid !== 'system:production-stats' || old.boardPublic !== false
      || source?.version !== AUTOMATION_VERSION || !item || item.episode !== source.episode
      || old.approverUid !== uid || input.requestId !== 'stats-' + hash(deliveryIdentity(source, uid)))
      throw new HttpsError('permission-denied', '현재 본인이 받은 통계 확인 건에서 처리해주세요.');
    if (item.state === 'resolved') return { resolved: true, reason: item.resolution?.reason || '원본 기록으로 조건 해소 확인' };
    const fingerprint = normalIssueFingerprint(item);
    if (!fingerprint) throw new HttpsError('failed-precondition', '이 종류는 원본 처리로 해소해주세요.');
    if (input.action === 'inspect') return { resolved: false, fingerprint, kind: item.kind, title: item.title,
      summary: `${item.evidence.date || ''} · ${item.evidence.qty ?? '?'}${item.evidence.unit || ''} · ${item.evidence.source || ''}` };
    if (input.fingerprint !== fingerprint) throw new HttpsError('failed-precondition', '확인 내용이 변경됐습니다. 다시 열어주세요.');
    // Validate against a fresh consistent source snapshot, not yesterday's evaluator.
    const snapshots = await Promise.all(SOURCES.map(name => tx.get(db.collection(name))));
    const data = Object.fromEntries(snapshots.map((s, i) => [SOURCES[i]!, s.docs.map(d => ({ ...d.data(), id: d.id }))]));
    const evaluation = evaluateStatsAutomation(data, { today: todayKST(), complete: true } as any);
    const current = evaluation.candidates.find((c: Data) => c.kind === item.kind && c.evidence.source === item.evidence.source);
    if (!current || normalIssueFingerprint(current) !== fingerprint)
      throw new HttpsError('failed-precondition', '원본 또는 판정이 변경됐습니다. 최신 통계를 확인해주세요.');
    let reason: string;
    try { reason = normalResolutionReason(item, input, old); }
    catch (error) { throw new HttpsError('invalid-argument', (error as Error).message); }
    const siblings = await tx.get(db.collection('confirmRequests').where('statsSource.key', '==', item.key));
    const resolution = { type: 'normal', fingerprint, reason, actorUid: uid, actorName: actor.name,
      requestId: input.requestId, at: new Date().toISOString() };
    const closed = { ...item, state: 'resolved', resolvedAt: todayKST(), resolution,
      history: [...(item.history || []), { episode: item.episode, resolvedAt: todayKST(), resolution }] };
    tx.update(stateRef, { issues: { ...issues, [item.key]: closed } });
    for (const s of siblings.docs) {
      const row = s.data();
      if (row.requesterUid === 'system:production-stats' && row.boardPublic === false
        && row.statsSource?.version === AUTOMATION_VERSION && row.statsSource.episode === item.episode
        && s.id === 'stats-' + hash(deliveryIdentity(row.statsSource, row.approverUid))) {
        tx.update(s.ref, { cancelled: true, statsResolvedAt: FieldValue.serverTimestamp(), statsResolution: resolution });
      }
    }
    return { resolved: true, reason };
  });
}
export const resolveProductionStatsIssue = onCall({ region: REGION, maxInstances: 1 }, request => resolveStatsIssue(request));

export async function runStatsShadow() {
  const db = getFirestore(), config = (await configRef().get()).data() || {};
  const live = config.mode === 'live' && deliveryAllowed(config);
  if (!live && (config.shadowEnabled !== true || config.mode !== 'shadow')) return { state: 'disabled' };
  const today = todayKST(), data = await readStatsSnapshot();
  const evaluation: Data = evaluateStatsAutomation(data, { today, complete: true } as any);
  const stateRef = db.doc('productionStatsAutomation/' + (live ? 'liveState' : 'shadowState'));
  if (evaluation.candidates.length > 300) throw Error('검증 후보 상한 초과: 분할 검토 필요');
  const outcome = await db.runTransaction(async tx => {
    const [control, state] = await Promise.all([tx.get(configRef()), tx.get(stateRef)]);
    if (live ? !deliveryAllowed(control.data() || {}) : control.data()?.shadowEnabled !== true || control.data()?.mode !== 'shadow') return null;
    const previous = state.data()?.issues || {};
    evaluation.resolvedKeys = provenResolutions(previous, data, today);
    const issues = reconcileIssues(previous, evaluation, { today,
      holidays: config.holidays || [], calendarComplete: Array.isArray(config.holidays)
        && config.validatedHolidaysThrough >= today } as any);
    if (Buffer.byteLength(JSON.stringify(issues)) > 650000) throw Error('검증 상태 상한 초과: 이력 보존 후 분할 필요');
    tx.set(stateRef, { issues, version: AUTOMATION_VERSION, evaluatedAt: FieldValue.serverTimestamp() });
    // Audit report only. No activityLogs, confirmRequests, popup deliveries or operational writes.
    const report = { ...evaluation, mode: live ? 'live' : 'shadow',
      observedAt: FieldValue.serverTimestamp(), actualDeliveries: live ? null : 0 };
    if (Buffer.byteLength(JSON.stringify(report)) > 800000) throw Error('검증 보고서 상한 초과');
    tx.set(db.doc('productionStatsAutomationReports/' + today), report);
    return { previous, issues };
  });
  let actualDeliveries = 0;
  if (live && outcome) {
    // Source facts close the issue; recipient read/ack/replies are never treated as resolution.
    for (const [key, row] of Object.entries(outcome.issues) as [string, Data][]) {
      if (row.state === 'resolved') await resolveDeliveredIssue(key, row.episode, config);
    }
    for (const item of planStatsDeliveries(outcome.issues, evaluation.weekly, { today, activationDate: config.activationDate }) as Data[]) {
      const delivery = await deliverStatsIssue(item, config);
      actualDeliveries += delivery.created || 0;
    }
    await db.doc('productionStatsAutomationReports/' + today).update({ actualDeliveries });
  }
  return { state: live ? 'live' : 'shadow', candidates: evaluation.candidates.length, actualDeliveries };
}
export const productionStatsShadowDaily = onSchedule({ region: REGION, schedule: '0 9 * * *',
  // A cold-start 429 happens before this handler runs. Scheduler retries must be
  // explicit; persisted per-recipient identities make an after-commit retry safe too.
  timeZone: 'Asia/Seoul', maxInstances: 1, retryCount: 3, maxRetrySeconds: 900,
  minBackoffSeconds: 60, maxBackoffSeconds: 300, maxDoublings: 2 }, async () => {
    const result = await runStatsShadow();
    console.info(JSON.stringify({ event: 'production_stats_schedule_complete', state: result.state,
      candidates: result.candidates ?? null, actualDeliveries: result.actualDeliveries ?? 0 }));
  });

// This path can update existing context only. It never evaluates or sends a new alert.
export async function enrichStatsForAdjustment(logId: string) {
  if (!logId || logId.includes('/')) return { updated: 0, created: 0 };
  const db = getFirestore();
  return db.runTransaction(async tx => {
    const [control, adjustment] = await Promise.all([tx.get(configRef()), tx.get(db.doc('meatLogs/' + logId))]);
    const row = adjustment.data();
    if (!deliveryAllowed(control.data() || {}) || row?.type !== 'adjust' || !row.meatStockId || !row.meatTypeId || !row.stage) return { updated: 0, created: 0 };
    const stockLogs = await tx.get(db.collection('meatLogs').where('meatStockId', '==', row.meatStockId));
    const data: { meatLogs: Data[] } = { meatLogs: stockLogs.docs.map(s => ({ ...s.data(), id: s.id })) };
    const items = new Map<string, Data>();
    for (const source of data.meatLogs) {
      if (source.type !== 'frozenIncoming' || ['deleted', 'cancelled', 'canceled'].includes(source.status)) continue;
      const reference = 'meatLogs/' + source.id;
      const following: Data[] = followingStockAdjustments(data, { source: reference }, todayKST());
      if (!following.some(a => a.source === 'meatLogs/' + logId)) continue;
      const key = JSON.stringify(['quantity', [reference, 'meatLogs:' + source.meatTypeId, '원료']]);
      items.set(key, { kind: 'quantity', evidence: { followingAdjustments: following } });
    }
    const keys = [...items.keys()], snapshots: QuerySnapshot[] = [];
    for (let start = 0; start < keys.length; start += 10) snapshots.push(await tx.get(
      db.collection('confirmRequests').where('statsSource.key', 'in', keys.slice(start, start + 10))));
    let updated = 0;
    for (const snapshot of snapshots) for (const request of snapshot.docs) {
      const old = request.data(), item = items.get(old.statsSource?.key);
      if (!item || old.requesterUid !== 'system:production-stats' || old.boardPublic !== false
        || old.statsSource?.version !== AUTOMATION_VERSION || !old.approverUid
        || request.id !== 'stats-' + hash(deliveryIdentity(old.statsSource, old.approverUid))) continue;
      const patch = confirmAdjustmentPatch(old, item);
      if (patch) { tx.update(request.ref, { ...patch, updatedAt: FieldValue.serverTimestamp() }); updated++; }
    }
    return { updated, created: 0 };
  });
}

export const onProductionStatsAdjustmentCreated = onDocumentCreated({ region: REGION,
  document: 'meatLogs/{logId}', maxInstances: 1, retry: true }, async event => {
  if (event.data?.data()?.type !== 'adjust') return;
  return enrichStatsForAdjustment(event.params.logId);
});

async function resolveDeliveredIssue(key: string, episode: number, config: Data) {
  if (!deliveryAllowed(config)) return;
  const db = getFirestore();
  await db.runTransaction(async tx => {
    const control = (await tx.get(configRef())).data() || {};
    if (!deliveryAllowed(control)) return;
    const requests = await tx.get(db.collection('confirmRequests').where('statsSource.key', '==', key));
    for (const s of requests.docs) if (s.data().statsSource?.episode === episode && !s.data().statsResolvedAt) tx.update(s.ref, {
      cancelled: true, statsResolvedAt: FieldValue.serverTimestamp(),
      body: s.data().body + '\n\n원본 기록으로 조건 해소를 확인했습니다. 기존 대화·확인 이력은 보존합니다.' });

  });
}
