# Fantapet Management Codebase Notes

Last updated: 2026-06-04

## Current Status

- 2026-06-04 spec_v27 P2 doc sync:
  - Documented the raw product-receipt flow (`openProductReceiptModal`, main.js): `productions` product-receipt fields, the `productTransferRequests/{idempotencyKey}` cross-app outbox schema + rules, and the modal/batch flow. Code-authoritative as of this commit; freezeDry receipt (`frozenProductId`/`quantity`) remains Phase 3 and is not yet emitted. Cross-app contract: `docs/fantapet_crossapp_request_product_transfer_2026-05-21.md`.
- 2026-05-19 v28 / Phase 1 code closeout:
  - Phase 1 code work is complete through Phase 2b, the 4th reorder bundle, and the 5th bundle. Next major step is seed entry and pre-operation data cleanup.
  - Latest relevant commits after v27: `7b2b5d4` production card reorder, `1b74aff` copy-sheet category order, `2e71161` left-side production reorder handle polish.
  - Latest deployed assets verified on GitHub Pages: `index-C-jDtjJi.js`, `index-BNP2kANj.css`.
  - 5th bundle E-6 production-card reorder is complete. Admin/office can drag production cards for the selected date only; production role does not see handles. The implementation reassigns the visible cards' existing `sortOrder` values and then calls the existing round/batch recalculation flow.
  - 5th bundle E-7 production-instruction category order is complete. Settings now stores `settings/copySheetOrder`; production sheet copy falls back to the default order when the document is missing.
  - 5th bundle E-8 log item ordering was intentionally deferred/cancelled for now. Current log ordering remains "unacknowledged required logs first, then timestamp descending"; revisit after about one week of seed/operation data if users report a concrete pain point.
  - E-6/E-7 verification passed by data/logic checks: same-date `sortOrder` pool reassigns correctly, other dates are unchanged, `round`/`batchNo` recalculates, `settings/copySheetOrder` save/delete/default fallback works. Verification production docs were marked `status: 'deleted'`; `copySheetOrder` was reset to default.

- 2026-05-18 v26 / Phase 2b implementation:
  - Added raw recipe `productionMethods` editing in `src/pages/recipe.js` and nested `recipes/{recipeId}/conversionHistory` writes for manual unit-to-box changes.
  - Manual conversion edits write `activityLogs` with `action: 'conversion'`, `subAction: 'manualEdit'`; office-log classification now includes `conversion`.
  - Production input now blocks raw recipes with no active conversion method, calculates `expectedBox` from the production date's applicable conversion value, accepts optional integer `actualBox`, and stores `methodKey`, `expectedBox`, `actualBox`, and `appliedUnitToBox`.
  - Production input keeps spec_v26 date-effective fallback behavior and shows a yellow notice when the current method value starts after the production date and an older conversion value is being used.
  - When multiple conversionHistory rows share the same effectiveDate, production now chooses the newest createdAt row so same-day manual corrections resolve to the latest value.
  - Existing raw `rawBoxQty` remains unchanged and continues to represent the pack-weight based theoretical box count.
  - Firestore rules now allow the nested `recipes/{recipeId}/conversionHistory/{historyId}` subcollection.
  - Phase 2c remains out of scope: automatic suggestions, 2-step conversion modal, and stats tab 7.

- 2026-05-18 v26 / 4th bundle reorder work:
  - E-2 bagTypes reorder is complete with SortableJS drag handles, admin/office-only handles, raw/freezeDry boundary protection, and global continuous sortOrder (`raw 0...`, `freezeDry` after raw).
  - E-3/E-4/E-5 added the same reorder pattern for frozenProducts, meatTypes, and recipes. Recipe reorder splits raw/freezeDry sections and updates existing supplementTypes sortOrder from the new recipe order.

- 2026-05-16 v26 / Phase 2a closeout:
  - Phase 2a holiday-master code and public deploy are complete. Latest relevant commits: `875bb03` holiday data, `7287287` expiry notice, `c21b70f` holiday-aware business-day helpers, `959f9cb` holiday settings UI, `d740010` production business-day wiring, `64befa2` shipping business-day schedule adjustment, `4e01cae` production-impact holiday badge.
  - Firestore Rules + Custom Claims work is updated for the cross-app role model. The production app reads `roles.production`; inventory reads `roles.inventory`; no setter writes a bare top-level `role`.
  - Current claim mapping: `alice@fantapet.com` has `roles: { inventory: 'owner', production: 'admin' }`; `admin@fantapet.com` has `roles: { inventory: 'admin', production: 'office' }`; `qc@fantapet.com` has `roles: { inventory: 'qc', production: 'production' }`.
  - Cutover safety: do not push or merge Firestore rules changes to `main` before the Admin SDK re-claim has been executed and verified with live token reads; `main` push triggers the rules deploy workflow.
  - Bag/recipe delete UI work is complete (`cc722a6`): admin and office can delete with cascade/soft-delete behavior as implemented; production is blocked by UI/rules.
  - Phase 2a smoke test passed:
    1. Korean public holiday auto import generated the 2025-2027 holiday docs.
    2. Company holiday range create/edit/delete works; delete is soft delete through `status: 'deleted'`.
    3. Incoming schedule on Sunday/non-shipping holiday shows the adjustment modal and changes to the next shipping business day. Verified with `2026-05-17 -> 2026-05-18`; test schedule was cancelled afterward.
    4. Production input on a production-affecting holiday shows the holiday badge. Verified with `2026-05-05` showing `등록 공휴일`.
  - Follow-up polish after smoke testing:
    - `3b390eb` improved company holiday form validation and required-field feedback.
    - `339e527` made settings sections collapsible; default state is collapsed.
    - `d0b8474` fixed the holiday form input layout by overriding table-oriented `.cell-input` styles only inside the holiday form and widening the settings container.
  - Public URL remains https://green-cloud-workroom.github.io/fant/. GitHub Pages can lag by roughly 10 minutes because of cache headers.
  - Superseded next work note: Phase 2b and the 4th/5th bundles are now complete; current next work is seed entry.

- 2026-05-14 Work A completed:
  - `src/pages/main.js` office-log classifier now includes `recipe`.
  - This completes the missing classification for recipe active-toggle logs added in unit 3.5 (`action: 'recipe'`, `subAction: 'activeToggle'`).
  - Verification: `npm.cmd run build` passed. Expected build warnings remain chunk size and ineffective dynamic import warnings.

- 2026-05-13 Phase 1 third bundle completed (spec_v24 supplement + unit preset work):
  - Units 1-12 plus helper units 1.5 / 3.5 / 9.5 are implemented through commit `e687af9`.
  - Unit 1: recipes gained `unitPresets: number[]` and recipe add/edit chip UI.
  - Unit 2: production input uses unit preset select with direct-entry fallback; empty preset recipes block production save.
  - Unit 3: supplement operational collections were added to the wipe whitelist (`supplementTypes`, `supplementStock`, `supplementLogs`), bringing wipe targets to 27 operational collections.
  - Unit 3.5: recipe active/inactive toggles write `activityLogs` with `action: 'recipe'`, `subAction: 'activeToggle'`.
  - Units 4-7: recipe preset changes auto-sync supplement SKUs; new supplement page supports stock list, filters, stock-in, manual adjust, and recent history.
  - Units 8-9: production save/edit/delete deducts and refunds supplement stock transactionally using `supplementLogs.relatedProductionId`.
  - Unit 9.5: supplement helper functions were extracted to `src/utils/supplement.js`.
  - Units 10-11: closing warnings and daily auto alert logs now include supplement minimum stock (`warnSupplementMin`, `supplementMin` details under `minStock:alert`).
  - Unit 12: stats gained a supplement table tab and all-sheet Excel export now has 6 sheets.
  - Deploy is still expected before seed entry. Step 2 wipe re-run and Step 3 seed entry are intentionally postponed.

- 2026-05-13 Phase 1 second bundle (C-2/C-3) completed:
  - C-2 closing warning popup unified with the closing blocker modal pattern. `showBlockingModal()` now supports `variant: 'block' | 'warning'`; warning mode uses the same item/detail layout, amber styling, no "go process" buttons, and `Cancel / Still close` actions before the staff close modal.
  - C-3 mojibake sweep completed with no source changes needed. `src/**/*.js/html/css` had 0 hits for representative mojibake/BOM/NFD patterns. The only dist hit is inside bundled xlsx/SheetJS internals and has no UI impact. Past `meat.js` mojibake found during 7F-2 was already restored.
  - Removed the user-visible frozen-pan placeholder button: the unimplemented `동결판 lot 용량` `+ 자동 조정` button and its "추후 추가 예정" alert were removed. Bread-pan manual adjustment remains implemented and unchanged.
  - Verification: `npm.cmd run build` passed. Expected build warnings remain chunk size and ineffective dynamic import warnings.

- 2026-05-12 E2/E3 closeout:
  - Live URL changed after GitHub username rename: https://green-cloud-workroom.github.io/fant/
  - E2 validation completed: permission matrix passed, closing blockers/warnings passed except autoRepack natural validation, light full-cycle checks passed.
  - E3 backup completed: `backup_pre_wipe_20260512_093907`, 245 docs total. Extra copy stored at `C:\Users\oddsk\OneDrive\fantapet_backups\backup_pre_wipe_20260512_093907`.
  - E3 wipe completed: preserved `users` 3, `staffGroups` 3, `recipes` 4, `settings` 0. Deleted operational data from wipe whitelist; final dry-run shows all wipe targets at 0 docs.
  - Wipe required temporary Firestore Rules relaxation because app-account delete was blocked by rules. Rules were restored after wipe and dry-run verification passed.
  - 2026-05-12 late wipe correction: `closings`, `breadPanLogs`, and `breadPanLots` were added to the wipe whitelist. Residual docs were deleted and final dry-run shows all 24 wipe targets at 0 docs.
  - 2026-05-12 UI/deploy fixes after wipe:
    - Removed the production-log empty-state placeholder text `6C-2/3...`; empty production logs now show "today production log none" wording.
    - Tender freeze-dry B option completed: recipes with `requiresSeparation === false` hide bread-pan input, save bread pan count as 0, and production/main cards omit bread-pan display.
    - Master active-toggle UX C-1 completed: meat, bag, frozen product, and recipe active/inactive controls use the list-row toggle pattern. Bag/frozen-product edit modals no longer contain active toggles.
    - Closing warning popup polish completed: warning items now carry detail rows for low bag/meat stock, matching the blocker-detail pattern.
    - `meat.js` modal-time duplicate `loadStaffCache()` call removed; initial awaited staff cache remains.
    - Admin REST wipe fallback now sends JSON with `charset=utf-8`; current REST path does not write Korean business data, so this is preventive hardening.
    - Latest deployed build after B-1/B-2/B-3: `index-iPGdTnt8.js`; if GitHub Pages lags, use Ctrl+Shift+R or incognito and confirm the JS asset name.
  - Seed checklist added: `fantapet_seed_checklist.md`. Seed input is for the test/pre-inventory-linkage environment, not live operations.
  - Current state wording: production-management app standalone validation is complete; next phase is inventory-app linkage, then simultaneous production/inventory operations.
  - Before real operations: reconnect raw recipe bag mapping for the preserved raw cat-chicken recipe, decide dog recipes, normalize recipe naming if needed, and change exposed test passwords for `alice`, `admin@`, `qc@`.
  - Keep backup folder outside git for about one month after launch.
  - spec_v23 correction required: decision 4 should mean "after standalone production-management validation", not "after live operations start"; define operations start as simultaneous production-management and inventory-app launch.

- 2026-05-11 E3 pre-wipe master data hardening:
  - `bagTypes`, `meatTypes`, `frozenProducts` now use active/inactive handling instead of destructive master deletion.
  - New master rows default to `active: true`; missing active is treated as active with `active !== false`.
  - Inactive masters remain visible in management/list views with inactive styling, but are excluded from new input dropdowns.
  - Existing mappings/history are preserved when editing: inactive linked bag/meat options remain selectable only for the already-linked record.
  - `meatTypes` delete UI was removed. Wrongly entered master data should be set inactive, not deleted.
  - Active toggles write `activityLogs` with `subAction: activeToggle`.
- 묶음 b 완료.
  - B1: 마감 차단 4/5/6 및 경고 1/2/3 추가.
  - B1: `settings/closingFlags` 읽기 추가. 문서 없으면 전부 ON.
  - B1: 차단 0건 + 경고만 있을 때 "그래도 마감?" 확인 후 마감 진행 분기 추가.
  - B2: 내일생산불러오기 차단 5조건 기존 구현 진단 통과.
  - B3: 계란/봉투/원육 최소재고 자동 발행 매일 1회 결정적 doc id 패턴 확인.
  - B4: 입고예정 중복 차단/단위 제한/정렬 및 frozenSep 자동 결정/자동 추정 진단 통과.
  - B4-6-4: 입고예정 수정 버튼/수정 모달/마감 가드 추가.
- 묶음 c 완료.
  - 권한 매트릭스 류 B/C 단계 버튼 DOM 제거 1차 적용.
  - production에서 핸들 수 없는 버튼은 렌더 단계에서 제거.
  - 함수 내부 권한 체크는 이중 안전망으로 유지.
  - settings 메뉴는 production에게 보이지만 클릭 시 alert 후 진입 차단.
  - settings 해당 이벤트 바인딩은 admin/office일 때만 실행하도록 보정.
- 묶음 a 완료.
  - 계란 현재 재고 카드에 FIFO 가용 용량 일괄/낱개 표시 추가.
  - `eggLogs` 전체를 timestamp 시간순으로 재생해 lot별 용량 계산.
  - FIFO 분해 합계와 `eggStock/global.currentQty` 정합성 경고 표시.
- 묶음 9 권한 매트릭스 1차 검토/정리 완료.
- 묶음 9 #9 자동 재포장 확인 모달 및 차이 처리 운영 검증 완료.
- 내일생산불러오기 / 마감 / 마감해제 권한 정책을 운영 결정에 맞게 조정함.
- 레시피 삭제 기능은 spec에 맞춰 완전 제거함. 레시피는 활성/비활성 토글만 사용.
- 원육 입고 등록은 현장 작업으로 판단하여 production도 가능하게 변경됨.
- 묶음 7 통계 기능 완료.
- 통계 페이지는 5개 탭으로 구성됨.
  - 생산량
  - 원료 소모량
  - 봉투 소모량
  - 계란 사용량
  - 일별 생산 현황
- 영양제
- 차트 4종 적용 완료.
  - 생산량: 레시피별 꺾은선
  - 원료 소모량: 원료별 꺾은선
  - 봉투 소모량: 봉투별 stacked 막대
  - 계란 사용량: 단일 꺾은선
- Excel 다운로드 완료.
  - 활성 탭 개별 다운로드
  - 6탭 전체 일괄 다운로드

## New Dependencies

- `chart.js`
  - 통계 차트 렌더링.
  - `Chart.register(...registerables)` 사용.
- `xlsx`
  - Excel 파일 생성 및 다운로드.
- `firebase-admin`
  - Dev dependency for `scripts/setCustomClaims.mjs`.
- `gh-pages`
  - Dev dependency for publishing Vite `dist` to GitHub Pages.
- `sortablejs`
  - Drag-and-drop ordering for master lists and production cards.
  - Used in bag, frozen product, meat type, recipe, production card, and copy-sheet category ordering flows.

## Scripts / Config

### `firestore.rules`

New in v26.

- Implements app claim + `roles.production` based access using Firebase Auth custom claims.
- `activityLogs` update is limited to acknowledged-related fields; full arbitrary updates remain blocked.
- `bagLogs` delete is allowed for admin and office because bag delete cascade needs it.
- Rules are deployed manually or by the GitHub Actions workflow when the required secret is present.

### `scripts/setCustomClaims.mjs`

New in v26.

- Admin SDK script for assigning cross-app `app`/`roles` claims to the three operating accounts.
- Removes legacy bare top-level `role` and deterministically writes `app` plus both `roles.inventory` and `roles.production` for the three configured accounts.
- Only `alice@fantapet.com`, `admin@fantapet.com`, and `qc@fantapet.com` are queried or modified; all other Firebase Auth users are skipped by design.
- `npm.cmd run claims:dry-run` previews changes.
- `npm.cmd run claims:execute` writes claims.

### `scripts/fetchKoreanPublicHolidays.mjs`

New in v26.

- Fetches Korean public holiday rows from the KASI special-day API and regenerates `src/services/holidayMaster.js`.
- 2028+ data was not available in the v26 session; current generated range is 2025-2027.

### `.github/workflows/firebase-rules.yml`

New in v26.

- Runs on `firestore.rules` changes.
- Performs a dry-run safety check before deploy.
- Requires GitHub secret `FIREBASE_RULES_SERVICE_ACCOUNT`.

### Operational data scripts

- `scripts/backupFirestorePreWipe.mjs` — pre-wipe Firestore backup (`npm run backup:prewipe`).
- `scripts/wipeFirestoreOperationalData.mjs` / `...Admin.mjs` — operational-data wipe, dry-run default (`npm run wipe:dry-run` / `wipe:execute`, plus `:admin` variants).

### Seed / cutover scripts (PR #2, 2026-05-21)

- `scripts/seedCleanup.mjs` — targeted handoff_v28 cleanup (test recipes, settings verification docs, supplementTypes test prefix, conversionHistory/activityLogs verification entries, deleted productions, orphan supplementStock). Dry-run default; `npm run seed-cleanup:dry` / `:execute`.
- `scripts/seedDataInput.mjs` — seeds existing recipes' unitPresets/labels and freeze-dry supplementTypes (+ paired supplementStock). Dry-run default; `npm run seed-data-input:dry` / `:execute`.
- `scripts/claimsBackupRestore.mjs` — backup/restore Auth custom claims for cutover rollback (`npm run claims:backup` / `claims:restore:dry` / `claims:restore`).
- `scripts/fixSupplementNames.mjs` — normalize mojibake in `supplementTypes.name` (`npm run fix:supplement-names:dry` / `:execute`).

## Important Files

### `src/pages/main.js`

v26 / Phase 2a:
- Calls `loadHolidaysCache()` on load and uses holiday-aware helpers for calendar and tomorrow-production behavior.
- Dashboard holiday-data notice appears for admin/office only when Korean public holiday data approaches expiry (`HOLIDAY_REFRESH_NEEDED_BEFORE = '2027-10-01'`) or is out of range after 2027. Production role does not see this banner.
- `OFFICE_LOG_ACTIONS` now includes `holiday`, in addition to existing office-log actions.

spec_v24 / Work A:
- `triggerMinStockLogs(today)` now also checks supplement minimum stock and emits daily deterministic alert logs.
- Supplement alert logs reuse `action: 'minStock'`, `subAction: 'alert'`; supplement-specific identity is stored in `details.kind: 'supplement'`.
- Auto alert doc id follows the existing per-item pattern: `auto_minStock_alert_{date}_{dedupKey}`.
- `OFFICE_LOG_ACTIONS` includes both `supplementStock` and `recipe`; recipe active-toggle logs now appear in the office log category.

메인 화면, 내일생산불러오기, 생산 로그, 캘린더, 마감 관련 흐름.

spec_v27 P2 — 제품입고 흐름 (`openProductReceiptModal`):
- 완료된 생식(raw) 생산카드 클릭 → 제품입고 모달. `category !== 'raw'`는 무시(동결건조 제품입고 = Phase 3).
- 입력: 생산방식(기록용, recipe `productionMethods`에서 선택), 판수(필수), 낱개(자투리 팩, 기본 0).
- 환산: `총 팩수 = 판수 × 판당팩수 + 낱개` → `박스 = floor(총팩/10)/2`, `낱개 = 총팩 % 10` (1박스 = 20팩, **10팩 = 0.5박스 본품**, 박스 분수 가능). 실시간 미리보기. (2026-06-09 호두 결정)
- 판당팩수는 `settings/systemValues`의 `packsPerPlateCat`/`packsPerPlateDog`에서 target별로 읽음. 값이 없거나 ≤0이면 alert 후 모달 중단.
- 저장: 단일 `writeBatch`로 (1) `productions/{id}` 입고 필드 update + `receivedRevision`+1, (2) `productTransferRequests/{productions:id:revision}` outbox 생성(`status:'pending'`). 원자적.
- 재입력(이미 received된 카드 재저장)은 `receivedRevision`을 올려 **새 outbox 문서**를 만든다(수정 아님). 재고앱은 같은 `sourceId`의 최신 revision만 반영.
- 스키마: 위 `productions` product-receipt fields + `productTransferRequests/{idempotencyKey}` 참조. cross-app 계약: `docs/fantapet_crossapp_request_product_transfer_2026-05-21.md`.

묶음 9 #9:
- 자동 재포장 trigger 로그 확인 후 전용 모달 표시.
- 실제 재포장 개수 입력 시 g 환산 및 시스템 수량과 차이 표시.
- 차이 없음: trigger 로그 ack만 처리하고 lot 용량은 변경하지 않음.
- 차이 있음: `meatStocks/{repackedStockId}.remaining` 보정 후 `activityLogs`에 `autoRepack:diff` 로그 발행.
- 0개 입력: 확인 팝업 후 lot `remaining: 0`, `closed: true` 처리.
- `autoRepack:diff`는 확인 필수 로그로 표시.
- 내일생산불러오기 차단 5조건 #4에 자동 재포장 미확인 로그 포함.

권한 변경:
- 내일생산불러오기: 전체 계정 가능.
- 내일생산불러오기 취소: 전체 계정 가능. 사유/담당자/수동 로그는 유지.
- 메인 새로고침(`handleRefreshCompletion`): admin/office만 가능. production 차단 + DOM 제거.
- 캘린더 이벤트 등록/수정/삭제: admin/office만 가능 + production DOM 제거.

묶음 b/c:
- 내일생산불러오기 차단 5조건은 `gatherTomorrowLoadBlockers(today)`에서 확인.
- 최소재고 자동 발행은 `triggerMinStockLogs(today)` / `ensureAutoLog()`의 결정적 doc id로 매일 1회 보장.
- `minStock:alert`는 일반 생산/사무 로그 차단에 포함하지 않고 경고 전담으로 처리.

주의:
- `activityLogs` 테스트 로그는 Firestore rules에서 delete가 막힐 수 있음. 검증 중 생성된 로그는 필요 시 acknowledged 처리로 정리.

### `src/layout.js`

마감/마감해제 버튼 및 전역 layout.

권한 변경:
- 마감/마감해제 권한 체크 제거. 전체 계정 가능.
- 기존 차단 조건, 사유/담당자 입력, 수동 로그는 유지.
- production이 settings 메뉴 클릭 시 alert 후 진입 차단.

묶음 b:
- 마감 체크 결과에 `warnings` / `totalWarnings` / `flags`가 추가됨.
- 차단 항목이 있으면 기존 차단 팝업으로 마감 중단.
- 차단 0건 + 경고만 있으면 단일 confirm 후 담당자 선택 모달로 진행.

### `src/services/closingChecks.js`

spec_v24:
- Reads `settings/closingFlags.warnSupplementMin` with default ON semantics.
- Loads `supplementTypes` and `supplementStock`, then passes them to supplement minimum-stock judgment.
- Supplement minimum warnings are warnings only, not closing blockers.

마감 차단/경고 체크 Firestore wrapper.

묶음 b:
- `settings/closingFlags` 문서 읽기 추가.
- 문서가 없거나 일부 필드가 없으면 기본값 ON.
- 기존 반환 필드를 유지하면서 `warnings`, `totalWarnings`, `flags` 추가.
- autoRepack 미확인 로그, 일반 생산 로그 미확인, 일반 사무 로그 미확인, 내일 생산 없음, 봉투 최소재고, 원육 최소재고 항목을 조회.

주의:
- B5 설정 UI는 아직 없음. 백엔드 읽기만 준비됨.
- B5 진행 시 최소재고 자동 발행을 `warnBagMin` / `warnMeatMin` flag false일 때 skip하도록 연결 필요.

### `src/services/closingChecksLogic.js`

spec_v24:
- `DEFAULT_CLOSING_FLAGS` includes `warnSupplementMin: true`.
- `judgeSupplementMinimumStock()` treats active supplement SKUs under 5 bags as warning items.
- Warning slot 4 is supplement minimum stock; it uses the same warning-modal detail pattern as bag/meat minimum warnings.

마감 차단/경고 순수 판정 로직.

묶음 b:
- 차단 4/5/6 및 경고 1/2/3 판정 추가.
- 차단 4 autoRepack 전용 항목과 차단 5 일반 생산 로그 항목 분리.
- 차단 5에서는 `autoRepack:trigger`, `autoRepack:diff`, `minStock:alert` 제외.
- 차단 6에서는 `minStock:alert` 제외.

### `src/pages/frozenPan.js`

동결판/빵판 재고 및 발주 흐름.

권한 변경:
- 발주 취소(`cancelOrder`): admin/office만 가능. production 차단.
- 확인 완료된 발주 취소 버튼은 production에서 DOM 제거.
- 빵판/텐더동결 입고 및 수동조정 계열은 production 가능.

spec_v20 13번 해석:
- 확인 전 발주행의 "발주 삭제"는 재고 차감 전 삭제이며 production 가능으로 유지.
- 확인 완료된 발주행의 "발주 취소"는 ledger 롤백 취소이며 admin/office만 가능.

### `src/pages/frozenProduct.js`

동결제품 입고.

권한 변경:
- 동결제품 종류 master 추가/수정: admin/office만 가능. production DOM 제거.
- 동결제품 입고 수정: admin/office만 가능. production 차단.
- 동결제품 입고 삭제: admin/office만 가능. production 차단.
- 동결제품 입고 수정/삭제 버튼은 production에서 DOM 제거.

### `src/pages/schedule.js`

입고 예정관리.

v26 / Phase 2a:
- Incoming schedule registration/edit resolves dates through `resolveScheduleBusinessDate(date)`.
- If the selected date is not a shipping business day, `showConfirmModal()` asks whether to change to `getNextBusinessDayByType(date, 'shipping')`.
- Shipping business-day logic considers Sunday plus holidays where `affectsShipping === true`; `shippingClosedFromEnabled === true` also blocks shipping on the preceding day.
- Smoke test passed with `2026-05-17` (Sunday) changing to `2026-05-18`.

묶음 b:
- 같은 날짜/구분/항목 중복 등록 차단 확인.
- 단위 제한 확인.
  - 원육: g/kg
  - 봉투: 장/박스
  - 계란: 개/판
- 정렬 확인: 날짜 오름차순, 같은 날짜는 최신 등록 순.
- 입고예정 수정 버튼 및 수정 모달 추가.
  - 수정 허용: 예정일, 수량, 단위, 담당자, 메모.
  - 구분/type 및 항목/itemId는 수정 불가.
  - 수정 시 기존 날짜나 새 날짜 중 하나라도 마감되면 차단.
  - 수정 시 `activityLogs` 발행.

묶음 c:
- 입고예정 등록/수정/취소 버튼은 admin/office만 렌더.
- 완료 버튼은 기존 운영 흐름대로 유지.

### `src/pages/recipe.js`

spec_v24:
- `recipes.unitPresets: number[]` stores production-unit presets. Empty arrays are allowed; missing fields are read with `Array.isArray(...) ? ... : []`.
- Recipe add/edit modal has chip UI for unit presets; duplicates, zero/negative values, and non-numeric values are blocked.
- Saving a recipe auto-syncs `supplementTypes/{recipeId}_{unit}` and `supplementStock/{recipeId}_{unit}`.
- Removing a preset deletes the matching supplement SKU, stock doc, and its supplement logs after confirmation. Existing stock/history warnings are shown before delete.
- Recipe active/inactive toggle propagates active state to supplement SKUs and writes `activityLogs` with `action: 'recipe'`, `subAction: 'activeToggle'`.

v26 / Phase 2b:
- Raw recipes can store `productionMethods: [{ methodKey, label, unitToBox, effectiveDate, active }]` for `rotary` and `manual` conversion values.
- Manual `unitToBox` changes create `recipes/{recipeId}/conversionHistory/{historyId}` docs and write `activityLogs` as `conversion/manualEdit`.
- Freeze-dry recipes hide the production-method conversion section.

PR #2 / pre-launch (2026-05-21):
- Recipe master edit affordances are gated to admin/office. The `+ 신규 추가` button, detail-form 저장/삭제 buttons, and the list active toggle are hidden or disabled for the `production` role; `saveRecipe` and the active-toggle handler also guard defensively. Detail-form inputs stay visible to production but have no persist path (운영 발견사항 #20).
- Recipes have a `usesSupplement` boolean (default true; missing = true) with a "영양제 사용" checkbox in the recipe form. When false (e.g., 텐더동결 products with no supplement), `saveRecipe` creates no `supplementTypes`/`supplementStock` for the recipe (and deletes existing ones when toggled off via `removedUnits`), and `production.js` skips the supplement deduct/refund transaction on new/edit save. Delete refund is `supplementLogs`-driven, so it is already a no-op when none exist.

레시피 관리.

권한/기능 변경:
- 레시피 삭제 버튼 제거.
- `deleteRecipe()` 함수 제거.
- `deleteDoc` / `showConfirmModal` 삭제 관련 import 제거.
- spec 7번 기준: 레시피는 삭제하지 않고 활성/비활성 토글로 관리.

### `src/pages/stats.js`

spec_v24:
- Added tab 6 for supplement statistics. It is table-only, no chart.
- Reads `supplementTypes`, `supplementStock`, and date-filtered `supplementLogs`.
- Aggregates stock-in, net usage from `autoDeduct`, manual adjustment, and current stock by supplement SKU.
- Excel all-download now exports 6 sheets including supplement data.

통계 페이지 전체 구현 파일.

주요 기능:
- 기간 모드: 주간 / 월간 / 직접
- 집계 단위: 일별 / 주별 / 월별 / 연별
- Firestore 클라이언트 집계
- Chart.js 차트 생성 및 destroy 라이프사이클 관리
- 레시피 / 원료 / 봉투 체크박스 토글
- 데이터 없는 기간 처리
- 개별 Excel 다운로드
- 전체 Excel 다운로드

Firestore 읽기:
- `productions`
- `bagLogs`
- `eggLogs`
- `frozenLogs`
- `bagTypes`
- `meatTypes`

캐시/상태:
- `lastProductionAgg`
- `lastMeatAgg`
- `lastBagAgg`
- `lastEggAgg`
- `lastDailyItems`
- `visibleRecipeIds`
- `visibleMeatIds`
- `visibleBagIds`
- `knownRecipeIds`
- `knownMeatIds`
- `knownBagIds`
- `bagPiecesPerBoxMap`
- `meatTypeShowInStatsMap`
- `meatTypeAutoDeductMap`

주의:
- Chart.js 인스턴스는 탭 전환 / 페이지 재진입 / 재렌더링 전에 `destroyAllCharts()`로 정리해야 함.
- 체크박스 토글은 Firestore 재쿼리 없이 캐시된 집계 데이터로 차트 dataset만 재생성.
- `bagLogs`에는 `piecesPerBox` 스냅샷이 없음. 통계에서는 현재 `bagTypes.piecesPerBox` 값을 사용함.
- 따라서 `piecesPerBox`를 나중에 바꾸면 과거 봉투 통계도 새 기준으로 환산됨.

### `src/pages/meat.js`

원육 재고 및 원육 종류 관리.

권한 변경:
- 원육 종류 master 관리: admin/office만 가능. production DOM 제거.
- 원육 입고 등록: 전체 계정 가능. 현장에서 실제 입고 수량 확인 후 등록하는 작업으로 production 허용.
- 전처리/재포장/수동조정 계열: production 가능.

묶음 7F-2 변경:
- 원육 종류 관리 모달에 `통계 표시` 체크박스 추가.
- 체크박스 변경 시 `meatTypes/{id}.showInStats` 즉시 저장.
- 신규 원육 추가 시 `showInStats: true` 저장.
- 기존 문서에 `showInStats`가 없으면 통계에서는 `true`로 처리.

추가 복구:
- 7F-2 작업 중 기존 한글 인코딩 깨짐 일부가 빌드 오류로 노출되어 복구함.
- 복구한 범위:
  - `getMeatLogTypeLabel()` 라벨
  - 수동조정 기록의 `stageKor`
  - 원육 재고 상단 제목/탭/주요 버튼/일부 표 헤더
- 이 깨짐은 7F-2 새 기능 때문에 생긴 것이 아니라 기존 파일에 있던 깨진 문자열이 빌드 검증 중 드러난 것.
- 남은 `meat.js` 한글 라벨 전체 재검토는 묶음 9 후보로 남김.

PR #2 / meat types management (2026-05-21):
- The meat-types management modal (admin/office only) now supports inline editing of `defaultUnitWeightG` and `minimumQtyG` per row, alongside the existing showInStats and active toggles.

### `src/pages/bag.js`

봉투 재고 및 봉투 종류 관리.

묶음 c:
- 봉투 종류 추가/수정은 admin/office만 가능.
- production에서는 봉투 종류 추가/수정 버튼 DOM 제거.
- 봉투 입고 등록과 수동조정은 기존 운영 흐름대로 유지.

### `src/pages/production.js`

spec_v24:
- Production unit input uses recipe `unitPresets`; direct input is still available when presets exist.
- Recipes with empty/missing `unitPresets` disable save and show an operator-facing guide to set presets in recipe management first.
- Production save transaction checks `supplementTypes/{recipeId}_{unit}` and `supplementStock/{recipeId}_{unit}`, blocks inactive/missing/zero-stock SKUs, then deducts 1 bag.
- Production edit refunds the previous SKU and deducts the new SKU atomically when the unit changes.
- Production delete soft-deletes the production card and refunds the linked supplement deduction; `supplementLogs.relatedProductionId` is used for net/refund tracking.
- Supplement deduct/refund is independent of tomorrow-load meat/bag deduction flows.

v26 / Phase 2b:
- Raw production input shows production method, expected boxes, optional integer actual boxes, and the future-effective-date notice.
- Raw production documents store `methodKey`, `expectedBox`, `actualBox`, and `appliedUnitToBox`; `rawBoxQty` remains the separate pack-weight theoretical box count.

v28 / 5th bundle E-6/E-7:
- `productionCards` uses SortableJS for same-date card reordering. Handles render for admin/office only.
- Reorder reassigns only the selected date's visible cards' existing `sortOrder` values. Other dates are intentionally not renumbered.
- After reorder, the existing `applyRoundsAndBatches(selectedDate)` flow recalculates `round` and `batchNo`.
- `showCopySheetModal()` reads `settings/copySheetOrder`; missing or invalid settings fall back to `rawCat`, `rawDog`, `freezeCat`, `freezeDog`, `freezeCommon`.
- Production sheet grouping is still derived from production `category` and `target`; E-7 changes output order only.

생산 카드 관리.

묶음 c:
- 새 생산 추가, 생산 카드 저장/수정, 생산 카드 삭제 UI는 admin/office만 가능.
- production에서는 관련 버튼 DOM 제거.
- 기존 함수 내부 권한 체크는 이중 안전망으로 유지.

### `src/pages/supplement.js`

New in spec_v24. Full supplement stock page.

Main responsibilities:
- Loads `supplementTypes`, `supplementStock`, and recent `supplementLogs`.
- Renders supplement SKU cards sorted by `sortOrder`, with active/inactive styling and filters for all / under 10 / under 5.
- Color thresholds are currently code defaults: under 10 bags = orange, under 5 bags = red.
- Provides stock-in modal. Active SKUs only; transaction increments `supplementStock.currentQty` and writes `supplementLogs` with `type: 'in'`.
- Provides manual adjust modal. Active SKUs only; all accounts may use it; reason and staff are required. Negative result is blocked. Writes `supplementLogs` with `type: 'adjust'` and `activityLogs` with `action: 'supplementStock'`.
- Staff group names are currently hard-coded for supplement flows: stock-in uses `SUPPLEMENT_IN_GROUP_NAME`, manual adjust uses `SUPPLEMENT_ADJUST_GROUP_NAME`. D-2 should move these to settings.
- No direct SKU create/edit/delete UI. SKU lifecycle is controlled by recipe `unitPresets`.

### `src/utils/supplement.js`

New in unit 9.5.

Helpers:
- `makeSupplementId(recipeId, unit)` returns deterministic SKU id `${recipeId}_${unit}`.
- `makeSupplementName(recipeName, unit)` builds display name `${recipeName} ${unit}...supplement`.
- `makeSupplementSortOrder(recipeSortOrder, unitIndex)` returns `recipeSortOrder * 100 + unitIndex`.

Used by recipe and production flows to keep SKU id/name/order consistent.

### `src/services/holidayMaster.js`

New in v26 / Phase 2a.

- Generated static Korean public holiday data from the KASI special-day API.
- Current covered range is 2025-2027. The API did not provide 2028+ data during the v26 session.
- Exports:
  - `PUBLIC_HOLIDAY_SOURCE`
  - `HOLIDAY_DATA_END_YEAR = 2027`
  - `HOLIDAY_REFRESH_NEEDED_BEFORE = '2027-10-01'`
  - `KOREAN_PUBLIC_HOLIDAYS`
  - `getKoreanPublicHolidaysForYear(year)`
  - `getKoreanPublicHolidaysForYears(startYear, years)`
- Generated holiday rows default to:
  - `holidayType: 'publicHoliday'`
  - `affectsProduction: true`
  - `affectsShipping: true`
  - `shippingClosedFromEnabled: true`
  - `isAutoGenerated: true`
- Do not hand-edit generated rows. Re-run `npm.cmd run fetch:holidays` when a later source range becomes available.

### `src/utils/date.js`

v26 / Phase 2a:
- Holiday cache merges static data from `holidayMaster.js` and Firestore `holidays`; Firestore wins on same-date collisions.
- `status: 'deleted'` removes a Firestore holiday override from effective holiday behavior.
- Key helpers:
  - `loadHolidaysCache()`
  - `getHolidaysCache()`
  - `getHolidayInfo(dateStr)`
  - `getHolidayInfoCache()`
  - `isHoliday(dateStr)`
  - `isBusinessDay(dateStr, type)`
  - `getNextBusinessDayByType(dateStr, type)`
  - `addBusinessDays(dateStr, days, type)`
  - `isLongShippingHoliday(dateStr)`
  - `getHolidayDataNotice(referenceDateStr)`
- Production business days and shipping business days differ:
  - Production uses `affectsProduction`.
  - Shipping uses `affectsShipping` and the prior-day shipping block when `shippingClosedFromEnabled` is enabled.

### `src/pages/settings.js`

설정 화면.

v26 / Phase 2a:
- Settings sections are rendered as collapsible `details.settings-section` cards and default to collapsed.
- Closing flags, menu staff groups, system values, and holiday management are now present in the settings UI.
- Holiday management:
  - Auto-imports generated Korean public holiday data for 2025-2027 from `src/services/holidayMaster.js`.
  - Existing docs are not overwritten during auto import.
  - Company holiday range create/edit/delete is available to admin/office. Delete is soft delete through `status: 'deleted'`.
  - Holiday fields include `affectsProduction`, `affectsShipping`, and `shippingClosedFromEnabled`.
  - Holiday changes write `activityLogs` with `action: 'holiday'`.
- Holiday form layout note:
  - The generic `.cell-input` class is table-oriented. `src/style.css` intentionally overrides `.holiday-field .cell-input` so date/text inputs render as normal form controls inside the holiday form only.
  - Keep `.holiday-form-fields` as the single grid wrapper for the four inputs: start date, end date, holiday name, memo.

v28 / 5th bundle E-7:
- Settings has a `생산지시서 카테고리 순서` section.
- The section renders five draggable items: `rawCat`, `rawDog`, `freezeCat`, `freezeDog`, `freezeCommon`.
- Sort order is stored at `settings/copySheetOrder` with `{ order, updatedAt, updatedBy }`.
- Firestore rules did not need a new match block because existing `settings/{settingId}` writer rules cover this document.

packs-per-plate (판당 팩수):
- Cat/dog packs-per-plate live in `settings/systemValues` as `packsPerPlateCat`/`packsPerPlateDog` (SYSTEM_VALUE_FIELDS, integer, default null), shown inside the 시스템 설정값 section. Plate→pack is raw-only (호두 2026-05-21), so no common value. Consumed by the raw product-receipt modal (`openProductReceiptModal`, main.js) to convert 판수 → 팩/박스. (Earlier a separate `settings/productConversion` doc/section held these; moved into systemValues 2026-05-23.)

묶음 c:
- spec_v20 기준으로 settings 메뉴는 production에게 보이게 유지.
- production이 메뉴 클릭 시 `layout.js`에서 alert 후 진입 차단.
- `renderSettings()` 내부에서도 production 즉시 차단.
- 해당 추가/삭제 버튼과 이벤트 바인딩은 admin/office일 때만 활성화.

주의:
- Older notes saying closingFlags/menu-staff/system settings UI is missing are obsolete as of v26.

### `src/pages/egg.js`

계란 재고.

묶음 a:
- 현재 재고 카드에 FIFO 용량 보기 토글 추가.
- 기본 상태는 닫힘. 새로고침 후 닫힘.
- 펼치면 `eggLogs` 전체를 timestamp 오름차순으로 재생해 FIFO 가용 용량 표시.
- 같은 날짜 입고도 각 로그를 별도 lot으로 표시.
- `type === 'in'`: 입고 lot 생성.
- `type === 'out'`: 오래된 lot부터 차감.
- `type === 'adjust' && qty < 0`: 오래된 lot부터 차감.
- `type === 'adjust' && qty > 0`: "조정" lot으로 별도 표시.
- FIFO 분해 합계가 `eggStock/global.currentQty`와 다르면 경고 표시.
- 입고 lot보다 먼저 기록된 출고/감소가 있으면 배분 불가 수량 표시.
- 이력 테이블은 기존처럼 최근 50건만 표시하되, FIFO 계산은 전체 로그를 사용.

### `src/style.css`

통계 스타일 포함.

v26 / Phase 2a:
- Settings accordion styles:
  - `.settings-section`
  - `.settings-section-summary`
  - `.settings-section-toggle`
  - `.settings-section-body`
- Holiday settings styles:
  - `.holiday-import-row`
  - `.holiday-form`
  - `.holiday-form-fields`
  - `.holiday-field`
  - `.holiday-form-actions`
  - `.holiday-options`
  - `.holiday-check`
  - `.holiday-list`
  - `.holiday-item`
  - `.holiday-date`
  - `.holiday-label`
  - `.holiday-flags`
  - `.btn-edit-holiday`
  - `.btn-del-holiday`
- Production holiday display styles:
  - `.holiday-badge`
  - `.holiday-badge-weekend`
  - `.holiday-badge-registered`
  - `.holiday-month-list`
- Important CSS note: `.cell-input` is a shared table-cell class. Holiday form inputs must be styled through `.holiday-field .cell-input` to avoid inheriting transparent table-cell input behavior.

묶음 7B:
- `.stats-recipe-toggles`
- `.stats-recipe-chip`
- `.stats-chart-canvas-wrap`

묶음 7F-2:
- `.stats-expected-tag`
- `.stats-expected-note`
- `.stats-download-btn-all`

묶음 a:
- `.egg-fifo-toggle`
- `.egg-fifo-panel`
- `.egg-fifo-row`
- `.egg-fifo-warning`

## Firestore Schema Notes

### `holidays/{YYYY-MM-DD}`

New in v26 / Phase 2a.

Effective holiday behavior is built from static `holidayMaster.js` data plus Firestore `holidays`. Firestore docs override static rows for the same date. A Firestore doc with `status: 'deleted'` removes that date from the effective cache.

```js
{
  date: 'YYYY-MM-DD',
  title: '어린이날',
  label: '어린이날',
  description: '',
  holidayType: 'publicHoliday' | 'internalOff',
  affectsProduction: true,
  affectsShipping: true,
  shippingClosedFromEnabled: true,
  isAutoGenerated: true,
  recurrenceRule: null,
  status: 'active' | 'deleted',
  source: 'KASI_SPECIAL_DAY_API',
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
}
```

Notes:
- Auto-import does not overwrite existing docs.
- Company holiday range registration creates one doc per date.
- Delete from settings is soft delete (`status: 'deleted'`).
- Smoke tests passed for auto import, range create/edit/delete, incoming schedule adjustment, and production holiday badge.

### `settings/closingFlags`

묶음 b에서 읽기 로직 추가. 문서 없으면 전부 ON.

```js
{
  blockTomorrowProd: true,
  blockFrozenOrder: true,
  blockScheduleDue: true,
  blockAutoRepack: true,
  blockProdLog: true,
  blockOfficeLog: true,
  blockEggOut: true,
  warnNoTomorrowProd: true,
  warnBagMin: true,
  warnMeatMin: true,
  warnSupplementMin: true,
}
```

주의:
- v26 settings UI can edit these flags.
- Missing fields still use default ON semantics.

### `settings/systemValues`

Newer settings UI stores production/system constants here. Current values were validation/seed-time values; clean before final operation seed if needed.

### `settings/menuStaffGroups`

Newer settings UI stores which staff groups are exposed per menu. Each menu must expose at least one staff group.

### `eggLogs`

계란 입고/출고/수동조정 로그.

```js
{
  date: string,
  timestamp: Timestamp,
  type: 'in' | 'out' | 'adjust',
  qty: number, // 부호 포함. 출고/감소는 음수.
  before: number,
  after: number,
  staffName: string,
  note?: string,
  reason?: string,
}
```

묶음 a FIFO 표시:
- `timestamp` 기준 시간순 재생.
- 플러스 조정은 별도 조정 lot.
- 마이너스 조정은 FIFO 차감.

### `meatTypes`

추가 필드:

```js
showInStats: boolean
category: 'meat' | 'produce'
```

의미:
- `true`: 통계 탭 원료 소모량에 표시
- `false`: 통계 탭 원료 소모량에서 제외
- 필드 없음: `true`로 처리
- category: 메인 원육 출고 목록 정렬용 구분. produce는 야채/과일 그룹으로 표시하고, 필드가 없으면 meat로 처리.

신규 원육:
- `showInStats: true`로 저장

### `bagTypes`

사용 필드:

```js
piecesPerBox: number
```

의미:
- 봉투 소모량 통계에서 이 값으로 박스 단위 환산.
- `0`, `null`, 필드 없음이면 박스 변환 불가.
- 변환 불가 봉투는 화면/Excel에서 별표 표시하고 총 장수만 표시.

주의:
- `bagLogs`에는 `piecesPerBox` 스냅샷이 없음.
- 현재 `bagTypes` 값을 사용해 과거 로그까지 환산함.

### `recipes.unitPresets`

New in spec_v24.

```js
unitPresets: number[]
```

Notes:
- Empty array is allowed and is the safe default for existing recipes.
- Existing docs may have no field; code reads missing/non-array as `[]`.
- Production save is blocked when the selected recipe has no presets.
- Each preset creates one supplement SKU with deterministic id `${recipeId}_${unit}`.

### `recipes.productionMethods`

New in v26 / Phase 2b. Raw recipes only.

```js
productionMethods: [
  {
    methodKey: 'rotary' | 'manual',
    label: string,
    unitToBox: number,
    effectiveDate: string, // YYYY-MM-DD
    active: boolean,
  }
]
```

Notes:
- Existing docs may have no field; code reads missing/non-array as `[]`.
- Production save for raw recipes is blocked when there is no active method.
- Freeze-dry recipes hide the conversion UI.

### `recipes/{recipeId}/conversionHistory/{auto-id}`

New in v26 / Phase 2b. Manual conversion change history.

```js
{
  methodKey: 'rotary' | 'manual',
  unitToBox: number,
  prevUnitToBox: number | null,
  effectiveDate: string,
  reason: 'manual' | 'autoSuggested',
  basedOnAvgOfRecent5: boolean,
  createdAt: Timestamp,
  createdBy: string | null,
}
```

Notes:
- Phase 2b only writes `reason: 'manual'` and `basedOnAvgOfRecent5: false`.
- Production input combines current `productionMethods` with history and applies the latest `effectiveDate <= productionDate`.
- Firestore rules include this nested subcollection under `recipes/{recipeId}`.

### `productions` conversion snapshot fields

New in v26 / Phase 2b for raw productions.

```js
methodKey: 'rotary' | 'manual',
expectedBox: number,
actualBox: number | null,
appliedUnitToBox: number,
```

Notes:
- `expectedBox` is cached at save time with one decimal of precision.
- `actualBox` is optional but must be an integer when entered.
- `appliedUnitToBox` snapshots the conversion value so later recipe changes do not recalculate existing production cards.
- `rawBoxQty` remains in place as the pack-weight based theoretical box count.

### `productions` product-receipt fields

New in spec_v27 P2 (raw product receipt). Written by `openProductReceiptModal` (main.js) when a completed raw card records actual produced quantity.

```js
received: true,
receivedMethod: string | null,    // recipe productionMethods methodKey, record-only
receivedPlates: number,           // 판수 (required)
receivedLoosePacks: number,       // 낱개 (자투리 팩), default 0
receivedTotalPacks: number,       // plates * packsPerPlate + loosePacks
receivedBox: number,              // floor(totalPacks / 20)   (1 box = 20 packs)
receivedRemainder: number,        // totalPacks % 20
receivedRevision: number,         // +1 on each re-receipt; drives the outbox revision
receivedAt: Timestamp,
updatedAt: Timestamp,
```

Notes:
- `packsPerPlate` comes from `settings/systemValues` (`packsPerPlateCat` / `packsPerPlateDog`); raw-only, so cat/dog are independent. If the relevant value is missing/≤0 the modal alerts and aborts.
- Re-recording an already-received card bumps `receivedRevision`; the same revision is used in the outbox doc id, so a re-receipt is a new `productTransferRequests` doc (not an edit).
- Written together with the outbox doc in a single `writeBatch` (atomic).
- `category !== 'raw'` cards are not handled by this modal (freezeDry receipt = Phase 3).

### `supplementTypes/{recipeId_unit}`

New in spec_v24. Supplement SKU master, generated from recipe presets.

```js
{
  id: string,                 // same as doc id, `${recipeId}_${unit}`
  recipeId: string,
  recipeName: string,
  unit: number,
  name: string,               // `${recipeName} ${unit}...supplement`
  active: boolean,            // follows recipe active state
  sortOrder: number,          // recipe.sortOrder * 100 + unit index
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string | null,
  updatedBy: string | null,
}
```

Notes:
- Operators do not create/delete these directly. Recipe `unitPresets` controls lifecycle.
- Inactive SKUs remain visible in the supplement page but are excluded from stock-in/manual-adjust dropdowns.

### `supplementStock/{recipeId_unit}`

New in spec_v24. Current supplement stock, one doc per supplement SKU.

```js
{
  id: string,
  supplementTypeId: string,
  currentQty: number,         // bags, non-negative
  updatedAt: Timestamp,
}
```

Notes:
- Created with `currentQty: 0` when a SKU is created.
- Production save deducts 1 bag immediately.
- Stock-in/manual-adjust/update/delete paths update this in transactions.

### `supplementLogs/{auto-id}`

New in spec_v24. Supplement stock movement history.

```js
{
  date: string,               // YYYY-MM-DD KST
  timestamp: Timestamp,
  supplementTypeId: string,
  type: 'in' | 'autoDeduct' | 'adjust',
  qty: number,                // signed. autoDeduct can be -1 deduct or +1 refund
  before: number,
  after: number,
  staffName: string,
  reason?: string,
  note?: string,
  relatedProductionId?: string,
}
```

Notes:
- Production save/edit/delete uses `relatedProductionId` for net refund/deduct tracking.
- Recipe preset removal deletes the SKU, stock doc, and matching supplement logs after warning/confirmation.

### `productTransferRequests/{idempotencyKey}`

New in spec_v27 P2. Cross-app outbox: the production app append-only writes finished-product receipts here; the inventory app reads/processes them into its own finished-product stock. The production app never writes inventory-owned collections directly (decouples the two apps, avoids double-receipt). Contract: `docs/fantapet_crossapp_request_product_transfer_2026-05-21.md`.

Doc id = `idempotencyKey` (deterministic). Written by `openProductReceiptModal` (main.js) in the same `writeBatch` as the `productions` receipt update.

```js
{
  idempotencyKey: string,            // = doc id = `${sourceCollection}:${sourceId}:${revision}`
  sourceApp: 'production',
  sourceCollection: 'productions',   // currently raw only; 'frozenProducts' reserved for Phase 3
  sourceId: string,                  // productions/{id}
  eventType: 'productReceipt',
  revision: number,                  // = productions.receivedRevision; re-receipt = new doc, not edit
  supersedesRevision: number | null, // revision-1 when revision>1, else null (최초 입고)
  status: 'pending',                 // production writes 'pending'; inventory updates to processed/rejected
  category: 'raw',
  recipeId: string,
  recipeName: string,                // snapshot
  target: 'cat' | 'dog' | '',
  plates: number,                    // 판수
  packs: number,                     // 총 팩수 = plates * packsPerPlate + loosePacks
  boxes: number,                     // floor(packs / 10) / 2 — 0.5박스 단위(10팩=0.5박스), 분수 가능
  remainderPacks: number,            // packs % 10 — 남은 <10팩만 낱개
  producedDate: string,              // p.date, 'YYYY-MM-DD'
  staff: string,                     // p.staffName
  createdAt: Timestamp,
}
```

Notes:
- Idempotency model: same `idempotencyKey` cannot be re-created; the inventory side reflects only the **latest revision per `sourceId`** (overwrite, not diff). Guards retries / double-click / card re-edit against double receipt.
- Rules (`firestore.rules`): `read` = production or inventory app; `create` = `isProductionWriter()` (admin/office); `update` = inventory app only (sets processed/rejected, etc.); `delete` = `false`.
- **Not yet written** (contract §2.1 proposed but freezeDry receipt is Phase 3): `frozenProductId`, `quantity`. Current code only emits raw fields above.
- The production app does not poll/subscribe this collection — it is write-only here. Inventory choice of polling vs `onSnapshot` is the inventory app's concern.

## Stats Tab Behavior

### 탭 1: 생산량

- `productions.status === 'active'`만 포함.
- 레시피별 꺾은선 차트.
- 레시피 체크박스로 라인 표시/숨김.
- 신규 레시피는 자동 ON.
- 0인 기간도 X축에 표시하고 0으로 연결.

### 탭 2: 원료 소모량

- `productions.ingredientsSnapshot` 기준.
- g 단위 저장값을 kg로 변환해 표시.
- `meatTypes.showInStats === false` 원료는 제외.
- `autoDeductInventory === false` 원료는 `예상` / `예상 사용량 (재고 차감 없음)` 라벨 표시.
- 한 원료가 여러 레시피에서 서로 다른 `autoDeductInventory` 값을 가지면 한 번이라도 `false`인 경우 예상 사용량으로 표시.

### 탭 3: 봉투 소모량

- `bagLogs.type`이 `autoDeduct` 또는 `autoDeductReverse`인 로그만 포함.
- `abs(net)` 기준.
- 수동조정 제외.
- 차트 Y축은 박스 단위 소수.
- 툴팁과 테이블은 `50박스 27장 (5,027장)` 형식.
- 합계 박스는 `박스 환산 합계: N박스 / 총 N장` 형식.
- `piecesPerBox` 미설정 봉투는 별표 표시.

### 탭 4: 계란 사용량

- `eggLogs.type === 'out'`만 포함.
- 단일 꺾은선 차트.
- 단위는 개.

### 탭 5: 일별 생산 현황

- 차트 없음. 테이블 전용.
- 생식: `productions.category === 'raw'`
- 동결건조: `frozenLogs.status === 'active'`
- `(date, type, name)` 키로 같은 날 같은 제품은 합산.

### 탭 6: 영양제
- Chart 없음. Table 중심.
- `supplementLogs.type === 'in'` 입고 합계.
- `supplementLogs.type === 'autoDeduct'` 사용량은 net 계산: 차감(-1)은 사용량 증가, 반환(+1)은 사용량 차감.
- `supplementLogs.type === 'adjust'` 수동조정은 signed sum.
- `supplementStock.currentQty`는 기간과 무관한 현재값.
- 기본은 active SKU만 표시하고, inactive 포함 토글로 과거 SKU까지 볼 수 있음.
- 정렬은 `supplementTypes.sortOrder` 오름차순.

## Excel Download

### 개별 다운로드

- 버튼: `Excel 다운로드`
- 활성 탭 1개만 다운로드.
- 파일명:

```text
통계_{탭이름}_{시작일}~{종료일}.xlsx
```

### 전체 다운로드

- 버튼: `전체 Excel 다운로드`
- 클릭 시 6탭 전체 데이터를 새로 쿼리.
- 1개 파일에 6개 시트 생성.
- 빈 탭도 `데이터 없음` 시트 포함.
- 파일명:

```text
Fantapet_통계_{시작일}~{종료일}.xlsx
```

시트:
- 생산량
- 원료 소모량
- 봉투 소모량
- 계란 사용량
- 일별 생산 현황
- 영양제

## Verification Done

- Work A:
  - `npm.cmd run build` passed.
  - Confirmed `recipe.js` emits `action: 'recipe'`, `subAction: 'activeToggle'` and `main.js` now classifies it as office log.
- Phase 1 third bundle / spec_v24 supplement units:
  - Unit 1: `recipes.unitPresets` chip UI and schema path verified.
  - Unit 2: production unit preset select and empty-preset save blocking verified.
  - Unit 3: supplement collections added to wipe whitelist and Firestore schema notes.
  - Unit 3.5: recipe active-toggle activity log added.
  - Units 4-7: supplement SKU sync, stock page, stock-in, manual adjust verified.
  - Units 8-9: production save/edit/delete supplement deduct/refund transaction paths verified.
  - Unit 9.5: supplement helper extraction verified.
  - Units 10-11: closing warning and daily auto alert integration verified.
  - Unit 12: supplement stats tab and Excel 6th sheet verified.
  - `npm.cmd run build` passed at each relevant bundle point. Expected warnings remain chunk size and ineffective dynamic import warnings.

- 묶음 b:
  - `npm.cmd run build` 통과.
  - B1 마감 차단/경고 코드 구현 완료.
  - B2 내일생산불러오기 차단 5조건 코드 진단 통과.
  - B3 최소재고 자동 발행 매일 1회 결정적 doc id 패턴 진단 통과.
  - B4 schedule/frozenSep spec gap 항목 진단 통과.
  - B4-6-4 입고예정 수정 기능 추가 후 build 통과.
- 묶음 c:
  - `npm.cmd run build` 통과.
  - 권한 매트릭스 DOM 제거 등 9파일 적용.
  - static grep으로 주요 버튼 조건부 렌더 확인.
  - `frozenPan.js` 발주 삭제/취소 정책 spec 13번 확인.
  - settings 해당 이벤트 권한 가드 보정 후 build 통과.
- 묶음 a:
  - `npm.cmd run build` 통과.
  - 계란 FIFO 용량 표시 구현.
  - 실제 브라우저 클릭 검증은 묶음 e로 이월.
- 묶음 9 권한/자동 재포장:
  - `npm.cmd run build` 통과.
  - 자동 재포장 trigger 로그 후 확인 모달 표시 검증.
  - 개수 입력 시 g 자동 표시 및 차이 표시 검증.
  - 차이 없음 시 trigger ack만 처리, lot 용량 변경 없음 검증.
  - 차이 있음 시 lot remaining 보정 및 `autoRepack:diff` 로그 발행 검증.
  - diff 로그 빨간 줄 확인 필수 표시 검증.
  - 0개 입력 시 confirm 후 lot `remaining: 0`, `closed: true` 검증.
  - 취소 시 미확인 상태 유지 검증.
  - 자동 재포장 미확인 상태에서 내일생산불러오기 차단 검증.
  - qc/office 계정에서 내일생산불러오기 및 마감 권한 차단 제거 확인.
  - qc 계정에서 원육 입고 등록 모달 진입 및 실제 저장 가능 확인.
  - 테스트용 `meatStocks` / `meatLogs` 문서들 삭제 완료. 삭제 불가한 테스트 `activityLogs`는 acknowledged 처리.
- `npm.cmd run build` 통과.
- 브라우저에서 확인:
  - 통계 화면 진입
  - 전체 다운로드 버튼 표시
  - 통계 별표 안내 표시
  - 예상 라벨 표시
  - 합계 `박스 환산 합계: 28박스 / 총 143,250장` 표시
  - 개별 탭 박스+장 표시 유지
  - 원육 종류 관리 모달 `통계 표시` 체크박스 표시

Build warnings:
- chunk size warning
- ineffective dynamic import warning
- 현재 빌드 실패 원인은 아님.

## Follow-Up Candidates

Phase 1 notes:
- B/codebase update for supplement units and Work A is complete.
- D-1/D-2/D-3 settings UI work is complete as of v26: closing flags, menu staff groups, and system values are editable in settings.
- E-2~E-7 drag-sort master ordering (bag, frozen product, meat type, recipe lists, production cards, copy-sheet category) is COMPLETE as of the 4th/5th bundles (see Current Status). Supplement SKU ordering remains derived from recipe order and unit preset order; no separate supplement drag-sort UI.

Next implementation candidate:
- Phase 2b conversion table work (spec_v26 §2-1~2-4) is COMPLETE. Next is Phase 2c (in-app wipe, conversion-difference recommendations/stats, planned production).

Operational discoveries to carry into spec_v25:
- `productions` delete is soft-delete (`status: 'deleted'`), not hard delete.
- `activityLogs` delete is blocked by Firestore Rules; cleanup/archival policy is still needed.
- Repo-local `firestore.rules`, `firebase.json`, `.firebaserc`, and `.github/workflows/firebase-rules.yml` are now present as of v26. Rules deploy workflow needs GitHub secret `FIREBASE_RULES_SERVICE_ACCOUNT`; if the secret is absent, rules workflow will fail on the next rules change.
- `minStock:alert` deterministic id is per-item/per-SKU using `auto_minStock_alert_{date}_{dedupKey}`.
- Supplement display name format is recipe name plus unit plus supplement label; no separate unit-name text.
- Supplement delete/refund net calculation depends on `supplementLogs.relatedProductionId`.
- Closing warnings are only shown after blockers are clear; standalone warning modal can be verified through direct `openBlockingModal({ variant: 'warning' })`.
- Seed should start from a clean wipe because unit 12 validation left supplement test residue.

Before launch:
- Staff seed input through the UI using `fantapet_seed_checklist.md`; timing is flexible because this is the test/pre-inventory-linkage environment.
- Seed order: meat types, bag types, frozen products, recipes/additional mappings, holidays/settings, initial stock.
- Reconnect preserved raw recipe bag mapping after bagTypes are seeded again.
- Decide whether dog recipes are needed for launch.
- Normalize preserved recipe naming if needed.
- Korean public holidays for 2025-2027 are already imported and should be treated as operating data, not test residue. Add company-specific holidays through settings as needed.
- Change exposed test passwords for `alice`, `admin@`, and `qc@` only at final real-operation start.
- Keep `backup_pre_wipe_20260512_093907` outside git for about one month after launch.

Next work bundles before real operations:
- C-2 / C-3 follow-up work after the B-1/B-2/B-3 small-fix bundle.
- Phase 2b: conversion table work from spec_v26 §2-1~2-4.
- Later Phase 2c: in-app wipe, conversion-difference recommendations/stats, planned production management, and any forecast collection alignment.
- Inventory-app linkage bundle.
- spec_v23: fix the meaning of decision 4 and define "operations start" as simultaneous production-management and inventory-app launch.

First operation week natural validation after the simultaneous launch:
- Auto repack full cycle and confirmation modal.
- Incoming schedule create/edit/complete/cancel cycle.
- Frozen pan order/confirm/cancel/delete cycle.
- Frozen separation receive/separate/outgoing cycle.
- Tray to frozen pan to tender frozen incoming cycle.
- Tomorrow production load full cycle and cancel flow.
- Excel downloads from a normal Chrome/Edge browser.
- Closing and tomorrow-load message consistency with real data.

Post-launch fix candidates:
- Add settings UI for closingFlags and other system toggles if operations need it.
- Later spec_v23: main card click production-input modal and inventory-app linkage bundle after production-management standalone validation.

## Permission Matrix Decisions

2026-05-11/12 operational decisions:

| # | Item | Decision |
|---|---|---|
| 1 | Tomorrow production load cancel | All accounts may use it; reason, staff, and manual log required. |
| 2 | Closing / reopen closing | All accounts may use it; reason, staff, and manual log required. |
| 3 | Tomorrow production load | All accounts may use it. |
| 4 | Preprocess / repack lot delete | Production may use it for lot-only deletion. |
| 5 | Calendar event create/edit/delete | Admin/office only. |
| 6 | Auto repack confirmation modal | Admin/production may use it; office is blocked. |
| 7 | Unauthorized operation UI | Remove the button/control from the DOM. |
| 8 | Recipe delete | Removed; use active/inactive instead. |
| 9 | Meat incoming log | All accounts may use it. |
| 10 | Manual adjustments D1-D5 | All accounts may use it; reason and staff required. |
| 11 | Bread tray / tender frozen incoming | All accounts may use it. |
| 12 | Separation receive/separate/outgoing | All accounts may use it. |
| 13 | Stats / Excel / Settings menu | Admin/office only. |
| 14 | Frozen product incoming edit/delete | Admin/office only. |
| 15 | Frozen pan order cancel | Admin/office only. |
| 16 | Incoming schedule cancel | Admin/office only. |
| 17 | Main refresh button | Admin/office only. |
| 18 | Production card save/edit/delete | Admin/office only. |
| 19 | Incoming schedule registration | Admin/office only. |
| 20 | Master data B1-B6 | Admin/office only; use active/inactive instead of destructive delete. |
| 21 | Supplement stock incoming / manual adjust | All accounts may use it; manual adjust requires reason and staff. |
| 22 | Recipe unit preset management | Admin/office only through recipe management. |

## Inventory App Linkage Decisions

Separate-topic decisions:

| Decision | Content |
|---|---|
| Decision 4 | Production management app launches standalone first. Inventory-app linkage is a separate post-launch bundle. |
| Decision 7 | Start with option 1: manual handoff. During operations, observe frequency and decide whether to systematize option 2 later. |

spec_v22 note:
- Main card click should open a production-input modal split into raw, raw-frozen, and tender-frozen branches.
- Plan this together with the inventory-app linkage bundle.
- Start after 1-2 weeks of stable operations.
