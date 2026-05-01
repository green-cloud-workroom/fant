# Firestore 컬렉션 스키마 (Phase 1A 신규 추가분)

## closings/{YYYY-MM-DD}

마감 상태와 마감 시점 잔량 스냅샷을 저장.

**문서 ID**: 마감 대상 날짜 KST `YYYY-MM-DD` (예: `2026-04-29`)

**상태 모델**:
- `open` = 문서가 존재하지 않음 (마감 안 한 날짜)
- `closed` = 마감됨, 해제 안 됨
- `released` = 마감 후 해제됨 (사유와 함께 기록)

**판정**: 반드시 `isDateClosed(dateStr)` 함수만 사용.
구현: `(doc.exists && doc.data().status === 'closed')`

**필드**:

```
{
  status: "closed" | "released",          // derived field, 직접 수정 금지
  closed: true,                           // 항상 true (legacy 호환용)

  closedAt: Timestamp,                    // 마감 시각 (UTC)
  closedBy: "홍성희",                      // 담당자 표시명
  closedByUid: "abc123...",               // Firebase Auth uid

  // released일 때만 채워짐, 그 외 null
  releasedAt: Timestamp | null,
  releasedBy: string | null,
  releasedByUid: string | null,
  releaseReason: string | null,           // 사유 텍스트

  // 마감 시점 잔량 스냅샷 (모든 stock 종류)
  snapshots: {
    egg: { currentQty: number },
    bags: { [bagTypeId]: number },
    meatByStage: {
      frozen:    { [meatTypeId]: number },  // 단위: g
      processed: { [meatTypeId]: number },
      repacked:  { [meatTypeId]: number }
    },
    frozenPan: { [factoryName]: number },   // 동결판 수
    frozenSep: {
      [productName]: { [separationType]: number }
    }
  }
}
```

**스냅샷 SUM 규칙**:
- `egg`: `eggStock/global.currentQty` 그대로
- `bags`: `bagTypes` 컬렉션 모든 문서의 `currentQty`
- `meatByStage`: `meatStocks` 컬렉션에서 `stage`별로 `meatTypeId`별 `remaining` 합산 (closed=false인 lot만)
- `frozenPan`: `frozenPanLots` 컬렉션에서 `remaining > 0`인 것의 `factory`별 합산
- `frozenSep`: `frozenSeparation` 컬렉션에서 `remaining > 0`인 것의 `productName`별 `separationType`별 합산

마감해제(`releaseClosing`) 시 스냅샷은 그대로 두지만 `status`만 `released`로 변경. 통계 메뉴는 `status === 'closed'`인 문서만 신뢰 데이터로 사용.

---

## activityLogs/{auto-id}

운영자 액션 통합 로그. 사무 로그/감사 추적용.

**문서 ID**: Firestore 자동 생성

**필드**:

```
{
  action: "closing",                      // 액션 카테고리
  subAction: "close" | "release",         // 세부 액션

  date: "2026-04-29",                     // 마감 대상 날짜 (closing의 경우)
  staff: "홍성희",                         // 액션 수행자 표시명
  uid: "abc123...",                       // Firebase Auth uid

  timestamp: Timestamp,                   // 액션 발생 시각

  message: "04/29 23:15 마감 / 담당: 홍성희",  // 사무 로그 표시용 가공 텍스트

  details: {                              // 액션별 추가 정보 (항상 객체)
    reason?: string                       // release일 때만
  },

  read: false                             // 사무 로그 미확인 처리용 (Phase 추후)

  acknowledged: false,                    // 확인 처리 여부 (Phase 5A)
  acknowledgedAt: Timestamp | null,       // 확인 처리 시각
  acknowledgedBy: string | null,          // 확인 처리한 담당자 표시명
  acknowledgedByUid: string | null        // 확인 처리한 Firebase Auth uid
}
```

**향후 확장 예정 action 종류** (Phase 1A에서는 `closing`만 사용):
- `production` — 생산 입력/수정/취소
- `meat` — 원육 입고/조정
- `egg` — 계란 입고/출고
- `bag` — 봉투 입고/출고
- `frozen` — 동결 작업

**불변 규칙**:
- 한 번 생성된 activityLogs 문서는 **수정/삭제 금지** (감사 추적 신뢰성)
- `read`, `acknowledged`, `acknowledgedAt`, `acknowledgedBy`, `acknowledgedByUid` 필드만 예외적으로 업데이트 가능 (확인 처리용)
- 삭제는 절대 금지
---

## holidays/{YYYY-MM-DD}

수동 등록 휴일. 토/일은 코드(`getNextBusinessDay`)에서 자동 처리하므로 저장 안 함.

**문서 ID**: 휴일 날짜 KST `YYYY-MM-DD` (예: `2026-05-01`). 같은 날짜 중복 등록 자동 차단.

**필드**:

​```
{
  date: "2026-05-01",       // 문서 ID와 동일 (조회 편의용)
  label: "근로자의 날",       // 휴일명 (운영 식별용)
  createdAt: Timestamp,     // 등록 시각 (UTC)
  createdBy: string         // 등록자 Firebase Auth uid
}
​```

**캐시 동작**:
- 앱 로딩 시 `loadHolidaysCache()` 1회 호출 → `date.js` 모듈 변수에 저장
- 설정 메뉴에서 휴일 등록/삭제 시 `loadHolidaysCache()` 재호출
- `getNextBusinessDay(dateStr)` 호출 시 인자 생략하면 캐시 자동 사용

**Firestore Rules**: read 인증 사용자, write admin/office (기존 유지).
---

## meatLogs/{auto-id}

원육 재고 변동 통합 이력. 입고/전처리/재포장/자동출고/생산차감/수동조정 모두 기록.

**문서 ID**: Firestore 자동 생성

**필드**:

```
{
  type: "frozenIncoming"      // 냉동창고 입고 (양수)
      | "frozenOut"           // 냉동창고에서 출고 (전처리 등록 시, 음수)
      | "processedIn"         // 전처리 신규 등록 (양수)
      | "processedOut"        // 전처리에서 출고 (재포장 등록 시, 음수)
      | "repackedIn"          // 재포장 신규 등록 (양수)
      | "repackedOut"         // 재포장에서 출고 (현재 미사용, 향후 확장)
      | "productionDeduct"    // 내일생산불러오기 차감 (음수)
      | "productionRollback"  // 내일생산불러오기 취소 복원 (양수)
      | "adjust",             // 수동조정 (+/-)

  date: "2026-04-30",          // 작업일 KST YYYY-MM-DD
  meatTypeId: "abc123",        // meatTypes 문서 ID
  meatNameSnapshot: "닭가슴살", // 당시 이름 (이후 이름 변경돼도 이력 보존)
  stage: "frozen" | "processed" | "repacked",
  meatStockId: string | null,  // 변동된 meatStocks 문서 ID

  delta: number,               // g 단위 변화량 (양수=증가, 음수=감소)
  before: number | null,       // 변동 전 잔량 g
  after: number | null,        // 변동 후 잔량 g

  staff: "홍성희",              // 담당자 표시명
  uid: "abc123...",            // Firebase Auth uid

  reason: string | null,       // 사유 (수동조정/자동출고/생산차감)
  batchId: string | null,      // 같은 트랜잭션 묶음 식별

  timestamp: Timestamp         // 기록 시각
}
```

**불변 규칙**:
- 한 번 생성된 meatLogs 문서는 **수정/삭제 금지**
- 삭제 절대 금지

**type별 delta 부호 규칙**:
- `frozenIncoming`, `processedIn`, `repackedIn`, `productionRollback`: 양수
- `frozenOut`, `processedOut`, `repackedOut`, `productionDeduct`: 음수
- `adjust`: 양수/음수 모두 가능

**type 해석 원칙**: "어디서 빠졌는지" 기준.
- `frozenOut` = 냉동창고에서 빠진 사건 (전처리 등록의 부산물)
- `processedOut` = 전처리에서 빠진 사건 (재포장 등록의 부산물)
- `repackedOut` = 재포장에서 빠진 사건 (현재 미사용)

**batchId 사용 패턴**:
- 같은 트랜잭션에서 발생한 로그들을 묶어서 추적
- 전처리 등록: `frozenOut` N개 (냉동창고 차감, FIFO로 여러 배치 걸칠 수 있음) + `processedIn` 1개, 모두 같은 batchId
- 재포장 등록: `processedOut` N개 + `repackedIn` 1개, 모두 같은 batchId
- 내일생산불러오기: 차감된 모든 lot의 `productionDeduct` N개, 모두 같은 batchId (= productionCompletion 문서 ID)
- 내일생산불러오기 취소: 복원된 모든 lot의 `productionRollback` N개, 모두 같은 batchId