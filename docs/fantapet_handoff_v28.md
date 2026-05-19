# Fantapet Management — Handoff v28

작성일: 2026-05-18
이전: handoff_v27
관련 spec: spec_v22 + v23 + v24 + v25 + v26

---

## ⚠ 다음 작업에서 가장 먼저 할 일

**Phase 1 코드 작업 100% 완료. 다음 = 시드 입력 단계.**

1. **시드 체크리스트 v3 작성** (~1h)
   - 정리 대상 데이터 wipe 순서
   - 시드 데이터 등록 순서
   - 검증 포인트
2. **검증 잔재 정리** (~1h) — handoff §"시드 입력 전 정리 필요" 그대로
3. **마스터 데이터 시드** (~1~2h)
4. **운영 직전 점검** (~1h) — 권한 매트릭스 / rules 동작 / codebase.md 최종 갱신

시드 끝나면 **운영 진입 가능 상태**.

---

## v27 → v28 변경 요약

- **5차 묶음 E-6 + E-7 완료**: 3 commits (`7b2b5d4` 생산 카드 reorder / `1b74aff` 생산지시서 카테고리 순서 / `2e71161` 핸들 좌측 보정)
- **E-8 폐기 결정** — 운영 발견사항 #22로 박음 (시드 후 1주 운영 데이터로 재검토)
- **Phase 1 코드 작업 100% 완료** 선언
- 신규 운영 발견사항 #22~#23
- 시드 진입 준비 상태로 갱신

---

## 현재 상태 (2026-05-18 기준)

### 단계
**Phase 1 — 코드 작업 전체 클로즈. D-시리즈 / §1 / §5 / §6 / Phase 2a / Phase 2b / 4차 / 5차 모두 완료. 다음은 시드 입력 → Phase 2c.**

### 커밋 상태
- 최신 commit: `2e71161` (5차 E-6 핸들 좌측 보정)
- `gh-pages` 배포 완료, 최신 asset: `index-C-jDtjJi.js`, `index-BNP2kANj.css`
- working tree clean

### v26 이후 누적 commit (11건)
| commit | 내용 |
|---|---|
| `48ff97c` | Phase 2b 환산표 + method 본체 |
| `bd86302` | Phase 2b 옵션C 미래 effectiveDate 안내 배지 |
| `1775243` | Phase 2b 같은 effectiveDate 다중 이력 tie-break |
| `92daf3b` | 4차 E-2 봉투 reorder + SortableJS 도입 |
| `bdee742` | 4차 E-3 동결제품 reorder |
| `3f18ec4` | 4차 E-4 원육 reorder |
| `d8a644c` | 4차 E-5 레시피 reorder + supplementTypes 동기화 |
| `7b2b5d4` | 5차 E-6 생산 카드 reorder + round/batchNo 자동 재계산 |
| `1b74aff` | 5차 E-7 생산지시서 카테고리 순서 + settings/copySheetOrder |
| `2e71161` | 5차 E-6 핸들 좌측 보정 |

공개 URL: https://green-cloud-workroom.github.io/fant/

### Firestore 상태
- 보존: `users 3`, `staffGroups 3`, `recipes 4 + 검증용 2`, `holidays 약 50개` (Phase 2a 자동 등록 통과)
- **신규 필드/컬렉션 (v26 이후)**:
  - `recipes.productionMethods[]` (raw 한정, Phase 2b)
  - `recipes/{id}/conversionHistory/{auto-id}` subcollection (Phase 2b)
  - `productions` raw 한정 신설: `methodKey`, `expectedBox`, `actualBox`, `appliedUnitToBox`
  - `settings/copySheetOrder` (E-7, 디폴트 폴백 가능)
- **OFFICE_LOG_ACTIONS**: `'conversion'` 추가 (Phase 2b)
- **sortOrder 정책 (4차/5차 완료)**:
  - bagTypes: 전역 연속 시퀀스 (raw 0~N, freezeDry N+1~)
  - frozenProducts: 0부터 단일 시퀀스
  - meatTypes: 0부터 단일 시퀀스
  - recipes: 전역 연속 시퀀스 (raw 0~N, freezeDry N+1~)
  - supplementTypes: `recipe.sortOrder * 100 + unitIndex` 자동 동기화
  - productions: 같은 날짜 안 카드만 드래그, 기존 sortOrder 풀 내 재배치, round/batchNo 자동 재계산

### Firestore rules
- 자동 deploy via GitHub Actions (`FIREBASE_RULES_SERVICE_ACCOUNT` secret 등록 완료)
- v26 이후 변경: `recipes/{recipeId}/conversionHistory/{historyId}` nested rule 추가 (Phase 2b)
- `settings/copySheetOrder` (E-7) = 기존 settings rules로 충분, 변경 없음

---

## 이번 세션 작업 내역 (2026-05-18, v27 이후)

### 5차 묶음 E-6 생산 카드 reorder (`7b2b5d4` + `2e71161`)

- 생산 입력 페이지 `<div id="productionCards">` 안 카드에 드래그 핸들 추가
- admin/office만 핸들 렌더, production은 미렌더
- 같은 날짜 카드만 드래그 가능 (다른 날짜 sortOrder 영향 없음)
- 드래그 후 기존 sortOrder 풀 내 재배치
- 저장 후 `applyRoundsAndBatches(selectedDate)`로 round/batchNo 자동 재계산
- 메모리 누수 방지: 선택 날짜 변경 시 Sortable 인스턴스 destroy + 재생성
- 보정 (`2e71161`): 핸들 위치 우측 → 좌측 변경 (삭제 버튼과 겹침 방지)

**검증 통과 항목** (사용자 직접 검증):
- 같은 날짜 카드 swap 후 다른 날짜 sortOrder 영향 없음 확인 (`sortOrder: 88` 카드 변경 없음)
- round 재계산: 치킨텐더 1 / 고양이 치킨 60 두 장 1,2 / 고양이 치킨 100 = 3
- batchNo 재계산: 고양이 치킨 60 두 장 = 1,2 / 다른 단위는 null

### 5차 묶음 E-7 생산지시서 카테고리 순서 (`1b74aff`)

- 설정 페이지 신규 섹션 추가
- 5개 카테고리 드래그 정렬: rawCat, rawDog, freezeCat, freezeDog, freezeCommon
- `settings/copySheetOrder` 도큐먼트 저장
- 도큐먼트 없을 시 디폴트 폴백 (rawCat → rawDog → freezeCat → freezeDog → freezeCommon)
- 생산지시서 복사 모달이 저장된 순서대로 출력

**검증 통과 항목**:
- 커스텀 순서(freezeCommon → rawCat) 저장/복사 모달 반영
- 도큐먼트 삭제 후 디폴트 폴백 확인

### E-8 폐기 결정 (운영 발견사항 #22)

- spec_v22 "로그 항목 순서 (생산/사무 따로)" 모호함
- 코드 조사 결과: 현재 로그 정렬 = "미확인 우선 + timestamp desc" (운영 직관에 부합)
- action별 우선순위 정렬은 명확한 사용자 요구 없이 설정만 늘림
- 결정: **시드 + 1주 운영 후 사용자 명확한 불편 발생 시 재검토**

---

## spec_v26 정정 사항 (v26 + v27 + v28 누적, 9건)

(v27과 동일. v28 변경 없음)

| # | spec_v26 원안 | 정정 (코드에 박힌 것) | 출처 |
|---|---|---|---|
| 1 | §1-5 `action:'supplement', subAction:'adjust'` | `action:'supplementStock', subAction:'manualAdjust'` 유지 | §1 작업 |
| 2 | §1-2 자동차감 = 각 생산 클릭 상세 | 그날 net 합계만 표시 | 사용자 결정 |
| 3 | §1-2 수동조정 사유 = 열 헤더 1개 | 상단 고정 사유 입력칸 | §1 작업 |
| 4 | §3-4 `activityLogs update: if false` | `acknowledged` 계열 필드만 update 허용 | §5 작업 |
| 5 | §5-2 컬렉션별 write 매트릭스 | 코드 현실 반영 추가 | §5 작업 |
| 6 | §5-5 "콘솔 수동 부여" | Admin SDK 스크립트 | §5 작업 |
| 7 | §5-2 "bagLogs delete: admin only" | admin + office | §6 작업 |
| 8 | §2-4 환산값 적용 규칙 | 같은 effectiveDate 다중 이력 시 createdAt desc 우선 | Phase 2b smoke test |
| 9 | §2-4 미래 effectiveDate 처리 | 차단 안 함. fallback + 안내 배지 | Phase 2b 옵션C |

다음 spec 갱신 시 본문 반영 필요.

---

## 운영 발견사항 (v28 갱신)

(v26까지 #1~#18 + v27 #19~#21 + 추가)

| # | 항목 | 처리 |
|---|---|---|
| 19 | 같은 effectiveDate 다중 이력 tie-break 누락 | ✅ `1775243`. spec 정정 #8. |
| 20 | recipe.js / meat 모달 add/edit 권한 가드 누락 | 시드 전 정리 또는 운영 직전 처리 |
| 21 | recipes 페이지 생식/동결건조 섹션 분리 부재 | ✅ E-5에서 해결 |
| **22** | **E-8 로그 항목 순서 = spec 모호 + 운영 요구 불명** | **폐기. 시드 후 1주 운영 데이터로 재검토** |
| **23** | **5차 E-6 핸들 위치 우측 → 좌측 보정** | ✅ `2e71161`. 삭제 버튼 겹침 방지 |

---

## 남은 작업 마스터 플랜 (v28)

### Phase 1 — 잔여 작업 (코드 X, 운영 준비)

| 순위 | 항목 | 예상 | 비고 |
|---|---|---|---|
| 1 | **시드 체크리스트 v3 작성** | 1h | 정리/시드/검증 순서 명문화 |
| 2 | **검증 잔재 정리** | 1h | handoff §"시드 입력 전 정리 필요" 그대로 |
| 3 | **마스터 데이터 시드** | 1~2h | bagTypes/meatTypes/recipes unitPresets/productionMethods 등 |
| 4 | **운영 직전 점검** | 1h | 권한 매트릭스 검증 + codebase.md 갱신 |

### Phase 2c — 시드 후 운영 데이터 축적 단계 (예상 28~44h)

| 항목 | 예상 |
|---|---|
| in-app wipe (§3) | 5~7h |
| 환산 차이 자동 추천 + 2단계 모달 (§2-5, 2-6) | 3~5h |
| 통계 탭7 환산 차이 (§2-7) | 3~4h |
| 예정 생산표 (§4) | 15~25h |
| E #22 캘린더 휴일 표시 | 2~3h |
| #12 conversion 사무 로그 변경 요약 표시 (Phase 2b 부분 통과) | 1~2h |
| #22 로그 항목 순서 (운영 1주 후 재검토) | 시점 결정 후 |

### Phase 4 자연 검증

(v25/v27 누적 그대로)

### Phase 5 동시 운영 진입

- alice/admin@/qc@ 비번 변경
- 직원 URL + 비번 + 체크리스트 전달
- 생산관리 + 재고관리 동시 운영 시작

---

## 알려진 이슈 (v28 누적)

### 1. 다음 작업 진입 전 처리

- 시드 체크리스트 v3 작성 시 결정 필요:
  - 시드 등록 방식 = Admin SDK 스크립트 vs 앱 UI 직접 등록 vs 혼합
  - 운영 발견사항 #20 (UI 권한 가드 누락) 처리 시점
  - settings/systemValues, settings/menuStaffGroups 처리 = 삭제(디폴트 폴백) vs 디폴트값으로 update

### 2. 시드 입력 전 정리 필요 (v28 갱신)

**v25 누적 + v27 추가 + v28 신규**:

#### 레시피/마스터
- `단위4_검증_A_v2` 레시피 (§6 삭제 UI 또는 wipe)
- `recipes/VNGOvGiefHOXm8ldZkSP` (Codex 프리셋 검증)
- 환산값 미등록 테스트 raw 레시피 1개 (sortOrder 자동 보정됨, 여전히 비활성)
- 기존 4개 운영 레시피 unitPresets 모두 빈 배열 — 시드 시 채울 것

#### 영양제
- `supplementTypes/_60` SKU + 그 재고/로그 (§1 검증, 현재 2봉)

#### Settings (검증값 → 디폴트 폴백)
- `settings/systemValues` (D-3 검증값)
- `settings/menuStaffGroups` (D-2 검증값)
- `settings/copySheetOrder` (E-7 검증, 운영 안전하게 디폴트로 리셋 완료)

#### 로그
- `activityLogs` 누적 검증 로그 (D-1/D-2/D-3 + §1 manualAdjust + §5 + Phase 2a + Phase 2b conversion/manualEdit 5건+ + 4차 + 5차 검증분)
- `supplementLogs` (§1 검증)

#### Productions (v28 갱신)
- Phase 2b smoke test 검증 카드 2건 (status: 'deleted')
- 5차 E-6 검증 카드 4건 (모두 status: 'deleted' 처리됨)
- `recipes/{고양이치킨id}/conversionHistory` 검증 이력 5건+ (0.83 → 0.85 → 0.86 → 0.85 + effectiveDate 변경 등)

→ 시드 직전 일괄 정리. `settings/systemValues`와 `settings/menuStaffGroups`는 문서 삭제로 디폴트 동작 권장.

### 3. 미해결 사용자 결정 항목 (spec_v26 §7)

(v27과 동일)
- 백업 저장 위치 (§3-2)
- "복사 안 하면 다음 disabled" 옵션 (§3-5)
- 백업 보존 기간 (§3)
- 예정 생산표 메뉴 위치 (§4-8)
- productionPlans 같은 날 같은 레시피 통합 vs 분리 (§4-1)
- 우측 패널 데이터 신선도 (§4-4)
- 211.420kg 임계값 settings 전환 (§4-3)
- forecastDaily/Analytics 스키마 변경 시 협의 채널 (§7 #10)

### 4. 재고관리 앱 협의 — 완료 + 잔여 의존

(v27 그대로)

**잔여 의존**:
- 재고관리 앱 측 forecastDaily / forecastAnalytics 컬렉션 + 집계 로직 구현 (재고관리 앱 Phase 2c)
- 재고관리 앱 측 [예정 생산관리] → [발주 예측] 명칭 변경 + spec §44~46 정정
- 재고관리 앱 spec §2.4 정정 (회사 휴무일 = 생산관리 앱 단독)
- 재고관리 앱 [환산표] 메뉴 폐기
- 양 앱 forecastDaily/Analytics read 코드 = Phase 2c 동시 진행

### 5. 코드 진입 시 확인 항목

- `productions.deleted: true` 소프트 삭제 카운트 = §6 recipe 삭제 정책과 정합성 확인 (v26 #69 미해결)

### 6. codebase.md 갱신 필요 항목 (시드 단계에서 일괄 갱신)

v27까지 누적 + v28 추가:

**v26 이후 추가된 것**:
- `recipes.productionMethods[]` 필드 (raw 한정)
- `recipes/{id}/conversionHistory` subcollection
- `productions` raw 한정 신설 필드 4개 (`methodKey`, `expectedBox`, `actualBox`, `appliedUnitToBox`)
- `recipe.js` 환산값 입력 UI + 섹션 분리 + Sortable
- `production.js` 생산방식 select + 예상박스 + 실제박스 + 미래 effectiveDate 안내 배지 + 카드 드래그 정렬
- `OFFICE_LOG_ACTIONS`에 `'conversion'` 추가
- 4차 묶음: `sortablejs` 의존성, bag.js/frozenProduct.js/meat.js/recipe.js Sortable + persistXxxOrder 함수, supplementTypes 동기화 배치
- 5차 묶음: production.js 카드 드래그, settings.js 카테고리 순서 섹션, settings/copySheetOrder
- style.css `.drag-handle` / `.sortable-ghost` / `.sortable-chosen` / `.recipe-section` / `.production-card` (좌측 핸들) / `.copy-sheet-order-list` 클래스

---

## 새 채팅 시작 가이드

### 다음 채팅 진입 시점
**지금이 새 채팅 진입 시점.** Phase 1 코드 100% 완료. 시드 입력은 새 환경(Claude Code)에서.

### Claude Code 진입 시 필요한 파일

프로젝트 디렉토리 (`fant/`) 안에 두기:
1. **`CLAUDE.md`** — 이번 세션에서 작성, 프로젝트 루트에 배치
2. **`docs/fantapet_handoff_v28.md`** — 이 파일
3. **`docs/fantapet_spec_v22.md` ~ `v26.md`** — 5개 spec
4. **`docs/codebase.md`** — 현재 코드 구조

`docs/` 폴더 신설 후 위 7개 파일 박아두면 Claude Code가 알아서 view 도구로 읽음.

### Claude Code 첫 메시지

```
프로젝트: Fantapet Management (펫푸드/사료 생산관리 웹앱)

현재 상태: Phase 1 코드 작업 100% 완료. 다음 = 시드 입력 단계.

먼저 다음 문서를 view로 읽어라:
1. CLAUDE.md (프로젝트 루트)
2. docs/fantapet_handoff_v28.md
3. docs/fantapet_spec_v26.md (필요 시 v22~v25도)
4. docs/codebase.md

특히 handoff §"시드 입력 전 정리 필요" 섹션이 핵심.

이번 세션 작업 = 시드 입력 단계 (예상 3~5h):

1. 시드 체크리스트 v3 작성
   - 정리 대상 데이터 wipe 순서
   - 시드 데이터 등록 순서
   - 검증 포인트
2. 검증 잔재 정리 (handoff §"시드 입력 전 정리 필요" 전부)
3. 마스터 데이터 시드
   - bagTypes / meatTypes / frozenProducts
   - recipes (4개 운영 + unitPresets + productionMethods 환산값)
   - supplementTypes (자동 동기화)
   - holidays (Phase 2a 자동 등록 완료 확인만)
4. 운영 직전 점검
   - 권한 매트릭스 (admin/office/production 3계정)
   - rules 동작 검증
   - codebase.md 최종 갱신

작업 규칙:
- 한국어, 직설적이고 간결하게
- 새 코드 제안 전 기존 파일 구조 먼저 확인
- 추측 금지, 모르면 물어볼 것
- handoff에 박힌 결정사항 100% 준수
- spec_v26 정정 사항 #1~#9 인지하고 진행

기술 스택: Vanilla JS + Vite, Firebase Firestore + Auth, GitHub Pages
URL: https://green-cloud-workroom.github.io/fant/

handoff 읽고 시드 체크리스트 초안부터 작성. 결정 필요 항목은 권장안 박은 채로 물어봐라.
```

---

## v28 추가 주의사항

(v27 주의사항 70~78 누적 + 추가)

79. **Phase 1 코드 작업 = 100% 클로즈**: D-시리즈 / §1 / §5 / §6 / Phase 2a / Phase 2b / 4차 (E-2~E-5) / 5차 (E-6 + E-7) 전부 완료. E-8은 폐기 (운영 후 재검토). 이 시점부터 시드 입력 → 운영 진입 단계.

80. **시드 전 4·5차 결정 = 운영 직행 보장**: handoff_v22 원안(시드 → 4·5차)에서 v27에서 순서 변경. 결과: 시드 1회로 sortOrder + productionMethods + conversionHistory + copySheetOrder 등 모든 신규 스키마 박힌 상태로 운영 시작. 마이그레이션 불필요.

81. **E-6 productions 카드 드래그 = 같은 날짜 안만**: 다른 날짜 sortOrder 영향 없음. 기존 sortOrder 풀 내 재배치 정책. recalcRoundsAndBatches가 같은 날짜 내에서 round/batchNo 재계산. 다른 날짜 카드는 건드리지 않음.

82. **E-7 settings/copySheetOrder = 디폴트 폴백 보장**: 도큐먼트 없을 시 코드 디폴트 순서(rawCat → rawDog → freezeCat → freezeDog → freezeCommon) 사용. 운영자가 임의로 도큐먼트 삭제해도 앱 정상 동작. 시드 시 도큐먼트 강제 생성 불필요 (운영자 첫 설정 시 자동 생성).

83. **시드 후 1주 = 운영 발견사항 #22 (로그 순서) 재검토 시점**: 현재 "미확인 우선 + timestamp desc" 정렬이 운영에서 진짜 충분한지 데이터로 판단. 사용자가 명확히 불편 호소하면 Phase 2c 항목으로 진입.

84. **Claude Code 진입 = 작업 환경 전환점**: 이전 = 클로드 채팅 + 코덱스 분리. 이후 = Claude Code (코드 + 파일 + 빌드 직접) + 코덱스 (필요 시). 시드 단계는 파일 직접 만지는 작업 비중 큼 → Claude Code 유리.

---

**작성**: 2026-05-18
**기준 commit**: `2e71161` (5차 E-6 핸들 좌측 보정, 배포 완료)
**다음 단계**: Claude Code 진입 → 시드 체크리스트 v3 → 검증 잔재 정리 → 마스터 데이터 시드 → 운영 직전 점검 → Phase 2c
