// 자정 자동 로그아웃 (Phase 1B)
//
// KST 00:01:00에 자동 signOut. 로그인 상태일 때만 동작.
// KST 23:55:00에 5분 전 토스트 알림 1회 표시.
//
// 사용:
//   import { setupMidnightLogout, clearMidnightLogout } from './midnightLogout.js';
//   onAuthStateChanged 콜백 안에서:
//     user가 있으면 setupMidnightLogout()
//     user가 없으면 clearMidnightLogout()

import { auth } from './firebase.js';
import { signOut } from 'firebase/auth';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

let logoutTimerId = null;
let toastTimerId = null;

/**
 * 다음 KST 자정+1분(00:01:00)까지의 ms 반환.
 * 호출 시점이 이미 자정 직후면 다음날 자정+1분.
 */
function msUntilNextKstLogoutTime() {
  const nowMs = Date.now();
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  // KST 기준 다음 00:01:00을 UTC ms로 환산
  const target = new Date(Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate() + 1, // 다음날
    0, 1, 0, 0,              // 00:01:00 KST
  ));
  // KST 자정+1분의 UTC 시점 = (다음날 00:01 KST를 UTC로 계산)
  // = (target에 표시된 UTC 시각) - 9h
  const targetUtcMs = target.getTime() - KST_OFFSET_MS;
  return targetUtcMs - nowMs;
}

/**
 * 다음 KST 23:55:00까지의 ms 반환.
 * 호출 시점이 이미 23:55 지났으면 다음날 23:55까지.
 */
function msUntilNextKstToastTime() {
  const nowMs = Date.now();
  const kstNow = new Date(nowMs + KST_OFFSET_MS);
  const hour = kstNow.getUTCHours();
  const min = kstNow.getUTCMinutes();

  // 오늘 23:55가 아직 안 지났는지 판정
  let useNextDay = false;
  if (hour > 23 || (hour === 23 && min >= 55)) {
    useNextDay = true;
  }

  const target = new Date(Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate() + (useNextDay ? 1 : 0),
    23, 55, 0, 0,
  ));
  const targetUtcMs = target.getTime() - KST_OFFSET_MS;
  return targetUtcMs - nowMs;
}

/**
 * 토스트 알림을 화면 우측 상단에 띄움. 10초 후 자동 사라짐.
 * 닫기 버튼 없음.
 */
function showLogoutWarningToast() {
  // 이미 표시 중이면 중복 방지
  const existing = document.getElementById('midnightLogoutToast');
  if (existing) return;

  const toast = document.createElement('div');
  toast.id = 'midnightLogoutToast';
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 99999;
    background: #d32f2f;
    color: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    line-height: 1.5;
    max-width: 320px;
    animation: midnightToastFadeIn 0.3s ease-out;
  `;
  toast.textContent = '5분 후 자동 로그아웃됩니다. 마감 작업을 마무리해주세요.';

  // 페이드인 애니메이션 1회만 등록
  if (!document.getElementById('midnightToastStyle')) {
    const style = document.createElement('style');
    style.id = 'midnightToastStyle';
    style.textContent = `
      @keyframes midnightToastFadeIn {
        from { opacity: 0; transform: translateY(-12px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // 10초 후 제거
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 10000);
}

/**
 * 자정 로그아웃 + 5분 전 토스트 타이머 등록.
 * 이미 등록되어 있으면 기존 것 클리어 후 재등록 (idempotent).
 *
 * 로그인 상태에서만 호출. user가 null이면 호출하지 말 것.
 */
export function setupMidnightLogout() {
  // 기존 타이머 정리
  clearMidnightLogout();

  // 로그아웃 예약
  const logoutMs = msUntilNextKstLogoutTime();
  logoutTimerId = setTimeout(async () => {
    try {
      // 로그아웃 시점에도 user가 살아있는지 확인
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('자정 자동 로그아웃 실패:', err);
    }
    // 로그아웃 후 onAuthStateChanged가 발화되어 clearMidnightLogout가 호출됨
    logoutTimerId = null;
  }, logoutMs);

  // 5분 전 토스트 예약
  const toastMs = msUntilNextKstToastTime();
  // 토스트 시점이 로그아웃 시점보다 늦으면 (이미 23:55 지난 상태에서 setup) 토스트 생략
  if (toastMs < logoutMs) {
    toastTimerId = setTimeout(() => {
      // 토스트 시점에도 로그인 중인 경우만
      if (auth.currentUser) {
        showLogoutWarningToast();
      }
      toastTimerId = null;
    }, toastMs);
  }
}

/**
 * 등록된 타이머를 모두 정리.
 * 로그아웃 시 호출.
 */
export function clearMidnightLogout() {
  if (logoutTimerId !== null) {
    clearTimeout(logoutTimerId);
    logoutTimerId = null;
  }
  if (toastTimerId !== null) {
    clearTimeout(toastTimerId);
    toastTimerId = null;
  }
}

// === 테스트용 (콘솔 검증) ===
// 브라우저 콘솔에서 다음과 같이 확인 가능:
//   window.__midnightDebug = { msUntilNextKstLogoutTime, msUntilNextKstToastTime };
// 운영에서는 노출 안 함.
if (typeof window !== 'undefined') {
  window.__midnightDebug = {
    msUntilNextKstLogoutTime,
    msUntilNextKstToastTime,
    showLogoutWarningToast,
  };
}
