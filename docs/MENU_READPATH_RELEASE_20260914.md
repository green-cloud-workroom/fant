# 전 메뉴 조회 구조 적용 릴리스

2026-09-14. 사용자 구현·배포 지시와 월 추가 운영비 1만원 이내 목표에 따라 남은 메뉴 이행을 완료했다. 최종 배포 식별자는 아래 운영 배포 기록에 남긴다.

## 변경 내용

- 메인 서버 요약은 유지하고 13개 메뉴와 동결작업 하위 화면에 세션 조회 모델·필요 범위 구독·화면 수명 관리를 적용했다. 최대 3개 모델, 비활성 owner 최대 2개, 30초 grace와 64MB soft budget으로 보관을 제한한다.
- 독립 조회는 병렬화했다. 설정은 8개 영역을 열 때 조회하며 첫 진입 데이터 조회는 0회다. 통계는 선택 탭/기간만 읽고 Excel 코드는 다운로드할 때 받는다.
- 저장 직전 서버 원본·권한·마감·세션을 다시 확인한다. 중복/결과불명 전송은 자동 재발행하지 않는다. 계란/영양제/봉투 재고와 관련 이력, 예정 완료 등은 명시된 transaction/batch 경계를 사용한다. [저장 경로표](ACTION_PATHS.md)에 기존 다단계 경계와 한계를 기록했다.
- 외부 갱신이 입력을 덮지 않도록 draft를 보존하며 명시적 갱신을 제공한다. 빠른 통계 탭 전환에서 이전 응답이 새 탭에 표시되던 경합을 수정하고 다운로드에도 같은 탭/기간 검증을 적용했다.

## 검증

`npm run test:readpath` 99개, `npm run test:readpath:integration` 6개 통과. 후자는 실제 Firebase SDK와 demo Firestore 에뮬레이터이며 운영 DB 저장은 없다. 10개 업무 golden이 직전 운영 source `61af19a`와 동일한 payload를 생성했다. 6개 실제 메뉴 DOM을 100회 교체한 뒤 listener 잔류 0, 모델 수 제한을 확인했다. 통계 100회 기간 변경의 query 정리도 검증했다.

성능은 메뉴별 20회 cold + 20회 warm, 요청당 50ms 지연을 넣은 Node VM/DOM fixture다. 실제 브라우저/운영 네트워크 p95가 아니다. baseline은 `61af19a`다.

| 메뉴 | 첫 진입 p95 전→후(ms) | 재방문 p95 전→후(ms) | 재방문 추가 조회 |
| --- | --- | --- | --- |
| 생산 입력 | 54→64 | 61→1 | 0 |
| 입고 예정 | 55→65 | 61→1 | 0 |
| 동결제품 | 56→62 | 61→2 | 0 |
| 동결판 | 126→61 | 122→1 | 0 |
| 동결 분리 | 54→62 | 61→0(반올림) | 0 |
| 동결작업 | 56→62 | 61→1 | 0 |
| 원료 | 122→57 | 135→1 | 0 |

동결판/원료의 첫 진입 대기는 약 52~53% 감소했다. 다른 메뉴 첫 진입은 개선을 주장하지 않는다. 예정 화면은 모달에서 쓸 master를 함께 준비해 첫 조회가 4→6으로 늘고 후속 모달 왕복을 줄였다. warm 수치는 세션에 모델이 남아 있고 갱신이 없는 경우다. 이전 메인 개선율을 이번 추가 개선율로 재사용하지 않는다.

증거: `output/readpath/menu-test-results.txt`, `menu-performance.json`, `core-compatibility.json`, `release-manifest.json`, `live-verification.json`. output은 로컬 검증 산출물로 git에 넣지 않는다.

## 서버·비용

이번 메뉴 변경에서 요약 코어 7개 파일 hash는 모두 유지됐다. logic `ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`, backend runtime source `4c61a80608e685f58a0479225590ff1441d0ac57`, Seoul Node22 함수 23개(min0), Control serve revision5다. 이번 후속 작업은 backend 재배포나 한도 증가를 하지 않았다.

2026-09-14 09:23:32 UTC 독립 검증에서 generation568, build `bc02d2b9-d7c5-4f98-8bbe-f67b23191aae`, 원본/공개 hash `4cea20b9d8836624512574636ab7b9f786e7ead3518ba3a565d51f7dc06fd50a` 일치. 검증 원본 쓰기0·projection 쓰기0, 전체 확인 읽기25,956건이다. 당시 공개 모델199,003bytes, 집계 원본1,704건. 증거는 backend `functions/output/production-dashboard/menu-release-verification.json` 및 프런트 `readpath.summary-acceptance.json`이다.

월 추가 비용 모델은 9,698원이다. 무료분 미공제·사용자10명·200KB·평균1.2초·환율1600원·부가세10% 가정이며 실제 청구액 상한이 아니다. 작업당 원본1,800/쓰기100, 일110시도·원본변경250건 한도를 유지한다. 최근 상태 completedJobs99/sourceEvents187로 일일 한도에 가까우며 한도를 올리지 않았다. 한도/요약 오류 시 원본 경로로 복구한다.

## 계획 대비 확정 사항과 인수 한계

- query registry는 SDK `queryEqual`로 동등성을 판정하고 kind/path/sequence 식별자를 사용한다. SDK 내부 객체 직렬화나 메뉴별 수동 의미 키를 사용하지 않는다.
- 표시 baseline은 최신 서버 fingerprint와 일치할 때만 명령에 사용할 수 있다. 계획의 모든 명령을 ID만 받고 DTO를 새로 만드는 형태로 통일하지는 않았다.
- 기존 다단계 workflow를 보존한 곳의 전체 원자성/TOCTOU(SC1/SC2)는 제외다. 결과불명 차단이 이미 성공한 앞 단계의 rollback을 뜻하지 않는다.
- 첫 정상 운영일의 실제 p95·24시간 비용·모든 역할의 전체 저장 흐름은 미관측이다. 해당 관측을 완료로 체크하지 않는다. 구현/배포의 완료와 분리한다.

## 복구

문제 메뉴는 `readpath.release.json`의 VITE_PERF_ROUTES에서 제외하고 현재 안전 가드를 유지한 source로 커밋 → `npm run release:prepare` → `npm run deploy` → `npm run verify:readpath-release` 한다. 메인 요약은 VITE_PRODUCTION_VIEW_MODE=session으로 바꾸면 원본 조회로 돌아간다. 서버 off는 backend 릴리스 문서의 Control 명령을 사용한다. 원본 wipe/복원이나 다른 앱 함수 중단은 하지 않는다.

## 운영 배포 기록

최종 source·gh-pages·Pages 실행·자산 검증 결과는 배포 완료 후 이 절에 기록한다.
