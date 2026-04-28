import './style.css';
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

// 앱 시작
onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp(user);
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

// 로그인 처리
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

// 메인 화면 (임시)
function showApp(user) {
  document.getElementById('app').innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <h2>로그인 성공!</h2>
      <p style="margin-top: 8px; color: #888;">${user.email}</p>
      <button onclick="handleLogout()" style="margin-top: 24px; padding: 8px 20px; cursor: pointer;">로그아웃</button>
    </div>
  `;
}

window.handleLogout = async () => {
  await signOut(auth);
};