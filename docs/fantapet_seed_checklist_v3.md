# 판타펫 생산관리 앱 — 시드 체크리스트 v3

작성일: 2026-05-21
기준: 생산앱 main (PR #2 머지 후) + 라이브 `fant-e5ae5`
성격: handoff_v28 시드 계획의 **사후 명문화** — 실무는 2026-05-20~21에 대부분 진행됨. 이 문서는 "무엇이 끝났고 무엇이 남았는지"를 라이브/로그 기준으로 고정한다.

---

## 0. 시드 등록 방식 (결정 사항)

- **방식 = Admin SDK 스크립트** (앱 UI 직접 등록 아님). `scripts/seedCleanup.mjs`, `scripts/seedDataInput.mjs` 사용.
- 모든 스크립트는 **dry-run 기본**, `--execute` 명시해야 쓰기. 인증 = `application-default` (gcloud ADC).
- 실행 로그는 `seed-*-dryrun/execute/postcheck-YYYYMMDD.txt`로 보존(현재 git 미추적 — 운영 기록용 로컬 보관).

---

## 1. 완료 항목 (로그/크로스앱 응답으로 검증됨)

| 항목 | 상태 | 근거 |
|---|---|---|
| 검증 잔재 정리 (test recipes, settings 검증값, supplementTypes 테스트 prefix, conversionHistory/activityLogs 검증분, deleted productions, orphan supplementStock) | ✅ 완료 | `seed-cleanup-postcheck-20260520` + `seed-cleanup-orphan-postcheck-20260521` 모두 삭제 대상 **0** |
| holidays 시드 | ✅ 완료 | 약 65건, 2025~2027, 라이브 보존 확인 (crossapp 응답 2026-05-21 §2) |
| claims cutover (cross-app role 모델) | ✅ 완료 | alice/admin/qc 라이브 적용, 2026-05-20 (crossapp 응답 §6) |
| recipe unitPresets/labels + freeze-dry supplementTypes(+supplementStock) | ✅ 완료 | `seed-data-input-postcheck-20260520` write **0** (idempotent) |
| 권한 매트릭스 점검 | ✅ 통과 | 2026-05-21 (crossapp 응답 §6) |
| 시드/커토버 스크립트 main 안착 | ✅ 완료 | PR #2 (2026-05-21) |

---

## 2. 라이브 확인 필요 (파일/로그로 확정 불가)

전체 마스터 데이터의 완전성은 라이브 Firestore를 직접 봐야 확정된다. `seedDataInput`은 **기존 레시피의 unitPresets/freeze-dry만** 다뤘으므로 아래는 별도 확인 대상:

- `bagTypes` / `meatTypes` / `frozenProducts` 마스터 완전성
- `staff` / `staffGroups` (담당자 그룹) 완전성
- 전체 raw 레시피의 `productionMethods`(환산값) 등록 여부
- 초기 재고(원육/봉투/영양제) 입력 여부

**확인 방법:** `npm run seed-cleanup:dry` + `npm run seed-data-input:dry` 재실행 = 현재 라이브 스냅샷(쓰기 없음). gcloud ADC 인증 필요.

---

## 3. 운영 직전 점검 (Phase 1 잔여)

| 항목 | 상태 |
|---|---|
| codebase.md 신규 스키마 갱신 | ✅ 완료 (PR #2 스크립트/meat 인라인편집/settings 판당팩수/recipe 가드 반영, stale follow-up 정정) |
| recipe.js 편집 권한 가드 (운영 발견사항 #20) | ✅ 완료 (production read-only) |
| firestore.rules legacy `token.role` 브랜치 제거 | ⬜ **결정 대기** — cutover 완료(5/20)·검증(5/21) 전제 충족. 모든 클라이언트 토큰 갱신 확인 후 제거 + main 머지(룰 자동 배포 트리거). |
| codebase.md mojibake 손상 | ✅ 완료 (PR #13, 2026-05-26) — Korean prose 313줄 재작성, mojibake/U+FFFD 0건 확인. |
| 원료 단가 effectiveDate 관리 (Phase A) | ✅ 완료 (PR #14·#16, 2026-05-26) — `meatTypes/{id}/priceHistory` 스키마 + 설정 UI + Firestore rules + 권한 가드(admin+office). 라이브 배포. |
| 원료 단가 시드 입력 | ⬜ **신규** — 활성 meatTypes 각각 단가 입력. **앱 UI**(설정 → 원료 단가 관리)에서 admin/office(=admin@ 또는 alice) 입력. effectiveDate를 실제 단가 변동일로 입력. 과거 변동 있으면 같은 원육에 여러 row 백필 권장(B단계 통계 탭7 가치 향상). |

---

## 4. 시드 등록 순서 (참고 — handoff 누적)

meat types → **원료 단가(앱 UI)** → bag types → frozen products → recipes / 추가 매핑 → holidays / settings → 초기 재고.
- bagTypes 재시드 후 보존된 raw 레시피의 bag 매핑 재연결.
- dog 레시피 운영 필요 여부 확정.
- **원료 단가**(Phase A, PR #14·#16): 앱 UI(설정 > 원료 단가 관리), admin/office 입력. effectiveDate 실제 변동일로 입력 — 과거 변동 있으면 같은 원육에 여러 row 백필(B단계 통계 탭7 가치 향상). Admin SDK 스크립트 아님(§0과 채널 다름).

---

## 5. 다음 단계

- 위 §3의 두 결정(rules legacy 제거 / mojibake) 처리 → Phase 1 종결.
- 이후 Phase 2c (in-app wipe, 환산 차이 자동 추천, 통계 탭7, 예정 생산표) + Phase 5 동시 운영 진입.
- 별개 신규 스코프: `spec_v27_product_receiving_draft` (제품 입고/이관 크로스앱) — 시드와 무관, 향후 협의.
