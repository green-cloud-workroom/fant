import { formatIngredientQtyValue } from './number.js';

export const CHICKEN_ORDER_NAMES = ['닭가슴살', '닭정육', '통닭', '닭목뼈', '닭안심'];

export function buildChickenOrderText(productionsArr = []) {
  const totals = new Map();

  productionsArr.forEach(production => {
    (production.ingredientsSnapshot || []).forEach(ing => {
      const name = (ing.name || '').trim();
      if (!name) return;
      totals.set(name, (totals.get(name) || 0) + Number(ing.requiredQtyG || 0));
    });
  });

  const parts = CHICKEN_ORDER_NAMES
    .map(name => {
      const totalG = totals.get(name) || 0;
      if (totalG <= 0) return '';
      return `${name} ${formatIngredientQtyValue(totalG, 'kg')}kg`;
    })
    .filter(Boolean);

  return parts.length ? parts.join(', ') : null;
}

function showCopyFallbackModal(text, fallbackTitle = '복사') {
  const existing = document.getElementById('orderCopyFallbackModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'orderCopyFallbackModal';
  overlay.innerHTML = `
    <div class="modal-box" style="width:480px;">
      <h3 class="modal-title">${fallbackTitle}</h3>
      <p style="font-size:13px;color:#555;margin:0 0 10px;">클립보드 복사가 막혔습니다. 아래 내용을 직접 복사해주세요.</p>
      <textarea id="orderCopyFallbackText" style="width:100%;height:90px;font-size:13px;padding:10px;border:1px solid #d0d0d0;border-radius:6px;box-sizing:border-box;resize:none;"></textarea>
      <div class="modal-actions">
        <button class="btn-primary" id="orderCopyFallbackClose">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const textarea = overlay.querySelector('#orderCopyFallbackText');
  textarea.value = text;
  setTimeout(() => {
    textarea.focus();
    textarea.select();
  }, 50);
  overlay.querySelector('#orderCopyFallbackClose').addEventListener('click', () => overlay.remove());
}

export function copyTextToClipboard(text, fallbackTitle = '복사') {
  if (!navigator.clipboard?.writeText) {
    showCopyFallbackModal(text, fallbackTitle);
    return Promise.resolve(false);
  }
  return navigator.clipboard.writeText(text)
    .then(() => alert('복사되었습니다!'))
    .catch(() => showCopyFallbackModal(text, fallbackTitle));
}
