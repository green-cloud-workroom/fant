// Offline synthetic preview: markup comes from the real main renderer.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { mainV2Fixture } from '../tests/fixtures/mainV2.mjs';

const e = await mainV2Fixture();
try {
  const css = await Promise.all(['src/style.css', 'src/theme-warm.css'].map(file => readFile(file, 'utf8')));
  const main = e.document.getElementById('mainContent').innerHTML;
  const menuCode = e.page.bindLogMenus.toString();
  await mkdir('output', { recursive: true });
  await writeFile('output/ui2-main.html', `<!doctype html><html lang="ko"><meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">
    <title>메인 V2 · 로컬 합성 데이터</title><style>${css.join('\n')}body{margin:0;font-family:Arial,'Malgun Gothic',sans-serif}*{box-sizing:border-box}</style>
    <div class="app-wrapper"><nav class="navbar"><div class="navbar-left"><strong>판타펫</strong></div><div class="navbar-center">
    ${['메인','생산입력','레시피','영양제','봉투','계란','입고예정','원육창고','동결건조','동결판','통계','설정'].map((label,i)=>`<button class="nav-btn ${i===0?'active':''}">${label}</button>`).join('')}
    </div><div class="navbar-right"><span class="user-badge">로컬 합성 미리보기</span></div></nav>
    <div class="subbar"><span class="subbar-item">📅 2026-09-14 (월)</span><span class="subbar-item">⏳ 2028-03-14</span><span class="subbar-item">🥚 100개</span><span class="subbar-item subbar-stock-warning">⚠️ 부족재고 3개</span><span class="subbar-item">📦 입고예정 1건</span><span class="subbar-item">🔔 미확인로그 4건</span></div>
    <main id="mainContent" class="main-content">${main}</main></div>
    <script>let closeMainLogMenu=()=>{},mainLogMenuPage=null;const getPageContext=()=>null,registerPageCleanup=()=>{};${menuCode};bindLogMenus();
    if(location.hash==='#checks'){
      const checks=[],check=(name,ok)=>checks.push({name,ok:!!ok});
      const toggle=document.querySelector('.log-more-toggle'),items=[...toggle.nextElementSibling.querySelectorAll('button')];
      toggle.focus();toggle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
      check('arrow opens and focuses first item',document.activeElement===items[0]&&toggle.getAttribute('aria-expanded')==='true');
      items[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));check('arrow focuses history',document.activeElement===items[1]);
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));check('escape closes and restores focus',document.activeElement===toggle&&toggle.nextElementSibling.hidden);
      toggle.click();document.body.click();check('outside closes',toggle.nextElementSibling.hidden);
      toggle.focus();toggle.click();const outsideButton=document.getElementById('btnBigView');outsideButton.focus();
      // A background headless document may suppress native focus events during its initial script.
      outsideButton.dispatchEvent(new FocusEvent('focus',{relatedTarget:toggle}));
      check('focus departure handler closes (synthetic focus event)',toggle.nextElementSibling.hidden);
      check('header controls 32px',[...document.querySelectorAll('.log-section-actions > button,.log-more-toggle')].every(b=>b.getBoundingClientRect().height===32));
      check('yellow removed including received cards',[...document.querySelectorAll('.unit-row td:nth-child(2)')].every(c=>getComputedStyle(c).backgroundColor==='rgba(0, 0, 0, 0)'));
      check('fixed time column',[...document.querySelectorAll('.log-row-time')].every(c=>c.getBoundingClientRect().width===40));
      check('no page horizontal overflow',document.documentElement.scrollWidth===innerWidth);
      closeMainLogMenu();document.activeElement?.blur();
      const report=document.createElement('pre');report.id='ui2-browser-checks';report.hidden=true;report.textContent=JSON.stringify(checks);document.body.append(report);
    }</script></html>`);
  console.log('output/ui2-main.html (synthetic main markup; shell is a static fixture; CSP blocks all network)');
} finally { await e.cleanup(); }
