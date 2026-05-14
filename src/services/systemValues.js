import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

// 시스템 설정값 디폴트.
// settings/systemValues 문서가 없으면 이 값을 사용한다.
// closingChecksLogic.js 의 DEFAULT_CLOSING_FLAGS 패턴과 동일.
export const DEFAULT_SYSTEM_VALUES = {
  maxPansPerBatch: 45,
  breadToFreezeRatio: { numerator: 4, denominator: 9 },
  breadToSiliconeRatio: 4,
  packsPerBox: 20,
  waterSplitThreshold: 16000,
  defaultLogPeriodDays: 365,
  supplementThresholdYellow: 10,
  supplementThresholdRed: 5,
  supplementClosingWarnThreshold: 5,
  supplementAutoAlertThreshold: 5,
  eggYolkAvgWeight: 14.5,
};

// 설정 UI 렌더링용 필드 정의.
// type: 'integer' | 'decimal' | 'fraction'
//  - integer: 정수 number input (step 1)
//  - decimal: 소수 number input (step 0.1)
//  - fraction: 분자/분모 number input 2칸. 값은 { numerator, denominator } 객체.
export const SYSTEM_VALUE_FIELDS = [
  {
    key: 'maxPansPerBatch',
    label: '동결건조 1회 최대 판수',
    desc: '동결건조 1회 작업 시 최대 판 수. 초과 시 경고 표시.',
    type: 'integer',
    unit: '판',
  },
  {
    key: 'breadToFreezeRatio',
    label: '빵판 → 동결판 환산',
    desc: '빵판 수를 동결판 수로 환산하는 비율. 디폴트 4/9.',
    type: 'fraction',
  },
  {
    key: 'breadToSiliconeRatio',
    label: '빵판 → 실리콘 환산',
    desc: '빵판 수를 실리콘 수로 환산하는 비율. 디폴트 ×4.',
    type: 'integer',
    unit: '배',
  },
  {
    key: 'packsPerBox',
    label: '생식 박스당 팩 수',
    desc: '생식 1박스에 들어가는 팩 수.',
    type: 'integer',
    unit: '팩',
  },
  {
    key: 'waterSplitThreshold',
    label: '물 분할 기준값',
    desc: '생산 시 물 용량 분할 기준. 이 값을 초과하면 분할 처리.',
    type: 'integer',
    unit: 'g',
  },
  {
    key: 'defaultLogPeriodDays',
    label: '로그 조회 기본 기간',
    desc: '로그 조회 화면 진입 시 기본 조회 기간.',
    type: 'integer',
    unit: '일',
  },
  {
    key: 'supplementThresholdYellow',
    label: '영양제 색상 노랑 임계값',
    desc: '영양제 재고가 이 값 미만이면 노란색으로 표시.',
    type: 'integer',
    unit: '봉',
  },
  {
    key: 'supplementThresholdRed',
    label: '영양제 색상 빨강 임계값',
    desc: '영양제 재고가 이 값 미만이면 빨간색으로 표시.',
    type: 'integer',
    unit: '봉',
  },
  {
    key: 'supplementClosingWarnThreshold',
    label: '영양제 마감 경고 임계값',
    desc: '영양제 재고가 이 값 미만이면 마감 시 확인 모달 표시.',
    type: 'integer',
    unit: '봉',
  },
  {
    key: 'supplementAutoAlertThreshold',
    label: '영양제 자동 발행 임계값',
    desc: '영양제 재고가 이 값 미만이면 자동 발행 로그 생성.',
    type: 'integer',
    unit: '봉',
  },
  {
    key: 'eggYolkAvgWeight',
    label: '계란 노른자 평균 중량',
    desc: '계란 노른자 1개의 평균 중량. 생산 계란 사용량 계산에 사용.',
    type: 'decimal',
    unit: 'g',
  },
];

// settings/systemValues 문서를 읽어 디폴트와 병합해 반환.
// 문서가 없거나 읽기 실패 시 디폴트 반환.
export async function loadSystemValues() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'systemValues'));
    return snap.exists()
      ? { ...DEFAULT_SYSTEM_VALUES, ...snap.data() }
      : { ...DEFAULT_SYSTEM_VALUES };
  } catch (err) {
    console.warn('[systemValues] load failed:', err);
    return { ...DEFAULT_SYSTEM_VALUES };
  }
}
