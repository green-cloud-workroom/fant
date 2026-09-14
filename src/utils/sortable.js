import Sortable from 'sortablejs';
import { registerPageCleanup } from './pageLifecycle.js';
export default class ManagedSortable extends Sortable {
  constructor(...args) {
    super(...args);
    this._unregister = registerPageCleanup(() => this.destroy());
  }
  destroy() {
    if (this._disposed) return;
    this._disposed = true;
    this._unregister?.();
    super.destroy();
  }
}
