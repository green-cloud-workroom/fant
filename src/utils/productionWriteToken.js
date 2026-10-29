// A fresh token on every write lets Rules reject unchanged legacy payloads.
// This is a compatibility fence, not authentication or optimistic concurrency.
export function newProductionWriteToken(source = globalThis.crypto) {
  if (typeof source?.randomUUID === 'function') return source.randomUUID();
  if (typeof source?.getRandomValues !== 'function') {
    throw new Error('이 브라우저에서는 저장을 지원하지 않습니다. 최신 브라우저로 다시 열어주세요.');
  }
  return [...source.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
