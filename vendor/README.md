# SheetJS 공식 archive

`xlsx-0.20.3.tgz`는 SheetJS Community Edition 0.20.3의 공식 배포 archive다.

- 공식 원본: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
- 공식 설치·vendoring 안내: https://docs.sheetjs.com/docs/getting-started/installation/nodejs/
- 라이선스: Apache-2.0. archive 안의 `package/LICENSE`를 수정하지 않고 보존했다. 이 배포 archive에는 별도 `NOTICE` 파일이 없다. 향후 공급사가 포함한 LICENSE·NOTICE는 제거하거나 변경하지 않는다.
- 수신한 archive SHA256: `8dc73fc3b00203e72d176e85b50938627c7b086e607c682e8d3c22c02bb99fe8`

직접 의존성은 `file:vendor/xlsx-0.20.3.tgz`로 고정하며, package-lock의 integrity와 함께 검토한다. 설치 중 lifecycle script를 실행하지 않는다. 공식 HTTPS로 받은 바이트의 자체 해시를 확인한 것이며, 별도의 공급사 서명이나 독립적으로 게시된 checksum을 검증했다는 뜻은 아니다.

공식 advisory는 CVE-2023-30533에 0.19.3 이상, CVE-2024-22363에 0.20.2 이상으로 갱신하도록 안내한다. 이 앱은 기존 내보내기 전용 API와 primitive-only AOA 검사를 유지하며, 이 갱신이 모든 의존성 경고나 임의 파일 파싱 경로의 안전성을 보증하지 않는다.
