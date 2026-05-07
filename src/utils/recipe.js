// 레시피 관련 공통 유틸
// 사용처: 동결판 재고, 분리작업 등 productName 드롭다운

import { db } from '../firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * 활성 동결건조 레시피 목록을 반환.
 * 표시명 형식: "고양이 닭가슴살 큐브" / "강아지 오리정육" / "치킨텐더" (공용)
 *
 * @returns {Promise<Array<{id:string, displayName:string}>>}
 */
export async function getActiveFreezeDryRecipes() {
  const q = query(
    collection(db, 'recipes'),
    where('category', '==', 'freezeDry'),
    where('active', '==', true)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map(d => {
    const data = d.data();
    const prefix = data.target === 'cat' ? '고양이 '
                 : data.target === 'dog' ? '강아지 '
                 : '';
    return {
      id: d.id,
      displayName: `${prefix}${data.name}`,
      sortOrder: data.sortOrder ?? 999,
      requiresSeparation: data.requiresSeparation === true,  // ★묶음 3 추가 — 동결생식 여부 (빵판 추적 대상)
    };
  });
  list.sort((a, b) => a.sortOrder - b.sortOrder);
  return list;
}

/**
 * <select> 옵션 HTML 문자열 반환.
 * 빈 placeholder 옵션 포함.
 *
 * @param {Array<{displayName:string}>} recipes
 * @param {string} [selected] - 미리 선택할 displayName
 * @returns {string}
 */
export function getRecipeOptionsHtml(recipes, selected = '') {
  const placeholder = `<option value="">선택</option>`;
  const opts = recipes.map(r =>
    `<option value="${r.displayName}" ${r.displayName === selected ? 'selected' : ''}>${r.displayName}</option>`
  ).join('');
  return placeholder + opts;
}