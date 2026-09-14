# 생산관리 로딩 구조 변경 실행 체크시트

작성: 2026-09-14. **구현 착수. [1차 릴리스 기록](READPATH_RELEASE_20260914.md)에 구현·실측·검증 범위를 기록한다. 아래 단계 전체를 완료한 것은 아니며 서버/전 메뉴 이행은 남아 있다.**

설계·데이터 계약·검증 기준은 [상세 실행 계획](PERFORMANCE_EXECUTION_PLAN_20260914.md)을 따른다. 이 체크시트는 작업 순서, 인계 조건, 증거 위치를 관리한다. 상세 계획과 충돌하면 임의 진행하지 말고 두 문서를 함께 수정한다.

## 실행 원칙과 순서

먼저 안전한 저장 경계를 만든 뒤 조회 캐시를 확대한다. 프런트 릴리스는 서버 구축과 독립적으로 완료할 수 있다. 서버 요약은 원본과의 병행 비교를 통과한 뒤 메인의 표시 데이터로 사용한다.

```text
00 기준·계측 → 01 저장 경계 → 02 순수 모델 → 03 세션 저장소
→ 04 공통 화면 수명 → 05 메인 → 06 메뉴별 이행 → 07 프런트 배포

02 계약 고정 → 08 서버 계약 → 09 서버 구현·로컬 검증 → 10 초기집계 도구
→ 11 서버 배포 준비·승인·shadow 배포 → 12 초기집계·운영 비교
→ 13 프런트 요약 비교·제한 적용 → 14 전체 적용·인수

13의 시작 조건 = 07 + 12 완료
```

03~07 프런트 작업과 08~10 서버 로컬 작업은 병행 가능하다. 병행 시작 전 02의 DTO·순수 계산·fixture hash를 고정한다. 그 계약이 변경되면 양쪽 담당자가 parity를 다시 통과시킨다. 08~10은 서버 운영 배포 승인이 없어도 로컬에서 준비할 수 있다.

한 구현자는 한 번에 한 단계의 코드만 변경한다. 독립 작업은 서로 다른 worktree/소유 파일로 나눈다. 각 메뉴·구조 단계는 별도 커밋으로 남긴다. 실패한 gate는 건너뛰지 않으며, 통과하지 못한 메뉴는 legacy 경로에 남긴다.

## 시작 기록 — 실제 실행 때 채움

| 항목 | 실행 기록 |
| --- | --- |
| 실행자 / 시작일 | 미실행 |
| 프런트 base / branch / worktree | 미실행 |
| 서버 base / branch / worktree | 미실행 |
| 현재 운영 source / gh-pages / 자산 hash | 미실행 |
| 보존할 다른 변경 | 미실행 |
| fixture / 순수 코어 hash | 02에서 기록 |
| 적용 route / 역할 / flags | 릴리스별 기록 |
| 배포 승인 근거 / 비용·문서 한도 | 해당 운영 단계 직전에 기록 |
| 증거 폴더 | `output/performance-readpath/<release-id>/` — 실행 때 생성 |

## 00. 기준 고정·계측

- [ ] `C:\dev\fant-production`의 status/HEAD/remote, `main`과 배포 코드의 차이, live 자산을 확인했다.
- [ ] `C:\dev\fantapet-inventory`의 status/HEAD/remote와 서버 소유 경계를 확인했다.
- [ ] 현재 검증된 운영 코드를 포함하는 HEAD에서 `codex/production-readpath-v2`와 별도 worktree를 만들었다. `main`을 무조건 기준으로 사용하지 않았다.
- [ ] `output/` 및 설비 부품 선행 기능, 타 작업 변경을 보존했다.
- [ ] VM loader의 동시 모듈 중복을 수정하고 반복 테스트가 같은 결과를 내는지 확인했다.
- [ ] client marks와 신규 npm scripts를 등록했다. 신규 script를 등록 전에 실행하지 않았다.
- [ ] 기존 performance/phase3a/phase3b/build와 새 계측 baseline을 저장했다.

**Gate:** 현행 state·write payload·조회 수의 반복 재현, 내용 paint와 skeleton 구별, 최소 20개 동일 조건 표본. **인계:** base 기록, baseline JSON, fixture, build manifest, 커밋.

## 01. 캐시 확대 전 저장 경계

- [ ] `serverReadScope`는 서버 강제 조회만 사용하며 표시 store를 참조하지 않는다.
- [ ] `closingGuard`는 조회 실패 시 저장을 차단한다. 서버에서 확인한 문서 없음은 기존대로 미마감으로 처리한다.
- [ ] `ACTION_PATHS.md`에 버튼→모달→최종 확인→기존 서비스의 모든 저장 경로를 기록했다.
- [ ] main 입고·마감은 ID/date/session으로 재조회하며 최종 확인 직전 source fingerprint·권한·마감·경고를 다시 검증한다.
- [ ] 이중 제출, 전송 후 결과불명, 이전 모달, source 변경 시 draft 보존을 검증했다.
- [ ] gateway가 없는 행위가 남은 route는 session 활성화 대상에서 제외했다.

**Gate:** T07~T10, 정상 payload parity, 제출 전 검증 실패 시 업무 쓰기0, 제출 후 단절 시 자동 재발행0/read-back. **인계:** action 표, command별 테스트, 커밋. 기존 TOCTOU 전체 해결은 주장하지 않는다.

## 02. 순수 모델·조회 계획

- [ ] `mainViewModel`/`businessCalendar`를 legacy 실행 상태에서 추출했다.
- [ ] 필드 누락/null·soft delete·정렬·14개 생산일·runDate·공휴일·환산 tie-break fixture를 고정했다.
- [ ] 독립 조회 선행 시작을 적용하고 새 자동 알림 뒤 오늘 로그만 다시 읽는다.
- [ ] 날짜 묶기와 실패 묶음의 개별 fallback을 별도 커밋으로 검증했다.
- [ ] DTO, logicVersion, 순수 코어 hash, fixture hash를 확정해 서버 작업에 전달했다.

**Gate:** 정상·오류 state/payload parity, T18~T20, 성능과 호출 수를 별도 기록. **인계:** 순수 코어 계약/fixtures/hash, query 목록, 커밋.

## 03. 세션 저장소·구독

- [ ] registry/store/pool/controller를 구현했다. query 객체 직렬화 대신 명시적 키를 사용한다.
- [ ] 동일 query 1 listener, owner/ref count, 30초 grace·LRU·모델 보관 정책을 검증했다.
- [ ] ready-empty/cache-only/error/permission/pending-write를 구별한다.
- [ ] UID·claims·KST day·epoch를 처리하고 같은 claims의 토큰 갱신으로 불필요하게 비우지 않는다.
- [ ] logout/권한 축소/절전 복귀/늦은 callback에서 이전 계정 자료가 남지 않는다.

**Gate:** T01~T05, T10~T12, UI 연결 전 fake listener 검증. **인계:** API 계약, lifecycle 검사 결과, 커밋.

## 04. 상단·라우터·모달

- [ ] shell은 유지하고 mainContent는 이동마다 새 노드로 만들며 legacy adapter가 작동한다.
- [ ] 메뉴/hash/내부 이동/뒤로·앞으로를 navigate로 통합했다.
- [ ] dirty 입력 확인이 끝나기 전 URL·선택 메뉴·draft를 바꾸지 않는다.
- [ ] await 전 transition ID로 이동 확인을 직렬화하고, 확인 중 로그아웃·역순 응답을 폐기한다.
- [ ] legacy 로더도 로컬 결과→epoch 확인→모듈 상태 설치 순서다. 옛 응답이 다음 방문의 전역 상태를 오염시키지 않는다.
- [ ] modalManager가 전역 bridge를 단독 소유하고 route 이탈 시 소유 모달/handler를 정리한다.
- [ ] Sortable/Chart/timer/DOM listener cleanup을 등록했다.
- [ ] DOM 변경을 legacy data mode로 먼저 검증한 뒤 공통 조회를 연결했다.

**Gate:** T02/T06/T15/T17, 14개 메뉴와 freezeOp, 100회 이동 후 잔류0. **인계:** mount/dispose 계약, navigation 검사, 커밋.

## 05. 메인 전환

- [ ] main 모델로 첫 화면과 재방문을 표시하고 생산/달력/로그/설비 영역을 따로 갱신한다.
- [ ] 업무 form·포커스를 listener 응답으로 덮어쓰지 않는다.
- [ ] autoLogCoordinator로 기존 생성 조건과 결정적 ID·확인 상태를 보존한다.
- [ ] 조건 조회의 failedChecks와 flush의 createdIds/existingIds/failedIds를 구별하며 실패를 성공으로 바꾸지 않는다.
- [ ] 알림 생성 중/실패를 완료된 빈 목록과 구별한다.
- [ ] main session flag만 켠 상태에서 cold/warm·외부 변경·업무 진입을 검증했다.

**Gate:** T05~T14, main model 불일치0, 준비된 warm p95 <= 200ms 목표 확인. **인계:** marks JSON, auto-log/write parity, 커밋.

## 06. 메뉴별 이행 — 행마다 별도 완료

모든 행의 공통 완료 조건: 조회 provider 전환 → action gateway 연결 → 외부 변경·dirty·역순 응답 검증 → 역할별 내용/저장 payload parity → build → 별도 커밋. 행별 위험·수정 내용은 상세 계획 §5 단계06을 따른다.

| 순서 | 메뉴 묶음 | 상태 / 커밋 / 증거 |
| --- | --- | --- |
| 06-1 | recipe | 미실행 |
| 06-2 | settings, 닫힌 영역 지연조회·단가 N+1 | 미실행 |
| 06-3 | production, 날짜 범위·수량/차감 보호 | 미실행 |
| 06-4 | bag / equipment | 미실행 |
| 06-5 | supplement / schedule | 미실행 |
| 06-6 | egg / frozenProduct | 미실행 |
| 06-7 | frozenPan / freezeOp / frozenSep | 미실행 |
| 06-8 | meat | 미실행 |
| 06-9 | stats, XLSX 클릭 시 import | 미실행 |

- [ ] 활성화 route만 `VITE_PERF_ROUTES`에 등록했다.
- [ ] 미이행 route와 이유를 기록했고, legacy에서도 공통 shell과 충돌하지 않는다.
- [ ] T15~T17 및 각 저장 경로 테스트를 통과했다.

**Gate:** 승인한 1차 적용 route는 모두 완료. 나머지를 제외한 사유를 명시한다. **인계:** route/역할/flag 행렬, 커밋 목록, 메뉴별 결과.

## 07. 프런트 릴리스

- [ ] 동일 조건 20회 이상 cold/warm 측정, 신규 query 수, listener 수를 비교했다.
- [ ] 성능 목표와 T01~T20 중 적용되는 전체 gate를 통과했다.
- [ ] off fallback build에도 단계01의 저장 검증이 유지된다.
- [ ] 테스트·자산·flags·이전 revision을 포함한 release manifest를 작성했다.
- [ ] deploy wrapper가 manifest flags를 재주입하고 재빌드 전체 자산 hash가 일치할 때만 gh-pages로 전송한다.
- [ ] 배포 승인 범위를 확인하고 상세 계획 R1 절차를 실행했다.
- [ ] 라이브 HTML과 모든 lazy chunk hash/HTTP200, Pages 완료, 역할별 진입을 확인했다.

**Gate:** CLI/build 성공과 live 완료를 구분. **인계:** source/gh-pages, assets manifest, client marks, 확인·미확인 업무 범위, rollback 방법. 서버 완료를 기다릴 필요 없다.

## 08. 서버 계약 준비

- [ ] 검증된 inventory base에서 `codex/production-dashboard-v1` 별도 worktree를 만들었다.
- [ ] 기존 Node22/TypeScript 초기화와 exports를 유지하고 새 파일만 추가한다.
- [ ] DTO·facts·SourceState·Jobs·Control과 영향 행렬을 구현 계약으로 고정했다.
- [ ] 같은 fixture/parity 및 logic/core/fixture hash 검증을 연결했다.
- [ ] projection 쓰기 allowlist와 source read-only adapter를 구현했다.

**Gate:** 02의 계약 일치, 형제 repo 런타임 import0, 원본 write API 주입0. **인계:** contracts, server manifest 초안, fixture 출처, 커밋.

## 09. 서버 구현·emulator

- [ ] create/update/delete observer, 현재 원문 재조회와 source fingerprint를 구현했다.
- [ ] day/view 두 job과 pending day barrier, desired/applied generation, lease/fence, coalescing을 구현했다.
- [ ] lease별 buildId/create-only chunk 모두 성공 후 root를 교체하고 실패 시 마지막 정상 view를 보존한다.
- [ ] retry 시각을 lease 취득 전에 확인하고, Control revision 변경이 이전 worker의 publish를 막는다.
- [ ] bounded retry/sweep/rollover와 off/shadow/serve를 구현했다.
- [ ] 신규 projection rules/index만 추가하고 기존 앱 권한 회귀를 검증했다.
- [ ] 운영 접속을 거부하는 demo emulator에서 서버 부분 T21~T23/T25/T26/T29/T30을 통과했다. T24는 단계10, 프런트 summary 검증은 단계13에서 진행한다.

**Gate:** 중복/역순/재생성/임대 만료/지속 변경에서 요청 유실·혼합 세대·원본 write0. **인계:** emulator 결과, burst 읽기/쓰기 계수, 정확한 함수 allowlist, 커밋.

## 10. 초기 집계·검증 도구

- [ ] backfill은 기본 dry-run, apply는 명시 인자와 source/projection 한도 필수다.
- [ ] page200/concurrency2, checkpoint/resume, 전체 과거 생산일 discovery를 구현했다.
- [ ] discovering/building/verifying/complete를 분리하고 요구 generation 적용·누락 facts0·원본 parity 뒤에만 complete로 만든다.
- [ ] backfill 도중 변경/삭제/재시작에 이전 snapshot이 최신 자료를 덮지 않는다.
- [ ] 독립 원본 계산과 summary 차이를 필드별로 보고한다.
- [ ] sourceState를 이용한 삭제 reconciliation과 read/write 비용 산식을 준비했다.
- [ ] mode 제어·선택 deploy wrapper·rollback 명령을 로컬에서 검증했다.

**Gate:** T24, dry-run write0, apply source write0, 한도 초과 시 checkpoint 후 중단. **인계:** 실행 가능한 scripts, dry-run 산출물, 커밋.

## 11. 서버 운영 shadow 배포

- [ ] 실제 live 함수/규칙/index와 inventory release diff를 대조했다.
- [ ] 신규 함수명·region·scheduler·한도·예상 월비용·backfill cap·경보 수신자를 확정했다.
- [ ] 미배포된 다른 앱 변경을 분리하고 배포 allowlist를 dry-run으로 출력했다.
- [ ] 해당 범위의 승인이 있는지 확인했다. 없으면 완성된 manifest를 제시한 뒤 이 단계에서 확인한다.
- [ ] 신규 index ready → additive rules → 신규 함수 off/shadow만 배포했다.
- [ ] 기존 앱 권한/서비스와 신규 실제 revision을 확인했다.

**Gate:** bare functions/Hosting/생산 repo rules 배포0, 원본 write0. **인계:** 승인 근거, 한도, live revision/hash, rollback 명령. 금액을 추측해 스케줄러를 켜지 않는다.

## 12. 운영 초기 집계·shadow 비교

- [ ] source observers가 변경을 수집하는 상태에서 승인 한도 내 projection-only backfill을 실행했다.
- [ ] 모든 과거 생산일 discovery 뒤 facts 생성·세대 적용·parity까지 확인하고 backfill complete에서만 후보 계산을 활성화했다.
- [ ] 정상 변경·과거 수정/삭제·완료 취소·날짜 변경을 원본 read-only와 비교했다.
- [ ] backlog·lease·source reads·projection writes·반영 지연이 한도 안이다.
- [ ] 불일치가 하나라도 있으면 serve로 넘어가지 않았다.

**Gate:** 불일치0, 제어 시험 갱신 p95 <= 5초/30초 초과 경보·fallback, backfill 완료. **인계:** comparison JSON, 실제 사용량, 운영에서 관측하지 못한 조건. 운영 데이터에 테스트 생산을 넣지 않는다.

## 13. 요약 제한 적용

- [ ] mainViewSource summary adapter가 schema/logic/date/mode/root/chunk를 검증한다.
- [ ] 승인된 검증 대상만 summary-shadow 이중 조회로 parity를 확인한다.
- [ ] 검증 대상은 build-time UID 해시 목록으로 제한한다. client는 내부 Control 대신 공개 root의 mode/controlRevision을 읽는다.
- [ ] missing/error/mixed generation/dirty form/fallback 루프를 검증했다. permission은 자동 fallback 대신 표시 중단·세션 재검증으로 처리한다.
- [ ] 제한된 대상에게 summary 표시를 켜고 20회 이상 cold/warm을 측정했다.
- [ ] 저장 명령은 summary 객체를 받지 않고 기존 gateway를 사용한다.

**Gate:** 07+12 완료, 프런트 T23/T27/T28/T30과 앞선 서버 검증을 합쳐 T21~T30 전체 확인, 표시 불일치0, 성능 목표·명령 경계 통과. **인계:** 적용 대상/flags, 표본, fallback 원인/비율, 커밋·배포 증거.

## 14. 전체 적용·인수

- [ ] 검증된 역할·route에 한해 확대했다.
- [ ] 첫 정상 운영일의 비교·지연·비용·backlog를 확인했다.
- [ ] rollover/sweep/reconciliation/예산 경보의 소유자·주기·알림 경로를 기록했다.
- [ ] legacy/emergency disable과 구세대 chunks를 유지한다.
- [ ] source/server/rules/index/logic/fixture/assets를 하나의 release 기록으로 연결했다.
- [ ] 미이행 메뉴·미검증 조건·기존 동시성 SC 범위·즉시 rollback을 최종 보고했다.

**Gate:** 상세 계획 §14 인수 보고 완성. 사용하지 않은 구버전 코드/자료 정리는 다음 별도 작업이다.

## 중단·복구 카드

| 발견 상황 | 즉시 할 일 | 재개 조건 |
| --- | --- | --- |
| payload/계산 불일치·gateway 우회·확인 상태 복구 | 해당 route flag 중단, 원본 경로 유지 | 재현 fixture와 수정 테스트 통과 |
| 다른 계정 자료·권한 밖 노출 | 표시 중단/세션 폐기, 확대 중단 | 역할·계정 전환 회귀 통과 |
| summary 세대 혼합·실패·과도한 지연 | 공개 mode off, 원본 provider | parity·갱신 지연·fallback 통과 |
| worker/read 비용 폭주 | Control off, manifest 신규 handler만 제한 | 원인/예산·재시도 테스트 통과 |
| 새 asset 실패 | 안전 가드 유지 fallback build 재배포 | live 전체 chunk hash/메뉴 확인 |

원본 DB 복원·wipe, gh-pages force-push, 기존 다른 앱 함수 중단을 복구 수단으로 사용하지 않는다. 상세 명령과 순서는 상세 계획 R3을 따른다.

## 단계 종료 기록 양식

각 단계마다 다음 항목을 실제 값으로 기록한다. 실행하지 않은 항목은 `미실행`, 해당 없는 항목은 이유와 함께 `해당 없음`으로 남긴다.

```text
단계 / 실행자 / 일시:
시작 HEAD → 완료 commit:
변경 파일 / 선택한 flags:
실행 명령과 exit code:
테스트 수·주요 결과 / 실패·해결:
fixture·표본 환경 / p50·p95 / query·document·write 수:
증거 파일 절대경로:
승인 근거·범위 (운영 단계만):
라이브 revision·자산 검증 (배포 단계만):
다음 단계 인계 / 잔여·미검증 / rollback:
```

## 다음 구현자에게 전달할 시작 지시문

> `docs/PERFORMANCE_EXECUTION_PLAN_20260914.md`와 이 체크시트를 읽고, 승인된 구현 범위 안에서 단계00부터 순서대로 진행하라. 현재 운영 기능을 포함한 HEAD를 확인하고 별도 worktree를 사용하라. 단계01 저장 검증을 먼저 완성하고 캐시 확대는 이후에 진행하라. 각 단계의 코드·테스트·증거를 남기고 gate를 통과한 단계만 완료 표시하라. 기존 원본 쓰기 규칙·재고 계산·역할·설비 기능을 보존하라. 서버 작업은 inventory의 별도 worktree에서 projection-only로 진행하라. 운영 배포는 완성된 manifest와 기존 승인 범위를 확인한 뒤 해당 단계에서 실행하라. 계획에 적힌 신설 명령은 먼저 구현·검증하라. 새로운 사실로 계획을 바꿀 때에는 근거와 두 문서의 변경을 함께 남겨라.
