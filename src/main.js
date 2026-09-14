import './style.css';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onIdTokenChanged, signOut } from 'firebase/auth';
import { loadUserInfo, clearUserInfo, currentUserRole } from './app.js';
import { loadHolidaysCache, getTodayKST } from './utils/date.js';
import { renderLayout } from './layout.js';
import { setupMidnightLogout, clearMidnightLogout } from './midnightLogout.js';
import { setSessionIdentity } from './state/sessionController.js';
import { createDisplayScope } from './state/displayReads.js';
import { flags, performanceDisabled } from './config/performanceFlags.js';

// 앱 시작
let authVersion = 0;
let refreshedUid = null;
let activeIdentity = null;
let loginDay = null;
onIdTokenChanged(auth, async (user) => {
  const version = ++authVersion;
  if (user) {
    try {
      const force = refreshedUid !== user.uid;
      refreshedUid = user.uid;
      if (!await loadUserInfo(user, force) || version !== authVersion) return;
      const identity = setSessionIdentity(user.uid, currentUserRole, getTodayKST());
      if (identity === activeIdentity) return;
      loginDay = getTodayKST();
      document.querySelectorAll('.modal-overlay').forEach(node => node.remove());
      await loadHolidaysCache(flags.store && !performanceDisabled() ? createDisplayScope('shell') : undefined);
      if (version !== authVersion) return;
      activeIdentity = identity;
      renderLayout();
      setupMidnightLogout();
    } catch (error) {
      if (version !== authVersion) return;
      clearUserInfo(); setSessionIdentity(null); activeIdentity = null;
      showLogin();
      document.getElementById('loginError').textContent = '사용자 정보를 확인하지 못했습니다. 다시 로그인해주세요.';
      console.error('[인증 확인 실패]', error);
    }
  } else {
    refreshedUid = null; activeIdentity = null; loginDay = null;
    clearUserInfo(); setSessionIdentity(null);
    document.querySelectorAll('.modal-overlay').forEach(node => node.remove());
    clearMidnightLogout();
    showLogin();
  }
});

function checkResumedDate() {
  if (loginDay && loginDay !== getTodayKST()) {
    clearUserInfo(); setSessionIdentity(null); activeIdentity = null;
    document.querySelectorAll('.modal-overlay').forEach(node => node.remove());
    showLogin();
    signOut(auth).catch(error => console.error('[날짜 변경 로그아웃]', error));
  }
}
window.addEventListener('pageshow', checkResumedDate);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkResumedDate(); });

// 로그인 화면
function showLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-box">
        <div class="login-logo">
          <h1>Fantapet Management</h1>
          <p>판타펫 생산 관리 시스템</p>
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input type="email" id="email" placeholder="이메일 입력" />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input type="password" id="password" placeholder="비밀번호 입력" />
        </div>
        <button class="login-btn" id="loginBtn">로그인</button>
        <div class="login-error" id="loginError"></div>
      </div>
    </div>
  `;

  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    errorEl.textContent = '이메일과 비밀번호를 입력해주세요.';
    return;
  }

  btn.textContent = '로그인 중...';
  btn.disabled = true;
  errorEl.textContent = '';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    errorEl.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
    btn.textContent = '로그인';
    btn.disabled = false;
  }
}
