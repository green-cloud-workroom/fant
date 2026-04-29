// test_phase3b.js
// Phase 3b 단위 테스트 — formatKstDateWithDay
//
// 실행:  node test_phase3b.js
// 의존성: src/utils/date.js만 import (firebase 의존성 없음)

import { formatKstDateWithDay } from './src/utils/date.js';

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

console.log('Phase 3b: formatKstDateWithDay\n');

// [1] 요일 정확성 (2026년 4-5월 검증)
console.log('[1] 요일 정확성');
{
  // 2026-04-28 = 화요일 (확인: https://www.timeanddate.com/calendar/?year=2026)
  assert('2026-04-28 → 4/28(화)', formatKstDateWithDay('2026-04-28') === '4/28(화)');
  assert('2026-04-29 → 4/29(수)', formatKstDateWithDay('2026-04-29') === '4/29(수)');
  assert('2026-04-30 → 4/30(목)', formatKstDateWithDay('2026-04-30') === '4/30(목)');
  assert('2026-05-01 → 5/1(금)', formatKstDateWithDay('2026-05-01') === '5/1(금)');
  assert('2026-05-02 → 5/2(토)', formatKstDateWithDay('2026-05-02') === '5/2(토)');
  assert('2026-05-03 → 5/3(일)', formatKstDateWithDay('2026-05-03') === '5/3(일)');
  assert('2026-05-04 → 5/4(월)', formatKstDateWithDay('2026-05-04') === '5/4(월)');
}

// [2] 월/일 1자리 처리
console.log('\n[2] 1자리 월/일');
{
  assert('2026-01-01 → 1/1(목)', formatKstDateWithDay('2026-01-01') === '1/1(목)');
  assert('2026-09-09 → 9/9(수)', formatKstDateWithDay('2026-09-09') === '9/9(수)');
}

// [3] 2자리 월/일
console.log('\n[3] 2자리 월/일');
{
  assert('2026-12-31 → 12/31(목)', formatKstDateWithDay('2026-12-31') === '12/31(목)');
  assert('2026-10-15 → 10/15(목)', formatKstDateWithDay('2026-10-15') === '10/15(목)');
}

// [4] 잘못된/비어있는 입력 방어
console.log('\n[4] 입력 방어');
{
  assert('null → 빈 문자열', formatKstDateWithDay(null) === '');
  assert('undefined → 빈 문자열', formatKstDateWithDay(undefined) === '');
  assert('빈 문자열 → 빈 문자열', formatKstDateWithDay('') === '');
  assert('포맷 깨짐 → 빈 문자열', formatKstDateWithDay('2026-04') === '');
  assert('숫자 아닌 부분 → 빈 문자열', formatKstDateWithDay('YYYY-MM-DD') === '');
}

// [5] 연도 경계
console.log('\n[5] 연도 경계');
{
  // 2025-12-31 = 수요일, 2026-01-01 = 목요일
  assert('2025-12-31 → 12/31(수)', formatKstDateWithDay('2025-12-31') === '12/31(수)');
  assert('2026-01-01 → 1/1(목)', formatKstDateWithDay('2026-01-01') === '1/1(목)');
}

console.log(`\n결과: ${pass}/${pass + fail} pass`);
if (fail > 0) {
  console.log('\n실패 항목:');
  failures.forEach(f => console.log(`  - ${f.name}`));
  process.exit(1);
}
