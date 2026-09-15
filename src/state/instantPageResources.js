import { createDisplayScope, displayPool } from './displayReads.js';
import { sessionStore } from './sessionStore.js';
import { getPageContext, registerPageCleanup } from '../utils/pageLifecycle.js';
import { fingerprint } from '../services/actionGateway.js';

const resources = new Map();
const MAX_BYTES = 64 * 1024 * 1024;
const MAX_KEYS_PER_ROUTE = 8;
let sequence = 0;
function copy(value) {
  if (value == null || typeof value !== 'object' || typeof value.toMillis === 'function') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(copy);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
}
function signature(snapshot) {
  return fingerprint(snapshot.docs ? snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    : snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
}
function discard(resource, entry) {
  clearTimeout(entry.timer);
  entry.generation++;
  displayPool.releaseOwner(entry.owner, true);
  resource.entries.delete(entry.key);
  if(!resource.active && resource.viewRevision?.key===entry.key)resource.viewRevision=null;
}
function trim() {
  const entries = [...resources.values()].flatMap(resource => [...resource.entries.values()].map(entry => ({ resource, entry })));
  let bytes = entries.reduce((sum, { entry }) => sum + (entry.bytes || 0), 0);
  for (const { resource, entry } of entries.sort((a, b) => a.entry.access - b.entry.access)) {
    if (resource.active && resource.viewRevision?.key === entry.key || entry.promise) continue;
    if (bytes <= MAX_BYTES && resource.entries.size <= MAX_KEYS_PER_ROUTE) continue;
    bytes -= entry.bytes || 0;
    discard(resource, entry);
  }
}
sessionStore.onClear(() => {
  for (const resource of resources.values()) {
    for (const entry of resource.entries.values()) discard(resource, entry);
    resource.viewRevision = null;
    resource.active = false;
    resource.context = null;
    resource.boundContext = null;
    resource.onChange = null;
    resource.blocked = !!resource.pending;
  }
});

// Preparing a model never changes the baseline of an active form.
export function instantPageResource(route) {
  if (resources.has(route)) return resources.get(route);
  const resource = {
    route, entries: new Map(), viewRevision: null, active: false, context: null,
    busy: false, blocked: false, pending: null, loadId: 0,
    get observations() { return this.viewRevision?.observations || []; },
    get model() { return this.viewRevision?.model || null; },
    get dirty() { return this.entries.get(this.viewRevision?.key)?.dirty ?? true; },
    getCommandBaseline() { return this.viewRevision?.observations || []; },
    invalidate() { for (const entry of this.entries.values()) entry.dirty = true; },
    disconnect() {
      for (const entry of this.entries.values()) {
        clearTimeout(entry.timer);
        displayPool.releaseOwner(entry.owner, true);
        entry.dirty = true;
      }
    },
    async prepare(key, loader, { force = false, cacheOnly = false } = {}) {
      let entry = this.entries.get(key);
      if (!entry) {
        entry = { key, owner: 'instant:' + route + ':' + key, dirty: true, generation: 0, access: ++sequence };
        this.entries.set(key, entry);
      }
      entry.access = ++sequence;
      if (cacheOnly && entry.revision) return entry.revision;
      if (!force && entry.promise) {
        if(!cacheOnly && entry.cacheOnly)return entry.promise.catch(error=>{
          if(error.code==='cache-miss')return this.prepare(key,loader,{force:true});
          throw error;
        });
        return entry.promise;
      }
      if (!force && entry.revision && !entry.dirty) return entry.revision;
      if (force) displayPool.releaseOwner(entry.owner, true);
      const generation = ++entry.generation, epoch = sessionStore.epoch;
      let changedDuringRead = false;
      displayPool.onChange(entry.owner, event => {
        changedDuringRead = true;
        entry.dirty = true;
        if (event.error?.code === 'permission-denied') {
          entry.revision = null;
          if (this.viewRevision?.key === key) this.viewRevision = null;
        }
        if (this.active && this.viewRevision?.key === key && this.context?.isCurrent()) this.onChange?.(event);
        else if (event.error?.code === 'permission-denied' && this.active) this.onChange?.(event);
      });
      const reader = createDisplayScope(entry.owner), observations = [], readTasks=[];
      let readFailure=null;
      const track = kind => ref => {
        const task=(async()=>{
          try {
            if (cacheOnly && !displayPool.peek(ref, kind === 'getDoc' ? 'doc' : 'query')) {
              throw Object.assign(new Error('아직 준비되지 않은 자료입니다.'), { code: 'cache-miss' });
            }
            const snapshot = await reader[kind](ref);
            observations.push({ kind, ref, fingerprint: signature(snapshot),observedAt:displayPool.confirmedAt(ref,kind==='getDoc'?'doc':'query') });
            return snapshot;
          }catch(error){readFailure ||= error;throw error;}
        })();
        readTasks.push(task);
        return task;
      };
      const request = (async () => {
        const model = await loader({ ...reader, getDoc: track('getDoc'), getDocs: track('getDocs') });
        await Promise.allSettled(readTasks);
        if(readFailure)throw readFailure;
        if (epoch !== sessionStore.epoch || generation !== entry.generation) return null;
        const times=observations.map(o=>o.observedAt).filter(Boolean);
        const revision = Object.freeze({ key, epoch, id: ++sequence, model: copy(model), observations:Object.freeze(observations), observedAt:times.length?Math.min(...times):Date.now() });
        entry.revision = revision;
        entry.dirty = changedDuringRead;
        entry.bytes = JSON.stringify(model).length * 2 + observations.reduce((n, o) => n + o.fingerprint.length * 2, 0);
        return revision;
      })();
      entry.promise = request;
      entry.cacheOnly = cacheOnly;
      try { return await request; }
      catch (error) {
        if (!entry.revision && generation===entry.generation && epoch===sessionStore.epoch) { displayPool.releaseOwner(entry.owner, true); this.entries.delete(key); }
        throw error;
      }
      finally {
        if (entry.promise === request) entry.promise = null;
        // A preparation owner has a bounded listener lifetime even without activation.
        if (epoch===sessionStore.epoch && this.entries.get(key)===entry && (!this.active || this.viewRevision?.key !== key)) this.releaseEntry(entry);
        trim();
      }
    },
    releaseEntry(entry) {
      clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        if(this.entries.get(entry.key)!==entry)return;
        if (this.active && this.viewRevision?.key === entry.key) return;
        displayPool.releaseOwner(entry.owner, true);
        entry.dirty = true;
      }, 30000);
      entry.timer.unref?.();
    },
    activate(context, revision) {
      if (!revision || revision.epoch !== sessionStore.epoch || context && !context.isCurrent()) return null;
      this.viewRevision = revision;
      const entry = this.entries.get(revision.key);
      if(context?.host?.dataset) {
        context.host.dataset.viewStale=String(!!entry?.dirty);
        context.host.dataset.viewObservedAt=String(revision.observedAt);
      }
      if (entry) { clearTimeout(entry.timer); entry.access = ++sequence; }
      return copy(revision.model);
    },
    async load(loader, { key = 'default', onChange, force = false } = {}) {
      const context = getPageContext(), loadId = ++this.loadId;
      this.context = context;
      this.active = true;
      this.onChange = onChange;
      if (this.boundContext !== context) {
        this.boundContext = context;
        registerPageCleanup(() => {
          if (this.context !== context) return;
          this.active = false;
          this.context = null;
          this.boundContext = null;
          this.onChange = null;
          for (const entry of this.entries.values()) this.releaseEntry(entry);
          trim();
        });
      }
      const entry = this.entries.get(key);
      if (!force && !this.blocked && entry?.revision) {
        const model = this.activate(context, entry.revision);
        if (entry.dirty) {
          this.prepare(key, loader).then(revision => {
            if (!revision || loadId !== this.loadId || context && !context.isCurrent()) return;
            this.onChange?.({});
          }).catch(error => {
            if (loadId === this.loadId && (!context || context.isCurrent())) this.onChange?.({ error });
          });
        }
        return model;
      }
      const revision = await this.prepare(key, loader, { force: force || this.blocked });
      if (loadId !== this.loadId) return null;
      this.blocked = !!this.pending;
      return this.activate(context, revision);
    },
  };
  resources.set(route, resource);
  return resource;
}
export function inspectInstantResources() {
  return [...resources.values()].map(r => ({ route: r.route, active: r.active, cached: r.entries.size > 0,
    dirty: r.dirty, keys: r.entries.size, bytes: [...r.entries.values()].reduce((n, e) => n + (e.bytes || 0), 0) }));
}
