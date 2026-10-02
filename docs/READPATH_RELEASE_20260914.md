# 조회 구조 1차 릴리스 기록

이 문서는 session 1차 배포의 기록이다. 이후 서버 요약 연결 상태는 [요약 릴리스 기록](SUMMARY_RELEASE_20260914.md)을 따른다. 아래 서버 미배포 표기는 1차 배포 당시 상태다.

현재 범위는 실행 계획의 프런트 1차 릴리스다. 서버 요약(08~14), 다른 메뉴의 세션 모델 전환, SC-1/SC-2 완료를 뜻하지 않는다.

## 변경

- 세션 epoch/구독 풀/메인 모델: 메인 재방문에서 추가 bootstrap 조회 없이 재사용. Auth token/역할/날짜 변경 시 폐기. 첫 cache-only 응답을 확정된 빈 결과로 쓰지 않는다. 초기 응답 timeout과 명시 재시도 제공.
- 공통 navbar/subbar 유지, 본문은 새 노드 생성. 모달 소유자·Sortable·Chart·timer 정리. 입력 중 주소 이동 확인에서 원래 입력 유지.
- 서버 전용 command read scope 및 원본 fingerprint. 메인 입고/이벤트/확인/재고 처리와 마감·해제 사전 검증. 마감 조회 실패 차단. 최종 마감에서 누락된 자동 알림 조건도 읽기 전용 검사.
- 마감 후보 로그·마감 문서를 날짜 IN으로 묶음. 실패한 묶음만 일별 조회로 재검사하여 기존 날짜별 판정/오류 우선순위 유지.
- 설정 8개 섹션은 펼칠 때 조회. 설정값의 기존 blur 저장 정책 유지. 영양제·통계 XLSX는 다운로드 클릭 시 import.
- 배포는 flags를 고정하고 재빌드의 전체 파일명·SHA-256 검사. 검증한 commit/flags/파일과 다르면 전송 중단.

첫 활성 route는 `main`. 나머지 13개 메뉴는 상단·수명 관리 개선을 사용하지만 페이지 데이터는 기존 조회 경로를 유지한다. registry는 SDK queryEqual로 동일 쿼리를 공유하며 SDK 내부 직렬화를 하지 않는다. 명명된 쿼리 registry, 페이지 모델 LRU/64MB 회수는 후속 대상이다.

## 측정

`npm run perf:measure`: 운영 연결 없는 Node VM 합성 데이터, 조건별20회. DOM paint/운영 네트워크 수치가 아니다. 기준 source `dddae06`.

| 조건 | 이전 p50 | 변경 p50 | 변경 p95 | 조회 |
| --- | ---: | ---: | ---: | --- |
| 요청당50ms / cold data ready | 424ms | 178ms | 190ms | 53 → 27 |
| 요청당150ms / cold data ready | 1,093ms | 479ms | 499ms | 53 → 27 |
| 50ms / warm 모델 재계산 | 364ms | 6ms | 8ms | 52 → 0 |
| 150ms / warm 모델 재계산 | 914ms | 7ms | 9ms | 52 → 0 |

별도 브라우저 fixture: 메인 재방문20회, 두 paint 기회까지 p50/p95 33/33ms, 추가 조회0회·쓰기0회. 느린 CPU 조건은 미측정. 원시 표본은 `output/readpath/measurement.json`.

## 검증

- Node readpath/performance/release37개, 기존 Phase3a24/24·Phase3b18/18 통과.
- 실제 Firestore emulator4/4: 두 client의 생성/수정/삭제 반영, 단일 listener, 로그아웃 정리, 역할별 접근, 충돌/offline command0, 날짜 IN/missing doc.
- emulator는 `demo-fant-readpath`, `127.0.0.1:8088` 강제. rules는 inventory HEAD 사본이며 배포하지 않음. 운영 project 실행 거부.
- 로컬14개 메뉴 진입, 이벤트 입력 중 주소 이동 취소→값 유지, 외부 계란 변경→상단 수량 갱신 확인.
- 설정 입력 시험에서 fixture가 활동 로그 쓰기를 의도적으로 거부한 오류1건은 로컬 제한이다. 저장 성공으로 계산하지 않는다.
- 기본 flags OFF build 성공. 실제 ON build와 전송 직전 재빌드의 전체 자산 SHA-256 일치 확인.

## 운영 배포 완료

- 운영 source: `23332c13747e6a86e42e0799975897bedf437cee`.
- gh-pages: `006e599dd7c174e5731622c7ac070fe668c469c4`, Pages 실행 `34811616174` 성공.
- flags: shell/store=true, routes=main, viewMode=session.
- 운영 파일 **37/37** SHA-256 일치. 일부 CDN의 일시적 404는 재검증 때 모두 해소됐다.
- 운영 로그인 세션으로 14개 메뉴의 읽기 전용 진입 확인. 메인 본문 19,431자가 변경 전과 동일했다. 전체 업무 저장 회귀를 뜻하지 않는다.
- 배포 이후 `4462fb1`은 테스트 fixture의 `data()`에서 문서 ID를 제거한 수정이며 운영 코드 변경이 아니다.
- 증거: `output/readpath/release-manifest.json`, `output/readpath/live-verification.json`.

## 운영 조사와 남은 범위

읽기 전용 count: productions449, productionCompletion65, closings65, eggLogs110, frozenPanStock6, schedules55, activityLogs11357, events0, holidays71, recipes28, meatTypes30, meatStocks146, bagTypes24, eggStock1, supplementTypes172, supplementStock172, equipmentParts44, equipments5, settings5, staffGroups3. 조사 이후 달라질 수 있다. 문서 내용/토큰은 보고서에 저장하지 않았다.

기존 Functions10개 ACTIVE 확인. 새 Functions/rules/index/scheduler/projection은 아직 운영 배포하지 않았다. 기존 원본 스키마·차감·outbox 프로토콜을 유지한다. 사전 서버 조회는 이후 동시 쓰기까지 원자적으로 막지는 않는다. 전송 후 결과불명 read-back, 전 메뉴 gateway/모델, 서버 운영 비교·비용·초기 집계·summary 화면 연결은 미완료다.

서버 로컬 후속 구현은 `C:/dev/fant-inventory-dashboard`의 `codex/production-dashboard-v1`에 분리했다. 날짜 사실/세대/lease/재시도/초기 집계·재개/선택 배포 도구를 구현했다. 순수 계산·계약12개와 emulator9개가 통과했고, 실제 원본을 읽어 기존 프런트를 메모리 fixture에서 실행한 비교도 불일치0·운영쓰기0이었다. 이 결과는 운영 trigger 실행이나 summary 화면 배포 증거가 아니다. 세부 상태는 해당 저장소의 `docs/PRODUCTION_DASHBOARD_IMPLEMENTATION_20260914.md` 참조.

## 배포 절차

1. 소스 commit과 작업 트리 확인.
2. `npm run release:prepare`.
3. `node scripts/deployReadpathRelease.mjs --verify-only`.
4. `npm run deploy` (gh-pages만).
5. `npm run verify:readpath-release`, 운영 메뉴 읽기 확인.
6. 라이브 release.json source/flags와 결과를 본 문서에 기록.

문제 시 원본 데이터 복구 없이 이전 gh-pages 자산으로 되돌린다. 임시 해제는 세션 `fant:perf:disable=1` 후 새로고침. 사용자용 활성화 스위치는 없다.
