# 생산관리 앱 → 재고관리 앱 — Cross-app 요청서: 완제품 입고 전송 (역방향)

작성일: 2026-05-21
방향: **생산관리 앱 → 재고관리 앱** (기존 `재고관리_Cross-app_요청_v2`의 역방향)
근거: 생산앱 spec_v27 초안 §6 + 호두 2026-05-21 결정(완제품 = 재고앱 소유, 생산앱이 전송)
대상: 재고관리 앱 책임자
응답 기한: 생산앱 spec_v27 단계 4~6(완제품 전송) 구현 직전. 생산앱 단계 1~3(설정·모달·동결건조 내부 자동입고)은 본 요청 없이 선행 가능.

---

## 0. 이 문서가 존재하는 이유

생산앱에 신규 기능(제품 입고)을 만든다: 생산카드에서 실제 생산량(판/팩) 입력 → 환산 → 재고 입고. 호두 결정으로 **완제품 재고는 재고앱이 소유**하고 생산앱은 완제품 입고를 재고앱으로 **전송**한다.

- **생식(raw) 완제품**: 생산카드 제품입고 즉시 완제품(박스/팩) → 재고앱 전송
- **동결제품(freezeDry 완제품)**: 생산앱 내부 파이프라인(빵판→분리→동결판→동결제품 입고) 종료 후 동결제품 단계에서 → 재고앱 전송
- 중간 생산재고(빵판/동결판/동결분리)는 생산앱 소관 — 전송 대상 아님

기존 Cross-app 요청서 v2(재고→생산)는 recipes/holidays/forecast 등 재고가 생산에서 "읽는" 것이었고, 본 문서는 생산이 재고로 "쓰는(전송)" 신규 역방향. 재고앱이 **수신·입고 처리 측**을 만들어야 함.

각 요청 = (1)무엇 (2)왜 (3)언제 (4)응답형태.

---

## 1. 완제품 입고 전송 메커니즘 결정

### 1.1 무엇이 필요한가
생산앱 완제품 입고를 재고앱이 받는 방식. **생산앱 결정(호두 2026-05-21) = outbox 패턴**:
- **공유 요청 컬렉션 `productTransferRequests`** — 생산앱이 append-only write, 재고앱이 read·처리(완제품 재고 반영). 생산앱은 재고 소유 컬렉션을 **직접 건드리지 않음**(결합도·이중입고 사고 위험↓).
- 대안(미채택): (b) 재고 컬렉션 직접 write, (c) 재고 Cloud Function 호출 — 생산앱은 Functions 미사용이라 (c)는 재고 측 트리거 구현 필요.
- rules: `productTransferRequests` = 생산 write(create) · 재고 read(+처리 표시 update). 생산앱 firestore.rules에 추가 예정(계약 확정 후).
- 재고앱은 이 컬렉션을 구독/폴링 → 멱등 체크(§4) → 자기 완제품 재고 입고.

→ **확인 요청**: outbox 패턴 + 컬렉션명 `productTransferRequests` 수용 가능한지. 재고가 폴링 vs onSnapshot 구독 중 무엇을 쓸지(생산앱은 무관).

### 1.2 왜 필요한가
- 생산앱은 Functions가 없어 서버측 호출 불가 → 클라이언트 Firestore write 또는 재고 Function 호출만 가능
- 양 앱이 같은 방식에 합의해야 rules·스키마·멱등 설계 일관

### 1.3 언제까지
생산앱 spec_v27 단계 4 진입 직전.

### 1.4 응답 형태
- 선호 메커니즘 (a/b/c) + 이유
- (a)면 공유 컬렉션명·소유자, (b)면 대상 컬렉션명·스키마, (c)면 Function 시그니처

---

## 2. 페이로드 스키마 합의

### 2.1 무엇이 필요한가
완제품 입고 전송 1건의 필드 스키마 합의. **생산앱 제안(안)**:

```js
// productTransferRequests/{idempotencyKey} — 완제품 입고 전송 1건 (생산 → 재고)
//   문서 ID = idempotencyKey (deterministic). revision마다 새 문서 = create-only로 충분.
{
  // --- 멱등/출처 (호두 2026-05-21 보강) ---
  idempotencyKey: string,     // = `${sourceCollection}:${sourceId}:${revision}` = 문서 ID. 같은 revision 중복 write 불가
  sourceApp: 'production',
  sourceCollection: 'productions' | 'frozenProducts',
  sourceId: string,           // productions/{id}(생식) 또는 frozenProducts/{id}(동결)
  eventType: 'productReceipt',
  revision: number,           // 같은 sourceId 재전송(완료 카드 재입력/수정) 시 +1. 재고는 최신 revision만 반영
  supersedesRevision: number | null, // revision>1이면 직전 revision(정정 입고), 1이면 null(최초). 재고가 "정정 vs 추가 입고" 구분용
  status: 'pending',          // 생산이 'pending'로 생성, 재고가 처리 후 'processed'/'rejected'로 update
  // --- 제품 식별 ---
  category: 'raw' | 'freezeDry',
  recipeId: string,           // 생산앱 recipes/{id} (§5 매핑)
  recipeName: string,         // 스냅샷
  target: 'cat' | 'dog' | '',
  // --- 수량 (생식): 완료 모달 입력값 = 입고 기준 ---
  plates?: number,            // 판수
  packs?: number,             // 총 팩수 = 판수×판당팩수 + 낱개
  boxes?: number,             // floor(packs/20)
  remainderPacks?: number,    // packs % 20
  // --- 수량 (동결제품) ---
  frozenProductId?: string,
  quantity?: number,          // 단위 합의 필요
  // --- 공통 ---
  producedDate: string,       // 'YYYY-MM-DD'
  staff: string,
  createdAt: <serverTimestamp>,
}
```
> 멱등 모델: `idempotencyKey`로 중복 차단. 완료 카드 **재입력/admin override** 시 같은 `sourceId`로 `revision`을 올려 재전송 → 재고는 동일 sourceId의 **최신 revision으로 덮어쓰기(차분 아님)**. 이중입고·재시도·더블클릭 모두 방지.

### 2.2 왜 필요한가
재고앱이 이 페이로드로 완제품 재고를 증가시켜야 하므로 필드·단위(박스 vs 팩 vs 개) 합의 필수.

### 2.3 언제까지
단계 4 진입 직전.

### 2.4 응답 형태
- 위 안 수용/수정 (특히 수량 단위: 재고앱 완제품 재고는 박스 기준? 팩 기준?)
- 재고앱이 추가로 필요한 필드(창고 위치, 유통기한 등)

---

## 3. 수신·입고 처리 방식

### 3.1 무엇이 필요한가
재고앱이 전송을 받으면: (a) 즉시 자동 입고 vs (b) 검수 대기 후 운영자 확인 입고.

### 3.2 왜 필요한가
- 자동이면 생산 즉시 재고 반영(빠름, 오입력 위험)
- 검수면 재고 정합 안전(운영 단계 추가)
- 생산앱 UX(전송 후 "입고됨" 표시 여부)에 영향

### 3.3 언제까지
단계 4~6 설계 시.

### 3.4 응답 형태
- 자동/검수 중 선택 + 검수면 재고앱 화면 위치
- 전송 실패/거부 시 생산앱으로의 피드백 방식(있다면)

---

## 4. 멱등 / 중복 방지

### 4.1 무엇이 필요한가
같은 완제품 입고가 재전송돼도 중복 입고 안 되게 `idempotencyKey`(=`sourceCollection:sourceId:revision`) 기반 멱등 보장. 재고 수신 측은 동일 `sourceId`의 **최신 revision만 반영(덮어쓰기)**, 같은 idempotencyKey 재수신은 무시.

### 4.2 왜 필요한가
네트워크 재시도·운영자 더블클릭·생산카드 수정 재전송 시 재고 이중 증가 방지.

### 4.3 언제까지
단계 4 구현 시.

### 4.4 응답 형태
- idempotencyKey + revision 덮어쓰기 모델 수용 확인 (재고 측 구현)
- 생산카드 수정으로 수량 변경 시 = 같은 sourceId·revision+1 재전송 → 재고는 최신값으로 재반영. 이 방식 합의 여부

---

## 5. 제품 식별 매핑 (recipeId → 재고앱 제품)

### 5.1 무엇이 필요한가
전송 페이로드의 `recipeId`(생산앱)를 재고앱이 자기 제품/SKU로 매핑하는 규약.

### 5.2 왜 필요한가
재고앱은 자체 제품 카탈로그 보유(Cross-app 요청 v2 §1에서 productId로 recipes 읽기 예정, 현재 수기 입력). 완제품 입고가 정확한 재고 제품으로 가려면 recipeId 매핑이 필요.

### 5.3 언제까지
단계 4 진입 직전. (Cross-app 요청 v2 §1 recipes 읽기와 연계)

### 5.4 응답 형태
- recipeId를 재고 제품 식별자로 직접 사용? 별도 매핑 테이블?
- 매핑 부재(신규 제품) 시 처리

---

## 6. 재고앱 구현 Sprint 위치

### 6.1 무엇이 필요한가
재고앱 "완제품 수신·입고" 기능이 어느 Sprint/Phase에 들어가는지.

### 6.2 왜 필요한가
생산앱 단계 4~6은 재고 수신 측이 있어야 완성. 양 앱 동시 진행 일정 조율.

### 6.3 언제까지
가능한 빨리(느린 트랙이므로 조기 착수 유리).

### 6.4 응답 형태
- 재고앱 완제품 수신 기능 예정 Sprint + 예상 시점

---

## 7. 종합

| # | 요청 | 핵심 |
|---|---|---|
| 1 | 전송 메커니즘 | **outbox 확정: `productTransferRequests`** (생산 write·재고 read). 재고 폴링/구독만 선택 |
| 2 | 페이로드 스키마 | §2.1 안(멱등 필드 포함) + 수량 단위 합의 |
| 3 | 수신 처리 | 자동 입고 vs 검수 |
| 4 | 멱등/중복방지 | idempotencyKey + revision(최신 덮어쓰기) |
| 5 | 제품 식별 매핑 | recipeId → 재고 제품 |
| 6 | 재고 Sprint 위치 | 완제품 수신 일정 |

**생산앱 측 선행 가능(본 요청 무관)**: spec_v27 단계 1~3 (판당팩수 설정, 제품입고 모달, 동결건조 빵판/동결판 내부 자동입고). 단계 4~6(완제품 전송)만 본 요청 응답 대기.

응답 받으면 생산앱 spec_v27 §6 확정 + 단계 4~6 work order.
