# 조회 구조 변경의 저장 경로

2026-09-14. 범위: 14개 메뉴, 동결작업 하위 화면, 공통 마감. 실제 운영 데이터로 저장 시험을 하지 않았다. 정상 payload는 격리 fixture와 직전 운영 source `61af19a` 비교로 검증했다.

## 공통 규칙

메뉴 버튼 → 입력/확인 화면 → 기존 핸들러 → `withReadCommand` 또는 `runPageCommand` → 서버 원본 재검증 → 기존 서비스/SDK 쓰기 순서다. 표시 baseline과 현재 서버 문서/쿼리 fingerprint가 다르면 쓰기 전에 중단한다. UID·역할·날짜·화면 수명도 확인한다. 표시 캐시만으로 쓰기를 승인하지 않는다.

`commandBatch`는 500개 이하 쓰기를 한 batch로 제출한다. `commandWrites`/`withReadWorkflow`는 기존 여러 단계의 순서를 유지하며 각 단계의 결과를 확인한다. 오류·응답 유실·시간 초과 후 자동 재발행하지 않고 재조회/화면 복구를 요구한다. 아직 해결되지 않은 전송은 강제 새로고침으로도 다시 발행할 수 없다. 전체 여러 단계를 하나의 transaction으로 바꾸지는 않았다.

| 화면 / 파일 | 사용자 진입 → 최종 동작 | 저장 경계 / 주요 보호 |
| --- | --- | --- |
| main.js | 일정 추가·수정·삭제, 로그 확인/일괄확인, 재포장 확인, 입고 확인 | actionGateway 서버 재검증. submit은 1회 전송+오류 read-back. 기존 confirm 경로는 일회용 확인권; 오류 후 다시 열어 재검증 |
| layout.js | 오늘/과거 마감, 마감 해제 → 담당자/사유 확인 | 사전검사 반복 후 action.submit 1회. 기존 closeDate/releaseClosing 보존 |
| recipe.js | 레시피 추가·편집·삭제·정렬 | withReadCommand; 기존 영양제 재고를 preset 재추가로 초기화하지 않음. 삭제된 입력행·preset도 dirty 판정 |
| production.js | 날짜 선택 → 생산 추가·수정·삭제·순서 변경 | workflow; 기존 생산/영양제 transaction 후 회차·batchNo 재계산 순서 보존. 환급 stock 읽기를 transaction 쓰기보다 앞에 배치 |
| schedule.js | 예정 추가·수정·취소·완료 | withReadCommand+batch; 완료 재고·이력·ledger·예정·activity를 동일 batch로 제출 |
| supplement.js | 날짜별 입고 셀/조정 셀 → 수량·사유 저장 | stock+log+activity transaction. 음수 방지, 다른 셀 draft 유지 |
| egg.js | 입고·조정·최소재고 변경 | withReadCommand; stock/history transaction, 현재 수량·최소값 비교 및 서버 마감 확인 |
| bag.js | 봉투 추가·편집·삭제·정렬, 입고·조정 | master 명령 + stock/history transaction. 상세 이력은 bagId 조건 조회 |
| equipment.js | 설비·부품 추가/복사/편집/삭제/정렬, 입고·교체 | master batch, stock/교체이력 transaction. 기존 교체주기 계산 보존 |
| frozenProduct.js | 제품 master/정렬, 제품 입고·수정·삭제 | workflow; 봉투 차감 → 기존 제품/이력/outbox 단계 보존. 한 단계 오류면 다음 단계 중단 |
| frozenPan.js | 동결판 입고·사용·조정·출고/확정/취소 관련 확인 | workflow; 기존 FIFO·ledger·재고 쓰기 순서 보존 |
| freezeOp.js | 작업 생성·배치 저장·취소 | workflow; 취소 시 원래 재고 복구. 하위 탭 이탈 시 구독 해제 |
| frozenSep.js | 분리·출고·수정·삭제·조정 관련 확인 | workflow; 소수 수량 및 원본 로그 계산 보존. 기존 생산 역할 허용 범위 유지 |
| meat.js | 입고·가공·재포장·조정, 원료 master/분류/순서 관리 | workflow; FIFO 원본 재검증, 기존 stock/log 순서 보존 |
| settings.js | 시스템값·마감설정·메뉴담당·직원·가격 등 각 영역 저장 | workflow; 변경 필드/직원 배열의 서버 값 비교. 실패한 입력 유지. 닫힌 영역 진입 조회 없음 |
| stats.js | 기간/탭 선택 → 현재/전체 Excel 다운로드 | 업무 쓰기 없음. 클릭 시 XLSX import, 응답 tab/range/token 일치 및 현재 표시 모델 준비 후 다운로드 |

## 검증과 한계

- 99개 프런트 테스트 및 실제 SDK 에뮬레이터 6개 통과. 에뮬레이터는 demo 프로젝트만 허용한다.
- 직전 운영 코드와 10개 업무 golden을 비교했다. 생산 생성/품목변경/삭제 환급, 예정 입고, FIFO, 제품입고/봉투/outbox, 원료 입고/조정/가공/재포장, 소수 분리/출고, 작업 취소 복구가 포함된다.
- source 변경·offline·권한 변경·이전 화면·이중 클릭·응답 유실·계속 pending인 전송의 반복 제출을 검증했다.
- 기존 여러 단계 저장의 부분 성공 및 서버 재검증 직후 다른 사용자가 변경하는 TOCTOU 전체 해결은 이번 범위가 아니다. 일반 batch의 원자성은 읽은 값에 대한 동시성 보장과 다르다.
- 실제 역할별 모든 업무 저장, 운영 하루 비용/지연 관측을 완료했다고 주장하지 않는다.
