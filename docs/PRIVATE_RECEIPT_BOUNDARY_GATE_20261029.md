# 교차 저장소 입고 수동 감사

`tests/receiptBoundary.test.mjs`는 공개 기본 `test:readpath`에 포함되지 않는 수동 감사다. 공개 생산 writer와 선택한 비공개 재고 TS consumer를 메모리 Firestore로 실행한다. 실제 source를 합성 구현으로 대체하지 않으며, stock 생성 helper는 명시적으로 포착한 합성 경계다. 실제 SDK·HTTP·배포 consumer 검증과 동등하지 않다.

필수 인자는 `--production-root`, `--inventory-root`, `--pins`, `--expected-pins-sha256`, `--output`이다. 무인자·알 수 없는/중복 인자·scope 누락·해시 불일치·기존 결과파일은 명시 실패한다. 두 root의 기본 경로는 없으며, 선택한 production root의 이 gate를 직접 실행해야 한다. 결과는 해당 root의 새로운 `output/` 파일에만 쓴다.

검토된 pin manifest는 `{version:1,production:{상대경로:SHA256},inventory:{상대경로:SHA256}}` 형식이다. production은 현재 `src/` 코드·`tests/helpers/`·VM fixture 모듈·package/lock·gate 자신을 전수 결속한다. inventory는 실제 읽는 TS6개(type3개·units·workflow client·receipt service)만 결속한다. 경로 escape·심볼릭 링크·추가/누락 scope를 거부한다. 기대 manifest SHA는 별도 검토 기록에서 명시 전달해야 하며, 실행하면서 임의 현재 소스를 새 trusted pin으로 승격하지 않는다.

실행 전후 source 해시와 파일을 읽을 때의 해시를 검사한다. 공개 root의 실제 pageDom helper를 동적 로드하며, 실제 private TS는 그 root에서 읽고 가상 모듈에서 실행한다. 표준 network 진입점/fetch는 거부하고, 명시 source 또는 설치 의존 모듈 밖의 파일 읽기를 거부한다. 자격증명이나 운영 원문은 필요하지 않다. 기대된 source와 설치 의존성은 신뢰된 검토 입력이어야 하며 이 도구 자체가 임의 악성 Node 코드의 완전한 sandbox라는 주장은 하지 않는다.

공개 writer 보호는 `mainReceipt`20건(18개 선언과 2개 표 기반 시험), pure `receiptRulesPatch`2건 및 F1/F2 frontend 시험으로 계속한다. private gate는 실제 재고 consumer의 최신 pending 선택·revision2 1회 수신·낡은 revision1 거부 의미를 유지한다. 기본 suite에서 제외한 시험을 공개 synthetic PASS로 둔갑시키지 않는다.

검증: focused25/25·기본 readpath184/184, 정상 수동 gate의 network/file/credential/운영 writes0. 수동 결과는 source hash와 합성 수량만 포함한다. 이 분리는 package script와 시험만 변경하며, 브라우저 bundle source·dependencies·stage2의 실제 runtime 검증을 재구축하지 않았다. 운영·원격 Git 작업은 실행하지 않았다.
