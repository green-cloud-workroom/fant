export function renderPage(menuId) {
  const content = document.getElementById('mainContent');
  if (!content) return;

  const pages = {
    main: `<div class="page-placeholder"><h2>메인 대시보드</h2><p>준비 중</p></div>`,
    production: `<div class="page-placeholder"><h2>생산 입력</h2><p>준비 중</p></div>`,
    meat: `<div class="page-placeholder"><h2>원육 재고</h2><p>준비 중</p></div>`,
    egg: `<div class="page-placeholder"><h2>계란</h2><p>준비 중</p></div>`,
    bag: `<div class="page-placeholder"><h2>봉투 재고</h2><p>준비 중</p></div>`,
    frozenProduct: `<div class="page-placeholder"><h2>동결제품 입고</h2><p>준비 중</p></div>`,
    frozenPan: `<div class="page-placeholder"><h2>동결판 재고</h2><p>준비 중</p></div>`,
    frozenSep: `<div class="page-placeholder"><h2>동결 분리작업</h2><p>준비 중</p></div>`,
    schedule: `<div class="page-placeholder"><h2>입고 예정관리</h2><p>준비 중</p></div>`,
    recipe: `<div class="page-placeholder"><h2>레시피 관리</h2><p>준비 중</p></div>`,
    stats: `<div class="page-placeholder"><h2>통계</h2><p>준비 중</p></div>`,
    settings: `<div class="page-placeholder"><h2>설정</h2><p>준비 중</p></div>`,
  };

  content.innerHTML = pages[menuId] || `<div class="page-placeholder"><h2>페이지 없음</h2></div>`;
}