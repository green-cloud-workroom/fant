# Fantapet Management — Spec v26

작성일: 2026-05-14
이전: spec_v25
형식: **v25 대비 신설 영역 + 정정 사항**. v22/v23/v24/v25 전체를 대체하지 않음. 다음 채팅에서 v22 + v23 + v24 + v25 + v26 같이 참조.

---

## v25 → v26 변경 요약

6개 영역 신설 + 정정:

1. **§1 — 영양제 표 입력 재작업**: v24 §3-4/§3-5/§3-6 모달 코드 폐기. 표 입력으로 전환.
2. **§2 — 환산표 통합 (생식 한정)**: recipes.productionMethods + conversionHistory 신설. 환산 차이 자동 추천. 재고관리 앱 [환산표] 메뉴 폐기 결정 반영.
3. **§3 — in-app 가변 데이터 wipe**: 설정 메뉴 위험 영역 신설. wipeHistory 컬렉션 + activityLogs delete 정책 변경.
4. **§4 — 예정 생산표 (productionPlans)**: 재고관리 앱 spec §44~46 옵션 A 분리 결과. 매트릭스 UI + forecastDaily/Analytics read.
5. **§5 — Firestore rules + Custom Claims**: 양 앱 공동 작업. rules 파일화 + Custom Claims 부여. 발견사항 #4 클로즈 경로.
6. **§6 — 봉투/레시피 삭제 정책**: v19_final §297 + v24 §3-11 정정. 조건부 삭제 도입.

추가:
- §7 미해결 / 결정 필요 항목
- §8 작업 시점 / 의존 관계 (handoff_v23 §"남은 작업 마스터 플랜" 갱신)

---

# §1. 영양제 표 입력 재작업

v24 §3-4/§3-5/§3-6 모달 입력 폐기. 표 입력으로 전환.

## 1-1. 폐기 대상

| commit | 내용 | 처리 |
|---|---|---|
| `ca65179` | 영양제 입고 모달 (단위 6) | UI 폐기, 핵심 로직(트랜잭션) 유지 |
| `4b37de2` | 영양제 수동조정 모달 (단위 7) | UI 폐기, 핵심 로직 유지 |

→ 데이터 구조 (`supplementTypes` / `supplementStock` / `supplementLogs`) 그대로. UI만 교체.

## 1-2. 표 UI 구조

```
┌─────────────────────┬──────┬─────────┬─────────┬─────────┬─────┐
│ 영양제 (제품+프리셋) │ 현재 │ 5/14    │ 5/14    │ 5/14    │ ... │
│                     │ 재고 │ 수동조정 │ 입고    │ 자동차감 │     │
├─────────────────────┼──────┼─────────┼─────────┼─────────┼─────┤
│ 담당자              │  —   │ alice   │ qc@     │ 자동    │     │
│ 사유 (수동조정만)    │      │ 분기마감 │         │         │     │
├─────────────────────┼──────┼─────────┼─────────┼─────────┼─────┤
│ 고양이 치킨 10용    │ 35⬜ │   +5    │   +20   │   -1    │ ... │
│ 고양이 치킨 20용    │  8🟨 │   -2    │         │   -1    │ ... │
│ 고양이 치킨 50용    │  3🟥 │         │   +10   │         │ ... │
└─────────────────────┴──────┴─────────┴─────────┴─────────┴─────┘
```

### 컬럼 정렬

| 항목 | 결정 |
|---|---|
| 좌측 고정 컬럼 | SKU명 + 현재 재고 (2열, sticky left) |
| 데이터 열 정렬 | **왼쪽일수록 최신** |
| 과거 일자 범위 | 14일 + 가로 스크롤로 그 이전 |
| 같은 날 여러 번 입고/조정 | 같은 날짜에 **별도 열** 생성 (입고 누를 때마다 새 열) |
| 자동차감 표시 | 그날 net 합계 1열로 묶음 (회색 톤) |

### 행 구조

| 행 | 내용 |
|---|---|
| 헤더 1 (날짜) | YYYY/MM/DD (모든 열 공통, 같은 날은 셀 병합) |
| 헤더 2 (유형) | 수동조정 / 입고 / 자동차감 |
| 메타 1 (담당자) | 입고·수동조정 열 = 첫 입력 시 select. 자동차감 열 = "자동" 고정 표시 |
| 메타 2 (사유) | 수동조정 열만 사용. 열 헤더에 텍스트 1개 (열 전체 공통) |
| 데이터 | SKU별 + 부호 표시 (`+5` / `-2`) |

## 1-3. 자동 저장 + 권한

### 자동 저장

- Tab/blur 이벤트 시 즉시 저장
- 트랜잭션: `supplementStock.currentQty += signedQty` + `supplementLogs` 발행
- 저장 실패 시 셀 빨간 테두리 + 토스트 알림
- 새 열 생성 = [입고] / [수동조정] 버튼 클릭 시점 (열만 생성, 실제 저장은 셀 입력 시)

### 권한 정정 (v24 §10 #21 정정)

| 작업 | 권한 |
|---|---|
| 입고 버튼 / 입고 셀 입력 | **production만 (qc@)** |
| 수동조정 버튼 / 수동조정 셀 입력 | **admin + office (alice + admin@)** |
| 표 조회 | 전체 |

⚠ 사용 가능 계정 자체 제한 = UI DOM 제거 패턴. 담당자 select는 사용 가능 계정 기준 자동 매핑.

v24 §10 #21 "All accounts may use it"은 정정. 사용자 결정 반영.

## 1-4. 색상 분기 + 필터 토글 + 출력

| 항목 | 결정 |
|---|---|
| 색상 분기 (현재 재고 셀) | 10봉 미만 노랑 / 5봉 미만 빨강 |
| 임계값 출처 | D-3 (시스템 설정값) 도입 후 settings 전환. 초기값 = 노랑 10 / 빨강 5 |
| 필터 토글 | 전체 / 10봉 미만만 / 5봉 미만만 |
| 출력 | 브라우저 인쇄 (CSS @media print) |
| 비활성 SKU | 흐리게 표시 |

## 1-5. 활동 로그

- 입고 = 미발행 (봉투/원육 패턴 따름)
- 수동조정 = `activityLogs` 발행 (`action: 'supplement'`, `subAction: 'adjust'`, `details: { skuId, skuName, qty, before, after, reason }`)
- 자동차감 = 미발행 (`supplementLogs`에만 기록)

## 1-6. v24 정정 항목

- **§3-4 메뉴 화면 구성**: 좌우 분할 → 단일 표 + 우측 상단 버튼 [입고] [수동조정] [필터] [새로고침]
- **§3-5 입고 등록 모달**: 표 셀 입력으로 대체. 모달 없음.
- **§3-6 수동조정 모달**: 표 셀 입력으로 대체. 단 사유 입력 = 열 헤더에 1개 (강제 입력 필드)
- **§3-7 필터**: 그대로 유지
- **§3-10 권한**: §1-3 매트릭스로 정정
- **§4 통계 탭6**: 그대로 (표 입력은 메뉴 화면만 영향, 통계는 영향 없음)

## 1-7. 코드 영향 범위

| 파일 | 변경 |
|---|---|
| `src/pages/supplement.js` | 모달 코드 제거 + 표 컴포넌트 신규 |
| `src/style.css` | 표 스타일 + sticky 좌측 컬럼 + @media print |
| `src/pages/main.js` | `OFFICE_LOG_ACTIONS`에 `'supplement'` 추가 (이미 있는지 확인 필요) |

작업 분량 추정: 4~6h

---

# §2. 환산표 통합 (생식 한정)

재고관리 앱과 합의: **옵션 2 (이관)**. 환산 마스터 + 환산 차이 분석 모두 생산관리 앱 책임.

## 2-1. 적용 범위 정정

**환산표 = 생식 카테고리 한정.**

근거: 동결제품은 추적 어려움 (입고 기준 시점과 생산 시점 다름, 박스 단위 환산 명확 X). 동결제품 환산은 spec_v27 또는 별도 영역으로.

## 2-2. 데이터 구조

### recipes.productionMethods 추가

```js
// recipes 컬렉션 (v26 추가 필드, 생식 카테고리 한정)
{
  ...,
  productionMethods: [
    {
      methodKey: 'rotary' | 'manual',  // 운영자 결정 — 1차 안
      label: string,                    // 표시명 (예: '로터리', '수동')
      unitToBox: number,                // 환산 비율 (생산단위 1 → N박스)
      effectiveDate: 'YYYY-MM-DD',      // 이 값이 적용되기 시작한 날
      active: boolean,
    }
  ],
}
```

⚠ `methodKey` 종류 확장은 spec_v27. 일단 'rotary' / 'manual' 2종으로 박음.

### conversionHistory subcollection

```js
// recipes/{recipeId}/conversionHistory/{historyId}
{
  methodKey: 'rotary' | 'manual',
  unitToBox: number,                    // 변경 후 값
  prevUnitToBox: number,                // 변경 전 값
  effectiveDate: 'YYYY-MM-DD',          // 새 값 적용 시작일
  reason: 'manual' | 'autoSuggested',
  basedOnAvgOfRecent5?: boolean,        // 자동 추천일 때 true
  createdAt: Timestamp,
  createdBy: string,
}
```

## 2-3. 레시피 모달 환산값 입력 UI

레시피 등록/수정 모달에 **생산 방식별 환산값** 섹션 신설:

```
생산 방식별 환산값 (생식 한정)
┌──────────┬──────────────┬────────────────┐
│ 방식     │ 단위 1 → 박스 │ 적용 시작일     │
├──────────┼──────────────┼────────────────┤
│ 로터리   │ [  0.83  ]   │ [  2026-05-14 ]│ [x]
│ 수동     │ [  0.70  ]   │ [  2026-01-01 ]│ [x]
└──────────┴──────────────┴────────────────┘
[+ 방식 추가]
```

- 동결건조 레시피 = 이 섹션 표시 안 함
- 환산값 변경 시 conversionHistory 자동 추가
- 적용 시작일 = 디폴트 오늘. 과거 날짜 입력 가능 (과거 생산 카드 재계산 트리거 안 함, 신규만 영향)

## 2-4. 생산 입력 모달 변경

```
레시피: [고양이 치킨 ▼]
생산단위: [ 100 ▼ ]   (프리셋 select)
생산방식: [ 로터리 ▼ ]  ← v26 신설
예상 박스: 83박스 (환산 자동 표시, read-only)
실제 박스: [   85   ] 박스 ← v26 신설 (선택 입력)
담당자: ...
```

| 항목 | 정책 |
|---|---|
| 생산방식 select | productionMethods active 항목만. 첫 항목 디폴트 |
| 환산값 적용 | **생산일 기준** effectiveDate ≤ productionDate 중 최신 |
| 실제 박스 | 선택 입력. 강제 X. 입력 시 환산 차이 분석 대상 |
| 동결건조 레시피 | 생산방식 select 표시 안 함 |

## 2-5. 환산 차이 분석 (D1~D5 박힘)

| 항목 | 결정 |
|---|---|
| D1. 차이 5% 방향 | **절대값** (양/음 둘 다 카운트) |
| D2. 카운트 기준 | 같은 **(레시피, 생산방식)** 5회 |
| D3. 1차 모달 취소 후 재알림 | 새 5회 입고 누적 시 |
| D4. 평균 소수점 | 2자리 반올림 |
| D5. 환산 이력 적용 | 시점별 분할 (effectiveDate 기준) |

### 트리거 위치

**production.js 생산 카드 저장/수정 시 actual 박스 수 입력 필드.** 선택 입력 (강제 X).

⚠ 이전 안 (동결제품 입고 시점)에서 **정정**. 생식 한정이므로 생산 카드가 트리거.

## 2-6. 자동 추천 발행 + 2단계 모달

흐름:
1. 생산 카드 저장 시 같은 (recipeId, methodKey) 최근 5회 `actualBox / expectedBox` 차이 절대값 모두 5% 이상 → 자동 발행
2. `activityLogs` 발행 (`action: 'conversion'`, `subAction: 'suggest'`, 사무 로그)
3. 메인 로그 패널에 클릭 가능 항목으로 표시
4. **1차 모달**: "환산값을 지난 5회 평균으로 변경할까요?" (Yes/No)
5. Yes → **2차 모달**: "예상 N박스 → M박스로 변경하시겠습니까?" (현재값 / 변경 후 값 명시)
6. 2차 확인 → recipes.productionMethods 갱신 + conversionHistory 추가 + activityLogs 발행 (`subAction: 'apply'`)

권한:
- 1차/2차 확인 = admin + office
- production(qc@)은 자동 추천 알림만 보임 (실행 권한 없음)

## 2-7. 통계 탭7 (환산 차이)

| 데이터 | 표시 |
|---|---|
| 레시피 × 방식 매트릭스 | 5회 평균 차이율, 마지막 자동 추천 시점 |
| 환산 이력 보기 | 모달, conversionHistory 시계열 |
| 기간 필터 | 통계 공통 (1년 디폴트) |

차트 없음. 테이블만.

## 2-8. 코드 진입 시점

- **Phase 2b**: productionMethods 입력 UI + conversionHistory + 생산 모달 method select + actual 박스 수 입력 (6~8h)
- **Phase 2c**: 자동 추천 발행 + 2단계 모달 + 통계 탭7 (3~5h)

자동 추천은 운영 데이터 5회 이상 필요 → 시드 직후엔 발동 안 함. Phase 2c로 분리.

## 2-9. 재고관리 앱 측 작업 (협의 완료)

- 재고관리 앱 [환산표] 메뉴 = **폐기**
- 환산 마스터 + 분석 = 생산관리 앱 단독

---

# §3. in-app 가변 데이터 wipe

운영 중에도 검증/리셋 가능. 설정 메뉴 위험 영역 신설.

## 3-1. 위치 / 권한 / 운영 시작 후 차단

| 항목 | 결정 |
|---|---|
| 위치 | 설정 메뉴 → "위험 영역" 섹션 (가장 아래, 빨간색 outline) |
| 권한 | **admin (alice) 만**. office/production은 DOM 제거 |
| 운영 시작 후 차단 | **없음** — 대표는 언제든 wipe 가능 |
| 확인 모달 | 2단계 |
| 자동 백업 | 실행 (필수) |
| 실행 메커니즘 | 기존 REST wipe 경로 재사용 (codebase.md §2026-05-12 박힘) |

## 3-2. 자동 백업

### 저장 위치 — 미결정 (사용자 결정 필요)

| 옵션 | 장단점 |
|---|---|
| A. Firebase Storage | 같은 Firebase 프로젝트, 권한 일관, 운영자가 콘솔에서 다운로드 가능. 비용: 매우 작음 |
| B. Google Drive | 운영자 친숙, 즉시 접근. OAuth/scope 추가 작업 필요 |
| C. 로컬 다운로드 (브라우저) | 의존성 없음. 단 다른 브라우저/기기에선 접근 불가, 분실 위험 |
| D. A + C 조합 | 안전망 + 즉시 접근. 구현 복잡도 약간 증가 |

→ **D 추천 (1차 안). 사용자 최종 결정 필요.**

### 백업 구조

- 백업 파일명: `fantapet-wipe-backup-{YYYYMMDD-HHmmss}.json`
- 내용: wipe 대상 컬렉션 전체 + wipeHistory 메타
- 압축: 단일 JSON (gzip 검토)

## 3-3. wipeHistory 컬렉션 신설

```js
// wipeHistory/{wipeId}
{
  wipeId: string,                       // auto
  executedAt: Timestamp,
  executedBy: string,                   // alice@
  backupLocation: string,               // Storage path or Drive ID
  backupSize: number,                   // bytes
  collectionsWiped: [
    { name: 'productions', docCount: N },
    ...
  ],
  preservedCollections: ['users', 'staffGroups', 'recipes', 'settings', 'holidays (isAutoGenerated=true만)'],
  reason?: string,
}
```

- wipeHistory **자체는 wipe 대상 제외**
- 영구 보존 (이력)

## 3-4. activityLogs rules 정책 변경

기존 (spec_v25 §3): 모두 delete 금지

**변경 (v26 §3-4)**: **admin만 delete 가능 (영구)**

이유: in-app wipe 도입 시 activityLogs도 wipe 대상이 되어야 함 (운영 잔재 정리). admin만 가능 = 안전 확보.

rules:
```
match /activityLogs/{logId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow delete: if request.auth.token.role == 'admin';
  allow update: if false;  // 영구 불변
}
```

→ Firestore rules 도입 후 적용 (§5 의존). 그 전까지는 spec_v25 §3 정책 유지 (모두 delete 금지).

## 3-5. 1차/2차 모달

### 1차 모달 (친화적 표현)

```
⚠ 가변 데이터 전체 삭제

이 작업은 운영 데이터를 모두 삭제합니다.
삭제 전 자동으로 백업이 생성됩니다.

[ 자동 백업 위치 ]
fantapet-wipe-backup-20260514-153022.json
저장 위치: Firebase Storage + 로컬 다운로드
[ 위치 복사 ]

[ 삭제 대상 카테고리 ]
- 생산 기록: 35건
- 원육 재고: 12건
- 봉투 이력: 87건
- 영양제 이력: 24건
- 활동 로그: 1,247건
- ... (14개 카테고리 표시)

[ 보존 데이터 ]
- 사용자 / 담당자 그룹 / 레시피 / 시스템 설정값 / 한국 공휴일

[다음] (백업 위치 복사하지 않아도 활성 — 사용자 결정 항목)
```

### 2차 모달

```
⚠ 최종 확인

자동 백업이 완료되었습니다.
삭제를 진행하려면 아래에 'WIPE'를 정확히 입력하세요.

[          ]

[삭제 실행] (WIPE 정확히 입력 시에만 enabled)
[취소]
```

## 3-6. 미해결 디테일

| 항목 | 결정 필요 시점 |
|---|---|
| 백업 저장 위치 (A/B/C/D) | 코드 진입 직전 (사용자) |
| "복사 안 하면 다음 disabled" 옵션 | 사용자 |
| 백업 보존 기간 | 사용자 (안: 1년) |

## 3-7. 코드 진입 시점

**Phase 2c**. 운영 데이터 축적 후 풀 사이클 검증 가능. 시드 직전엔 검증 잔재 정리에 §6 봉투/레시피 삭제 + 수동 wipe 사용.

분량 추정: 5~7h (백업 옵션에 따라 변동)

---

# §4. 예정 생산표 (productionPlans)

재고관리 앱 spec §44~46 **옵션 A 분리** 결과. 생산표 본체 = 생산관리 앱 단독 책임. 재고관리 앱은 발주 예측 데이터만 read-only 제공.

## 4-1. productionPlans 컬렉션 스키마

```js
// productionPlans/{YYYYMMDD_recipeId}
{
  date: 'YYYY-MM-DD',
  recipeId: string,
  recipeName: string,                   // 스냅샷
  methodKey: 'rotary' | 'manual',       // 생산 방식 (환산 적용)
  
  // 입력값
  productionUnit: number,               // 생산단위 (운영자 입력)
  
  // 자동 계산
  expectedBoxes: number,                // 생산단위 × productionMethods.unitToBox
  expectedMeatKg: number,               // 211kg 경고 판정용
  
  // 상태
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled',
  
  // 완료 연동
  productionId?: string,                // 실제 생산 카드 생성 시 ID 참조
  completedAt?: Timestamp,
  
  // 자동 분할
  splitFromId?: string,                 // 211kg 초과 시 분할된 경우 원본 plan ID
  splitNote?: string,
  
  createdAt, updatedAt,
  createdBy, updatedBy,
}
```

doc id 패턴: `{YYYYMMDD}_{recipeId}` (결정적). 같은 날 같은 레시피 = 1건만 (분할은 splitFromId로 추적, 별도 doc).

⚠ 같은 날 같은 레시피 여러 회차 = 운영 입력 시점에 통합 vs 별도 doc 결정. **1차 안**: 통합 (productionUnit 합산). 회차 분리는 실제 생산 카드(`productions`)에서.

## 4-2. 매트릭스 UI (날짜 × 레시피)

```
         | 5/14 (목) | 5/15 (금) | 5/18 (월) | 5/19 (화) | ... 
─────────┼───────────┼───────────┼───────────┼───────────┼───
치킨류   |    100    |     —     |    140    |    120    |
고양이치킨|   [80예]   |     —     |  [140확]  |   [확]    |
고양이미디엄|   [확]    |   [확]    |     —     |   [예]    |
─────────┼───────────┼───────────┼───────────┼───────────┼───
주간 합계 |    180    |    180    |    140    |    240    |
원물 kg  |  185 ⚠   |     —     |   165    |   220 ⚠   |
```

| 영역 | 내용 |
|---|---|
| 좌측 고정 | 레시피명 (생식 카테고리만) |
| 상단 고정 | 날짜 (요일 표시, 휴일 색상) |
| 셀 | 생산단위 + 상태 배지 (예/확/완) |
| 하단 | 주간 합계 / 카테고리별 합계 / 원물 kg |
| 우측 (선택 시) | 상세 패널 (§4-4) |

### 상태 배지

| 상태 | 표시 | 색상 |
|---|---|---|
| planned | 예 | 빨강 (재고관리 앱 §44.1 빨간 글씨 매핑) |
| confirmed | 확 | 검정 (§44.1 검은 글씨 매핑) |
| completed | 완 | 회색 |
| cancelled | (빈 셀) | — |

### 휴일 표시

- 날짜 헤더에 휴일 색상 (spec_v25 §1 영업일 계산 룰 read)
- affectsShipping=true → 회색 배경
- 연휴 시작/종료일 → 테두리 강조

## 4-3. 예정/확정 상태 + 자동 분할 211kg 경고

### 상태 전환 (재고관리 앱 §45.1 그대로)

- 셀 단위 토글 (예 ↔ 확)
- 날짜 전체 확정 (해당 날짜 예정 셀 모두 확정으로)
- 이미 개별 확정된 셀 = 그대로 유지
- 확정 이력 = `activityLogs` 발행

### 211kg 초과 경고

- 하루 원물 kg 합계 > 211.420kg → 빨강 경고
- 자동 분할 제안 모달: "원물 {N}kg 초과. 분할하시겠습니까?"
- 분할 시: 같은 레시피의 생산단위를 2일로 나눔. splitFromId로 추적.

⚠ 211.420kg 임계값 = D-3 시스템 설정값 후보. 추후 변경 가능 필드로.

## 4-4. 우측 상세 패널 (forecastDaily / forecastAnalytics read)

재고관리 앱이 발행한 read-only 데이터 표시.

### read 컬렉션 (재고관리 앱 측 작성)

```js
// forecastDaily/{date}_{productId}_{unitType}
{
  date, productId, productName,
  category: 'raw' | 'dried',
  unitType: 'main' | 'sample',
  unit: 'box' | 'pack' | 'unit',
  shippedQty, pendingQty, subscriptionQty,
  expectedTotalQty,                     // = shippedQty + subscriptionQty (pending 제외)
  updatedAt, computedBy,
}

// forecastAnalytics/{productId}
{
  productId,
  weekdayAvg: { mon, tue, ..., sun },
  monthlyAvg: { '01': n, ..., '12': n },
  preHolidayAvg, postHolidayAvg,
  preLongHolidayAvg, postLongHolidayAvg, // 연휴 정의: 연속 affectsShipping ≥ 2일
  recent7Days, recent14Days, recent30Days, recent90Days,
  yearAvg,
  updatedAt,
}
```

### 우측 패널 표시 (셀 선택 시)

```
┌─ 고양이 치킨 (5/14) ───────────────┐
│ 예정: 100단위 (83박스)              │
│ 원물: 50kg                          │
├─ 발주 예측 (재고관리 앱 데이터) ───┤
│ 지난달 출고량: 240박스              │
│ 최근 4주: 280박스                   │
│ 요일별(목): 12박스 평균             │
│ 정기배송 예정: 8박스                │
│ 오늘 발주량: 15박스                 │
│ 못 나간 수량: 2박스                 │
└─────────────────────────────────────┘
```

### 데이터 신선도

- **페이지 진입 시 fetch** (1차 안). realtime listener는 부담 큼.
- 새로고침 버튼으로 재조회

→ 코드 진입 시 최종 결정.

## 4-5. 휴일 보정 + 주간 요약

- 휴일 보정 = 휴일 전후 영업일 예상 발주량 증가 → preHolidayAvg/postHolidayAvg 표시
- 주간 합계 = 매주 월~일 단위 자동 계산
- 카테고리별 합계 = 치킨류 / 기타 (재고관리 앱 §44.4 따름)

## 4-6. read 의존 항목 (재고관리 앱 측 결정 의존)

| 항목 | 의존 |
|---|---|
| forecastDaily / forecastAnalytics 스키마 최종 | 재고관리 앱 측 |
| 카테고리별 unitType 매트릭스 (raw/dried × main/sample) | 협의 완료 |
| 연휴 정의 (연속 affectsShipping ≥ 2일) | 협의 완료 |
| 갱신 시점 (재고관리 앱 03:00 자동 + 출고 확정 시) | 협의 완료 |

## 4-7. 코드 진입 시점

**Phase 2c** (시드 후 운영 데이터 축적 단계).

근거:
1. 예정 생산표 = 출고 데이터 축적 후 의미 있음
2. forecastDaily 데이터 = 재고관리 앱 운영 시작 후 채워짐
3. 시드 직전 차단 시 운영 시작 지연

⚠ productionPlans 스키마는 spec_v26에 박아두고, 코드 진입은 Phase 2c.

분량 추정: 15~25h (매트릭스 UI + 상태 토글 + 자동 분할 + 우측 패널 + 휴일 보정)

## 4-8. 메뉴 위치

신설 메뉴. **운영자 결정 필요.**

1차 안: **메뉴 9번 입고 예정관리 다음** 또는 **메뉴 10번 레시피 관리 다음**.

---

# §5. Firestore rules + Custom Claims

양 앱 공동 작업. handoff_v23 §"운영 발견사항 #4" (firestore.rules 파일 없음) 클로즈 경로.

## 5-1. rules 파일화

| 항목 | 결정 |
|---|---|
| 위치 | 생산관리 앱 repo (`firestore.rules` at root) |
| 책임 | 생산관리 앱 측이 owner |
| 재고관리 앱 변경 | PR로 우리 repo에 요청 |
| 배포 | GitHub Actions 자동 (`firebase deploy --only firestore:rules`) |
| 현재 상태 | Firebase 콘솔에만 설정 있음. repo 미반영 |

## 5-2. 컬렉션별 write 매트릭스

| 컬렉션 | 책임 앱 | write 권한 |
|---|---|---|
| recipes / productionMethods / conversionHistory | 생산관리 | admin + office |
| productions | 생산관리 | admin + office + production |
| productionPlans (가칭) | 생산관리 | admin + office |
| meatTypes / meatStocks / meatLogs | 생산관리 | production (입고) / admin + office (수동조정) |
| bagTypes / bagLogs | 생산관리 | production (입고) / admin + office (수동조정) |
| frozenProducts / frozenLogs / frozenPanStock / frozenSeparation | 생산관리 | admin + office + production |
| supplementTypes / supplementStock | 생산관리 | system (자동만) |
| supplementLogs | 생산관리 | production (입고) / admin + office (수동조정/자동차감) |
| eggStock / eggLogs | 생산관리 | admin + office + production |
| schedules | 생산관리 | admin + office |
| events | 생산관리 | admin + office |
| holidays | 생산관리 | admin + office (재고관리 앱 read만) |
| stockLedger / productionCompletion | 생산관리 | 시스템 트랜잭션만 |
| activityLogs | 양 앱 | create: 인증된 모두, delete: admin만 (§3-4), update: 불가 |
| wipeHistory | 생산관리 | admin만 |
| settings / staffGroups / users | 생산관리 | admin only (대부분) |
| Order / OrderItem / ShippingBatch | 재고관리 | 재고관리 앱 권한 따름 |
| CustomerSubscription | 재고관리 | 재고관리 앱 권한 따름 |
| StockLot | 재고관리 | 재고관리 앱 권한 따름 |
| IncomingStock | 생산관리 발행 → 재고관리 수신 | 생산관리 write, 재고관리 read |
| forecastDaily / forecastAnalytics | 재고관리 | 재고관리 앱 write, 생산관리 read |

### 권한 표현

- `request.auth.token.app == 'production'` → 생산관리 앱 계정만
- `request.auth.token.app == 'inventory'` → 재고관리 앱 계정만
- `request.auth.token.role == 'admin' | 'office' | 'production'` → 우리 앱 역할

## 5-3. Custom Claims

| Claim | 값 |
|---|---|
| `app` | `'inventory'` 또는 `'production'` (공유 계정은 둘 다 부여 — 단 Firebase는 단일 string. **재검토 필요**) |
| `role` | `'admin'` / `'office'` / `'production'` |

⚠ `app` claim이 single value인지, array인지 확인 필요. Firebase Auth Custom Claims는 JSON 객체이므로 array 가능. → `app: ['inventory', 'production']` 형태 박음.

rules 표현:
```
allow read: if 'production' in request.auth.token.app;
```

## 5-4. 운영 계정 매트릭스 (확정)

| 이메일 | role | app |
|---|---|---|
| alice@fantapet.com | admin | ['inventory', 'production'] |
| admin@fantapet.com | office | ['inventory', 'production'] |
| qc@fantapet.com | production | ['inventory', 'production'] |

3계정 공유. 생산실 + 배송실 = qc@ 공유. 재고관리 앱 측 별도 신규 계정 발급 없음.

## 5-5. 부여 방식

**콘솔 수동 (Firebase Console → Authentication → 사용자 → Custom Claims 직접 입력).**

근거: 운영 계정 3개. Cloud Function 자동화 = 과한 인프라.

작업 책임: 사용자(호두) 단독.

운영 체크리스트 항목:
- 새 계정 추가 시 = 콘솔에서 role + app claim 부여
- claim 변경 시 = 사용자 재로그인 (token refresh)

## 5-6. 배포 파이프라인

- `.firebaserc` + `firebase.json` repo 추가
- GitHub Actions workflow: `firebase deploy --only firestore:rules` 트리거
- 트리거 조건: `firestore.rules` 변경 시 자동
- 환경변수: `FIREBASE_TOKEN` GitHub Secrets

## 5-7. 도입 시점

**Phase 2a 휴일 마스터 진입 직전.**

근거:
1. holidays = 양 앱 첫 cross-app 의존 지점. rules 박혀야 안전
2. 영양제 표 입력 (§1) 직후 = 우리 앱 핵심 write 코드 거의 완성된 시점
3. 시드 전 회귀 검출 = 운영 데이터 없을 때 위험 낮음
4. 환산표 마스터 (Phase 2b) 진입 전 rules 박혀있어야 자연스러움

## 5-8. 회귀 위험

현재 rules = 콘솔만, 사실상 free-write. 파일화 + Custom Claims 적용 시:
- 기존 write 호출 모두 rules 통과 검증 대상
- 회귀 가능성 있음

대응:
- rules 도입 후 전체 메뉴 smoke test (각 메뉴 입력/수정/삭제 1회씩)
- claim 부여 누락 시 401 발생 → 콘솔 확인

분량 추정: rules 파일화 + Custom Claims 작업 = 6~10h (양 앱 공동, 우리 측만)

---

# §6. 봉투 / 레시피 삭제 정책 (v19_final §297, §556 + v24 §3-11 정정)

## 6-1. 봉투 삭제 — `bagTypes` cascade

| 케이스 | 처리 |
|---|---|
| 연결 레시피/동결제품 있음 | **차단**. 모달: "{레시피명/제품명}에 연결되어 있어 삭제할 수 없습니다. 연결을 먼저 해제해주세요." |
| 연결 없음 + 재고 0장 + 입고 이력 없음 | confirm → `bagTypes` + `bagLogs` 일체 삭제 |
| 연결 없음 + 재고 0장 + 입고 이력 있음 | 경고 모달: "입고 이력 N건이 함께 삭제됩니다." → confirm |
| 연결 없음 + **재고 N장 (N>0)** | 경고 모달: "{봉투명} 재고 {N}장이 남아있습니다. 봉투 재고 및 이력이 모두 삭제됩니다." → confirm → 일체 삭제 |

- 영양제 SKU 삭제 패턴 (v24 §1-3)과 일관
- spec v19_final §556 "수동조정으로 0 만들고 삭제" 정정 (강제 삭제 허용)

### 연결 판정

- `recipes.bagTypeId == {bagTypeId}` 검색 (생식 봉투)
- `frozenProducts.bagTypeId == {bagTypeId}` 검색 (동결건조 봉투)
- 둘 중 하나라도 매칭 = 연결 있음

## 6-2. 레시피 삭제 — `recipes` cascade

| 케이스 | 처리 |
|---|---|
| `productions` ≥ 1건 | **차단**. 모달: "이 레시피로 만든 생산 기록이 N건 있어 삭제할 수 없습니다. 비활성화로 처리해주세요." |
| `schedules`(입고예정) ≥ 1건 | **차단**. 모달: "입고 예정 N건이 있어 삭제할 수 없습니다." |
| 위 둘 다 없음 + 영양제 SKU 모두 재고 0봉 + 이력 없음 | confirm → recipes + supplementTypes + supplementStock 일체 삭제 |
| 위 둘 다 없음 + 영양제 SKU 이력 있음 (재고 0) | 경고 모달: "영양제 이력 N건이 함께 삭제됩니다." → confirm |
| 위 둘 다 없음 + 영양제 SKU **재고 있음** | 경고 모달: "영양제 재고가 {SKU명} {N}봉 ... 남아있습니다. 모두 삭제됩니다." → confirm |

- v24 §3-11 "recipes 삭제될 일 없음" **정정**
- 봉투 연결(`recipes.bagTypeId`)은 참조하는 쪽(recipes)이 사라지므로 자동 해제. 봉투 측 별도 처리 불필요
- 활동 로그(`activityLogs`) = 불변, 삭제 안 함

### 카운트 쿼리

- `productions` where recipeId == X (count)
- `schedules` where recipeId == X (count, 입고예정)
- `supplementTypes` where recipeId == X (각 SKU stock + log count)

## 6-3. UI

### 봉투 (메뉴 5)

- 우측 상단 버튼: `[수정] [수동조정] [+ 입고 등록]` → `[수정] [삭제] [수동조정] [+ 입고 등록]`
- [삭제] = 빨간 outline 버튼 (위험 표현)
- 동결제품 메뉴(§12) "수정/삭제" 패턴 따름

### 레시피 (메뉴 10)

- 레시피 상세 우측 하단: `[저장]` → `[저장] [삭제]`
- [삭제] = 빨간 outline 버튼
- v19_final §344 정정

## 6-4. 권한

| 작업 | 권한 |
|---|---|
| 봉투 삭제 | admin + office |
| 레시피 삭제 | admin + office |

production(qc@)은 UI DOM 자체 제거. v24 §10 #21 패턴 따름.

## 6-5. activityLogs 발행

```js
// 봉투 삭제
{
  action: 'bag',
  subAction: 'delete',
  details: {
    bagName: string,
    bagType: 'raw' | 'dried',
    currentQty: number,                 // 삭제 시점 재고
    logCount: number,                   // 같이 삭제된 이력 건수
  }
}

// 레시피 삭제
{
  action: 'recipe',
  subAction: 'delete',
  details: {
    recipeName: string,
    category: 'raw' | 'dried',
    supplementSkuCount: number,         // 같이 삭제된 SKU 건수
    supplementTotalQty: number,         // 같이 삭제된 영양제 총 재고
    supplementLogCount: number,         // 같이 삭제된 영양제 이력 건수
  }
}
```

분류 = 사무 로그. `OFFICE_LOG_ACTIONS`에 `'bag'`, `'recipe'` 이미 박혀있음 (작업 A에서 `'recipe'` 추가됨, `'bag'`도 기존 박힘 — 확인 필요).

## 6-6. 코드 진입 시점

**§1 영양제 표 + §5 rules 직후, Phase 2a 휴일 마스터 직전.**

근거:
- 시드 직전 검증 잔재 정리에 유용 (`단위4_검증_A_v2` 레시피, `_60` SKU 등)
- in-app wipe (§3) 도입 전 우회 경로
- 분량 작음

분량 추정: 2~3h

---

# §7. 미해결 / 결정 필요 항목

| # | 항목 | 결정 시점 | 책임 |
|---|---|---|---|
| 1 | 백업 저장 위치 (§3-2) | 코드 진입 직전 | 사용자 |
| 2 | "복사 안 하면 다음 disabled" 옵션 (§3-5) | 코드 진입 직전 | 사용자 |
| 3 | 백업 보존 기간 (§3) | 코드 진입 직전 | 사용자 |
| 4 | 예정 생산표 메뉴 위치 (§4-8) | 코드 진입 직전 | 사용자 |
| 5 | productionPlans 같은 날 같은 레시피 통합 vs 분리 (§4-1) | 코드 진입 직전 | 사용자 |
| 6 | 우측 패널 데이터 신선도 (§4-4) | 코드 진입 시 | 사용자 |
| 7 | Custom Claims `app` claim array 확인 (§5-3) | rules 작업 진입 시 | Firebase 문서 확인 |
| 8 | 211.420kg 임계값 settings 전환 (§4-3) | D-3 작업 시 | 사용자 |
| 9 | D-3 계란 노른자 평균 중량 디폴트값 | D-3 작업 시 | 사용자 |
| 10 | forecastDaily / forecastAnalytics 스키마 변경 시 협의 채널 | Phase 2c 진입 시 | 양 앱 공동 |

---

# §8. 작업 시점 / 의존 관계 (handoff_v23 §"남은 작업 마스터 플랜" 갱신)

## Phase 1 잔여 작업 (재배치)

| 순위 | 항목 | 예상 | 비고 |
|---|---|---|---|
| 1 | D-1 검증 (코덱스) | 5분 | f3fcacd 확인 |
| 2 | spec_v26 작성 | 2~3h | **본 문서** |
| 3 | D-3 시스템 설정값 UI | 2~3h | 영양제 임계값 + 211kg + 계란 노른자 |
| 4 | D-2 메뉴별 담당자 그룹 UI | 3~4h | 영양제 추가 |
| 5 | 영양제 표 입력 재작업 (§1) | 4~6h | 단위 6/7 모달 폐기 |
| **6** | **firestore.rules + Custom Claims (§5)** | **6~10h** | **신설. Phase 2a 직전** |
| 7 | 봉투/레시피 삭제 UI (§6) | 2~3h | 시드 직전 검증 잔재 정리 |
| 8 | Phase 2a 휴일 마스터 (spec_v25 §1) | 10~14h | 한국 공휴일 + 회사 휴무일 + 영업일 계산 |
| 9 | Phase 2b 환산표 마스터 + method (§2-1~2-4, 2-7 일부) | 6~8h | 자동 추천은 Phase 2c |
| 10 | deploy + 시드 입력 | 3~5h | 시드 체크리스트 v3 작성 필요 |
| 11 | 4·5차 묶음 | 10~13h | handoff_v22 §4·5차 그대로 |

총 추정: 48~69h (Phase 1 잔여)

## Phase 2c — 시드 후 운영 데이터 축적 단계

| 항목 | 예상 |
|---|---|
| in-app wipe (§3) | 5~7h |
| 환산 차이 자동 추천 + 2단계 모달 (§2-5, 2-6) | 3~5h |
| 통계 탭7 환산 차이 (§2-7) | 3~4h |
| 예정 생산표 (§4) | 15~25h |
| E #22 캘린더 휴일 표시 | 2~3h |

총 추정: 28~44h

## Phase 4 자연 검증

handoff_v22 + v23 누적 + v26 추가:
- in-app wipe 풀 사이클 (백업 → 삭제 → 복구 가능 확인)
- 환산 차이 자동 추천 풀 사이클
- 영양제 표 입력 풀 사이클
- 휴일 마스터 변경 → 영업일 계산 → 재고관리 앱 영향 검출
- 예정 생산표 풀 사이클 (forecastDaily read + 211kg 분할)
- Firestore rules 권한 매트릭스 검증 (3계정 × 컬렉션 권한)

## Phase 5 동시 운영 진입

- 비번 변경
- 직원 URL + 비번 + 체크리스트 전달
- 생산관리 + 재고관리 동시 운영 시작

---

## 다음 spec 작성 시점 — spec_v27

운영 시작 후 발견사항 + 동결제품 환산 (§2-1에서 제외된 영역) + 자재 종류 확장 검토.

---

**작성**: 2026-05-14
**기준 handoff**: v23
**기준 commit**: f3fcacd (D-1 closingFlags UI, deploy 안 됨)
**다음 단계**: D-1 검증 (코덱스) → deploy → D-3 → D-2 → §1 영양제 표 → §5 rules → §6 삭제 → Phase 2a → Phase 2b → 시드 → 4·5차 → Phase 2c
