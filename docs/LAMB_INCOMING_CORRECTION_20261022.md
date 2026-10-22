# 양제비추리 입고량 정정 — 2026-10-22

사용자 승인 범위: 현재 재고를 변경하지 않고 기존 이력을 보존하면서 2026-06-09 입고량을 82.973kg로 정정한다.

## 보존과 정정 계약

- 원본 `meatLogs/vj204sVCQMi3ZYFIYneb`: 82,973,000g를 그대로 보존.
- 기존 수동조정 `meatLogs/yMzz7k1QFHlzIBJbt07m`: 82,973,000g → 82,973g를 그대로 보존.
- 추가 기록 `meatLogs/incomingQuantity_v1_vj204sVCQMi3ZYFIYneb`: `type: incomingQuantityCorrection`, `delta: 0`, `changesStock: false`, `originalQtyG: 82973000`, `correctedQtyG: 82973`.
- `date`는 원본 입고일, `timestamp`는 실제 정정 기록 시각이다. `correctionOf`와 `basisAdjustmentId`가 원본과 근거를 연결한다.
- 통계의 입고 집계만 정정량으로 대체한다. 별도 입고 건수나 사용량으로 추가하지 않는다. 원본·근거가 일치하지 않으면 집계를 중단한다.
- 기존 재고 문서의 `initialQtyG`도 감사 근거로 보존한다. 현재고 계산은 기존 `remaining`/`closed`를 사용한다.
- 스크립트는 기본 dry-run, `--execute`에서 결정적 ID의 기록 1건만 create한다. 같은 내용 재실행은 쓰기 0건, 다른 내용 덮어쓰기는 차단한다.

## 운영 검증

- 2026-10-22 13:45 KST 적용: 쓰기 1건. 양제비추리 재고 문서 10개와 모든 기존 로그의 데이터·버전 동일.
- 대상 로트 잔량 0g / 마감 유지. 열려 있는 양제비추리 재고 53,301.142857g 유지.
- 양제비추리 입고: 6월 149.973kg / 2건, 전체 192.973kg / 3건. 입고일·수급 간격 유지.
- 전체 원료 누적 입고 106,181.001kg → 23,290.974kg. 차이 82,890.027kg. 생산·사용 통계 및 최근 3개월/당월 입고 통계 영향 없음.
- 실제 운영 스냅샷을 독립 계산과 31,359항목 대조, 불일치 0. 기존 미확인 생산 1건은 미확인으로 유지.
- 운영 백업과 정정 결과는 로컬 `output/lamb-correction/`, 통계 스냅샷은 `output/stats-live-audit/`에 보관하며 배포에 포함하지 않는다.

자동화, 설비 교체 주기, Firestore Rules 및 재고 차감 로직 변경 없음.
