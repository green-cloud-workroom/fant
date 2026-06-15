# Fantapet 생산관리 앱 — Handoff v29

작성: 2026-06-15 (운영 세션 / 모델 fable-5)
이전: v28(2026-05-18 pre-seed) — v28 본문은 시드 *전* 기록이라 상당수 과거사. 이 v29가 현재 권위 문서.
폴더: C:\dev\fant-production · repo: green-cloud-workroom/fant · 공개: https://green-cloud-workroom.github.io/fant/

> 이 문서는 "다음 세션 Claude가 호두를 이미 아는 사람처럼 이어가도록" 두껍게 쓴 거다.
> §1(호두가 누구·무엇을 원하나)과 §4(공유 rules)는 반드시 먼저 읽어라. 나머지는 필요할 때 참조.

---

## 0. 가장 먼저 (cold-start 30초)

1. 폴더 C:\dev\fant-production, `git remote -v` = green-cloud-workroom/fant 확인.
   (fantapet-inventory면 재고앱 — 다른 repo. 즉시 중단하고 호두에 알릴 것.)
2. `git status` → tracked 깨끗 + untracked만(백업 JSON 9 + delete 스크립트 3 + AGENTS.md ≈ 13개)이면 정상.
3. `git --no-pager log -1 --oneline` → 이 문서 작성 시 main = `91722eb`(PR #63). 그 이후면 그동안 더 진행된 것.
4. 메모리 자동 로드됨 — 특히 `project_shared_rules_conflict`, `feedback_codex_uncommitted_deploy`,
   `feedback_codex_handoff_format`, `feedback_agent_role_split`. 이게 §1·§2·§4의 압축본.
5. 모든 핸드오프/스펙/메모리는 stale 가정. **실코드 대조 후 발언.**

---

## 1. 호두가 누구이고, 무엇을 원하는가 (★핵심)

### 1.1 사람
- Fantapet(반려동물 사료 회사) 오너. **코딩은 1도 모르는 비개발자**. 한국어로 소통.
- fant-e5ae5(Firebase) 하나를 **5개 사내 앱이 공유**: 재고관리 · 생산관리(이 repo) · 운영관리(급여/근태/세무) · 레시피계산기(recipesss) · 재무관리. 호두가 이 전부의 오너.
- 이 repo는 그중 **생산관리 앱**: 생산 계획/입력, 레시피·환산표, 휴일 마스터, 실제 생산 입고,
  원육·봉투·계란·영양제·동결(빵판→분리→동결판→동결제품) 재고, 마감.

### 1.2 소통 방식 (그대로 지킬 것)
- **직접·간결·한국어.** 감정적 패딩 금지. 칭찬·사과 길게 늘이지 말 것. 비번 잔소리 금지.
- 질문할 땐 **항상 추천답안 + 이유**를 붙여라(호두가 고르기만 하면 되게). blocker와 improvement를 구분해 말해라.
- 호두 의도를 넘겨짚지 말고 액면 그대로 받아라. 실수는 짧게 인정하고 넘어가라.
- 메모리/문서가 X라는데 코드가 Y면 **둘 중 하나를 몰래 고르지 말고 불일치를 그대로 드러내라.**

### 1.3 호두가 진짜로 원하는 것 (이번 세션에서 관찰한 패턴)
- **눈으로 버그를 잡는다.** 코드를 못 읽어도 "결과가 틀렸다"를 즉시 알아챈다
  (봉투 376,000장, 노른자 0, 닭간 두 줄, 44.8000004빵판, 원육 출고 누락 등 전부 호두가 먼저 발견).
  → 너의 역할: 호두가 "이거 이상한데?" 하면 **코드로 원인을 확정**하고, 버그/정상/설계 중 무엇인지 정직하게 가른다.
- **근본 해법 지향, 단 과설계 지양.** 최소 패치로 때우는 것도, 거대한 재설계도 싫어한다.
  예: "원료명이 레시피마다 다르다" → 별칭 테이블(과설계) 말고 실제 rename(근본). "재입고 차단 vs 수정" → 일관성 있게 수정 허용.
- **실제 운영 워크플로에 맞추기.** "발주는 미리 하니까 미래 일정 기준으로 복사돼야" 같은 현장 감각이 강하다.
- **일관성**에 민감하다(같은 단위·같은 정밀도·같은 정렬이 화면마다 다르면 싫어함).
- **데이터 무결성 최우선.** 지금은 시드 끝나고 **실데이터로 운영 중(Phase 4)**이라, 재고가 깨지면 진짜 사고다.
- **결정은 호두가, 분석·실행은 에이전트가.** 호두는 5개 앱을 AI로 굴리는 "지휘자"다.
  품질의 상당 부분이 "좋은 분석 + 매 단계 검증" 구조에서 나온다 → **그 검증 구조를 지키는 게 너의 핵심 가치**다.

### 1.4 호두가 싫어하는 것 / 사고 이력
- **사본이 여러 개라 서로 덮어쓰는 것**(→ §4 공유 rules). "갑자기 접근 거부" 사고의 원인이었다.
- **미커밋 드리프트**: 병렬 Codex가 라이브 배포는 하고 커밋은 안 하거나, 작업트리에 엉뚱한 변경을 남긴다.
  → git 작업 전 **항상 `git status`·`git diff` 먼저**. 발견하면 별도 브랜치/stash로 보존 후 보고.
- **위험 런북의 UI 우회**: wipe/execute 류는 기술적 동결(브랜치 보호 등) 먼저, 매 단계 재고지.

---

## 2. 일하는 방식 (에이전트 레인 + 워크플로)

### 2.1 레인
- **Claude(너)** = 분석·리뷰·계획·문서·cross-app 경계 판단. + git 브랜치/커밋/push, 배포(gh-pages), 문서 갱신.
- **Codex** = 구현·터미널·테스트. 너가 **복붙형 work order**를 써주면 호두가 Codex에 붙여넣어 돌린다.
- **호두** = PR 머지(브라우저). **이 환경엔 gh CLI 없음** → PR 생성/머지 못 함.
  너는 push 후 "Create a pull request ... <URL>" 링크를 호두에게 주고, 호두가 브라우저에서 생성+squash 머지.

### 2.2 한 사이클 (이번 세션 내내 이렇게 돌았다)
1. 호두가 "이거 이상/이거 해줘" → 너가 **실코드로 원인·범위 확정**(필요시 Explore 에이전트로 매핑).
2. 애매하면 **추천답안 붙여 AskUserQuestion**으로 방향 확정.
3. **복붙형 Codex work order** 작성(feedback_codex_handoff_format): 브랜치명·정확한 파일/라인·"절대 하지 말 것"·검증·보고형식.
4. 호두가 Codex 실행 → 결과 보고 → 너가 **머지된/푸시된 diff를 직접 대조 리뷰**(보호 시스템이면 더 깐깐히).
5. 코드 변경이면 **너가 배포**: `git checkout main && git pull && npm run deploy` → 호두에게 Ctrl+Shift+R 안내.
   (호두가 이미 머지·배포한 경우도 많음 → 그땐 머지 확인 + diff 리뷰만.)
- work order는 한 번에 다 못 줄 만큼 길어도 됨. 단 **여러 작업이 같은 파일/구역이면 병렬 금지**(머지 충돌) — 순서를 명시.

### 2.3 배포 규칙 (중요)
- 코드 변경 = `npm run deploy`(vite build → gh-pages). 문서/CI 변경 = 배포 불필요.
- 디렉터리 주의: 반드시 `cd C:\dev\fant-production`에서. (호두가 C:\dev에서 돌려 ENOENT 난 적 있음.)
- **rules는 절대 이 repo에서 배포하지 말 것 → §4.**

---

## 3. 프로젝트 현재 단계

- 시드 입력 완료. **Phase 4 = 자연 검증(실데이터 운영하며 버그 잡기).** 지금 호두가 매일 쓰면서 발견하는 걸 고치는 중.
- main = `91722eb`. 오픈 PR 0. 배포 = gh-pages.
- 호두 본인 = alice@fantapet.com = production:admin. (admin@ = production:office, qc@ = production:production — 이름이 헷갈리니 주의.)

---

## 4. 🔴 공유 Firestore rules 거버넌스 (절대 사고치지 말 것)

- fant-e5ae5는 **5개 앱이 공유하는 단일 rules 파일**. 프로젝트당 룰셋 1개라 **누가 배포하든 라이브 전체를 교체**한다.
  각 앱이 자기 부분만 배포 → 서로 덮어써서 깨졌다(과거 "갑자기 접근 거부" 사고의 정체).
- **정본 = 재고관리(inventory) repo의 firestore.rules.draft** (라이브와 전 줄 일치 검증됨, 5개 앱 규칙 포함).
  **룰 배포는 재고관리 repo 한 곳에서만.**
- **이 생산 repo는 룰 배포 영구 봉쇄(PR #60 머지 완료):**
  ① `.github/workflows/firebase-rules.yml`의 push 트리거 주석(workflow_dispatch만)
  ② `firebase.json`에서 firestore 항목 제거(`{"_note":...}`만 남음 → `firebase deploy --only firestore:rules` no-op)
  → 이 repo의 `firestore.rules`는 **참고용 stale 사본(production-only 축소판)**. **절대 배포·복원·정본취급 금지.**
- **룰 변경 필요 시(새 컬렉션/권한)**: 직접 손대지 말고 **변경 내용을 재고관리 쪽에 전달** → 거기 정본 반영 후 1회 배포.
- 진짜 현재 룰 확인: 앱/복사본 말고 **Firebase 콘솔 → Firestore → 규칙 탭**(유일한 진실 + 배포 이력).
- 일반 교훈(호두가 좋아한 결론): 사본 여러 개가 어긋날 땐 다수결 말고 **"실행 중 실제 상태(라이브 배포본)"를 단일 정본**으로.
- stash 보관: `stash@{0}`=full 멀티앱 rules(mojibake, 정본은 재고repo라 불필요 → 폐기 가능),
  `stash@{1}`=recipesss rules. 둘 다 호두 OK 시 `git stash drop`.

---

## 5. 보호 시스템 / 도메인 모델 (변경 전 반드시 이해)

- **append-only 원장 + 실측 정합.** 입고·차감은 불변 이력 행으로 쌓고, 잔량은 합산 결과. 수동조정은
  과거 행을 안 건드리고 **정정 델타 행을 추가**. → 과거 행을 mutate하거나 cascade-delete 하지 말 것(감사성 붕괴).
- **재고는 lot(입고 배치) 단위 FIFO.** 같은 원육/제품이 입고 횟수만큼 여러 줄로 보이는 건 **정상**(합치면 FIFO 깨짐).
  오래된 lot부터 차감. (원육 재고 3탭 상단 "원육별 합계"는 #61로 추가 — 표시용.)
- **실측이 오류를 흡수한다.** 빵판→동결판 전처리 때 **동결판 재고는 실측(직접 센 값)으로 들어간다**
  (frozenPan.js L1167 "실측값으로"; 이력에 "이론 X / 실측 Y"). 그래서 빵판 입력이 좀 틀려도 동결판/발주로
  전파되지 않는다 → 보통 **cascade 취소·삭제 불필요, 틀린 층(빵판)에서만 정정**. (호두에게 이걸로 "발주 취소 안 해도 됨" 설명한 바 있음.)
- **cross-app outbox**: 생식 제품입고 → `productTransferRequests`(생산 create, 재고 update, delete 금지)로 재고앱에 전송.
  멱등키 `productions:{id}:{revision}`. **한 번 보낸 전송은 깨끗이 취소 못 함** → cascade-edit가 위험한 이유.
- **마감 가드 `blockIfClosed(date)`**: "오늘 처리"하는 작업(수동조정 등)은 `getToday()` 전달이 맞다
  (입고일이 아니라). #62에서 빵판/동결판 수동조정을 이 원칙대로 고침.
- **0.5박스 환산**: 10팩=0.5박스(본품), 1박스=20팩. boxes=floor(totalPacks/10)/2, 낱개=totalPacks%10.
- **판당 팩수**: 레시피별 오버라이드(`recipes.packsPerPlate`) 우선, 없으면 settings/systemValues(packsPerPlateCat/Dog).
- **원료 수량 표시 통일**: 공용 `formatIngredientQtyValue`(g 최대1자리/kg 최대2자리, 정수는 소수점 생략). 빵판 수는 round2.
- spec_v26 정정 9건은 CLAUDE.md에 박혀 있음(환산값 effectiveDate≤생산일·createdAt desc tie-break, bagLogs delete=admin+office 등).
- **firestore read/write 작성 전 docs/codebase.md 스키마 확인.**

---

## 6. 이번 세션 머지·배포 완료 (회귀 시 참조)

main 91722eb 기준, 전부 머지+배포:
- #63 레시피 원료 붙여넣기 — 단일값 통과 + 붙여넣은 행부터 채움(0번 덮어쓰기 해소)
- #62 빵판/동결판 수동조정 마감가드 lot.date→getToday()
- #61 원육 재고 3탭 상단 "원육별 합계" 요약
- #60 rules 자동배포 봉쇄(워크플로 + firebase.json) — §4
- (이전) 발주복사 메인→생산입력 이동(선택날짜 기준) · 원료명 통합관리(설정)+닭발주 복사 ·
  명칭통합 시 미마감 생산 스냅샷 동기화 · packsPerPlate 레시피 오버라이드 · 원료 수량 정밀도 통일+빵판 round2 ·
  동결건조 카드 제품입고(빵판/동결판)+입고 수정 · 0.5박스 환산 · 소급 내일생산불러오기(마감 교착 해소) ·
  봉투 필요량 단위버그(376,000→실제) 등.

---

## 7. 미해결 백로그 + 우선순위 (호두가 고름)

| 우선 | 항목 | 메모 |
|---|---|---|
| ★1 | **C. 원육 수동조정(meat.js) 마감가드** | lot.date 기준이면 #62와 동일 증상(과거 입고분 조정 막힘) → getToday()로. 빠르게 닫기 좋음. 먼저 코드 확인. |
| 2 | **A. 레시피 원료 행별 인라인 수정/삭제** | 미소진·미마감 엔트리만(엮인 거 없을 때). cascade-편집은 ❌(§5). 소진/엮인 건 정정 델타로. |
| 2 | **B. 잔량 0(소진) lot 조정** | loadBreadPanLots/loadFrozenPanLots의 `!closed` 필터로 빠짐. (소진)태그로 노출. 우회로(새 입고) 있어 비차단. |
| 3 | **D. 한글 키보드 타이핑 안 됨** | #63로 붙여넣기 해소. 여전히 안 되면 환경(IME/메타마스크 확장) — 시크릿창/다른 브라우저 테스트. 코드 아님. |
| 4 | 정리 | stash 2개(§4), 머지된 옛 원격 브랜치 6개(gone) 가지치기, untracked 13개 정식 처리, 원육/동결제품 모달 비활성 패턴. |

→ 대부분은 **호두가 운영하다 발견하는 새 버그/요청**이 실제 1순위가 된다. 위 표는 "한가할 때" 목록.

---

## 8. 자주 깜빡하는 caveat

- prompt()/confirm() 배포 SPA에서 차단될 수 있음 → 인라인 UI/showModal.
- production role = claims.roles.production(단일 role 아님). admin@ = office, qc@ = production(이름 헷갈림).
- 발주 복사/출고 패널은 생산카드 **snapshot 이름** 매칭 → 명칭 통합 후 **신규 생산부터** 정확(이미 입력된 카드는 옛 이름).
- 원료명 통합(설정)은 레시피만 rename + 미마감 생산 스냅샷 동기화. 과거(마감) 스냅샷은 불변(이력 보존).
- 공공데이터 휴일 API 5년 한계, HOLIDAY_DATA_END_YEAR=2027(2027-06경 2028 재시도).
- recipesss(레시피계산기) 합류 예정 — recipeDrafts/{uid}/items/*(우리 앱 read X). rules는 재고repo 정본에 반영.

---

## 9. 첫 액션 (뭐부터)

1. §0 sanity check → §1·§4 읽기.
2. **새 브랜치에서 작업(main 직접 금지). rules는 절대 손대지 말 것(§4).**
3. 호두에게 "오늘 뭐부터 갈까 — ①운영하다 발견한 새 버그/요청, 아니면 ②백로그 C(원육 수동조정 가드)부터?"
   추천 = 호두가 새로 발견한 게 있으면 그것부터(Phase 4 운영이 1순위), 없으면 C(빠르고 #62와 동질).
4. 무엇이든: 실코드로 원인 확정 → (애매하면 추천 붙여 질문) → 복붙형 Codex work order → 머지 diff 리뷰 → 배포.
5. 보호 시스템(재고 차감/FIFO/마감/ledger/cross-app)·firestore.rules 건드리는 일은 평소보다 두 배 깐깐히, 호두 확인 후.
```
