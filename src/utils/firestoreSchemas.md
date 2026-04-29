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
- `read` 필드만 예외적으로 업데이트 가능 (사무 로그 확인 처리용)
