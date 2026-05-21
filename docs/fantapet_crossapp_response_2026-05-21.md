# 생산관리 앱 → 재고관리 앱 — Cross-app 요청서 v2 응답

작성일: 2026-05-21
응답 대상: `재고관리 docs/판타펫_재고관리_Cross-app_요청_v2_2026-05-18.md` (7개 항목)
기준: 생산앱 main `6159d74` 실제 코드 + 라이브 시드 상태(`fant-e5ae5`)
작성: 생산앱 세션 (Claude 분석, 실제 코드 대조)

요약 판정: **§6·§7 종결, §2·§4 답변완료, §3 = N(생산앱 forecast 미참조), §5 스탬프 예정, §1 실제 스키마 통보(재고 가정과 상이 — 아래 §1 필독).**

---

## §1. recipes / productionMethods 실제 구조 — ⚠ 재고 가정과 다름

### 핵심: 환산 모델이 카테고리별로 다르고, 동결건조는 productionMethods를 안 씀

`recipes/{id}` 의 `category`는 **`'raw'`(생식) | `'freezeDry'`(동결건조)** 두 값. (재고 가정 `'raw'|'dried'` 와 다름 — `freezeDry` 임.)

| 카테고리 | 환산 필드 | 비고 |
|---|---|---|
| `raw` (생식) | `productionMethods[]` (배열) | 생산방식별 unit→box 환산 |
| `freezeDry` (동결건조) | `freezeDryBagCountPerUnit` (숫자) | **productionMethods 없음.** 1 생산단위당 봉 수 |

**재고 시안 6-1은 "동결건조 제품 → productionMethod 조회"로 설계됐는데, 생산앱 동결건조 레시피엔 productionMethods가 없습니다.** 동결건조 환산은 `recipes/{id}.freezeDryBagCountPerUnit`(1단위 = N봉)를 읽어야 합니다.

### 1-A. raw 레시피 `productionMethods[]` 실제 스키마

```js
// recipes/{id}  (category === 'raw' 일 때만 존재, 그 외엔 [])
{
  category: 'raw',
  name: string,
  unitPresets: number[],          // 예: [60, 100] (g 단위 SKU)
  productionMethods: [
    {
      methodKey: 'rotary' | 'manual',   // 정본 2종 (로터리/수동). 그 외 키 없음
      label: '로터리' | '수동',
      unitToBox: number,                // 1 생산단위 → N박스 (소수 가능, >0)
      effectiveDate: 'YYYY-MM-DD',      // 환산 적용 시작일 (필수)
      active: boolean                    // 기본 true
    }
  ],
  sortOrder: number,
  active: boolean
}
```

- ⚠ 재고 가정 필드와 매핑: `methodId`→`methodKey`, `methodName`→`label`, `conversionToBoxes`→`unitToBox`, `conversionEffectiveDate`→`effectiveDate`, `isActive`→`active`.
- ⚠ **생산앱에 없는 것**: `baseUnit`, `baseQty`, `conversionToPacks`. 생산앱 raw 환산은 **box 1차원(`unitToBox`)만** 제공. "판→팩" 같은 팩 환산 개념 없음.

### 1-B. freezeDry 레시피 환산

```js
// recipes/{id}  (category === 'freezeDry')
{
  category: 'freezeDry',
  name: string,
  unitPresets: number[],            // 예: [1]
  freezeDryBagCountPerUnit: number, // 1 생산단위 = N봉 (재고의 "팩 환산"에 해당)
  // productionMethods 없음
}
```

### 1-C. conversionHistory subcollection (raw 환산 변경 이력)

```js
// recipes/{id}/conversionHistory/{auto-id}
{
  methodKey,            // 'rotary' | 'manual'
  unitToBox,            // 변경 후 값
  prevUnitToBox,        // 변경 전 값
  effectiveDate,        // 'YYYY-MM-DD'
  reason: 'manual',
  basedOnAvgOfRecent5: boolean,
  createdAt: <serverTimestamp>,
  createdBy: <uid|null>
}
```
- freezeDry는 conversionHistory 미사용(현재).

### 1-D. 호출 인터페이스 / 적용 규칙 / 빈값

- **호출**: 직접 Firestore read. 생산앱은 Cloud Functions 미사용 → 함수 래퍼 없음.
- **환산값 적용 규칙(raw)**: `effectiveDate ≤ productionDate` 인 것 중 `effectiveDate` 최신, 동일 시 conversionHistory(이력) 우선 + `createdAt desc` tie-break. 미래 effectiveDate는 차단 안 함(현재값 fallback + 안내). (생산앱 spec_v26 정정 #8·#9)
- **빈값**: raw인데 환산 미등록 → `productionMethods: []`. freezeDry → `productionMethods` 키 자체 없음/빈배열, 대신 `freezeDryBagCountPerUnit` 확인. recipe 자체 없으면 read 결과 없음(에러 아님).

### 1-E. 재고측 권장

재고 동결건조 발주예측 환산은 **`freezeDryBagCountPerUnit`** 기반으로 설계. raw 제품을 발주예측에 쓸 경우만 `productionMethods[].unitToBox`. 팩/baseUnit/baseQty 2차원 환산이 발주예측에 꼭 필요하면 별도 협의(생산앱 스키마 확장 vs 재고 자체 보유). **재고가 아직 소비 코드를 안 만들었으므로 위 실제 스키마 기준으로 Phase 2c 설계 권장.**

---

## §2. 휴일 마스터 시드 일정 — 완료

- `holidays` 시드 **완료**: 약 65건, **2025~2027년** 적재(Phase 2a 자동 등록 통과, 라이브 보존 확인 2026-05-21).
- 영업일 캐시 갱신 주기(systemSettings, 30분): 현행 유지. 변경 필요 시 협의.
- 운영 중 휴일 추가·변경 알림: 생산앱이 `activityLogs`(휴일 변경 시) 기록 → 재고 알림 #11 연동은 §5(app 스탬프) 적용 후 가능.
- 과거 이관 기간(1~3년) 휴일이 추가로 필요하면 범위 알려주면 적재.

---

## §3. forecastDaily / forecastAnalytics read-only 노출 — **N**

- 생산앱은 forecastDaily / forecastAnalytics를 **읽지 않음**(2026-05-21 호두 결정). 생산앱 firestore.rules에 해당 read 규칙 없음(추가 안 함).
- 생산앱은 별도 forecast 계산도 안 함(생산앱엔 발주예측/예정생산표 미구축, forecast 비참조).
- → 정합성 충돌 없음(생산앱이 같은 데이터로 다른 계산을 낼 일 없음). 재고가 단독 소유·계산.
- 추후 생산앱이 예정생산표(Phase 2c)에서 참조 표시가 필요해지면 그때 §3 재오픈.

---

## §4. 환산 기준 등록·수정 UX — 존재함

- **경로**: 생산앱 > 레시피 관리 > [생식 레시피] > 생산방식(productionMethods) 섹션. (동결건조 레시피는 `freezeDryBagCountPerUnit` 입력 필드.)
- **effectiveDate 처리**: 등록·수정 시 적용 시작일 직접 입력. 미래 시점 예약 가능(미래 effectiveDate 차단 안 함, 적용은 productionDate 도달 시).
- **변경 이력 보기**: `recipes/{id}/conversionHistory` 에 변경 이력 누적(prev/next/effectiveDate/createdAt). 재고 forecastNotes.driedRows의 `appliedConversionDate` 스냅샷으로 과거 기준 추적 시 이 subcollection 조회.
- 재고 시안 6-1 "환산 기준은 생산관리 앱 레시피 관리에서" 안내 문구 → 위 경로 실제 존재함.

---

## §5. activityLogs `details.app:'production'` — 적용 예정(작업 중)

- 현재 생산앱 `recordActivity`는 `details.app`를 박지 않음(미충족).
- **수정 예정**: `recordActivity`가 모든 로그 `details.app:'production'` 자동 주입(branch `fix/activitylogs-app-stamp`, 본 응답과 함께 진행).
- 데드라인: 재고 묶음D(2026-05-21) 결정으로 **운영 진입(Phase 5 dual-run) 체크리스트**로 이동 — Phase 1 블로커 아님. 단 생산앱은 선제 적용 예정.
- spec_v25 §3·§4 정의 준수. 적용 후 재고 통합 이력 조회에서 `details.app` 필터 동작.

---

## §6. UI 스택 + 공유 계정 role 체계 — 종결(cutover 완료)

- 생산앱 = Vanilla JS + Vite, 커스텀 라우터, vanilla HTML/CSS + SortableJS. shadcn/Tailwind 미사용. 컴포넌트 공유 불가(스택 비호환). 재고 shadcn 유지 권장.
- 정본 role: **admin / office / production** 3종. 권한 매트릭스 = spec_v23 §10.
- 공유 계정 규약: **앱별 role 분리** `{ app:[], roles:{ inventory, production } }`. 각 앱 자기 키만 read, setter는 read-merge로 상대 키 보존, bare `role` 금지.
  - **2026-05-20 양 앱 cutover 실행 완료.** 라이브 claims: alice@`{inv:owner,prod:admin}`, admin@`{inv:admin,prod:office}`, qc@`{inv:qc,prod:production}`.
  - 생산앱 setUserClaims 권한관리는 재고 Cloud Function(`setUserClaims`)이 roles.production도 세팅하도록 확장됨(재고 branch `cutover/setuserclaims-production-role`, 단일 권위).
- `production` role 정본 맞음. 범위 = 생산직원(생산입력 가능, 드래그 핸들·마스터관리·설정·수동조정 등 admin/office 전용 UI 차단). qc@가 production으로 작동하는 것은 의도된 것(2026-05-21 권한 매트릭스 점검 통과).

---

## §7. Cloud Functions 리전 — 종결

- 생산앱 Cloud Functions **미사용**(Auth + Firestore + Hosting only). 리전 충돌 없음. 재고 `asia-northeast3` 유지. cross-region 시나리오 없음.

---

## 종합 표

| # | 항목 | 생산앱 응답 |
|---|---|---|
| 1 | productionMethods 구조 | 실제 스키마 통보. **동결건조는 productionMethods 없음 → `freezeDryBagCountPerUnit` 사용**. raw는 `unitToBox` 1차원(팩/baseUnit 없음). 재고 가정과 상이 → 위 실제 기준 설계 |
| 2 | 휴일 시드 | 완료(65건/2025-2027) |
| 3 | forecast read 노출 | **N** (생산앱 미참조) |
| 4 | 환산 등록·수정 UX | 레시피 관리 경로 존재, effectiveDate 예약·conversionHistory 이력 |
| 5 | activityLogs app 스탬프 | 적용 예정(선제), 데드라인 Phase 5로 이동 |
| 6 | role 체계 | 종결(cutover 완료) |
| 7 | Functions 리전 | 종결(함수 없음) |

**다음 협의 필요 항목**: §1의 동결건조 환산 모델(`freezeDryBagCountPerUnit`) + raw box 환산이 재고 발주예측 요구(팩 2차원)를 충족하는지 — 재고 Phase 2c 설계 진입 시 확정.
