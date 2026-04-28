import './style.css';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { loadUserInfo } from './app.js';
import { renderLayout } from './layout.js';

// 앱 시작
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadUserInfo(user);
    renderLayout();
  } else {
    showLogin();
  }
});

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