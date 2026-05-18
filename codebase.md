# Fantapet Management Codebase Notes

Last updated: 2026-05-18

## Current Status

- 2026-05-18 v26 / Phase 2b implementation:
  - Added raw recipe `productionMethods` editing in `src/pages/recipe.js` and nested `recipes/{recipeId}/conversionHistory` writes for manual unit-to-box changes.
  - Manual conversion edits write `activityLogs` with `action: 'conversion'`, `subAction: 'manualEdit'`; office-log classification now includes `conversion`.
  - Production input now blocks raw recipes with no active conversion method, calculates `expectedBox` from the production date's applicable conversion value, accepts optional integer `actualBox`, and stores `methodKey`, `expectedBox`, `actualBox`, and `appliedUnitToBox`.
  - Production input keeps spec_v26 date-effective fallback behavior and shows a yellow notice when the current method value starts after the production date and an older conversion value is being used.
  - When multiple conversionHistory rows share the same effectiveDate, production now chooses the newest createdAt row so same-day manual corrections resolve to the latest value.
  - Existing raw `rawBoxQty` remains unchanged and continues to represent the pack-weight based theoretical box count.
  - Firestore rules now allow the nested `recipes/{recipeId}/conversionHistory/{historyId}` subcollection.
  - Phase 2c remains out of scope: automatic suggestions, 2-step conversion modal, and stats tab 7.

- 2026-05-16 v26 / Phase 2a closeout:
  - Phase 2a holiday-master code and public deploy are complete. Latest relevant commits: `875bb03` holiday data, `7287287` expiry notice, `c21b70f` holiday-aware business-day helpers, `959f9cb` holiday settings UI, `d740010` production business-day wiring, `64befa2` shipping business-day schedule adjustment, `4e01cae` production-impact holiday badge.
  - Firestore Rules + Custom Claims work is complete (`9ee0517`, `9c8c7d8`). Three accounts have custom claims: `alice@fantapet.com` admin, `admin@fantapet.com` office, `qc@fantapet.com` production; all include `app: ['inventory', 'production']`.
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
  - Current next work: Phase 2b conversion table work from spec_v26 §2-1~2-4.

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
  - C-3 mojibake sweep completed with no source changes needed. `src/**/*.js/html/css` had 0 hits for representative mojibake/BOM/NFD patterns (`창`, `횄`, `占?, `\u00`, `\xc3`, `챦쨩쩔`, Hangul Jamo range). The only dist hit is inside bundled xlsx/SheetJS internals and has no UI impact. Past `meat.js` mojibake found during 7F-2 was already restored.
  - Removed the user-visible frozen-pan placeholder button: the unimplemented `?숆껐??lot ?붾웾` `+ ?섎룞 議곗젙` button and its "異뷀썑 異붽? ?덉젙" alert were removed. Bread-pan manual adjustment remains implemented and unchanged.
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
- 臾띠쓬 b ?꾨즺.
  - B1: 留덇컧 李⑤떒 4/5/6 諛?寃쎄퀬 1/2/3 異붽?.
  - B1: `settings/closingFlags` ?쎄린 異붽?. 臾몄꽌 ?놁쑝硫??꾨? ON.
  - B1: 李⑤떒 0嫄?+ 寃쎄퀬留??덉쓣 ??"洹몃옒??留덇컧?" ?뺤씤 ??留덇컧 吏꾪뻾 遺꾧린 異붽?.
  - B2: ?댁씪?앹궛遺덈윭?ㅺ린 李⑤떒 5議곌굔 湲곗〈 援ы쁽 吏꾨떒 ?듦낵.
  - B3: 怨꾨?/遊됲닾/?먯쑁 理쒖냼?ш퀬 ?먮룞 諛쒗뻾 留ㅼ씪 1??寃곗젙??doc id ?⑦꽩 ?뺤씤.
  - B4: ?낃퀬?덉젙 以묐났 李⑤떒/?⑥쐞 ?쒗븳/?뺣젹 諛?frozenSep ?먮룞 寃곗젙/?먮룞 異붿젙 吏꾨떒 ?듦낵.
  - B4-6-4: ?낃퀬?덉젙 ?섏젙 踰꾪듉/?섏젙 紐⑤떖/留덇컧 媛??異붽?.
- 臾띠쓬 c ?꾨즺.
  - 沅뚰븳 留ㅽ듃由?뒪 猷?B/C ???踰꾪듉 DOM ?쒓굅 1李??곸슜.
  - production?먯꽌 ?④꺼???섎뒗 踰꾪듉? ?뚮뜑 ?④퀎?먯꽌 ?쒓굅.
  - ?⑥닔 ?대? 沅뚰븳 泥댄겕???댁쨷 ?덉쟾留앹쑝濡??좎?.
  - settings 硫붾돱??production?먭쾶 蹂댁씠吏留??대┃ ??alert ??吏꾩엯 李⑤떒.
  - settings ?대떦???대깽??諛붿씤?⑹? admin/office???뚮쭔 ?ㅽ뻾?섎룄濡?蹂댁젙.
- 臾띠쓬 a ?꾨즺.
  - 怨꾨? ?꾩옱 ?ш퀬 移대뱶??FIFO 媛???붾웾 ?쇱묠/?묓옒 ?쒖떆 異붽?.
  - `eggLogs` ?꾩껜瑜?timestamp ?쒓컙?쒖쑝濡??ъ깮??lot蹂??붾웾 怨꾩궛.
  - FIFO 遺꾪빐 ?⑷퀎? `eggStock/global.currentQty` ?뺥빀??寃쎄퀬 ?쒖떆.
- 臾띠쓬 9 沅뚰븳 留ㅽ듃由?뒪 1李??먭?/?뺣━ ?꾨즺.
- 臾띠쓬 9 #9 ?먮룞 ?ы룷???뺤씤 紐⑤떖 諛?李⑥씠 泥섎━ ?댁쁺 寃利??꾨즺.
- ?댁씪?앹궛遺덈윭?ㅺ린 / 留덇컧 / 留덇컧?댁젣 沅뚰븳 ?뺤콉???댁쁺??寃곗젙??留욊쾶 議곗젙??
- ?덉떆????젣 湲곕뒫? spec??留욎떠 ?꾩쟾 ?쒓굅?? ?덉떆?쇰뒗 ?쒖꽦/鍮꾪솢???좉?留??ъ슜.
- ?먯쑁 ?낃퀬 ?깅줉? ?꾩옣 ?묒뾽?쇰줈 ?먮떒?섏뿬 production??媛?ν븯寃?蹂寃쎈맖.
- 臾띠쓬 7 ?듦퀎 湲곕뒫 ?꾨즺.
- ?듦퀎 ?섏씠吏??5媛???쑝濡?援ъ꽦??
  - ?앹궛??
  - ?먮즺 ?뚮え??
  - 遊됲닾 ?뚮え??
  - 怨꾨? ?ъ슜??
  - ?쇰퀎 ?앹궛 ?꾪솴
- 영양제
- 李⑦듃 4醫??곸슜 ?꾨즺.
  - ?앹궛?? ?덉떆?쇰퀎 爰얠???
  - ?먮즺 ?뚮え?? ?먮즺蹂?爰얠???
  - 遊됲닾 ?뚮え?? 遊됲닾蹂?stacked 留됰?
  - 怨꾨? ?ъ슜?? ?⑥씪 爰얠???
- Excel ?ㅼ슫濡쒕뱶 ?꾨즺.
  - ?쒖꽦 ??媛쒕퀎 ?ㅼ슫濡쒕뱶
  - 6???꾩껜 ?쇨큵 ?ㅼ슫濡쒕뱶

## New Dependencies

- `chart.js`
  - ?듦퀎 李⑦듃 ?뚮뜑留?
  - `Chart.register(...registerables)` ?ъ슜.
- `xlsx`
  - Excel ?뚯씪 ?앹꽦 諛??ㅼ슫濡쒕뱶.
- `firebase-admin`
  - Dev dependency for `scripts/setCustomClaims.mjs`.
- `gh-pages`
  - Dev dependency for publishing Vite `dist` to GitHub Pages.

## Scripts / Config

### `firestore.rules`

New in v26.

- Implements role/app-claim based access using Firebase Auth custom claims.
- `activityLogs` update is limited to acknowledged-related fields; full arbitrary updates remain blocked.
- `bagLogs` delete is allowed for admin and office because bag delete cascade needs it.
- Rules are deployed manually or by the GitHub Actions workflow when the required secret is present.

### `scripts/setCustomClaims.mjs`

New in v26.

- Admin SDK script for assigning role/app claims to the three operating accounts.
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

硫붿씤 ?붾㈃, ?댁씪?앹궛遺덈윭?ㅺ린, ?앹궛 濡쒓렇, 罹섎┛?? 留덇컧 愿???먮쫫.

臾띠쓬 9 #9:
- ?먮룞 ?ы룷??trigger 濡쒓렇 ?뺤씤 ???꾩슜 紐⑤떖 ?쒖떆.
- ?ㅼ젣 ?ы룷??媛쒖닔 ?낅젰 ??g ?섏궛 諛??쒖뒪???섎웾怨?李⑥씠 ?쒖떆.
- 李⑥씠 ?놁쓬: trigger 濡쒓렇 ack留?泥섎━?섍퀬 lot ?붾웾? 蹂寃쏀븯吏 ?딆쓬.
- 李⑥씠 ?덉쓬: `meatStocks/{repackedStockId}.remaining` 蹂댁젙 ??`activityLogs`??`autoRepack:diff` 濡쒓렇 諛쒗뻾.
- 0媛??낅젰: ?뺤씤 ?앹뾽 ??lot `remaining: 0`, `closed: true` 泥섎━.
- `autoRepack:diff`???뺤씤 ?꾩닔 濡쒓렇濡??쒖떆.
- ?댁씪?앹궛遺덈윭?ㅺ린 李⑤떒 5議곌굔 #4???먮룞 ?ы룷??誘명솗??濡쒓렇 ?ы븿.

沅뚰븳 蹂寃?
- ?댁씪?앹궛遺덈윭?ㅺ린: ?꾩껜 怨꾩젙 媛??
- ?댁씪?앹궛遺덈윭?ㅺ린 痍⑥냼: ?꾩껜 怨꾩젙 媛?? ?ъ쑀/?대떦???쒕룞 濡쒓렇???좎?.
- 硫붿씤 ?덈줈怨좎묠(`handleRefreshCompletion`): admin/office留?媛?? production 李⑤떒 + DOM ?쒓굅.
- 罹섎┛???대깽???깅줉/?섏젙/??젣: admin/office留?媛??+ production DOM ?쒓굅.

臾띠쓬 b/c:
- ?댁씪?앹궛遺덈윭?ㅺ린 李⑤떒 5議곌굔? `gatherTomorrowLoadBlockers(today)`?먯꽌 ?뺤씤.
- 理쒖냼?ш퀬 ?먮룞 諛쒗뻾? `triggerMinStockLogs(today)` / `ensureAutoLog()`??寃곗젙??doc id濡?留ㅼ씪 1??蹂댁옣.
- `minStock:alert`???쇰컲 ?앹궛/?щТ 濡쒓렇 李⑤떒???ы븿?섏? ?딄퀬 寃쎄퀬 ?꾨떞?쇰줈 泥섎━.

二쇱쓽:
- `activityLogs` ?뚯뒪??濡쒓렇??Firestore rules??delete媛 留됲옄 ???덉쓬. 寃利?以??앹꽦??濡쒓렇???꾩슂 ??acknowledged 泥섎━濡??뺣━.

### `src/layout.js`

留덇컧/留덇컧?댁젣 踰꾪듉 諛??꾩뿭 layout.

沅뚰븳 蹂寃?
- 留덇컧/留덇컧?댁젣 沅뚰븳 泥댄겕 ?쒓굅. ?꾩껜 怨꾩젙 媛??
- 湲곗〈 李⑤떒 議곌굔, ?ъ쑀/?대떦???낅젰, ?쒕룞 濡쒓렇???좎?.
- production??settings 硫붾돱 ?대┃ ??alert ??吏꾩엯 李⑤떒.

臾띠쓬 b:
- 留덇컧 泥댄겕 寃곌낵??`warnings` / `totalWarnings` / `flags`媛 異붽???
- 李⑤떒 ??ぉ???덉쑝硫?湲곗〈 李⑤떒 ?앹뾽?쇰줈 留덇컧 以묐떒.
- 李⑤떒 0嫄?+ 寃쎄퀬留??덉쑝硫??⑥씪 confirm ???대떦???좏깮 紐⑤떖濡?吏꾪뻾.

### `src/services/closingChecks.js`

spec_v24:
- Reads `settings/closingFlags.warnSupplementMin` with default ON semantics.
- Loads `supplementTypes` and `supplementStock`, then passes them to supplement minimum-stock judgment.
- Supplement minimum warnings are warnings only, not closing blockers.

留덇컧 李⑤떒/寃쎄퀬 泥댄겕 Firestore wrapper.

臾띠쓬 b:
- `settings/closingFlags` 臾몄꽌 ?쎄린 異붽?.
- 臾몄꽌媛 ?녾굅???쇰? ?꾨뱶媛 ?놁쑝硫?湲곕낯媛?ON.
- 湲곗〈 諛섑솚 ?꾨뱶瑜??좎??섎㈃??`warnings`, `totalWarnings`, `flags` 異붽?.
- autoRepack 誘명솗??濡쒓렇, ?쇰컲 ?앹궛 濡쒓렇 誘명솗?? ?쇰컲 ?щТ 濡쒓렇 誘명솗?? ?댁씪 ?앹궛 ?놁쓬, 遊됲닾 理쒖냼?ш퀬, ?먯쑁 理쒖냼?ш퀬 ??ぉ??議고쉶.

二쇱쓽:
- B5 ?ㅼ젙 UI???꾩쭅 ?놁쓬. 諛깆뿏???쎄린留?以鍮꾨맖.
- B5 吏꾪뻾 ??理쒖냼?ш퀬 ?먮룞 諛쒗뻾??`warnBagMin` / `warnMeatMin` flag false????skip?섎룄濡??곌껐 ?꾩슂.

### `src/services/closingChecksLogic.js`

spec_v24:
- `DEFAULT_CLOSING_FLAGS` includes `warnSupplementMin: true`.
- `judgeSupplementMinimumStock()` treats active supplement SKUs under 5 bags as warning items.
- Warning slot 4 is supplement minimum stock; it uses the same warning-modal detail pattern as bag/meat minimum warnings.

留덇컧 李⑤떒/寃쎄퀬 ?쒖닔 ?먯젙 濡쒖쭅.

臾띠쓬 b:
- 李⑤떒 4/5/6 諛?寃쎄퀬 1/2/3 ?먯젙 異붽?.
- 李⑤떒 4 autoRepack ?꾩슜 ??ぉ怨?李⑤떒 5 ?쇰컲 ?앹궛 濡쒓렇 ??ぉ 遺꾨━.
- 李⑤떒 5?먯꽌??`autoRepack:trigger`, `autoRepack:diff`, `minStock:alert` ?쒖쇅.
- 李⑤떒 6?먯꽌??`minStock:alert` ?쒖쇅.

### `src/pages/frozenPan.js`

?숆껐??鍮듯뙋 ?ш퀬 諛?諛쒖＜ ?먮쫫.

沅뚰븳 蹂寃?
- 諛쒖＜ 痍⑥냼(`cancelOrder`): admin/office留?媛?? production 李⑤떒.
- ?뺤씤 ?꾨즺??諛쒖＜ 痍⑥냼 踰꾪듉? production?먯꽌 DOM ?쒓굅.
- 鍮듯뙋/?먮뜑?숆껐 ?낃퀬 諛??섎룞議곗젙 怨꾩뿴? production 媛??

spec_v20 13???댁꽍:
- ?뺤씤 ??諛쒖＜?됱쓽 "諛쒖＜ ??젣"???ш퀬 李④컧 ????젣?대ŉ production 媛?μ쑝濡??좎?.
- ?뺤씤 ?꾨즺??諛쒖＜?됱쓽 "諛쒖＜ 痍⑥냼"??ledger 濡ㅻ갚 痍⑥냼?대ŉ admin/office留?媛??

### `src/pages/frozenProduct.js`

?숆껐?쒗뭹 ?낃퀬.

沅뚰븳 蹂寃?
- ?숆껐?쒗뭹 醫낅쪟 master 異붽?/?섏젙: admin/office留?媛?? production DOM ?쒓굅.
- ?숆껐?쒗뭹 ?낃퀬 ?섏젙: admin/office留?媛?? production 李⑤떒.
- ?숆껐?쒗뭹 ?낃퀬 ??젣: admin/office留?媛?? production 李⑤떒.
- ?숆껐?쒗뭹 ?낃퀬 ?섏젙/??젣 踰꾪듉? production?먯꽌 DOM ?쒓굅.

### `src/pages/schedule.js`

?낃퀬 ?덉젙愿由?

v26 / Phase 2a:
- Incoming schedule registration/edit resolves dates through `resolveScheduleBusinessDate(date)`.
- If the selected date is not a shipping business day, `showConfirmModal()` asks whether to change to `getNextBusinessDayByType(date, 'shipping')`.
- Shipping business-day logic considers Sunday plus holidays where `affectsShipping === true`; `shippingClosedFromEnabled === true` also blocks shipping on the preceding day.
- Smoke test passed with `2026-05-17` (Sunday) changing to `2026-05-18`.

臾띠쓬 b:
- 媛숈? ?좎쭨/援щ텇/?덈ぉ 以묐났 ?깅줉 李⑤떒 ?뺤씤.
- ?⑥쐞 ?쒗븳 ?뺤씤.
  - ?먯쑁: g/kg
  - 遊됲닾: ??諛뺤뒪
  - 怨꾨?: 媛???
- ?뺣젹 ?뺤씤: ?좎쭨 ?ㅻ쫫李⑥닚, 媛숈? ?좎쭨??理쒖떊 ?깅줉 ??
- ?낃퀬?덉젙 ?섏젙 踰꾪듉 諛??섏젙 紐⑤떖 異붽?.
  - ?섏젙 ?덉슜: ?덉젙?? ?섎웾, ?⑥쐞, ?대떦?? 硫붾え.
  - 援щ텇/type 諛??덈ぉ/itemId???섏젙 遺덇?.
  - ?섏젙 ??湲곗〈 ?좎쭨? ???좎쭨 以??섎굹?쇰룄 留덇컧?대㈃ 李⑤떒.
  - ?섏젙 ??`activityLogs` 諛쒗뻾.

臾띠쓬 c:
- ?낃퀬?덉젙 ?깅줉/?섏젙/痍⑥냼 踰꾪듉? admin/office留??뚮뜑.
- ?꾨즺 踰꾪듉? 湲곗〈 ?댁쁺 ?먮쫫?濡??좎?.

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

?덉떆??愿由?

沅뚰븳/湲곕뒫 蹂寃?
- ?덉떆????젣 踰꾪듉 ?쒓굅.
- `deleteRecipe()` ?⑥닔 ?쒓굅.
- `deleteDoc` / `showConfirmModal` ??젣 愿??import ?쒓굅.
- spec 7??湲곗?: ?덉떆?쇰뒗 ??젣?섏? ?딄퀬 ?쒖꽦/鍮꾪솢???좉?濡?愿由?

### `src/pages/stats.js`

spec_v24:
- Added tab 6 for supplement statistics. It is table-only, no chart.
- Reads `supplementTypes`, `supplementStock`, and date-filtered `supplementLogs`.
- Aggregates stock-in, net usage from `autoDeduct`, manual adjustment, and current stock by supplement SKU.
- Excel all-download now exports 6 sheets including supplement data.

?듦퀎 ?섏씠吏 ?꾩껜 援ы쁽 ?뚯씪.

二쇱슂 湲곕뒫:
- 湲곌컙 紐⑤뱶: 二쇨컙 / ?붽컙 / 吏곸젒
- 吏묎퀎 ?⑥쐞: ?쇰퀎 / 二쇰퀎 / ?붾퀎 / ?곕퀎
- Firestore ?대씪?댁뼵??吏묎퀎
- Chart.js 李⑦듃 ?앹꽦 諛?destroy ?쇱씠?꾩궗?댄겢 愿由?
- ?덉떆??/ ?먮즺 / 遊됲닾 泥댄겕諛뺤뒪 ?좉?
- ?곗씠???녿뒗 湲곌컙 泥섎━
- 媛쒕퀎 Excel ?ㅼ슫濡쒕뱶
- ?꾩껜 Excel ?ㅼ슫濡쒕뱶

Firestore ?쎄린:
- `productions`
- `bagLogs`
- `eggLogs`
- `frozenLogs`
- `bagTypes`
- `meatTypes`

罹먯떆/?곹깭:
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

二쇱쓽:
- Chart.js ?몄뒪?댁뒪?????꾪솚 / ?섏씠吏 ?ъ쭊??/ ???뚮뜑留??꾩뿉 `destroyAllCharts()`濡??뺣━?댁빞 ??
- 泥댄겕諛뺤뒪 ?좉?? Firestore ?ъ옘由??놁씠 罹먯떆??吏묎퀎 ?곗씠?곕줈 李⑦듃 dataset留??ъ깮??
- `bagLogs`?먮뒗 `piecesPerBox` ?ㅻ깄?룹씠 ?놁쓬. ?듦퀎?먯꽌???꾩옱 `bagTypes.piecesPerBox` 媛믪쓣 ?ъ슜??
- ?곕씪??`piecesPerBox`瑜??섏쨷??諛붽씀硫?怨쇨굅 遊됲닾 ?듦퀎????湲곗??쇰줈 ?섏궛??

### `src/pages/meat.js`

?먯쑁 ?ш퀬 諛??먯쑁 醫낅쪟 愿由?

沅뚰븳 蹂寃?
- ?먯쑁 醫낅쪟 master 愿由? admin/office留?媛?? production DOM ?쒓굅.
- ?먯쑁 ?낃퀬 ?깅줉: ?꾩껜 怨꾩젙 媛?? ?꾩옣?먯꽌 ?ㅼ젣 ?낃퀬 ?섎웾 ?뺤씤 ???깅줉?섎뒗 ?묒뾽?쇰줈 production ?덉슜.
- ?꾩쿂由??ы룷???섎룞議곗젙 怨꾩뿴: production 媛??

臾띠쓬 7F-2 蹂寃?
- ?먯쑁 醫낅쪟 愿由?紐⑤떖??`?듦퀎 ?쒖떆` 泥댄겕諛뺤뒪 而щ읆 異붽?.
- 泥댄겕諛뺤뒪 蹂寃???`meatTypes/{id}.showInStats` 利됱떆 ???
- ?좉퇋 ?먯쑁 異붽? ??`showInStats: true` ???
- 湲곗〈 臾몄꽌??`showInStats`媛 ?놁쑝硫??듦퀎?먯꽌??`true`濡?泥섎━.

異붽? 蹂듦뎄:
- 7F-2 ?묒뾽 以?湲곗〈 ?쒓? ?몄퐫??源⑥쭚 ?쇰?媛 鍮뚮뱶 ?ㅻ쪟濡??몄텧?섏뼱 蹂듦뎄??
- 蹂듦뎄??踰붿쐞:
  - `getMeatLogTypeLabel()` ?쇰꺼
  - ?섎룞議곗젙 湲곕줉??`stageKor`
  - ?먯쑁 ?ш퀬 ?곷떒 ?쒕ぉ/??二쇱슂 踰꾪듉/?쇰? ???ㅻ뜑
- ??源⑥쭚? 7F-2 ??湲곕뒫 ?뚮Ц???앷릿 寃껋씠 ?꾨땲??湲곗〈 ?뚯씪???덈뜕 源⑥쭊 臾몄옄?댁씠 鍮뚮뱶 寃利?以??쒕윭??寃?
- ?⑥? `meat.js` ?쒓? ?쇰꺼 ?꾩껜 ?먭?? 臾띠쓬 9 ?꾨낫濡??④?.

### `src/pages/bag.js`

遊됲닾 ?ш퀬 諛?遊됲닾 醫낅쪟 愿由?

臾띠쓬 c:
- 遊됲닾 醫낅쪟 異붽?/?섏젙? admin/office留?媛??
- production?먯꽌??遊됲닾 醫낅쪟 異붽?/?섏젙 踰꾪듉 DOM ?쒓굅.
- 遊됲닾 ?낃퀬 ?깅줉怨??섎룞議곗젙? 湲곗〈 ?댁쁺 ?먮쫫?濡??좎?.

### `src/pages/production.js`

spec_v24:
- Production unit input uses recipe `unitPresets`; direct input is still available when presets exist.
- Recipes with empty/missing `unitPresets` disable save and show an operator-facing guide to set presets in recipe management first.
- Production save transaction checks `supplementTypes/{recipeId}_{unit}` and `supplementStock/{recipeId}_{unit}`, blocks inactive/missing/zero-stock SKUs, then deducts 1 bag.
- Production edit refunds the previous SKU and deducts the new SKU atomically when the unit changes.
- Production delete soft-deletes the production card and refunds the linked supplement deduction; `supplementLogs.relatedProductionId` is used for net/refund tracking.
- Supplement deduct/refund is independent of tomorrow-load meat/bag deduction flows.

?앹궛 移대뱶 愿由?

臾띠쓬 c:
- ???앹궛 異붽?, ?앹궛 移대뱶 ????섏젙, ?앹궛 移대뱶 ??젣 UI??admin/office留?媛??
- production?먯꽌??愿??踰꾪듉 DOM ?쒓굅.
- 湲곗〈 ?⑥닔 ?대? 沅뚰븳 泥댄겕???댁쨷 ?덉쟾留앹쑝濡??좎?.

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

?ㅼ젙 ?붾㈃.

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

臾띠쓬 c:
- spec_v20 湲곗??쇰줈 settings 硫붾돱??production?먭쾶 蹂댁씠寃??좎?.
- production??硫붾돱 ?대┃ ??`layout.js`?먯꽌 alert ??吏꾩엯 李⑤떒.
- `renderSettings()` ?대??먯꽌??production 利됱떆 李⑤떒.
- ?대떦??異붽?/??젣 踰꾪듉怨??대깽??諛붿씤?⑹? admin/office???뚮쭔 ?쒖꽦??

二쇱쓽:
- Older notes saying closingFlags/menu-staff/system settings UI is missing are obsolete as of v26.

### `src/pages/egg.js`

怨꾨? ?ш퀬.

臾띠쓬 a:
- ?꾩옱 ?ш퀬 移대뱶??FIFO ?붾웾 蹂닿린 ?좉? 異붽?.
- 湲곕낯 ?곹깭???ロ옒. ?덈줈怨좎묠 ???ロ옒.
- ?쇱튂硫?`eggLogs` ?꾩껜瑜?timestamp ?ㅻ쫫李⑥닚?쇰줈 ?ъ깮??FIFO 媛???붾웾 ?쒖떆.
- 媛숈? ?좎쭨 ?낃퀬??媛?濡쒓렇瑜?蹂꾨룄 lot?쇰줈 ?쒖떆.
- `type === 'in'`: ?낃퀬 lot ?앹꽦.
- `type === 'out'`: ?ㅻ옒??lot遺??李④컧.
- `type === 'adjust' && qty < 0`: ?ㅻ옒??lot遺??李④컧.
- `type === 'adjust' && qty > 0`: "議곗젙" lot?쇰줈 蹂꾨룄 ?쒖떆.
- FIFO 遺꾪빐 ?⑷퀎? `eggStock/global.currentQty`媛 ?ㅻⅤ硫?寃쎄퀬 ?쒖떆.
- ?낃퀬 lot蹂대떎 癒쇱? 湲곕줉??異쒓퀬/媛먯냼媛 ?덉쑝硫?諛곕텇 遺덇? ?섎웾 ?쒖떆.
- ?대젰 ?뚯씠釉붿? 湲곗〈泥섎읆 理쒓렐 50嫄대쭔 ?쒖떆?섎릺, FIFO 怨꾩궛? ?꾩껜 濡쒓렇瑜??ъ슜.

### `src/style.css`

?듦퀎 ?ㅽ????ы븿.

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

臾띠쓬 7B:
- `.stats-recipe-toggles`
- `.stats-recipe-chip`
- `.stats-chart-canvas-wrap`

臾띠쓬 7F-2:
- `.stats-expected-tag`
- `.stats-expected-note`
- `.stats-download-btn-all`

臾띠쓬 a:
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

臾띠쓬 b?먯꽌 ?쎄린 濡쒖쭅 異붽?. 臾몄꽌 ?놁쑝硫??꾨? ON.

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

二쇱쓽:
- v26 settings UI can edit these flags.
- Missing fields still use default ON semantics.

### `settings/systemValues`

Newer settings UI stores production/system constants here. Current values were validation/seed-time values; clean before final operation seed if needed.

### `settings/menuStaffGroups`

Newer settings UI stores which staff groups are exposed per menu. Each menu must expose at least one staff group.

### `eggLogs`

怨꾨? ?낃퀬/異쒓퀬/?섎룞議곗젙 濡쒓렇.

```js
{
  date: string,
  timestamp: Timestamp,
  type: 'in' | 'out' | 'adjust',
  qty: number, // 遺???ы븿. 異쒓퀬/媛먯냼???뚯닔.
  before: number,
  after: number,
  staffName: string,
  note?: string,
  reason?: string,
}
```

臾띠쓬 a FIFO ?쒖떆:
- `timestamp` 湲곗? ?쒓컙???ъ깮.
- ?뚮윭??議곗젙? 蹂꾨룄 議곗젙 lot.
- 留덉씠?덉뒪 議곗젙? FIFO 李④컧.

### `meatTypes`

異붽? ?꾨뱶:

```js
showInStats: boolean
```

?섎?:
- `true`: ?듦퀎 ?? ?먮즺 ?뚮え?됱뿉 ?쒖떆
- `false`: ?듦퀎 ?? ?먮즺 ?뚮え?됱뿉???쒖쇅
- ?꾨뱶 ?놁쓬: `true`濡?泥섎━

?좉퇋 ?먯쑁:
- `showInStats: true`濡????

### `bagTypes`

?ъ슜 ?꾨뱶:

```js
piecesPerBox: number
```

?섎?:
- 遊됲닾 ?뚮え???듦퀎?먯꽌 ???섎? 諛뺤뒪 ?⑥쐞濡??섏궛.
- `0`, `null`, ?꾨뱶 ?놁쓬?대㈃ 諛뺤뒪 蹂??遺덇?.
- 蹂??遺덇? 遊됲닾???붾㈃/Excel?먯꽌 蹂꾪몴 ?쒖떆?섍퀬 珥????섎쭔 ?쒖떆.

二쇱쓽:
- `bagLogs`?먮뒗 `piecesPerBox` ?ㅻ깄?룹씠 ?놁쓬.
- ?꾩옱 `bagTypes` 媛믪쓣 ?ъ슜??怨쇨굅 濡쒓렇源뚯? ?섏궛??

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

## Stats Tab Behavior

### ??: ?앹궛??

- `productions.status === 'active'`留??ы븿.
- ?덉떆?쇰퀎 爰얠???李⑦듃.
- ?덉떆??泥댄겕諛뺤뒪濡??쇱씤 ?쒖떆/?④?.
- ?좉퇋 ?덉떆?쇰뒗 ?먮룞 ON.
- 0??湲곌컙??X異뺤뿉 ?쒖떆?섍퀬 0?먯쑝濡??곌껐.

### ??: ?먮즺 ?뚮え??

- `productions.ingredientsSnapshot` 湲곗?.
- g ?⑥쐞 ??κ컪??kg濡?蹂?섑빐 ?쒖떆.
- `meatTypes.showInStats === false` ?먮즺???쒖쇅.
- `autoDeductInventory === false` ?먮즺??`?덉긽` / `?덉긽 ?ъ슜??(?ш퀬 李④컧 ?놁쓬)` ?쇰꺼 ?쒖떆.
- ???먮즺媛 ?щ윭 ?덉떆?쇱뿉???쒕줈 ?ㅻⅨ `autoDeductInventory` 媛믪쓣 媛吏硫???踰덉씠?쇰룄 `false`??寃쎌슦 ?덉긽 ?ъ슜?됱쑝濡??쒖떆.

### ??: 遊됲닾 ?뚮え??

- `bagLogs.type`??`autoDeduct` ?먮뒗 `autoDeductReverse`??濡쒓렇留??ы븿.
- `abs(net)` 湲곗?.
- ?섎룞議곗젙 ?쒖쇅.
- 李⑦듃 Y異뺤? 諛뺤뒪 ?⑥쐞 ?뚯닔.
- ?댄똻怨??뚯씠釉붿? `50諛뺤뒪 27??(5,027??` ?뺤떇.
- ?⑷퀎 諛뺤뒪??`諛뺤뒪 ?섏궛 ?⑷퀎: N諛뺤뒪 / 珥?N?? ?뺤떇.
- `piecesPerBox` 誘몄꽕??遊됲닾??蹂꾪몴 ?쒖떆.

### ??: 怨꾨? ?ъ슜??

- `eggLogs.type === 'out'`留??ы븿.
- ?⑥씪 爰얠???李⑦듃.
- ?⑥쐞??媛?

### ??: ?쇰퀎 ?앹궛 ?꾪솴

- 李⑦듃 ?놁쓬. ?뚯씠釉??꾩슜.
- ?앹떇: `productions.category === 'raw'`
- ?숆껐嫄댁“: `frozenLogs.status === 'active'`
- `(date, type, name)` ?ㅻ줈 媛숈? ??媛숈? ?쒗뭹???⑹궛.

### ??: ?곸뼇??
- Chart ?놁쓬. Table 以묒떖.
- `supplementLogs.type === 'in'` ?낃퀬 ?⑷퀎.
- `supplementLogs.type === 'autoDeduct'` ?ъ슜?됱? net 怨꾩궛: 李④컧(-1)? ?ъ슜??利앷?, ?섎텋(+1)? ?ъ슜??李④컧.
- `supplementLogs.type === 'adjust'` ?섎룞議곗젙? signed sum.
- `supplementStock.currentQty`??湲곌컙怨?臾닿????꾩옱媛?
- 湲곕낯? active SKU留??쒖떆?섍퀬, inactive ?ы븿 ?좉?濡?怨쇨굅 SKU源뚯? 蹂????덉쓬.
- ?뺣젹? `supplementTypes.sortOrder` ?ㅻ쫫李⑥닚.

## Excel Download

### 媛쒕퀎 ?ㅼ슫濡쒕뱶

- 踰꾪듉: `?뱿 Excel ?ㅼ슫濡쒕뱶`
- ?쒖꽦 ??1媛쒕쭔 ?ㅼ슫濡쒕뱶.
- ?뚯씪紐?

```text
?듦퀎_{??씪踰?_{?쒖옉??~{醫낅즺??.xlsx
```

### ?꾩껜 ?ㅼ슫濡쒕뱶

- 踰꾪듉: `?뱿 ?꾩껜 ?ㅼ슫濡쒕뱶`
- ?대┃ ??6???꾩껜 ?곗씠?곕? ?덈줈 荑쇰━.
- 1媛??뚯씪??6媛??쒗듃 ?앹꽦.
- 鍮???룄 `?곗씠???놁쓬` ?쒗듃 ?ы븿.
- ?뚯씪紐?

```text
Fantapet_?듦퀎_{?쒖옉??~{醫낅즺??.xlsx
```

?쒗듃:
- ?앹궛??
- ?먮즺 ?뚮え??
- 遊됲닾 ?뚮え??
- 怨꾨? ?ъ슜??
- ?쇰퀎 ?앹궛 ?꾪솴
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

- 臾띠쓬 b:
  - `npm.cmd run build` ?듦낵.
  - B1 留덇컧 李⑤떒/寃쎄퀬 肄붾뱶 援ы쁽 ?꾨즺.
  - B2 ?댁씪?앹궛遺덈윭?ㅺ린 李⑤떒 5議곌굔 肄붾뱶 吏꾨떒 ?듦낵.
  - B3 理쒖냼?ш퀬 ?먮룞 諛쒗뻾 留ㅼ씪 1??寃곗젙??doc id ?⑦꽩 吏꾨떒 ?듦낵.
  - B4 schedule/frozenSep spec gap ??ぉ 吏꾨떒 ?듦낵.
  - B4-6-4 ?낃퀬?덉젙 ?섏젙 湲곕뒫 異붽? ??build ?듦낵.
- 臾띠쓬 c:
  - `npm.cmd run build` ?듦낵.
  - 沅뚰븳 留ㅽ듃由?뒪 DOM ?쒓굅 ???9?뚯씪 ?곸슜.
  - static grep?쇰줈 二쇱슂 踰꾪듉 議곌굔遺 ?뚮뜑 ?뺤씤.
  - `frozenPan.js` 諛쒖＜ ??젣/痍⑥냼 ?뺤콉 spec 13???뺤씤.
  - settings ?대떦???대깽??沅뚰븳 媛??蹂댁젙 ??build ?듦낵.
- 臾띠쓬 a:
  - `npm.cmd run build` ?듦낵.
  - 怨꾨? FIFO ?붾웾 ?쒖떆 援ы쁽.
  - ?ㅼ젣 釉뚮씪?곗? ?대┃ 寃利앹? 臾띠쓬 e濡??댁썡.
- 臾띠쓬 9 沅뚰븳/?먮룞 ?ы룷??
  - `npm.cmd run build` ?듦낵.
  - ?먮룞 ?ы룷??trigger 濡쒓렇 ???뺤씤 紐⑤떖 ?쒖떆 寃利?
  - 媛쒖닔 ?낅젰 ??g ?먮룞 ?쒖떆 諛?李⑥씠 ?쒖떆 寃利?
  - 李⑥씠 ?놁쓬 ??trigger ack留?泥섎━, lot ?붾웾 蹂寃??놁쓬 寃利?
  - 李⑥씠 ?덉쓬 ??lot remaining 蹂댁젙 諛?`autoRepack:diff` 濡쒓렇 諛쒗뻾 寃利?
  - diff 濡쒓렇 鍮④컙 以??뺤씤 ?꾩닔 ?쒖떆 寃利?
  - 0媛??낅젰 ??confirm ??lot `remaining: 0`, `closed: true` 寃利?
  - 痍⑥냼 ??誘명솗???곹깭 ?좎? 寃利?
  - ?먮룞 ?ы룷??誘명솗???곹깭?먯꽌 ?댁씪?앹궛遺덈윭?ㅺ린 李⑤떒 寃利?
  - qc/office 怨꾩젙?먯꽌 ?댁씪?앹궛遺덈윭?ㅺ린 諛?留덇컧 沅뚰븳 李⑤떒 ?쒓굅 ?뺤씤.
  - qc 怨꾩젙?먯꽌 ?먯쑁 ?낃퀬 ?깅줉 紐⑤떖 吏꾩엯 諛??ㅼ젣 ???媛???뺤씤.
  - ?뚯뒪?몄슜 `meatStocks` / `meatLogs` 臾몄꽌????젣 ?꾨즺. ??젣 遺덇????뚯뒪??`activityLogs`??acknowledged 泥섎━.
- `npm.cmd run build` ?듦낵.
- 釉뚮씪?곗??먯꽌 ?뺤씤:
  - ?듦퀎 ?붾㈃ 吏꾩엯
  - ?꾩껜 ?ㅼ슫濡쒕뱶 踰꾪듉 ?쒖떆
  - ?? ?듦퀎 鍮꾪몴???덈궡 ?쒖떆
  - ?? ?덉긽 ?쇰꺼 ?쒖떆
  - ?? ?⑷퀎 `諛뺤뒪 ?섏궛 ?⑷퀎: 28諛뺤뒪 / 珥?143,250?? ?쒖떆
  - ?? 媛쒕퀎 ??諛뺤뒪+???쒖떆 ?좎?
  - ?먯쑁 醫낅쪟 愿由?紐⑤떖 `?듦퀎 ?쒖떆` 泥댄겕諛뺤뒪 ?쒖떆

Build warnings:
- chunk size warning
- ineffective dynamic import warning
- ?꾩옱 鍮뚮뱶 ?ㅽ뙣 ?붿씤? ?꾨떂.

## Follow-Up Candidates

Phase 1 notes:
- B/codebase update for supplement units and Work A is complete.
- D-1/D-2/D-3 settings UI work is complete as of v26: closing flags, menu staff groups, and system values are editable in settings.
- E-2/E-5 drag-sort master ordering for bag, frozen product, meat type, and recipe lists remains a candidate. Supplement SKU ordering remains derived from recipe order and unit preset order; no separate supplement drag-sort UI.

Next implementation candidate:
- Phase 2b conversion table work from spec_v26 §2-1~2-4.

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
