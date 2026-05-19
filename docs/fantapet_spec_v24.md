# Fantapet Management — Spec v24 (v23 대비 변경사항)

작성일: 2026-05-13
이전: spec_v23
형식: **v22 + v23 대비 diff 정리**. v22/v23 전체를 대체하지 않음. 다음 채팅에서 v22 + v23 + v24 같이 참조.

---

## v23 → v24 변경 요약

1. **7절 — 생산단위 프리셋 신설** (`recipes.unitPresets: number[]`)
2. **8절 — 생산 입력 모달 변경** (프리셋 select + 직접 입력 + 빈 프리셋 강제 안내)
3. **신설 절 — 영양제 재고 관리 메뉴** (`supplementTypes` / `supplementStock` / `supplementLogs`)
4. **8절 — 생산 카드 저장/수정/삭제 시 영양제 자동 차감/롤백** (원육/봉투와 다른 시점)
5. **16절 — 통계 탭6 신설** (영양제 — 테이블 위주)
6. **4절 — 마감 경고에 영양제 5봉 미만 추가**
7. **5절 — 메뉴별 담당자 그룹에 영양제 추가**
8. **17절 — `closingFlags.warnSupplementMin` 추가, 시스템 설정값에 영양제 최소재고 임계값 추가**
9. **18절 — wipe whitelist에 3개 컬렉션 추가**

---

## 0. 차감 시점 명확화 (모순 정정)

handoff_v21 5-2 결정사항 "차감: 생산 저장 시 즉시 차감 (원육과 같은 시점)"에서 "원육과 같은 시점" 부분은 사용자 표현 착오로 판단. 원육/봉투는 **내일생산불러오기 시점**에 차감되므로 영양제와 다름.

**확정 정책 (v24)**:

| 자재 | 차감 시점 | 롤백 |
|---|---|---|
| 원육 | 내일생산불러오기 시 | 내일생산불러오기 취소 / 메인 새로고침 |
| 봉투 | 내일생산불러오기 시 | 내일생산불러오기 취소 / 메인 새로고침 |
| **영양제 (v24)** | **생산 카드 저장 시 즉시** | **생산 카드 삭제 / 수정 시 직접 환불** |

영양제는 `stockLedger`를 쓰지 않고 `supplementLogs`의 `relatedProductionId` 역추적으로 롤백.

---

## 1. 7절 — 레시피 관리 (생산단위 프리셋 신설)

### 1-1. 데이터 구조 추가

```js
// recipes 컬렉션 (v24 추가 필드)
{
  ...,
  unitPresets: number[],  // 예: [10, 20, 50]
}
```

규칙:
- 빈 배열 `[]` 허용 (마이그레이션 시 디폴트)
- 정수 / 소수 모두 허용 (운영자가 자유 입력)
- 중복 허용 안 함 (저장 시 검증, 중복 시 차단)
- 정렬: 입력 순서 유지 (오름차순 자동 정렬 안 함, 운영자 의도 존중)
- 최대 개수 제한 없음 (UI에서 자연스럽게 제한됨)

### 1-2. 등록/수정 모달 UI

레시피 등록/수정 모달에 **생산단위 프리셋** 필드 신설:

```
생산단위 프리셋
[  10  ] [+ 추가]
─────────────
[10] [x]
[20] [x]
[50] [x]
```

- 입력 칸에 숫자 입력 + "추가" 버튼 → chip 리스트에 추가
- 각 chip에 X 버튼으로 삭제
- 저장은 레시피 저장 시 같이 처리 (별도 저장 없음)
- 검증: 음수 / 0 / 중복 / 비숫자 차단

### 1-3. 프리셋 삭제 시 영양제 SKU 처리

기준: 프리셋에서 unit 제거 → 해당 SKU 자동 삭제 (재고 무관).

운영자 확정 정책:
- **자동 삭제 안 함**. 운영자가 프리셋에서 명시적으로 unit을 제거할 때만 SKU 삭제.
- 재고 보유 여부와 관계없이 삭제 가능.
- 단, 재고 있을 시 경고 모달 표시.

처리 흐름:

| 케이스 | 처리 |
|---|---|
| 재고 0봉 + 차감 이력 없음 | 일반 confirm: "생산단위 N을 프리셋에서 삭제합니다." → 확인 시 SKU + stock + 로그 삭제 |
| 재고 0봉 + 차감 이력 있음 | 일반 confirm + 이력 보존 경고: "차감 이력이 N건 있습니다. 삭제 시 이력도 함께 삭제됩니다." |
| **재고 N봉 (N>0)** | **경고 모달: "영양제 {SKU명} {N}봉이 있는데 정말 삭제하시겠습니까? 영양제 재고도 함께 삭제됩니다."** → 확인 시 SKU + stock + 로그 일체 삭제 |

⚠ 운영자가 의도하지 않은 자동 삭제 절대 발생 안 함. 레시피 비활성도 SKU 삭제 트리거 아님 (1-5 참조).

### 1-4. 기존 레시피 4개 마이그레이션

- `recipes/0E30g5DOHeTWl2N9XO4v` (치킨텐더)
- `recipes/69ZBLdBgD78gEbP6kBU4` (고양이 주식 덕캣)
- `recipes/HYdqC7LJ1Eft9JJU1Gly` (고양이 주식치킨캣)
- `recipes/yEhV7xTxX8giuDtSnFmQ` (고양이 치킨)

→ `unitPresets: []` 디폴트로 저장. 운영자가 시드 입력 시 레시피 수정 모달에서 직접 입력.

스크립트 마이그레이션 불필요. 코드에서 `unitPresets || []` 패턴으로 안전 처리.

### 1-5. 레시피 비활성 시 SKU 처리

- 레시피 `active: false` 전환 → 해당 레시피의 모든 SKU 자동 비활성 (`supplementTypes.active: false`)
- 비활성 SKU는 입고/수동조정 드롭다운에서 제외 (역방향 표시 보존)
- 영양제 메뉴 목록에서는 비활성 SKU 흐리게 표시
- 레시피 재활성 시 SKU도 자동 재활성 (재고/로그 보존)

비활성/활성과 삭제는 별개 흐름. 삭제는 오직 프리셋 명시적 제거로만.

---

## 2. 8절 — 생산 입력 (프리셋 select + 영양제 차감)

### 2-1. 생산단위 입력 UI 변경

기존: 자유 number input
변경: select 드롭다운 + "직접 입력" 옵션

**프리셋 있는 레시피 선택 시**:
```
생산단위
[ 10           ▼ ]
  ├─ 10
  ├─ 20
  ├─ 50
  └─ 직접 입력...
[단위명 표시]
```
- "직접 입력" 선택 시 number input 표시 (프리셋 외 값 입력 가능)
- 디폴트: 첫 번째 프리셋 값

**프리셋 없는 레시피 (`unitPresets: []`) 선택 시**:
```
생산단위
[ 선택 불가     ▼ ]  ← disabled
⚠ 레시피 관리에서 생산단위 프리셋을 먼저 설정해주세요.
```
- select disabled
- 저장 버튼도 disabled
- 안내 메시지 강제 표시 (skip 불가)

### 2-2. 생산 카드 저장 시 영양제 자동 차감

생산 카드 저장 트랜잭션 안에서 즉시 차감.

흐름:
1. 입력값 검증 (레시피 / 생산단위 / 담당자)
2. **SKU 조회** (`supplementTypes/{recipeId}_{unit}`)
3. SKU 없음 → 차단: "이 (레시피, 생산단위) 조합의 영양제가 등록되어 있지 않습니다. 레시피 관리에서 프리셋을 확인해주세요."
4. SKU 비활성 → 차단: "이 영양제는 비활성 상태입니다."
5. **재고 조회** (`supplementStock/{skuId}.currentQty`)
6. 재고 0봉 → 차단: "{SKU명} 재고가 부족합니다. 영양제 재고를 먼저 입고해주세요."
7. 1봉 차감 + 생산 카드 저장 (한 트랜잭션)
8. `supplementLogs` 발행 (`type: 'autoDeduct'`, `qty: -1`, `relatedProductionId: {productionId}`)

마이너스 비허용. 0봉 차감 시도 = 차단.

### 2-3. 생산 카드 수정 시 영양제 처리

저장 후 수정 가능 항목 (기존 정책 그대로):
- 레시피 변경 불가
- 생산단위만 수정 가능

생산단위 변경 시:
- 기존 SKU에서 1봉 환불 (`type: 'autoDeduct'`, `qty: +1`, `relatedProductionId` 기존 카드)
- 새 SKU에서 1봉 차감 (위 2-2와 동일 흐름)
- 새 SKU 재고 0봉이면 → 수정 차단 (기존 SKU 환불도 안 함, 원자성 보장)

### 2-4. 생산 카드 삭제 시 영양제 처리

생산 카드 삭제 = 저장 시 차감했던 1봉 환불.

- `supplementStock.currentQty += 1`
- `supplementLogs` 발행 (`type: 'autoDeduct'`, `qty: +1`, `reason: 'production deleted'`, `relatedProductionId` 카드 ID)

내일생산불러오기 전/후 무관 (원육/봉투와 다름). 카드 삭제 = 무조건 환불.

### 2-5. 내일생산불러오기 / 취소와 무관

원육/봉투는 내일생산불러오기 시 차감, 취소 시 ledger 롤백.

영양제는 **이 흐름과 완전히 분리**:
- 내일생산불러오기 시 영양제 차감 안 함 (이미 카드 저장 시 차감 끝)
- 내일생산불러오기 취소 시 영양제 환불 안 함 (생산 카드 자체는 살아있으므로)
- 메인 새로고침 시 영양제 ledger 롤백 없음

---

## 3. 신설 절 — 영양제 재고 관리 (메뉴 신설)

### 3-1. 메뉴 위치

신설 메뉴. 메뉴 번호 + 화면 순서는 **운영자 결정 필요**.

디폴트 안: **메뉴 5번 봉투 재고 다음** 또는 **메뉴 6번 동결제품 입고 다음**. 결정사항에 따라 확정.

### 3-2. 데이터 구조

```js
// supplementTypes (SKU 마스터, 자동 생성/삭제)
{
  id: `${recipeId}_${unit}`,  // 결정적 doc id (예: 'yEhV7xTxX8giuDtSnFmQ_10')
  recipeId: string,
  recipeName: string,         // 스냅샷 (표시 빠르게)
  unit: number,
  name: string,               // `${recipeName} ${unit}용 영양제` 자동 생성
                              // 예: '고양이 치킨 10용 영양제'
  active: boolean,            // 레시피 active 따름
  sortOrder: number,          // recipes.sortOrder * 100 + unit index
  createdAt, updatedAt,
  createdBy, updatedBy,
}

// supplementStock (현재 재고, SKU와 1:1)
{
  id: same as supplementTypes.id,
  supplementTypeId: string,
  currentQty: number,         // 봉, 정수, 0 이상
  updatedAt: Timestamp,
}

// supplementLogs (입고/차감/조정 이력)
{
  date: string,               // YYYY-MM-DD (KST)
  timestamp: Timestamp,       // UTC
  supplementTypeId: string,
  type: 'in' | 'autoDeduct' | 'adjust',
  qty: number,                // 부호 포함 (in 양수, autoDeduct 음수 또는 환불 양수, adjust 양수/음수)
  before: number,
  after: number,
  staffName: string,
  reason?: string,            // adjust 필수
  note?: string,
  relatedProductionId?: string,  // autoDeduct 시 필수
}
```

### 3-3. SKU 자동 생성/삭제

**생성 트리거**:
- 레시피 등록 시 `unitPresets` 있으면 각 unit마다 SKU 생성
- 레시피 수정 시 `unitPresets` 변경 → 추가된 unit에 대해 SKU 생성
- `supplementStock` 초기 0으로 생성
- `name` 필드 자동 계산: `${recipeName} ${unit}용 영양제`
  - 사용자 결정: 단위명 (units) 제거. 숫자 + "용 영양제" 만.

**삭제 트리거**:
- 레시피 수정 시 `unitPresets`에서 unit 제거
- 위 1-3 정책 그대로 (재고 0이면 confirm, 재고 있으면 경고 모달)
- 삭제 시 `supplementTypes` + `supplementStock` + 해당 SKU의 `supplementLogs` 일체 삭제

**비활성/활성 트리거**:
- 레시피 active 토글 따라감 (1-5 참조)
- SKU 자체에 활성 토글 UI 없음

### 3-4. 메뉴 화면 구성

좌우 분할 (봉투 재고 패턴 유사).

**좌측 — SKU 목록**
- 카드/행 형식 (봉투 카드 패턴)
- 표시: SKU명 / 현재 재고 / 색상 분기
  - 10봉 미만: 노란색 배경
  - 5봉 미만: 빨간색 배경
  - 10봉 이상: 기본 흰색
- 비활성 SKU 흐리게 표시
- 정렬: `sortOrder` 오름차순
- 필터 (상단):
  - 전체
  - 10봉 미만만
  - 5봉 미만만

**상단 버튼**:
- ① 영양제 입고 등록
- ② 수동 조정
- ③ 필터 토글 (전체/10미만/5미만)
- ④ 새로고침 (공통 패턴)

**우측 — 이력 테이블**
- 최근 50건 표시
- 컬럼: 날짜 / 시간 / SKU / 유형 (입고/자동차감/수동조정) / 수량 / 잔량 / 담당자 / 사유·비고
- 유형 태그 색상:
  - 입고: 파란색
  - 자동차감 (생산 차감 / 환불): 회색
  - 수동조정: 노란색
- 전체보기 버튼 → 모달 (10일치 / 히스토리 전체)

### 3-5. ① 영양제 입고 등록

입고예정 흐름 없음. 즉시 등록.

모달:
- SKU 드롭다운 (활성만, sortOrder 순)
- 수량 (양수 정수, 봉 단위)
- 입고일 (디폴트 오늘, KST)
- 담당자 (메뉴별 담당자 그룹, 5-1 참조)
- 비고

저장 트랜잭션:
- `supplementStock.currentQty += qty`
- `supplementLogs` 발행 (`type: 'in'`)
- `activityLogs` 발행 안 함 (수동조정만 발행, 입고는 미발행 — 봉투/원육 패턴 따름)

수정/삭제: 당일 행만 가능 (입고예정 패턴). 이전 날짜는 수동 조정으로만 처리.

### 3-6. ② 수동 조정

모달:
- SKU 드롭다운 (활성만)
- 조정 유형: + 증가 / − 감소
- 수량 (양수 정수)
- 사유 (필수)
- 담당자 (필수, 메뉴별 담당자 그룹)
- 비고

저장 트랜잭션:
- `supplementStock.currentQty += signedQty`
- 결과가 음수면 차단: "재고가 마이너스가 됩니다. 조정 수량을 확인해주세요."
- `supplementLogs` 발행 (`type: 'adjust'`, `reason` 포함)
- `activityLogs` 발행 (사무 로그 — 봉투/원육 수동조정 패턴 따름)

마이너스 재고 비허용 (원육/봉투는 마이너스 가능하지만 영양제는 비허용 — 생산 차단 정책과 일치).

### 3-7. ③ 필터

상단 토글:
- 전체 (디폴트)
- 10봉 미만만
- 5봉 미만만

좌측 목록만 필터링. 이력 테이블은 무관.

### 3-8. 마감 경고 (차단 X)

마감 차단 항목 아님. 경고만.

- 5봉 미만 SKU 1개 이상 있으면 마감 경고 표시
- `closingFlags.warnSupplementMin` (디폴트 true)
- 경고 모달 메시지: "{SKU명}: 현재 {N}봉 / 최소 5봉" (봉투/원육 경고 패턴 따름)

`closingChecksLogic.js` / `closingChecks.js` 확장:
- `gatherWarningSupplementMin()` 추가
- `flags.warnSupplementMin` 체크 후 조회
- 결과를 `warnings` 배열에 추가 (봉투/원육 패턴 동일)

### 3-9. 자동 발행 로그 (supplementMin:alert)

매일 1회 자동 발행.

- 결정적 doc id 패턴: `supplementMin:alert:${date}:${skuId}` 또는 `supplementMin:alert:${date}` (한 번에 묶음)
  - 봉투/원육 `minStock:alert` 기존 패턴 확인 후 일관성 맞춰 결정 (1차 안: 한 번에 묶음 패턴)
- 트리거: 5봉 미만 SKU 1개 이상
- 발행 시점: `triggerMinStockLogs(today)` 동일 흐름에서 같이 처리
- 분류: 사무 로그 (`minStock:alert` 패턴 따름)
- 확인 필수 로그 처리 (생산/사무 로그 차단에는 포함 안 됨, 봉투/원육과 동일)

### 3-10. 권한

운영자 결정사항 그대로:
- 입고 등록: admin/office/production 전체 (qc@ 포함)
- 수동조정: admin/office/production 전체 (qc@ 포함)
- 필터/조회: 전체
- SKU 마스터 수정/삭제: 직접 UI 없음 (레시피 관리에서 프리셋으로만)

### 3-11. 데이터 정합성

- `supplementTypes.active`가 `false`인 SKU는 입고/수동조정 모달 드롭다운에 노출 안 됨
- 생산 카드 저장 시 비활성 SKU → 저장 차단 (위 2-2 참조)
- `recipes.unitPresets`에서 unit 제거 시 → SKU 삭제 (위 1-3 / 3-3)
- `recipes`가 삭제될 일은 없음 (레시피 삭제 정책 폐지 — 활성/비활성만)

---

## 4. 16절 — 통계 탭6 신설 (영양제)

운영자 결정 (c): 테이블 위주.

### 4-1. 데이터

기간 내 SKU별 집계:
- 기간 입고 합계 (`supplementLogs.type === 'in'` 양수 합)
- 기간 사용량 합계 (`supplementLogs.type === 'autoDeduct'` 음수의 절댓값 합)
  - 환불 (autoDeduct 양수) 차감 — net 사용량
- 기간 수동조정 합계 (`supplementLogs.type === 'adjust'`, 부호 포함)
- 현재 재고 (`supplementStock.currentQty`)

### 4-2. 화면

차트 없음. 테이블만.

```
[ 필터: 전체 / 활성만 / 비활성 포함 ]

| SKU명              | 입고 (봉) | 사용 (봉) | 수동조정 (봉) | 현재재고 (봉) |
|---|---|---|---|---|
| 고양이 치킨 10용 영양제   | 50       | 12       | -3            | 35           |
| 고양이 치킨 20용 영양제   | 30       | 8        | 0             | 22           |
| ...                 |          |          |               |              |

총계:                | 80       | 20       | -3            | 57           |
```

- 정렬: `sortOrder` 오름차순
- 비활성 SKU 토글 (디폴트 활성만)
- 현재 재고는 기간 무관 실시간값

### 4-3. Excel 다운로드

- 개별 다운로드: `통계_영양제_{시작일}~{종료일}.xlsx`
- 전체 다운로드: 기존 5탭에 추가 → 6탭 시트 (`영양제`)

### 4-4. 캐시/상태 (stats.js 확장)

```js
lastSupplementAgg
visibleSupplementIds       // 비활성 토글
knownSupplementIds
supplementTypeActiveMap    // active 여부
```

봉투 통계 (탭3) 패턴 유사하지만 차트 없음.

---

## 5. 5절 — 메뉴별 담당자 그룹

영양제 메뉴 추가. 운영자 결정 필요 (디폴트 안 제시).

| 메뉴 | 선임 | 주임 | 사무 |
|---|---|---|---|
| 영양제 재고 (입고) | ☐ | ☑ | ☑ |
| 영양제 재고 (수동조정) | ☑ | ☐ | ☑ |

→ 운영자 확정 시 spec_v25에 반영.

---

## 6. 17절 — 설정값 확장

### 6-1. closingFlags 추가

```js
{
  ...,
  warnSupplementMin: true,  // v24 신설
}
```

설정 UI는 D-1 (Phase 1 6차 묶음)에서 다룸. 현재는 디폴트 true (문서 없으면 ON).

### 6-2. 시스템 설정값 추가

```
- 영양제 색상 분기 임계값 (디폴트: 10봉 미만 노랑, 5봉 미만 빨강)
- 영양제 자동 발행 트리거 (디폴트: 5봉 미만)
- 영양제 마감 경고 트리거 (디폴트: 5봉 미만)
```

settings 컬렉션에 추가. UI는 D-3 (Phase 1 6차 묶음). 미존재 시 코드 디폴트 사용.

---

## 7. 18절 — wipe whitelist 갱신

현재 24개 → v24에서 3개 추가 → **27개**.

추가 컬렉션 (운영 데이터로 분류):
- `supplementTypes`
- `supplementStock`
- `supplementLogs`

`recipes`는 wipe 대상 아님 그대로 유지 (`unitPresets` 필드만 추가).

---

## 8. 4절 — 마감 차단/경고 (변경 요약)

### 차단 항목 (변경 없음)
v22/v23 그대로. 영양제는 마감 차단 항목 아님.

### 경고 항목 (1건 추가)
1. 내일 생산 입력 없음 (`warnNoTomorrowProd`)
2. 봉투 최소재고 미달 (`warnBagMin`)
3. 원육 최소재고 미달 (`warnMeatMin`)
4. **영양제 5봉 미만 (`warnSupplementMin`)** — v24 신설

경고 모달 디테일 표시 패턴 (C-2 통일 패턴) 그대로 적용.

---

## 9. 시드 입력 순서 (v24 갱신)

| 순서 | 항목 | 비고 |
|---|---|---|
| 1 | 원육 종류 | 기존 |
| 2 | 봉투 종류 | 기존 |
| 3 | 동결제품 종류 | 기존 |
| 4 | 레시피 매핑 보정 + **생산단위 프리셋 입력** | v24 신규 |
| 5 | **영양제 SKU 자동 생성 확인 + 초기 재고 입력** | v24 신규 (영양제 메뉴 완성 후) |
| 6 | 회사 휴무일 | 기존 (한국 법정공휴일은 Phase 2 자동) |
| 7 | 초기 재고 (원육/봉투/동결제품) | 기존 |

**시드 입력 시점**: 영양제 메뉴 완성 후 시작. 영양제 메뉴 미완성 상태에서 시드 시작 금지.

---

## 10. 권한 매트릭스 추가

| # | Item | Decision |
|---|---|---|
| 21 | Supplement stock — incoming, manual adjust | All accounts may use it (admin/office/production/qc). |
| 22 | Recipe unit presets management (registration/edit) | Admin/office only (recipe 권한 따름). |

---

## 11. 코드 영향 범위 (참고)

| 파일 | 변경 |
|---|---|
| `src/pages/recipe.js` | unitPresets 필드 + chip UI + 프리셋 삭제 시 SKU 처리 |
| `src/pages/production.js` | 생산단위 select + 직접 입력 옵션 + 빈 프리셋 강제 + 영양제 차감/환불/SKU 검증 |
| `src/pages/supplement.js` (신설) | 영양제 메뉴 전체 |
| `src/router.js` | 영양제 메뉴 등록 |
| `src/app.js` | 영양제 메뉴 권한 정의 |
| `src/layout.js` | 사이드바에 영양제 메뉴 추가 |
| `src/pages/stats.js` | 탭6 영양제 + Excel 6시트 |
| `src/services/closingChecks.js` | warnSupplementMin 조회 |
| `src/services/closingChecksLogic.js` | gatherWarningSupplementMin |
| `src/pages/main.js` | `triggerMinStockLogs`에 영양제 항목 추가 |
| `src/utils/firestoreSchemas.md` | 3개 컬렉션 스키마 추가 |
| `scripts/wipe.js` (또는 admin wipe 코드) | whitelist 3개 추가 |

---

## 12. spec_v25 작성 시점

**spec_v25**: 동시 운영 시작 후 1~2주 발견사항 반영. Phase 4 이후 작성.

v24에서 못 박은 항목 중 운영 중 결정 필요한 것:
- 영양제 메뉴 위치 (디폴트 안에서 확정)
- 영양제 메뉴별 담당자 그룹 (5절)
- 영양제 색상 분기 임계값 (운영 1~2주 후 미세조정 가능성)
- 자동 발행 doc id 패턴 한 번 더 검증 (`minStock:alert` 기존 패턴 확인 후)

---

## 13. 미해결 / 결정 필요 항목 (spec_v24 이후)

| 항목 | 결정 시점 | 비고 |
|---|---|---|
| 영양제 메뉴 위치 (몇 번째) | 코드 진입 직전 | 운영자 결정 |
| 영양제 메뉴별 담당자 그룹 | 코드 진입 직전 | 5절 채움 |
| `supplementMin:alert` doc id 패턴 (per-SKU vs 일자 묶음) | 코드 진입 시 | `minStock:alert` 기존 코드 확인 후 일관성 맞춤 |
| `name` 필드 표시 형식 최종 확정 | spec 검토 시 | "고양이 치킨 10용 영양제" 형식 — 운영자 확정 |

---

**작성**: 2026-05-13
**기준 handoff**: v21
**기준 commit**: (영양제 코드 진입 전, `index-eUuQcS8g.js`)
**다음 단계**: handoff_v22 작성 → 영양제 메뉴 위치 + 담당자 그룹 확정 → 코드 진입
