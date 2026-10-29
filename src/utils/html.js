// For HTML text and quoted ordinary attributes only. Not JS, URLs or CSS.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Keep hex colors (including legacy short hex), never interpolate raw CSS.
export function recipeColor(value, fallback = '#4A7C59') {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value)) ? String(value) : fallback;
}
