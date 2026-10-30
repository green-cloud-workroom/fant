import {movementAmount, movementLabel} from '../services/manualMovementLogic.js';

// Display only: resolve references within the already loaded collection, never fetch.
// Return plain text so each HTML sink retains its existing escapeHtml boundary.
export function movementNote(text, collectionName, logs, fallbackLabel) {
  return String(text).replace(/취소 원본: ([A-Za-z]+Logs)\/([^\s·/]+)/g, (match, name, id) => {
    if (name !== collectionName) return match;
    const source = logs.find(row => row.id === id);
    if (!source) return '취소 원본: 이전 이력';
    const date = /^\d{4}-(\d{2})-(\d{2})$/.exec(source.date || '');
    const amount = movementAmount(source);
    if (!date || !Number.isFinite(amount)) return '취소 원본: 이전 이력';
    return `취소 원본: ${date[1]}/${date[2]} ${movementLabel(source, fallbackLabel(source))} ${amount >= 0 ? '+' : ''}${amount}`;
  });
}
