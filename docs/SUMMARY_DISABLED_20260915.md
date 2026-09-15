# 서버 요약 중단

2026-09-15. 사용자 "그럼 꺼" 지시에 따라 서버 요약을 중단하고 메인을 session 원본 조회로 전환한다. 전 메뉴 세션 재사용·병렬 조회·지연 로딩·저장 안전 가드는 유지한다.

## 판단 근거

현재 코드를 동일한 합성 데이터로 각20회 측정했다. 요청 지연50ms에서 cold 데이터 준비 p95는 summary485ms/session192ms, 지연150ms에서 summary1247ms/session491ms다. 두 경로의 공개 표시 DTO는 같고 업무 쓰기는0이었다. warm 재계산은 양쪽 모두 신규 조회0회다. 요약 경로는 원본 알림 조회가 남아 있으며 순차 대기가 있어 이 조건에서는 오히려 느렸다.

Node VM 측정으로 인증·번들 다운로드·DOM paint·데이터 전송량은 포함하지 않았다. 운영 전체의 체감 시간을 측정한 수치가 아니다. 원본 경로는 cold 조회 요청이12→27로 늘므로 기존 Firestore 비용이0이 된다는 뜻도 아니다. 측정 원본은 `C:/dev/fant-production/output/summary-comparison/results.json`이다.

## 중단 범위

- Control/runtime과 현재 공개 root를 off로 전환한다. 기존 요약 클라이언트도 원본 경로로 대체한다.
- 프런트 `VITE_PRODUCTION_VIEW_MODE=session`으로 재배포한다. 다른3개 release flag는 유지한다.
- `productionDashboard.deploy.json`의23개 함수만 Seoul에서 제거하고 해당 정기 작업2개 제거를 확인한다. 다른 앱의 배포/규칙/index/업무 원본은 변경하지 않는다.
- backend 진입점에서 요약 함수 export를 제거하고 선택 배포 gate를 false로 둬 실수로 재활성화하지 않도록 한다. 소스와 마지막 요약 데이터는 보존한다.
- 이번 기능의 새 함수 실행·집계·스케줄 호출을 중단하는 조치다. 이미 발생한 사용료나 보존된 자료/빌드 이미지의 저장 비용까지0이라고 주장하지 않는다.

## 복구

다시 사용할 경우 사용자의 재활성화 지시 후 export와 배포 gate를 복원하고, 선택 함수 배포 → shadow → 재집계 → 독립 원본 검증 → serve → 프런트 summary 순서로 진행한다. 보존된 요약은 오래된 데이터이므로 바로 serve로 바꾸지 않는다.

## 배포 확인

최종 서버 제거 수·Control revision·프런트 source와 운영 자산 검증은 작업 완료 후 기록한다.
