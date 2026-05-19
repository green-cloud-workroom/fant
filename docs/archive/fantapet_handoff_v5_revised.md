# Fantapet Management — 작업 핸드오프 v5 수정본

## 현재 상태 (2026-04-30)

**완료된 phase:**
- Phase 0 — 기준 핸드오프/초기 정리
- Phase 1A — 마감 인프라 코어 (`closings`, `activityLogs`, `closing.js`)
- Phase 1B — 자정 자동 로그아웃 (`midnightLogout.js`)
- Phase 2 — 마감 차단 함수 4개
- Phase 2.5 — `productionCompletion` ID 버그 수정
- Phase 3 — 미마감 UI (`getAllBlockingItems`, 빨간 배너, 메뉴 ⚠️, 로그인/배너 모달, 신규 등록 차단 헬퍼)
- Phase 4 — 마감 버튼 + 마감해제 + 로그아웃 가드
- 부수 패치 — 입고 완료 모달 실제수량 빈칸
- Firestore Rules 수정 — `closings` write 권한을 production(QC) 기준으로 변경
- 메인 대시보드 생산카드 UI 개선
- 내일생산불러오기 빈 데이터 가드

**다음 추천 작업:** Phase 5를 메인 대시보드 정리/알림 인프라 phase로 진행.

---

## Phase 4 완료 내역

### Phase 4a — UI 분리 + 마감 버튼 라벨 상태

**파일:** `src/layout.js`, `src/style.css`

추가:
- `navbar-right` 영역을 마감 버튼(`#closingBtn`) + 로그아웃 버튼(`#logoutBtn` ↗) 두 개로 분리
- `updateClosingButton()` 함수
  - `getEarliestUnclosedWorkday()` 결과로 라벨 분기
  - `earliest === null` → `마감해제` (오늘이 이미 마감됨)
  - `earliest === today` → `오늘 마감`
  - `earliest < today` → `어제 마감` (실제로는 가장 빠른 미마감 영업일)
  - 에러 시 → `마감` + disabled
- `dataset.mode` (`close`/`release`) + `dataset.targetDate` 셋팅
- `renderLayout` 끝에서 `updateClosingButton()` 호출
- CSS: `.close-btn:disabled`, `.logout-btn` 추가

### Phase 4b — 정상 마감 흐름 + 권한 분기

**파일:** `src/layout.js`

추가:
- `handleClosingClick()` 함수
  - 권한 체크: `currentUserRole !== 'production'` → alert 후 return
  - `mode === 'close'`: `getAllBlockingItems(targetDate)` 호출
  - `totalBlocked > 0` → `window.openBlockingModal()` 재사용
  - `totalBlocked === 0` → `showCloseConfirmModal(targetDate)`
- `showCloseConfirmModal(targetDate)` 함수
  - 담당자 드롭다운 (전체: senior + lead + office)
  - 확인 시 `closeDate(targetDate, staffName)` 호출
  - 성공 시 alert + `updateClosingButton()` + `updateBlockingBanner()` 갱신
- `db`, `doc`, `getDoc` import 추가

### Phase 4c — 마감해제 흐름

**파일:** `src/layout.js`

추가:
- `handleClosingClick()` 내 `mode === 'release'` 분기 → `showReleaseConfirmModal(targetDate)`
- `showReleaseConfirmModal(targetDate)` 함수
  - 사유(textarea, 필수) + 담당자 드롭다운(필수)
  - 사유나 담당자 비면 alert
  - `releaseClosing(targetDate, staffName, reason)` 호출
  - 성공 시 라벨/배너 갱신

### Phase 4d — 로그아웃 가드 팝업

**파일:** `src/layout.js`

추가:
- `handleLogoutClick()` 함수
  - `isDateClosed(today)` 체크
  - 미마감이면 confirm 팝업 → 취소면 return, 확인이면 `handleLogout()`
  - 마감 완료면 confirm 없이 바로 `handleLogout()`
  - 에러 발생 시에도 안전 fallback으로 logout 진행
- `logoutBtn` 이벤트 바인딩을 `handleLogout` → `handleLogoutClick`으로 교체

---

## 부수 패치 / Rules 수정

### 입고 완료 모달 실제수량 빈칸

**파일:** `src/pages/schedule.js`

`showCompleteModal(s)` 내 실제 수량 input의 `value="${s.orderedQty}"` → `placeholder="실제 입고 수량 입력"`로 교체.

이유:
- 발주수량이 자동 입력되어 사용자가 그대로 누르는 운영 사고 방지.

### Firestore Rules — closings 권한

**위치:** Firebase Console → Firestore → Rules

```js
match /closings/{doc} {
  allow read: if isAuthenticated();
  allow write: if isProduction();
}
```

이유:
- 마감/마감해제는 production(QC)만 가능.
- 기존 rule이 admin/office만 허용해서 production이 마감 시도 시 권한 오류 발생.

---

## 메인 대시보드 생산카드 UI 변경

**파일:** `src/pages/main.js`, `src/style.css`

### 변경 내용

기존:
- 메인 생산카드가 `레시피명 + 생산단위`만 보이는 단순 카드.
- 오늘 생산과 다음 영업일 생산이 동시에 위/아래로 보이는 구조였음.

변경:
- 생산카드를 첨부 이미지 스타일의 표 형태로 변경.
- 카드 안에 `부위 / 생산수량 / 단위` 테이블 표시.
- 생산단위 행은 노란색으로 강조.
- `ingredientsSnapshot` 기반으로 원료 목록 표시.
- 원육 연결 원료(`meatTypeId` 있음)는 kg, 기타 원료는 g로 표시.
- 크게보기 모달도 같은 표 카드 재사용.

### 현재 표시 정책

정책상 메인에는 **하루치 생산만 보여야 함**.

- 내일생산불러오기 전: 오늘 생산만 표시
- 내일생산불러오기 후: 불러온 다음 영업일 생산만 표시
- 오늘 생산과 내일 생산을 동시에 위/아래로 보여주지 않음

현재 코드에는 `activeProductions = isCompleted ? nextProductions : productions` 구조가 들어가 있음.

### 추가 확인 필요

실제 화면에서 여전히 오늘 생산과 내일 생산이 위/아래로 같이 보이면, 배포 캐시 또는 이전 코드가 남은 것일 수 있음. Phase 5 진입 전 다음을 확인:
- 메인 왼쪽 패널에 생산 섹션이 하나만 렌더링되는지
- `isCompleted === true`일 때 오늘 생산이 완전히 숨겨지는지
- `isCompleted === false`일 때 다음 영업일 생산이 숨겨지는지

---

## 내일생산불러오기 빈 데이터 가드

**파일:** `src/pages/main.js`

### 변경 내용

다음 영업일 생산이 0건이면:
- `내일생산불러오기` 버튼 disabled
- tooltip: `다음 영업일에 등록된 생산이 없습니다`
- 혹시 클릭 핸들러가 호출되어도 `alert('다음 영업일에 등록된 생산이 없습니다.')` 후 return
- `productionCompletion` 문서 생성하지 않음
- 마감 차단 항목 1번도 발생하지 않음

운영 원칙:
- 불러올 생산이 없으면 버튼을 누를 이유가 없음.
- 다음 영업일 생산이 없을 때는 마감 차단도 없음.

---

## 현재 마감 동작 흐름 정리

### 마감 버튼 라벨 (모든 role 공통)

| earliest | isDateClosed(today) | 라벨 | 동작 |
|---|---|---|---|
| `null` | `true` | 마감해제 | release 모달 |
| `=== today` | `false` | 오늘 마감 | close 모달 |
| `< today` | `false` | 어제 마감 | close 모달 (targetDate=earliest) |

### 권한 분기

| role | 동작 |
|---|---|
| `production` | 마감/해제 가능 |
| `admin`, `office` | 버튼은 보이되 클릭 시 alert |

### 차단 항목 체크 범위 (현재 4개)

| ID | 차단 조건 | 점프 메뉴 |
|---|---|---|
| 1 | 다음 영업일 생산 ≥1 + dateStr `productionCompletion`(completed) 없음 | main |
| 2 | `frozenPanStock` 발주행 미확인/미취소 | frozenPan |
| 3 | `schedules` status=scheduled | schedule |
| 7 | 노른자 사용 production ≥1 + 같은 날 `eggLogs(out)` 0건 | egg |

차단 4·5·6번(미확인 로그류) + 경고 3개는 아직 미구현.

### 로그아웃 가드

- 오늘 미마감 → confirm 띄움
- 오늘 마감 완료 → 바로 로그아웃
- 자정 자동 로그아웃: `midnightLogout.js` 유지. 23:55 토스트 + 00:01 강제 signOut.

---

## Claude 질문에 대한 점검 결과 — acknowledge 인프라

### 현재 코드 확인 결과

`src/services/activityLogs.js`:
- 현재 `activityLogs`는 `recordActivity()`로만 생성됨.
- 필드:
  - `action`
  - `subAction`
  - `date`
  - `staff`
  - `uid`
  - `timestamp`
  - `message`
  - `details`
  - `read: false`
- `acknowledged`, `acknowledgedAt`, `acknowledgedBy` 필드는 없음.
- `read`를 업데이트하는 서비스도 아직 없음.

검색 결과:
- `productionLogs`, `officeLogs` 같은 독립 컬렉션 사용 흔적 없음.
- 자동 재포장 확인용 별도 로그 인프라 없음.
- 자동 재포장은 현재 `meatStocks`의 `stage: 'repacked'` 데이터 흐름과 관련되어 있으나, “미확인 자동 재포장 로그”를 판정할 통합 로그 구조는 아직 없음.

### 결론

Phase 5에서 메인 알림과 차단 4·5·6을 바로 한 번에 UI부터 만들면 위험함.
먼저 acknowledge/read 인프라를 설계해야 함.

### 추천 결정

`activityLogs`를 앞으로의 통합 알림/사무 로그 기반으로 삼는다.

추천 필드:
```js
activityLogs/{autoId} = {
  action: 'closing' | 'production' | 'meat' | 'egg' | 'bag' | 'frozen' | 'office',
  subAction: string,
  date: 'YYYY-MM-DD',
  staff: string,
  uid: string | null,
  timestamp: Timestamp,
  message: string,
  details: object,
  read: false,
  acknowledged: false,
  acknowledgedAt: null,
  acknowledgedBy: null,
  acknowledgedByUid: null,
  severity: 'blocker' | 'warning' | 'info',
  jumpMenu: string | null
}
```

기존 데이터 마이그레이션:
- 실제 일괄 마이그레이션은 당장 하지 않음.
- 판정 시 `acknowledged !== true`를 미확인으로 간주.
- 기존 `read:false` 로그는 필요 시 `acknowledged:false`처럼 취급.

확인 처리 단위:
- Phase 5A에서는 단건 확인부터 추천.
- 일괄 확인은 Phase 5C 또는 후속으로 분리.

---

## 누락 / 후속 과제 목록

### 1. 메인 2주 캘린더 미구현

스펙상 메인 대시보드에는 2주 캘린더가 있어야 함.
현재 메인에는 캘린더가 보이지 않음.

추천:
- Phase 5 범위에 포함.
- 다만 메인 알림과 한 번에 섞지 말고 Phase 5B로 분리.

### 2. 메인 알림 패널 미완성

현재 `renderQuickInfo()`는 사실상 빈 껍데기 수준.
표시 항목:
- 계란 부족
- 내일생산불러오기 완료
- 알림 없음

스펙의 “생산 로그 / 사무 로그” 요구와 차이가 큼.

추천:
- Phase 5A에서 메인 알림 패널을 먼저 재설계.
- 단일 박스를 확장할지, spec처럼 생산 로그/사무 로그 2분할로 갈지 결정 필요.

### 3. 차단 항목 4·5·6 미구현

스펙상 마감 차단 항목:
- 4. 미확인 자동 재포장 로그 있음
- 5. 생산 로그 미확인 항목 있음
- 6. 사무 로그 미확인 항목 있음

현재 Phase 2/3/4는 1,2,3,7만 구현.

추천:
- Phase 5A에서 acknowledge 인프라 설계.
- Phase 5C에서 4·5·6 차단 함수 추가.

### 4. 경고 3개 미구현

스펙상 경고 항목:
- 내일 생산 입력 없음
- 봉투 최소재고 미달
- 원육 최소재고 미달

경고는 마감 차단이 아니라 “확인 후 진행 가능” 성격.

추천:
- Phase 5D로 분리.
- 차단 함수와 별도 `warningChecks` 계층으로 두는 게 안전.

### 5. 마감 후 수정/삭제 제한 전체 적용 점검 필요

현재 Phase 3/4는 마감 배너, 신규 등록 차단, 마감 버튼에 집중.
스펙의 “마감 이후 수정 제한”이 모든 페이지에 완전히 적용됐는지 불명확.

추천:
- Phase 6 별도 작업으로 분리.
- 각 페이지별 `추가/수정/삭제/출고/완료/취소` 버튼을 표로 정리한 뒤 적용.
- 차단 해소 액션은 막지 않는 원칙 유지.

### 6. 휴일 관리 미구현

`holidays` 컬렉션 및 설정 UI 없음.
`getNextBusinessDay()`가 토일만 기준이면 공휴일 계산 오류 가능.

추천:
- Phase 7 또는 Phase 5 이후 별도 작업.
- 설정 화면에 휴일 등록/삭제 UI 추가.
- `getNextBusinessDay(date, holidays)` 구조로 확장.

### 7. idempotency / race condition 보강 필요

현재 내일생산불러오기 정상 흐름은 앞단 가드로 중복 클릭을 막음.
하지만 race condition 가능성 남음:
- `productionCompletion`은 날짜 ID로 덮어쓰기 가능
- `stockLedger`는 자동 ID라 중복 생성 가능
- 동시 클릭/새로고침 타이밍에 재고 이중 차감 가능

추천:
- Phase 8 또는 운영 안정화 phase로 분리.
- Firestore transaction 사용 검토.
- `productionCompletion/{date}` 선점/상태 체크와 ledger 생성이 원자적으로 묶여야 함.

### 8. settings 권한 점검 필요

스펙:
- 생산실 계정은 설정 메뉴가 보이지만 접근 차단.

현재 코드에서 `settings`가 production role에도 보이는 구조였음.
실제 접근 차단이 되어 있는지 점검 필요.

추천:
- 권한 QA 항목으로 분리.
- `renderSettings()` 진입 시 production role 차단 여부 확인.

### 9. 통계 메뉴 미구현

현재 통계는 placeholder.
대표/사무 권한 메뉴.

추천:
- 운영 검증 이후 또는 Phase 9.
- 차트/엑셀 다운로드 범위가 커서 Phase 5와 섞지 않음.

### 10. prompt() → 커스텀 모달 교체

여러 페이지에 `prompt()` 사용 중.
순수 UX 개선이며 기능 추가는 아님.

추천:
- 마지막 정리 phase로 진행.

---

## Phase 5 추천 구조

### 결론

Claude 제안처럼 “Phase 5 메인 알림 + 차단 4·5·6 + 경고 3”을 한 이름 아래 묶는 방향은 맞음.
다만 한 번에 구현하지 말고 sub-phase로 분리해야 함.

### 추천 sub-phase

#### Phase 5A — 알림/acknowledge 인프라

목표:
- `activityLogs` 기반 확인 인프라 정의
- `acknowledged !== true` 판정 원칙 확정
- 단건 확인 함수 추가
- 메인 알림 데이터 wrapper 설계

추천:
- `read`는 기존 호환용으로 유지
- 새 인프라는 `acknowledged` 기준
- 기존 데이터는 `acknowledged !== true`면 미확인으로 간주

#### Phase 5B — 메인 알림 UI + 2주 캘린더

목표:
- 메인 우측 하단 `🔔 알림` 영역 재설계
- 오늘 처리해야 할 항목 카드 표시
- spec의 2주 캘린더 영역 복구/구현

알림 영역 선택:
- 추천은 A: spec에 맞춰 생산 로그 / 사무 로그 2분할로 재설계
- 단, 구현 부담이 크면 5B-1 단일 박스 확장 → 5B-2 2분할 전환으로 쪼갤 수 있음

#### Phase 5C — 차단 항목 4·5·6 추가

목표:
- 미확인 자동 재포장 로그
- 생산 로그 미확인
- 사무 로그 미확인
- `getAllBlockingItems(date)`에 4·5·6 추가
- 마감 버튼 차단에도 자동 반영

전제:
- Phase 5A의 acknowledge 인프라가 먼저 있어야 함.

#### Phase 5D — 경고 3개 추가

목표:
- 내일 생산 입력 없음
- 봉투 최소재고 미달
- 원육 최소재고 미달

원칙:
- 경고는 마감 차단 아님.
- 마감 모달 또는 메인 알림에서 노란색 warning으로 표시.
- 마감은 가능하되 사용자가 인지하도록 함.

---

## Claude 질문에 대한 답변 권장안

1. 알림 영역 구조: 최종 목표는 spec처럼 생산 로그 / 사무 로그 2분할. 구현은 Phase 5B에서 쪼개서 진행 가능.
2. acknowledge 인프라: `activityLogs` 기반으로 새 필드 `acknowledged`, `acknowledgedAt`, `acknowledgedBy`, `acknowledgedByUid`, `severity`, `jumpMenu` 추가. 기존 데이터는 `acknowledged !== true`로 미확인 처리. Phase 5A는 단건 확인부터.
3. 알림 클릭 동작: `확인` 버튼과 `처리하러 가기` 버튼을 분리. 카드 클릭은 상세 펼침 또는 무동작.
4. 차단/경고 시각 구분: 차단 빨강, 경고 노랑, 일반 정보 회색/초록.
5. 경고 3개: Phase 5 안에는 포함하되 Phase 5D로 분리. 차단 4·5·6보다 뒤.

---

## 다음 작업 추천 순서

1. Phase 5A — acknowledge 인프라 결정/구현
2. Phase 5B — 메인 알림 UI + 2주 캘린더
3. Phase 5C — 차단 4·5·6 추가
4. Phase 5D — 경고 3개 추가
5. Phase 6 — 마감 후 수정/삭제 제한 전체 페이지 점검/적용
6. Phase 7 — 휴일 관리
7. Phase 8 — idempotency/race condition 보강
8. Phase 9 — 통계 메뉴
9. Phase 10 — prompt() 커스텀 모달 교체

---

## 작업 시 주의사항

1. 마크다운 placeholder 절대 금지.
2. 단위 테스트 가능한 부분은 `services/*Logic.js`로 분리.
3. Firestore 쓰기/운영 데이터 영향 큰 변경은 별도 side patch로 분리.
4. 사용자는 코딩 초보이므로 적용 안내는 Step만 명확하게.
5. CRLF/LF 경고는 무시 가능.
6. 새 phase 진입 시 변경사항 장황한 설명보다 적용 Step 우선.

---

## 다음 채팅 시작 시

첨부:
- 이 핸드오프 v5 수정본
- 최신 `codebase.md`
- spec v19

첫 메시지 추천:

"Phase 5A부터 시작. activityLogs 기반 acknowledge 인프라 설계/구현부터 진행하자. 메인 알림 UI와 2주 캘린더는 Phase 5B로 분리하고, 차단 4·5·6은 Phase 5C, 경고 3개는 Phase 5D로 분리한다."