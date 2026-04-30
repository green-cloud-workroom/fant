// src/services/closingChecksLogic.js
//
// 마감 차단 항목 판정 — 순수 함수 4개 + 집계 함수 1개 (Phase 3a 추가).
// firebase 의존성 없음. 데이터 배열을 인자로 받아 판정만 수행.
// 단위 테스트(test.js)는 이 파일만 import해서 검증한다.
//
// Phase 2 — V1: 차단 항목 1, 2, 3, 7번.
// Phase 3a — aggregateBlockingItems, BLOCKING_ITEM_META 추가.

/**
 * 1. 내일생산불러오기 처리 안 됨
 *
 * 차단 조건: 다음 영업일에 생산이 1개 이상 있고 + dateStr의
 * productionCompletion이 'completed' 상태로 존재하지 않으면 차단.
 * 다음 영업일에 생산이 없으면 처리할 게 없으므로 통과.
 *
 * @param {Array} nextDayProductions - 다음 영업일에 해당하는 productions 문서 배열 (status!=='deleted' 사전 필터됨)
 * @param {Array} completions - productionCompletion 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD' 마감하려는 날짜
 * @returns {{blocked: boolean, reason: string, count: number}}
 */
export function judgeTomorrowProductionLoaded(nextDayProductions, completions, dateStr) {
  // 다음 영업일에 production 없으면 처리할 게 없으므로 통과
  if (!nextDayProductions || nextDayProductions.length === 0) {
    return { blocked: false, reason: '', count: 0 };
  }

  // 해당 날짜에 productionCompletion이 'completed' 상태로 존재하는지
  const isCompleted = (completions || []).some(c =>
    c.runDate === dateStr && c.status === 'completed'
  );

  if (isCompleted) {
    return { blocked: false, reason: '', count: 0 };
  }

  return {
    blocked: true,
    reason: `다음 영업일 생산 ${nextDayProductions.length}건이 있는데 내일생산불러오기를 진행하지 않았습니다`,
    count: nextDayProductions.length
  };
}

/**
 * 2. 동결건조 발주 확인 처리 안 됨
 *
 * 차단 조건: type==='order' && date===dateStr 인 frozenPanStock 행 중
 * status가 'confirmed' 또는 'cancelled'가 아닌 것이 1개 이상 있으면 차단.
 *
 * (기존 데이터 호환을 위해 status 필드가 없거나 'pending', 빈 문자열인 경우도
 *  '미확인'으로 본다.)
 *
 * @param {Array} rows - frozenPanStock 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeFrozenOrdersConfirmed(rows, dateStr) {
  const unconfirmed = (rows || []).filter(r =>
    r.type === 'order' &&
    r.date === dateStr &&
    r.status !== 'confirmed' &&
    r.status !== 'cancelled'
  );

  return {
    blocked: unconfirmed.length > 0,
    reason: unconfirmed.length > 0
      ? `오늘 동결건조 발주 ${unconfirmed.length}건이 확인되지 않았습니다`
      : '',
    count: unconfirmed.length
  };
}

/**
 * 3. 입고 예정 완료/취소 처리 안 됨
 *
 * 차단 조건: date===dateStr && status==='scheduled' 인 schedules 행이
 * 1개 이상 있으면 차단.
 *
 * @param {Array} schedules - schedules 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeSchedulesProcessed(schedules, dateStr) {
  const unprocessed = (schedules || []).filter(s =>
    s.date === dateStr && s.status === 'scheduled'
  );

  return {
    blocked: unprocessed.length > 0,
    reason: unprocessed.length > 0
      ? `오늘 입고 예정 ${unprocessed.length}건이 완료/취소 처리되지 않았습니다`
      : '',
    count: unprocessed.length
  };
}

/**
 * 7. 계란 출고 미입력
 *
 * 차단 조건: date===dateStr && status!=='deleted' 인 productions 중
 * ingredientsSnapshot[i].name에 '노른자'가 포함된 항목이 있는 production이
 * 1개 이상 있고 + 같은 날짜에 eggLogs.type==='out' 기록이 0건이면 차단.
 *
 * 노른자 사용 production이 0이면 처리할 필요 없으므로 통과.
 *
 * @param {Array} productions - productions 컬렉션 전체 문서 배열
 * @param {Array} eggLogs - eggLogs 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeEggOutputForProduction(productions, eggLogs, dateStr) {
  // 1) 해당 날짜에 노른자 사용한 생산 카운트
  const eggUsingProductions = (productions || []).filter(p =>
    p.date === dateStr &&
    p.status !== 'deleted' &&
    (p.ingredientsSnapshot || []).some(ing =>
      (ing.name || '').includes('노른자')
    )
  );

  if (eggUsingProductions.length === 0) {
    return { blocked: false, reason: '', count: 0 };
  }

  // 2) 해당 날짜에 계란 출고 기록 있는지
  const hasEggOutput = (eggLogs || []).some(l =>
    l.date === dateStr && l.type === 'out'
  );

  if (hasEggOutput) {
    return { blocked: false, reason: '', count: 0 };
  }

  return {
    blocked: true,
    reason: `오늘 노른자 사용 생산 ${eggUsingProductions.length}건인데 계란 출고가 입력되지 않았습니다`,
    count: eggUsingProductions.length
  };
}

/**
 * [Phase 3a 신규]
 * 차단 항목 메타데이터 — V1 차단 항목 1, 2, 3, 7번.
 *
 * label: 모달/배너에 표시할 짧은 고정 라벨
 * jumpMenu: 차단 항목 처리하러 갈 메뉴 ID (app.js MENUS의 id와 일치)
 *   1 → 메인 (내일생산불러오기 버튼이 메인에 있음)
 *   2 → 동결판 재고 (발주 행 확인)
 *   3 → 입고 예정관리 (완료/취소 처리)
 *   7 → 계란 (출고 입력)
 */
export const BLOCKING_ITEM_META = {
  1: { label: '내일생산불러오기 처리 안 됨', jumpMenu: 'main' },
  2: { label: '동결건조 발주 확인 처리 안 됨', jumpMenu: 'frozenPan' },
  3: { label: '입고 예정 완료/취소 처리 안 됨', jumpMenu: 'schedule' },
  7: { label: '계란 출고 미입력', jumpMenu: 'egg' }
};

/**
 * [Phase 3a 신규]
 * 4개 차단 항목 결과를 집계해서 모달/배너용 데이터로 변환.
 *
 * blocked=true인 항목만 items에 포함. 항목 ID 순(1→2→3→7) 정렬.
 * 순수 함수 — Firestore 의존성 없음. 단위 테스트는 이 함수에서 수행.
 *
 * @param {Object} item1 - judgeTomorrowProductionLoaded 결과
 * @param {Object} item2 - judgeFrozenOrdersConfirmed 결과
 * @param {Object} item3 - judgeSchedulesProcessed 결과
 * @param {Object} item7 - judgeEggOutputForProduction 결과
 * @returns {{
 *   totalBlocked: number,
 *   items: Array<{ id: number, label: string, reason: string, count: number, jumpMenu: string }>
 * }}
 */
export function aggregateBlockingItems(item1, item2, item3, item7) {
  const map = { 1: item1, 2: item2, 3: item3, 7: item7 };
  const items = [];

  for (const id of [1, 2, 3, 7]) {
    const result = map[id];
    if (result && result.blocked) {
      items.push({
        id,
        label: BLOCKING_ITEM_META[id].label,
        reason: result.reason || '',
        count: result.count || 0,
        jumpMenu: BLOCKING_ITEM_META[id].jumpMenu
      });
    }
  }

  return {
    totalBlocked: items.length,
    items
  };
}
