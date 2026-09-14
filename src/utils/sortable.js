import Sortable from 'sortablejs';
import { registerPageCleanup } from './pageLifecycle.js';
const instances=new Set();
export default class ManagedSortable extends Sortable {
  static create(...args) { return new this(...args); }
  constructor(...args) {
    for(const old of instances)if(old._host?.isConnected===false)old.destroy();
    super(...args);
    this._host=args[0];instances.add(this);
    this._unregister = registerPageCleanup(() => this.destroy());
  }
  destroy() {
    if (this._disposed) return;
    this._disposed = true;
    instances.delete(this);
    this._unregister?.();
    super.destroy();
  }
}
