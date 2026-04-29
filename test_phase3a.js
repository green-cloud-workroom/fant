// test_phase3a.js
// Phase 3a 단위 테스트 — aggregateBlockingItems + BLOCKING_ITEM_META
//
// 실행:  node test_phase3a.js
// 의존성: src/services/closingChecksLogic.js만 import (Firestore 의존성 없음)

import {
  aggregateBlockingItems,
  BLOCKING_ITEM_META
} from './src/services/closingChecksLogic.js';

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, cond, info = '') {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push({ name, info });
    console.log(`  ✗ ${name}${info ? ' — ' + info : ''}`);
  }
}

console.log('Phase 3a: aggregateBlockingItems\n');

// [1] 모두 통과
console.log('[1] 모두 통과');
{
  const r = aggregateBlockingItems(
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 }
  );
  assert('totalBlocked === 0', r.totalBlocked === 0);
  assert('items 빈 배열', Array.isArray(r.items) && r.items.length === 0);
}

// [2] 1번만 차단
console.log('\n[2] 1번만 차단');
{
  const r = aggregateBlockingItems(
    { blocked: true, reason: '내일생산불러오기 처리 안 됨', count: 5 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 }
  );
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('items[0].id === 1', r.items[0].id === 1);
  assert('items[0].label 정확', r.items[0].label === '내일생산불러오기 처리 안 됨');
  assert('items[0].jumpMenu === main', r.items[0].jumpMenu === 'main');
  assert('items[0].count === 5', r.items[0].count === 5);
  assert('items[0].reason 전달됨', r.items[0].reason === '내일생산불러오기 처리 안 됨');
}

// [3] 2번만 차단
console.log('\n[3] 2번만 차단');
{
  const r = aggregateBlockingItems(
    { blocked: false, reason: '', count: 0 },
    { blocked: true, reason: '오늘 동결건조 발주 3건 미확인', count: 3 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 }
  );
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('items[0].id === 2', r.items[0].id === 2);
  assert('items[0].jumpMenu === frozenPan', r.items[0].jumpMenu === 'frozenPan');
  assert('items[0].count === 3', r.items[0].count === 3);
}

// [4] 3번만 차단
console.log('\n[4] 3번만 차단');
{
  const r = aggregateBlockingItems(
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: true, reason: '오늘 입고 예정 2건 미처리', count: 2 },
    { blocked: false, reason: '', count: 0 }
  );
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('items[0].id === 3', r.items[0].id === 3);
  assert('items[0].jumpMenu === schedule', r.items[0].jumpMenu === 'schedule');
}

// [5] 7번만 차단
console.log('\n[5] 7번만 차단');
{
  const r = aggregateBlockingItems(
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: true, reason: '오늘 노른자 사용 생산 1건인데 계란 출고 미입력', count: 1 }
  );
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('items[0].id === 7', r.items[0].id === 7);
  assert('items[0].jumpMenu === egg', r.items[0].jumpMenu === 'egg');
}

// [6] 전부 차단 + 순서
console.log('\n[6] 전부 차단 + 순서');
{
  const r = aggregateBlockingItems(
    { blocked: true, reason: 'r1', count: 1 },
    { blocked: true, reason: 'r2', count: 2 },
    { blocked: true, reason: 'r3', count: 3 },
    { blocked: true, reason: 'r7', count: 7 }
  );
  assert('totalBlocked === 4', r.totalBlocked === 4);
  assert('items 길이 4', r.items.length === 4);
  assert('items[0].id === 1', r.items[0].id === 1);
  assert('items[1].id === 2', r.items[1].id === 2);
  assert('items[2].id === 3', r.items[2].id === 3);
  assert('items[3].id === 7', r.items[3].id === 7);
}

// [7] 1번 + 7번만 차단
console.log('\n[7] 1번 + 7번만 차단');
{
  const r = aggregateBlockingItems(
    { blocked: true, reason: 'r1', count: 1 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: true, reason: 'r7', count: 1 }
  );
  assert('totalBlocked === 2', r.totalBlocked === 2);
  assert('items 길이 2', r.items.length === 2);
  assert('items[0].id === 1', r.items[0].id === 1);
  assert('items[1].id === 7', r.items[1].id === 7);
}

// [8] reason/count 누락 방어
console.log('\n[8] reason/count 누락 방어');
{
  const r = aggregateBlockingItems(
    { blocked: true },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 },
    { blocked: false, reason: '', count: 0 }
  );
  assert('reason 누락 시 빈 문자열', r.items[0].reason === '');
  assert('count 누락 시 0', r.items[0].count === 0);
}

// [9] null/undefined 인자
console.log('\n[9] null/undefined 인자');
{
  const r = aggregateBlockingItems(null, undefined, null, undefined);
  assert('null/undefined → totalBlocked === 0', r.totalBlocked === 0);
  assert('null/undefined → items 빈 배열', r.items.length === 0);
}

// [10] BLOCKING_ITEM_META 매핑
console.log('\n[10] BLOCKING_ITEM_META 매핑');
{
  assert('META[1].jumpMenu === main', BLOCKING_ITEM_META[1].jumpMenu === 'main');
  assert('META[2].jumpMenu === frozenPan', BLOCKING_ITEM_META[2].jumpMenu === 'frozenPan');
  assert('META[3].jumpMenu === schedule', BLOCKING_ITEM_META[3].jumpMenu === 'schedule');
  assert('META[7].jumpMenu === egg', BLOCKING_ITEM_META[7].jumpMenu === 'egg');
  assert('META[1].label 존재', typeof BLOCKING_ITEM_META[1].label === 'string' && BLOCKING_ITEM_META[1].label.length > 0);
  assert('META[2].label 존재', typeof BLOCKING_ITEM_META[2].label === 'string' && BLOCKING_ITEM_META[2].label.length > 0);
  assert('META[3].label 존재', typeof BLOCKING_ITEM_META[3].label === 'string' && BLOCKING_ITEM_META[3].label.length > 0);
  assert('META[7].label 존재', typeof BLOCKING_ITEM_META[7].label === 'string' && BLOCKING_ITEM_META[7].label.length > 0);
}

console.log(`\n결과: ${pass}/${pass + fail} pass`);
if (fail > 0) {
  console.log('\n실패 항목:');
  failures.forEach(f => console.log(`  - ${f.name}`));
  process.exit(1);
}