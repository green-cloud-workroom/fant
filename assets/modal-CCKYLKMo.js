import{t as e}from"./rolldown-runtime-lhHHWwHU.js";import{r as t}from"./modalManager-Z4b2ihO9.js";var n=e({showConfirmModal:()=>o,showPromptModal:()=>a}),r=null,i=`commonPromptModal`;function a(e={}){let{title:n=``,message:a=``,label:o=``,placeholder:s=``,defaultValue:c=``,required:l=!0,multiline:u=!1,confirmText:d=`확인`,cancelText:f=`취소`}=e;return new Promise(e=>{r?.();let p=document.getElementById(i);p&&p.remove();let m=`
      <div class="modal-overlay" id="${i}">
        <div class="modal-box" style="width:420px;">
          <h3 class="modal-title"></h3>
          ${a?`<p data-prompt-message style="font-size:13px;color:#555;margin:0 0 16px;line-height:1.6;white-space:pre-wrap;"></p>`:``}
          ${o?`<label data-prompt-label style="display:block;font-size:12px;color:#555;margin-bottom:6px;font-weight:500;"></label>`:``}
          ${u?`<textarea id="commonPromptInput" rows="3" style="width:100%;padding:8px;font-size:13px;font-family:inherit;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:4px;resize:vertical;outline:none;"></textarea>`:`<input type="text" id="commonPromptInput" style="width:100%;padding:8px;font-size:13px;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:4px;outline:none;" />`}
          <div class="modal-actions">
            <button class="btn-secondary" id="commonPromptCancel"></button>
            <button class="btn-primary" id="commonPromptConfirm"></button>
          </div>
        </div>
      </div>
    `;document.body.insertAdjacentHTML(`beforeend`,m);let h=document.getElementById(i),g=document.getElementById(`commonPromptInput`),_=document.getElementById(`commonPromptCancel`),v=document.getElementById(`commonPromptConfirm`);h.querySelector(`.modal-title`).textContent=n;let y=h.querySelector(`[data-prompt-message]`);y&&(y.textContent=a);let b=h.querySelector(`[data-prompt-label]`);b&&(b.textContent=o+(l?` *`:``)),g.placeholder=s,g.value=c,_.textContent=f,v.textContent=d,setTimeout(()=>g.focus(),50);let x=new AbortController,S=()=>{},C=()=>{x.abort(),S(),r=null,h&&h.remove()};r=()=>{C(),e(null)},S=t(r),_.addEventListener(`click`,()=>{C(),e(null)}),v.addEventListener(`click`,()=>{let t=g.value.trim();if(l&&!t){alert(`${o||`값`}을(를) 입력해주세요.`),g.focus();return}C(),e(t)}),g.addEventListener(`keydown`,t=>{t.key===`Escape`?(C(),e(null)):t.key===`Enter`&&!u&&(t.preventDefault(),v.click())})})}function o(e={}){let{title:n=`확인`,message:a=``,confirmText:o=`확인`,cancelText:s=`취소`,danger:c=!1}=e;return new Promise(e=>{r?.();let l=document.getElementById(i);l&&l.remove();let u=`
      <div class="modal-overlay" id="${i}">
        <div class="modal-box" style="width:420px;">
          <h3 class="modal-title"></h3>
          <p data-prompt-message style="font-size:13px;color:#333;margin:0 0 16px;line-height:1.6;white-space:pre-wrap;"></p>
          <div class="modal-actions">
            <button class="btn-secondary" id="commonPromptCancel"></button>
            <button class="${c?`btn-danger`:`btn-primary`}" id="commonPromptConfirm"></button>
          </div>
        </div>
      </div>
    `;document.body.insertAdjacentHTML(`beforeend`,u);let d=document.getElementById(i),f=document.getElementById(`commonPromptCancel`),p=document.getElementById(`commonPromptConfirm`);d.querySelector(`.modal-title`).textContent=n,d.querySelector(`[data-prompt-message]`).textContent=a,f.textContent=s,p.textContent=o,setTimeout(()=>p.focus(),50);let m=new AbortController,h=()=>{},g=()=>{m.abort(),h(),r=null,d&&d.remove()};r=()=>{g(),e(!1)},h=t(r),f.addEventListener(`click`,()=>{g(),e(!1)}),p.addEventListener(`click`,()=>{g(),e(!0)}),document.addEventListener(`keydown`,function t(n){if(!document.getElementById(i)){document.removeEventListener(`keydown`,t);return}n.key===`Escape`?(g(),e(!1),document.removeEventListener(`keydown`,t)):n.key===`Enter`&&(g(),e(!0),document.removeEventListener(`keydown`,t))},{signal:m.signal})})}export{o as n,a as r,n as t};