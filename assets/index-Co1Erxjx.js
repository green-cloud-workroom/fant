const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index.esm-BEtDdFFW.js","assets/rolldown-runtime-lhHHWwHU.js","assets/closing-B-f_EnvQ.js","assets/closingChecks-Xx1rd8dq.js"])))=>i.map(i=>d[i]);
import{t as e}from"./rolldown-runtime-lhHHWwHU.js";import{A as t,B as n,C as r,D as i,E as a,F as o,G as s,H as c,I as l,L as u,M as d,N as f,O as ee,P as p,R as te,S as ne,T as re,U as ie,V as ae,W as oe,_ as se,a as m,b as ce,c as h,f as g,g as le,i as _,j as ue,k as de,l as fe,m as pe,n as v,p as y,r as me,s as b,u as x,v as S,w as he,x as ge,y as _e,z as ve}from"./index.esm-BEtDdFFW.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),ne(`firebase`,`12.12.1`,`app`);function ye(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}var be=ye,xe=new a(`auth`,`Firebase`,ye()),Se=new he(`@firebase/auth`);function Ce(e,...t){Se.logLevel<=r.WARN&&Se.warn(`Auth (${le}): ${e}`,...t)}function we(e,...t){Se.logLevel<=r.ERROR&&Se.error(`Auth (${le}): ${e}`,...t)}function C(e,...t){throw Ee(e,...t)}function w(e,...t){return Ee(e,...t)}function Te(e,t,n){return new a(`auth`,`Firebase`,{...be(),[t]:n}).create(t,{appName:e.name})}function T(e){return Te(e,`operation-not-supported-in-this-environment`,`Operations that alter the current user are not supported in conjunction with FirebaseServerApp`)}function Ee(e,...t){if(typeof e!=`string`){let n=t[0],r=[...t.slice(1)];return r[0]&&(r[0].appName=e.name),e._errorFactory.create(n,...r)}return xe.create(e,...t)}function E(e,t,...n){if(!e)throw Ee(t,...n)}function D(e){let t=`INTERNAL ASSERTION FAILED: `+e;throw we(t),Error(t)}function O(e,t){e||D(t)}function De(){return typeof self<`u`&&self.location?.href||``}function Oe(){return ke()===`http:`||ke()===`https:`}function ke(){return typeof self<`u`&&self.location?.protocol||null}function Ae(){return typeof navigator<`u`&&navigator&&`onLine`in navigator&&typeof navigator.onLine==`boolean`&&(Oe()||l()||`connection`in navigator)?navigator.onLine:!0}function je(){if(typeof navigator>`u`)return null;let e=navigator;return e.languages&&e.languages[0]||e.language||null}var Me=class{constructor(e,t){this.shortDelay=e,this.longDelay=t,O(t>e,`Short delay should be less than long delay!`),this.isMobile=ae()||c()}get(){return Ae()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}};function Ne(e,t){O(e.emulator,`Emulator should always be set here`);let{url:n}=e.emulator;return t?`${n}${t.startsWith(`/`)?t.slice(1):t}`:n}var Pe=class{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<`u`&&`fetch`in self)return self.fetch;if(typeof globalThis<`u`&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<`u`)return fetch;D(`Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill`)}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<`u`&&`Headers`in self)return self.Headers;if(typeof globalThis<`u`&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<`u`)return Headers;D(`Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill`)}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<`u`&&`Response`in self)return self.Response;if(typeof globalThis<`u`&&globalThis.Response)return globalThis.Response;if(typeof Response<`u`)return Response;D(`Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill`)}},Fe={CREDENTIAL_MISMATCH:`custom-token-mismatch`,MISSING_CUSTOM_TOKEN:`internal-error`,INVALID_IDENTIFIER:`invalid-email`,MISSING_CONTINUE_URI:`internal-error`,INVALID_PASSWORD:`wrong-password`,MISSING_PASSWORD:`missing-password`,INVALID_LOGIN_CREDENTIALS:`invalid-credential`,EMAIL_EXISTS:`email-already-in-use`,PASSWORD_LOGIN_DISABLED:`operation-not-allowed`,INVALID_IDP_RESPONSE:`invalid-credential`,INVALID_PENDING_TOKEN:`invalid-credential`,FEDERATED_USER_ID_ALREADY_LINKED:`credential-already-in-use`,MISSING_REQ_TYPE:`internal-error`,EMAIL_NOT_FOUND:`user-not-found`,RESET_PASSWORD_EXCEED_LIMIT:`too-many-requests`,EXPIRED_OOB_CODE:`expired-action-code`,INVALID_OOB_CODE:`invalid-action-code`,MISSING_OOB_CODE:`internal-error`,CREDENTIAL_TOO_OLD_LOGIN_AGAIN:`requires-recent-login`,INVALID_ID_TOKEN:`invalid-user-token`,TOKEN_EXPIRED:`user-token-expired`,USER_NOT_FOUND:`user-token-expired`,TOO_MANY_ATTEMPTS_TRY_LATER:`too-many-requests`,PASSWORD_DOES_NOT_MEET_REQUIREMENTS:`password-does-not-meet-requirements`,INVALID_CODE:`invalid-verification-code`,INVALID_SESSION_INFO:`invalid-verification-id`,INVALID_TEMPORARY_PROOF:`invalid-credential`,MISSING_SESSION_INFO:`missing-verification-id`,SESSION_EXPIRED:`code-expired`,MISSING_ANDROID_PACKAGE_NAME:`missing-android-pkg-name`,UNAUTHORIZED_DOMAIN:`unauthorized-continue-uri`,INVALID_OAUTH_CLIENT_ID:`invalid-oauth-client-id`,ADMIN_ONLY_OPERATION:`admin-restricted-operation`,INVALID_MFA_PENDING_CREDENTIAL:`invalid-multi-factor-session`,MFA_ENROLLMENT_NOT_FOUND:`multi-factor-info-not-found`,MISSING_MFA_ENROLLMENT_ID:`missing-multi-factor-info`,MISSING_MFA_PENDING_CREDENTIAL:`missing-multi-factor-session`,SECOND_FACTOR_EXISTS:`second-factor-already-in-use`,SECOND_FACTOR_LIMIT_EXCEEDED:`maximum-second-factor-count-exceeded`,BLOCKING_FUNCTION_ERROR_RESPONSE:`internal-error`,RECAPTCHA_NOT_ENABLED:`recaptcha-not-enabled`,MISSING_RECAPTCHA_TOKEN:`missing-recaptcha-token`,INVALID_RECAPTCHA_TOKEN:`invalid-recaptcha-token`,INVALID_RECAPTCHA_ACTION:`invalid-recaptcha-action`,MISSING_CLIENT_TYPE:`missing-client-type`,MISSING_RECAPTCHA_VERSION:`missing-recaptcha-version`,INVALID_RECAPTCHA_VERSION:`invalid-recaptcha-version`,INVALID_REQ_TYPE:`invalid-req-type`},Ie=[`/v1/accounts:signInWithCustomToken`,`/v1/accounts:signInWithEmailLink`,`/v1/accounts:signInWithIdp`,`/v1/accounts:signInWithPassword`,`/v1/accounts:signInWithPhoneNumber`,`/v1/token`],Le=new Me(3e4,6e4);function k(e,t){return e.tenantId&&!t.tenantId?{...t,tenantId:e.tenantId}:t}async function A(e,t,n,r,i={}){return Re(e,i,async()=>{let i={},a={};r&&(t===`GET`?a=r:i={body:JSON.stringify(r)});let o=oe({key:e.config.apiKey,...a}).slice(1),s=await e._getAdditionalHeaders();s[`Content-Type`]=`application/json`,e.languageCode&&(s[`X-Firebase-Locale`]=e.languageCode);let c={method:t,headers:s,...i};return te()||(c.referrerPolicy=`no-referrer`),e.emulatorConfig&&u(e.emulatorConfig.host)&&(c.credentials=`include`),Pe.fetch()(await ze(e,e.config.apiHost,n,o),c)})}async function Re(e,t,n){e._canInitEmulator=!1;let r={...Fe,...t};try{let t=new Ve(e),i=await Promise.race([n(),t.promise]);t.clearNetworkTimeout();let a=await i.json();if(`needConfirmation`in a)throw He(e,`account-exists-with-different-credential`,a);if(i.ok&&!(`errorMessage`in a))return a;{let[t,n]=(i.ok?a.errorMessage:a.error.message).split(` : `);if(t===`FEDERATED_USER_ID_ALREADY_LINKED`)throw He(e,`credential-already-in-use`,a);if(t===`EMAIL_EXISTS`)throw He(e,`email-already-in-use`,a);if(t===`USER_DISABLED`)throw He(e,`user-disabled`,a);let o=r[t]||t.toLowerCase().replace(/[_\s]+/g,`-`);if(n)throw Te(e,o,n);C(e,o)}}catch(t){if(t instanceof i)throw t;C(e,`network-request-failed`,{message:String(t)})}}async function j(e,t,n,r,i={}){let a=await A(e,t,n,r,i);return`mfaPendingCredential`in a&&C(e,`multi-factor-auth-required`,{_serverResponse:a}),a}async function ze(e,t,n,r){let i=`${t}${n}?${r}`,a=e,o=a.config.emulator?Ne(e.config,i):`${e.config.apiScheme}://${i}`;return Ie.includes(n)&&(await a._persistenceManagerAvailable,a._getPersistenceType()===`COOKIE`)?a._getPersistence()._getFinalTarget(o).toString():o}function Be(e){switch(e){case`ENFORCE`:return`ENFORCE`;case`AUDIT`:return`AUDIT`;case`OFF`:return`OFF`;default:return`ENFORCEMENT_STATE_UNSPECIFIED`}}var Ve=class{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((e,t)=>{this.timer=setTimeout(()=>t(w(this.auth,`network-request-failed`)),Le.get())})}};function He(e,t,n){let r={appName:e.name};n.email&&(r.email=n.email),n.phoneNumber&&(r.phoneNumber=n.phoneNumber);let i=w(e,t,r);return i.customData._tokenResponse=n,i}function Ue(e){return e!==void 0&&e.enterprise!==void 0}var We=class{constructor(e){if(this.siteKey=``,this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw Error(`recaptchaKey undefined`);this.siteKey=e.recaptchaKey.split(`/`)[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(let t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return Be(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)===`ENFORCE`||this.getProviderEnforcementState(e)===`AUDIT`}isAnyProviderEnabled(){return this.isProviderEnabled(`EMAIL_PASSWORD_PROVIDER`)||this.isProviderEnabled(`PHONE_PROVIDER`)}};async function Ge(e,t){return A(e,`GET`,`/v2/recaptchaConfig`,k(e,t))}async function Ke(e,t){return A(e,`POST`,`/v1/accounts:delete`,t)}async function qe(e,t){return A(e,`POST`,`/v1/accounts:lookup`,t)}function Je(e){if(e)try{let t=new Date(Number(e));if(!isNaN(t.getTime()))return t.toUTCString()}catch{}}async function Ye(e,t=!1){let n=p(e),r=await n.getIdToken(t),i=Ze(r);E(i&&i.exp&&i.auth_time&&i.iat,n.auth,`internal-error`);let a=typeof i.firebase==`object`?i.firebase:void 0,o=a?.sign_in_provider;return{claims:i,token:r,authTime:Je(Xe(i.auth_time)),issuedAtTime:Je(Xe(i.iat)),expirationTime:Je(Xe(i.exp)),signInProvider:o||null,signInSecondFactor:a?.sign_in_second_factor||null}}function Xe(e){return Number(e)*1e3}function Ze(e){let[t,n,r]=e.split(`.`);if(t===void 0||n===void 0||r===void 0)return we(`JWT malformed, contained fewer than 3 sections`),null;try{let e=ee(n);return e?JSON.parse(e):(we(`Failed to decode base64 JWT payload`),null)}catch(e){return we(`Caught error parsing JWT payload as JSON`,e?.toString()),null}}function Qe(e){let t=Ze(e);return E(t,`internal-error`),E(t.exp!==void 0,`internal-error`),E(t.iat!==void 0,`internal-error`),Number(t.exp)-Number(t.iat)}async function $e(e,t,n=!1){if(n)return t;try{return await t}catch(t){throw t instanceof i&&et(t)&&e.auth.currentUser===e&&await e.auth.signOut(),t}}function et({code:e}){return e===`auth/user-disabled`||e===`auth/user-token-expired`}var tt=class{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){let e=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),e}else{this.errorBackoff=3e4;let e=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,e)}}schedule(e=!1){if(!this.isRunning)return;let t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){e?.code===`auth/network-request-failed`&&this.schedule(!0);return}this.schedule()}},nt=class{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Je(this.lastLoginAt),this.creationTime=Je(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}};async function rt(e){let t=e.auth,n=await $e(e,qe(t,{idToken:await e.getIdToken()}));E(n?.users.length,t,`internal-error`);let r=n.users[0];e._notifyReloadListener(r);let i=r.providerUserInfo?.length?ot(r.providerUserInfo):[],a=at(e.providerData,i),o=e.isAnonymous,s=!(e.email&&r.passwordHash)&&!a?.length,c=o?s:!1,l={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new nt(r.createdAt,r.lastLoginAt),isAnonymous:c};Object.assign(e,l)}async function it(e){let t=p(e);await rt(t),await t.auth._persistUserIfCurrent(t),t.auth._notifyListenersIfCurrent(t)}function at(e,t){return[...e.filter(e=>!t.some(t=>t.providerId===e.providerId)),...t]}function ot(e){return e.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||``,displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}async function st(e,t){let n=await Re(e,{},async()=>{let n=oe({grant_type:`refresh_token`,refresh_token:t}).slice(1),{tokenApiHost:r,apiKey:i}=e.config,a=await ze(e,r,`/v1/token`,`key=${i}`),o=await e._getAdditionalHeaders();o[`Content-Type`]=`application/x-www-form-urlencoded`;let s={method:`POST`,headers:o,body:n};return e.emulatorConfig&&u(e.emulatorConfig.host)&&(s.credentials=`include`),Pe.fetch()(a,s)});return{accessToken:n.access_token,expiresIn:n.expires_in,refreshToken:n.refresh_token}}async function ct(e,t){return A(e,`POST`,`/v2/accounts:revokeToken`,k(e,t))}var lt=class e{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){E(e.idToken,`internal-error`),E(e.idToken!==void 0,`internal-error`),E(e.refreshToken!==void 0,`internal-error`);let t=`expiresIn`in e&&e.expiresIn!==void 0?Number(e.expiresIn):Qe(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){E(e.length!==0,`internal-error`);let t=Qe(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(E(this.refreshToken,e,`user-token-expired`),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){let{accessToken:n,refreshToken:r,expiresIn:i}=await st(e,t);this.updateTokensAndExpiration(n,r,Number(i))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(t,n){let{refreshToken:r,accessToken:i,expirationTime:a}=n,o=new e;return r&&(E(typeof r==`string`,`internal-error`,{appName:t}),o.refreshToken=r),i&&(E(typeof i==`string`,`internal-error`,{appName:t}),o.accessToken=i),a&&(E(typeof a==`number`,`internal-error`,{appName:t}),o.expirationTime=a),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new e,this.toJSON())}_performRefresh(){return D(`not implemented`)}};function M(e,t){E(typeof e==`string`||e===void 0,`internal-error`,{appName:t})}var ut=class e{constructor({uid:e,auth:t,stsTokenManager:n,...r}){this.providerId=`firebase`,this.proactiveRefresh=new tt(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new nt(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){let t=await $e(this,this.stsTokenManager.getToken(this.auth,e));return E(t,this.auth,`internal-error`),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Ye(this,e)}reload(){return it(this)}_assign(e){this!==e&&(E(this.uid===e.uid,this.auth,`internal-error`),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(e=>({...e})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(t){let n=new e({...this,auth:t,stsTokenManager:this.stsTokenManager._clone()});return n.metadata._copy(this.metadata),n}_onReload(e){E(!this.reloadListener,this.auth,`internal-error`),this.reloadListener=e,this.reloadUserInfo&&=(this._notifyReloadListener(this.reloadUserInfo),null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await rt(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(S(this.auth.app))return Promise.reject(T(this.auth));let e=await this.getIdToken();return await $e(this,Ke(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||``}static _fromJSON(t,n){let r=n.displayName??void 0,i=n.email??void 0,a=n.phoneNumber??void 0,o=n.photoURL??void 0,s=n.tenantId??void 0,c=n._redirectEventId??void 0,l=n.createdAt??void 0,u=n.lastLoginAt??void 0,{uid:d,emailVerified:f,isAnonymous:ee,providerData:p,stsTokenManager:te}=n;E(d&&te,t,`internal-error`);let ne=lt.fromJSON(this.name,te);E(typeof d==`string`,t,`internal-error`),M(r,t.name),M(i,t.name),E(typeof f==`boolean`,t,`internal-error`),E(typeof ee==`boolean`,t,`internal-error`),M(a,t.name),M(o,t.name),M(s,t.name),M(c,t.name),M(l,t.name),M(u,t.name);let re=new e({uid:d,auth:t,email:i,emailVerified:f,displayName:r,isAnonymous:ee,photoURL:o,phoneNumber:a,tenantId:s,stsTokenManager:ne,createdAt:l,lastLoginAt:u});return p&&Array.isArray(p)&&(re.providerData=p.map(e=>({...e}))),c&&(re._redirectEventId=c),re}static async _fromIdTokenResponse(t,n,r=!1){let i=new lt;i.updateFromServerResponse(n);let a=new e({uid:n.localId,auth:t,stsTokenManager:i,isAnonymous:r});return await rt(a),a}static async _fromGetAccountInfoResponse(t,n,r){let i=n.users[0];E(i.localId!==void 0,`internal-error`);let a=i.providerUserInfo===void 0?[]:ot(i.providerUserInfo),o=!(i.email&&i.passwordHash)&&!a?.length,s=new lt;s.updateFromIdToken(r);let c=new e({uid:i.localId,auth:t,stsTokenManager:s,isAnonymous:o}),l={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:a,metadata:new nt(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!a?.length};return Object.assign(c,l),c}},dt=new Map;function N(e){O(e instanceof Function,`Expected a class definition`);let t=dt.get(e);return t?(O(t instanceof e,`Instance stored in cache mismatched with class`),t):(t=new e,dt.set(e,t),t)}var ft=class{constructor(){this.type=`NONE`,this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){let t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}};ft.type=`NONE`;var pt=ft;function mt(e,t,n){return`firebase:${e}:${t}:${n}`}var ht=class e{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;let{config:r,name:i}=this.auth;this.fullUserKey=mt(this.userKey,r.apiKey,i),this.fullPersistenceKey=mt(`persistence`,r.apiKey,i),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){let e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e==`string`){let t=await qe(this.auth,{idToken:e}).catch(()=>void 0);return t?ut._fromGetAccountInfoResponse(this.auth,t,e):null}return ut._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;let t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(t,n,r=`authUser`){if(!n.length)return new e(N(pt),t,r);let i=(await Promise.all(n.map(async e=>{if(await e._isAvailable())return e}))).filter(e=>e),a=i[0]||N(pt),o=mt(r,t.config.apiKey,t.name),s=null;for(let e of n)try{let n=await e._get(o);if(n){let r;if(typeof n==`string`){let e=await qe(t,{idToken:n}).catch(()=>void 0);if(!e)break;r=await ut._fromGetAccountInfoResponse(t,e,n)}else r=ut._fromJSON(t,n);e!==a&&(s=r),a=e;break}}catch{}let c=i.filter(e=>e._shouldAllowMigration);return!a._shouldAllowMigration||!c.length?new e(a,t,r):(a=c[0],s&&await a._set(o,s.toJSON()),await Promise.all(n.map(async e=>{if(e!==a)try{await e._remove(o)}catch{}})),new e(a,t,r))}};function gt(e){let t=e.toLowerCase();if(t.includes(`opera/`)||t.includes(`opr/`)||t.includes(`opios/`))return`Opera`;if(bt(t))return`IEMobile`;if(t.includes(`msie`)||t.includes(`trident/`))return`IE`;if(t.includes(`edge/`))return`Edge`;if(_t(t))return`Firefox`;if(t.includes(`silk/`))return`Silk`;if(St(t))return`Blackberry`;if(Ct(t))return`Webos`;if(vt(t))return`Safari`;if((t.includes(`chrome/`)||yt(t))&&!t.includes(`edge/`))return`Chrome`;if(xt(t))return`Android`;{let t=e.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/);if(t?.length===2)return t[1]}return`Other`}function _t(e=o()){return/firefox\//i.test(e)}function vt(e=o()){let t=e.toLowerCase();return t.includes(`safari/`)&&!t.includes(`chrome/`)&&!t.includes(`crios/`)&&!t.includes(`android`)}function yt(e=o()){return/crios\//i.test(e)}function bt(e=o()){return/iemobile/i.test(e)}function xt(e=o()){return/android/i.test(e)}function St(e=o()){return/blackberry/i.test(e)}function Ct(e=o()){return/webos/i.test(e)}function wt(e=o()){return/iphone|ipad|ipod/i.test(e)||/macintosh/i.test(e)&&/mobile/i.test(e)}function Tt(e=o()){return wt(e)&&!!window.navigator?.standalone}function Et(){return n()&&document.documentMode===10}function Dt(e=o()){return wt(e)||xt(e)||Ct(e)||St(e)||/windows phone/i.test(e)||bt(e)}function Ot(e,t=[]){let n;switch(e){case`Browser`:n=gt(o());break;case`Worker`:n=`${gt(o())}-${e}`;break;default:n=e}let r=t.length?t.join(`,`):`FirebaseCore-web`;return`${n}/JsCore/${le}/${r}`}var kt=class{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){let n=t=>new Promise((n,r)=>{try{n(e(t))}catch(e){r(e)}});n.onAbort=t,this.queue.push(n);let r=this.queue.length-1;return()=>{this.queue[r]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;let t=[];try{for(let n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(e){t.reverse();for(let e of t)try{e()}catch{}throw this.auth._errorFactory.create(`login-blocked`,{originalMessage:e?.message})}}};async function At(e,t={}){return A(e,`GET`,`/v2/passwordPolicy`,k(e,t))}var jt=6,Mt=class{constructor(e){let t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??jt,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState===`ENFORCEMENT_STATE_UNSPECIFIED`&&(this.enforcementState=`OFF`),this.allowedNonAlphanumericCharacters=e.allowedNonAlphanumericCharacters?.join(``)??``,this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){let t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&=t.meetsMinPasswordLength??!0,t.isValid&&=t.meetsMaxPasswordLength??!0,t.isValid&&=t.containsLowercaseLetter??!0,t.isValid&&=t.containsUppercaseLetter??!0,t.isValid&&=t.containsNumericCharacter??!0,t.isValid&&=t.containsNonAlphanumericCharacter??!0,t}validatePasswordLengthOptions(e,t){let n=this.customStrengthOptions.minPasswordLength,r=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),r&&(t.meetsMaxPasswordLength=e.length<=r)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let r=0;r<e.length;r++)n=e.charAt(r),this.updatePasswordCharacterOptionsStatuses(t,n>=`a`&&n<=`z`,n>=`A`&&n<=`Z`,n>=`0`&&n<=`9`,this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,r,i){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||=t),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||=n),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||=r),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||=i)}},Nt=class{constructor(e,t,n,r){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=r,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Pt(this),this.idTokenSubscription=new Pt(this),this.beforeStateQueue=new kt(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=xe,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=r.sdkClientVersion,this._persistenceManagerAvailable=new Promise(e=>this._resolvePersistenceManagerAvailable=e)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=N(t)),this._initializationPromise=this.queue(async()=>{if(!this._deleted&&(this.persistenceManager=await ht.create(this,e),this._resolvePersistenceManagerAvailable?.(),!this._deleted)){if(this._popupRedirectResolver?._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=this.currentUser?.uid||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;let e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{let t=await qe(this,{idToken:e}),n=await ut._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(e){console.warn(`FirebaseServerApp could not login user with provided authIdToken: `,e),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){if(S(this.app)){let e=this.app.settings.authIdToken;return e?new Promise(t=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(e).then(t,t))}):this.directlySetCurrentUser(null)}let t=await this.assertedPersistence.getCurrentUser(),n=t,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();let t=this.redirectUser?._redirectEventId,i=n?._redirectEventId,a=await this.tryRedirectSignIn(e);(!t||t===i)&&a?.user&&(n=a.user,r=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(n)}catch(e){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(e))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return E(this._popupRedirectResolver,this,`argument-error`),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await rt(e)}catch(e){if(e?.code!==`auth/network-request-failed`)return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=je()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(S(this.app))return Promise.reject(T(this));let t=e?p(e):null;return t&&E(t.auth.config.apiKey===this.config.apiKey,this,`invalid-user-token`),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&E(this.tenantId===e.tenantId,this,`tenant-id-mismatch`),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return S(this.app)?Promise.reject(T(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return S(this.app)?Promise.reject(T(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(N(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();let t=this._getPasswordPolicyInternal();return t.schemaVersion===this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?t.validatePassword(e):Promise.reject(this._errorFactory.create(`unsupported-password-policy-schema-version`,{}))}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){let e=new Mt(await At(this));this.tenantId===null?this._projectPasswordPolicy=e:this._tenantPasswordPolicies[this.tenantId]=e}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new a(`auth`,`Firebase`,e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{let n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){let t={providerId:`apple.com`,tokenType:`ACCESS_TOKEN`,token:e,idToken:await this.currentUser.getIdToken()};this.tenantId!=null&&(t.tenantId=this.tenantId),await ct(this,t)}}toJSON(){return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:this._currentUser?.toJSON()}}async _setRedirectUser(e,t){let n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){let t=e&&N(e)||this._popupRedirectResolver;E(t,this,`argument-error`),this.redirectPersistenceManager=await ht.create(this,[N(t._redirectPersistence)],`redirectUser`),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){return this._isInitialized&&await this.queue(async()=>{}),this._currentUser?._redirectEventId===e?this._currentUser:this.redirectUser?._redirectEventId===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);let e=this.currentUser?.uid??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,r){if(this._deleted)return()=>{};let i=typeof t==`function`?t:t.next.bind(t),a=!1,o=this._isInitialized?Promise.resolve():this._initializationPromise;if(E(o,this,`internal-error`),o.then(()=>{a||i(this.currentUser)}),typeof t==`function`){let i=e.addObserver(t,n,r);return()=>{a=!0,i()}}else{let n=e.addObserver(t);return()=>{a=!0,n()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return E(this.persistenceManager,this,`internal-error`),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Ot(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){let e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e[`X-Firebase-gmpid`]=this.app.options.appId);let t=await this.heartbeatServiceProvider.getImmediate({optional:!0})?.getHeartbeatsHeader();t&&(e[`X-Firebase-Client`]=t);let n=await this._getAppCheckToken();return n&&(e[`X-Firebase-AppCheck`]=n),e}async _getAppCheckToken(){if(S(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;let e=await this.appCheckServiceProvider.getImmediate({optional:!0})?.getToken();return e?.error&&Ce(`Error while retrieving App Check token: ${e.error}`),e?.token}};function P(e){return p(e)}var Pt=class{constructor(e){this.auth=e,this.observer=null,this.addObserver=de(e=>this.observer=e)}get next(){return E(this.observer,this.auth,`internal-error`),this.observer.next.bind(this.observer)}},Ft={async loadJS(){throw Error(`Unable to load external scripts`)},recaptchaV2Script:``,recaptchaEnterpriseScript:``,gapiScript:``};function It(e){Ft=e}function Lt(e){return Ft.loadJS(e)}function Rt(){return Ft.recaptchaEnterpriseScript}function zt(){return Ft.gapiScript}function Bt(e){return`__${e}${Math.floor(Math.random()*1e6)}`}var Vt=class{constructor(){this.enterprise=new Ht}ready(e){e()}execute(e,t){return Promise.resolve(`token`)}render(e,t){return``}},Ht=class{ready(e){e()}execute(e,t){return Promise.resolve(`token`)}render(e,t){return``}},Ut=`recaptcha-enterprise`,Wt=`NO_RECAPTCHA`,Gt=class{constructor(e){this.type=Ut,this.auth=P(e)}async verify(e=`verify`,t=!1){async function n(e){if(!t){if(e.tenantId==null&&e._agentRecaptchaConfig!=null)return e._agentRecaptchaConfig.siteKey;if(e.tenantId!=null&&e._tenantRecaptchaConfigs[e.tenantId]!==void 0)return e._tenantRecaptchaConfigs[e.tenantId].siteKey}return new Promise(async(t,n)=>{Ge(e,{clientType:`CLIENT_TYPE_WEB`,version:`RECAPTCHA_ENTERPRISE`}).then(r=>{if(r.recaptchaKey===void 0)n(Error(`recaptcha Enterprise site key undefined`));else{let n=new We(r);return e.tenantId==null?e._agentRecaptchaConfig=n:e._tenantRecaptchaConfigs[e.tenantId]=n,t(n.siteKey)}}).catch(e=>{n(e)})})}function r(t,n,r){let i=window.grecaptcha;Ue(i)?i.enterprise.ready(()=>{i.enterprise.execute(t,{action:e}).then(e=>{n(e)}).catch(()=>{n(Wt)})}):r(Error(`No reCAPTCHA enterprise script loaded.`))}return this.auth.settings.appVerificationDisabledForTesting?new Vt().execute(`siteKey`,{action:`verify`}):new Promise((e,i)=>{n(this.auth).then(n=>{if(!t&&Ue(window.grecaptcha))r(n,e,i);else{if(typeof window>`u`){i(Error(`RecaptchaVerifier is only supported in browser`));return}let t=Rt();t.length!==0&&(t+=n),Lt(t).then(()=>{r(n,e,i)}).catch(e=>{i(e)})}}).catch(e=>{i(e)})})}};async function Kt(e,t,n,r=!1,i=!1){let a=new Gt(e),o;if(i)o=Wt;else try{o=await a.verify(n)}catch{o=await a.verify(n,!0)}let s={...t};if(n===`mfaSmsEnrollment`||n===`mfaSmsSignIn`){if(`phoneEnrollmentInfo`in s){let e=s.phoneEnrollmentInfo.phoneNumber,t=s.phoneEnrollmentInfo.recaptchaToken;Object.assign(s,{phoneEnrollmentInfo:{phoneNumber:e,recaptchaToken:t,captchaResponse:o,clientType:`CLIENT_TYPE_WEB`,recaptchaVersion:`RECAPTCHA_ENTERPRISE`}})}else if(`phoneSignInInfo`in s){let e=s.phoneSignInInfo.recaptchaToken;Object.assign(s,{phoneSignInInfo:{recaptchaToken:e,captchaResponse:o,clientType:`CLIENT_TYPE_WEB`,recaptchaVersion:`RECAPTCHA_ENTERPRISE`}})}return s}return r?Object.assign(s,{captchaResp:o}):Object.assign(s,{captchaResponse:o}),Object.assign(s,{clientType:`CLIENT_TYPE_WEB`}),Object.assign(s,{recaptchaVersion:`RECAPTCHA_ENTERPRISE`}),s}async function qt(e,t,n,r,i){return i===`EMAIL_PASSWORD_PROVIDER`?e._getRecaptchaConfig()?.isProviderEnabled(`EMAIL_PASSWORD_PROVIDER`)?r(e,await Kt(e,t,n,n===`getOobCode`)):r(e,t).catch(async i=>i.code===`auth/missing-recaptcha-token`?(console.log(`${n} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`),r(e,await Kt(e,t,n,n===`getOobCode`))):Promise.reject(i)):i===`PHONE_PROVIDER`?e._getRecaptchaConfig()?.isProviderEnabled(`PHONE_PROVIDER`)?r(e,await Kt(e,t,n)).catch(async i=>e._getRecaptchaConfig()?.getProviderEnforcementState(`PHONE_PROVIDER`)===`AUDIT`&&(i.code===`auth/missing-recaptcha-token`||i.code===`auth/invalid-app-credential`)?(console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${n} flow.`),r(e,await Kt(e,t,n,!1,!0))):Promise.reject(i)):r(e,await Kt(e,t,n,!1,!0)):Promise.reject(i+` provider is not supported.`)}async function Jt(e){let t=P(e),n=new We(await Ge(t,{clientType:`CLIENT_TYPE_WEB`,version:`RECAPTCHA_ENTERPRISE`}));t.tenantId==null?t._agentRecaptchaConfig=n:t._tenantRecaptchaConfigs[t.tenantId]=n,n.isAnyProviderEnabled()&&new Gt(t).verify()}function Yt(e,n){let r=se(e,`auth`);if(r.isInitialized()){let e=r.getImmediate();if(t(r.getOptions(),n??{}))return e;C(e,`already-initialized`)}return r.initialize({options:n})}function Xt(e,t){let n=t?.persistence||[],r=(Array.isArray(n)?n:[n]).map(N);t?.errorMap&&e._updateErrorMap(t.errorMap),e._initializeWithPersistence(r,t?.popupRedirectResolver)}function Zt(e,n,r){let i=P(e);E(/^https?:\/\//.test(n),i,`invalid-emulator-scheme`);let a=!!r?.disableWarnings,o=Qt(n),{host:s,port:c}=$t(n),l=c===null?``:`:${c}`,d={url:`${o}//${s}${l}/`},f=Object.freeze({host:s,port:c,protocol:o.replace(`:`,``),options:Object.freeze({disableWarnings:a})});if(!i._canInitEmulator){E(i.config.emulator&&i.emulatorConfig,i,`emulator-config-failed`),E(t(d,i.config.emulator)&&t(f,i.emulatorConfig),i,`emulator-config-failed`);return}i.config.emulator=d,i.emulatorConfig=f,i.settings.appVerificationDisabledForTesting=!0,u(s)?ie(`${o}//${s}${l}`):a||tn()}function Qt(e){let t=e.indexOf(`:`);return t<0?``:e.substr(0,t+1)}function $t(e){let t=Qt(e),n=/(\/\/)?([^?#/]+)/.exec(e.substr(t.length));if(!n)return{host:``,port:null};let r=n[2].split(`@`).pop()||``,i=/^(\[[^\]]+\])(:|$)/.exec(r);if(i){let e=i[1];return{host:e,port:en(r.substr(e.length+1))}}else{let[e,t]=r.split(`:`);return{host:e,port:en(t)}}}function en(e){if(!e)return null;let t=Number(e);return isNaN(t)?null:t}function tn(){function e(){let e=document.createElement(`p`),t=e.style;e.innerText=`Running in emulator mode. Do not use with production credentials.`,t.position=`fixed`,t.width=`100%`,t.backgroundColor=`#ffffff`,t.border=`.1em solid #000000`,t.color=`#b50000`,t.bottom=`0px`,t.left=`0px`,t.margin=`0px`,t.zIndex=`10000`,t.textAlign=`center`,e.classList.add(`firebase-emulator-warning`),document.body.appendChild(e)}typeof console<`u`&&typeof console.info==`function`&&console.info(`WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.`),typeof window<`u`&&typeof document<`u`&&(document.readyState===`loading`?window.addEventListener(`DOMContentLoaded`,e):e())}var nn=class{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return D(`not implemented`)}_getIdTokenResponse(e){return D(`not implemented`)}_linkToIdToken(e,t){return D(`not implemented`)}_getReauthenticationResolver(e){return D(`not implemented`)}};async function rn(e,t){return A(e,`POST`,`/v1/accounts:signUp`,t)}async function an(e,t){return j(e,`POST`,`/v1/accounts:signInWithPassword`,k(e,t))}async function on(e,t){return j(e,`POST`,`/v1/accounts:signInWithEmailLink`,k(e,t))}async function sn(e,t){return j(e,`POST`,`/v1/accounts:signInWithEmailLink`,k(e,t))}var cn=class e extends nn{constructor(e,t,n,r=null){super(`password`,n),this._email=e,this._password=t,this._tenantId=r}static _fromEmailAndPassword(t,n){return new e(t,n,`password`)}static _fromEmailAndCode(t,n,r=null){return new e(t,n,`emailLink`,r)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){let t=typeof e==`string`?JSON.parse(e):e;if(t?.email&&t?.password){if(t.signInMethod===`password`)return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod===`emailLink`)return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case`password`:return qt(e,{returnSecureToken:!0,email:this._email,password:this._password,clientType:`CLIENT_TYPE_WEB`},`signInWithPassword`,an,`EMAIL_PASSWORD_PROVIDER`);case`emailLink`:return on(e,{email:this._email,oobCode:this._password});default:C(e,`internal-error`)}}async _linkToIdToken(e,t){switch(this.signInMethod){case`password`:return qt(e,{idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:`CLIENT_TYPE_WEB`},`signUpPassword`,rn,`EMAIL_PASSWORD_PROVIDER`);case`emailLink`:return sn(e,{idToken:t,email:this._email,oobCode:this._password});default:C(e,`internal-error`)}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}};async function F(e,t){return j(e,`POST`,`/v1/accounts:signInWithIdp`,k(e,t))}var ln=`http://localhost`,un=class e extends nn{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(t){let n=new e(t.providerId,t.signInMethod);return t.idToken||t.accessToken?(t.idToken&&(n.idToken=t.idToken),t.accessToken&&(n.accessToken=t.accessToken),t.nonce&&!t.pendingToken&&(n.nonce=t.nonce),t.pendingToken&&(n.pendingToken=t.pendingToken)):t.oauthToken&&t.oauthTokenSecret?(n.accessToken=t.oauthToken,n.secret=t.oauthTokenSecret):C(`argument-error`),n}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(t){let{providerId:n,signInMethod:r,...i}=typeof t==`string`?JSON.parse(t):t;if(!n||!r)return null;let a=new e(n,r);return a.idToken=i.idToken||void 0,a.accessToken=i.accessToken||void 0,a.secret=i.secret,a.nonce=i.nonce,a.pendingToken=i.pendingToken||null,a}_getIdTokenResponse(e){return F(e,this.buildRequest())}_linkToIdToken(e,t){let n=this.buildRequest();return n.idToken=t,F(e,n)}_getReauthenticationResolver(e){let t=this.buildRequest();return t.autoCreate=!1,F(e,t)}buildRequest(){let e={requestUri:ln,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{let t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=oe(t)}return e}};async function dn(e,t){return A(e,`POST`,`/v1/accounts:sendVerificationCode`,k(e,t))}async function fn(e,t){return j(e,`POST`,`/v1/accounts:signInWithPhoneNumber`,k(e,t))}async function pn(e,t){let n=await j(e,`POST`,`/v1/accounts:signInWithPhoneNumber`,k(e,t));if(n.temporaryProof)throw He(e,`account-exists-with-different-credential`,n);return n}var mn={USER_NOT_FOUND:`user-not-found`};async function hn(e,t){return j(e,`POST`,`/v1/accounts:signInWithPhoneNumber`,k(e,{...t,operation:`REAUTH`}),mn)}var gn=class e extends nn{constructor(e){super(`phone`,`phone`),this.params=e}static _fromVerification(t,n){return new e({verificationId:t,verificationCode:n})}static _fromTokenResponse(t,n){return new e({phoneNumber:t,temporaryProof:n})}_getIdTokenResponse(e){return fn(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return pn(e,{idToken:t,...this._makeVerificationRequest()})}_getReauthenticationResolver(e){return hn(e,this._makeVerificationRequest())}_makeVerificationRequest(){let{temporaryProof:e,phoneNumber:t,verificationId:n,verificationCode:r}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:n,code:r}}toJSON(){let e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(t){typeof t==`string`&&(t=JSON.parse(t));let{verificationId:n,verificationCode:r,phoneNumber:i,temporaryProof:a}=t;return!r&&!n&&!i&&!a?null:new e({verificationId:n,verificationCode:r,phoneNumber:i,temporaryProof:a})}};function _n(e){switch(e){case`recoverEmail`:return`RECOVER_EMAIL`;case`resetPassword`:return`PASSWORD_RESET`;case`signIn`:return`EMAIL_SIGNIN`;case`verifyEmail`:return`VERIFY_EMAIL`;case`verifyAndChangeEmail`:return`VERIFY_AND_CHANGE_EMAIL`;case`revertSecondFactorAddition`:return`REVERT_SECOND_FACTOR_ADDITION`;default:return null}}function vn(e){let t=s(ue(e)).link,n=t?s(ue(t)).deep_link_id:null,r=s(ue(e)).deep_link_id;return(r?s(ue(r)).link:null)||r||n||t||e}var yn=class e{constructor(e){let t=s(ue(e)),n=t.apiKey??null,r=t.oobCode??null,i=_n(t.mode??null);E(n&&r&&i,`argument-error`),this.apiKey=n,this.operation=i,this.code=r,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(t){let n=vn(t);try{return new e(n)}catch{return null}}},bn=class e{constructor(){this.providerId=e.PROVIDER_ID}static credential(e,t){return cn._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){let n=yn.parseLink(t);return E(n,`argument-error`),cn._fromEmailAndCode(e,n.code,n.tenantId)}};bn.PROVIDER_ID=`password`,bn.EMAIL_PASSWORD_SIGN_IN_METHOD=`password`,bn.EMAIL_LINK_SIGN_IN_METHOD=`emailLink`;var xn=class{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}},Sn=class extends xn{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}},Cn=class e extends Sn{constructor(){super(`facebook.com`)}static credential(t){return un._fromParams({providerId:e.PROVIDER_ID,signInMethod:e.FACEBOOK_SIGN_IN_METHOD,accessToken:t})}static credentialFromResult(t){return e.credentialFromTaggedObject(t)}static credentialFromError(t){return e.credentialFromTaggedObject(t.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t||!(`oauthAccessToken`in t)||!t.oauthAccessToken)return null;try{return e.credential(t.oauthAccessToken)}catch{return null}}};Cn.FACEBOOK_SIGN_IN_METHOD=`facebook.com`,Cn.PROVIDER_ID=`facebook.com`;var wn=class e extends Sn{constructor(){super(`google.com`),this.addScope(`profile`)}static credential(t,n){return un._fromParams({providerId:e.PROVIDER_ID,signInMethod:e.GOOGLE_SIGN_IN_METHOD,idToken:t,accessToken:n})}static credentialFromResult(t){return e.credentialFromTaggedObject(t)}static credentialFromError(t){return e.credentialFromTaggedObject(t.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t)return null;let{oauthIdToken:n,oauthAccessToken:r}=t;if(!n&&!r)return null;try{return e.credential(n,r)}catch{return null}}};wn.GOOGLE_SIGN_IN_METHOD=`google.com`,wn.PROVIDER_ID=`google.com`;var Tn=class e extends Sn{constructor(){super(`github.com`)}static credential(t){return un._fromParams({providerId:e.PROVIDER_ID,signInMethod:e.GITHUB_SIGN_IN_METHOD,accessToken:t})}static credentialFromResult(t){return e.credentialFromTaggedObject(t)}static credentialFromError(t){return e.credentialFromTaggedObject(t.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t||!(`oauthAccessToken`in t)||!t.oauthAccessToken)return null;try{return e.credential(t.oauthAccessToken)}catch{return null}}};Tn.GITHUB_SIGN_IN_METHOD=`github.com`,Tn.PROVIDER_ID=`github.com`;var En=class e extends Sn{constructor(){super(`twitter.com`)}static credential(t,n){return un._fromParams({providerId:e.PROVIDER_ID,signInMethod:e.TWITTER_SIGN_IN_METHOD,oauthToken:t,oauthTokenSecret:n})}static credentialFromResult(t){return e.credentialFromTaggedObject(t)}static credentialFromError(t){return e.credentialFromTaggedObject(t.customData||{})}static credentialFromTaggedObject({_tokenResponse:t}){if(!t)return null;let{oauthAccessToken:n,oauthTokenSecret:r}=t;if(!n||!r)return null;try{return e.credential(n,r)}catch{return null}}};En.TWITTER_SIGN_IN_METHOD=`twitter.com`,En.PROVIDER_ID=`twitter.com`;var Dn=class e{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(t,n,r,i=!1){return new e({user:await ut._fromIdTokenResponse(t,r,i),providerId:On(r),_tokenResponse:r,operationType:n})}static async _forOperation(t,n,r){return await t._updateTokensIfNecessary(r,!0),new e({user:t,providerId:On(r),_tokenResponse:r,operationType:n})}};function On(e){return e.providerId?e.providerId:`phoneNumber`in e?`phone`:null}var kn=class e extends i{constructor(t,n,r,i){super(n.code,n.message),this.operationType=r,this.user=i,Object.setPrototypeOf(this,e.prototype),this.customData={appName:t.name,tenantId:t.tenantId??void 0,_serverResponse:n.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(t,n,r,i){return new e(t,n,r,i)}};function An(e,t,n,r){return(t===`reauthenticate`?n._getReauthenticationResolver(e):n._getIdTokenResponse(e)).catch(n=>{throw n.code===`auth/multi-factor-auth-required`?kn._fromErrorAndOperation(e,n,t,r):n})}async function jn(e,t,n=!1){let r=await $e(e,t._linkToIdToken(e.auth,await e.getIdToken()),n);return Dn._forOperation(e,`link`,r)}async function Mn(e,t,n=!1){let{auth:r}=e;if(S(r.app))return Promise.reject(T(r));let i=`reauthenticate`;try{let a=await $e(e,An(r,i,t,e),n);E(a.idToken,r,`internal-error`);let o=Ze(a.idToken);E(o,r,`internal-error`);let{sub:s}=o;return E(e.uid===s,r,`user-mismatch`),Dn._forOperation(e,i,a)}catch(e){throw e?.code===`auth/user-not-found`&&C(r,`user-mismatch`),e}}async function Nn(e,t,n=!1){if(S(e.app))return Promise.reject(T(e));let r=`signIn`,i=await An(e,r,t),a=await Dn._fromIdTokenResponse(e,r,i);return n||await e._updateCurrentUser(a.user),a}async function Pn(e,t){return Nn(P(e),t)}async function Fn(e){let t=P(e);t._getPasswordPolicyInternal()&&await t._updatePasswordPolicy()}function In(e,t,n){return S(e.app)?Promise.reject(T(e)):Pn(p(e),bn.credential(t,n)).catch(async t=>{throw t.code===`auth/password-does-not-meet-requirements`&&Fn(e),t})}function Ln(e,t,n,r){return p(e).onIdTokenChanged(t,n,r)}function Rn(e,t,n){return p(e).beforeAuthStateChanged(t,n)}function zn(e,t,n,r){return p(e).onAuthStateChanged(t,n,r)}function Bn(e){return p(e).signOut()}function Vn(e,t){return A(e,`POST`,`/v2/accounts/mfaEnrollment:start`,k(e,t))}function Hn(e,t){return A(e,`POST`,`/v2/accounts/mfaEnrollment:finalize`,k(e,t))}function Un(e,t){return A(e,`POST`,`/v2/accounts/mfaEnrollment:start`,k(e,t))}function Wn(e,t){return A(e,`POST`,`/v2/accounts/mfaEnrollment:finalize`,k(e,t))}var Gn=`__sak`,Kn=class{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Gn,`1`),this.storage.removeItem(Gn),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){let t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}},qn=1e3,Jn=10,Yn=class extends Kn{constructor(){super(()=>window.localStorage,`LOCAL`),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Dt(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(let t of Object.keys(this.listeners)){let n=this.storage.getItem(t),r=this.localCache[t];n!==r&&e(t,r,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((e,t,n)=>{this.notifyListeners(e,n)});return}let n=e.key;t?this.detachListener():this.stopPolling();let r=()=>{let e=this.storage.getItem(n);!t&&this.localCache[n]===e||this.notifyListeners(n,e)},i=this.storage.getItem(n);Et()&&i!==e.newValue&&e.newValue!==e.oldValue?setTimeout(r,Jn):r()}notifyListeners(e,t){this.localCache[e]=t;let n=this.listeners[e];if(n)for(let e of Array.from(n))e(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent(`storage`,{key:e,oldValue:t,newValue:n}),!0)})},qn)}stopPolling(){this.pollTimer&&=(clearInterval(this.pollTimer),null)}attachListener(){window.addEventListener(`storage`,this.boundEventHandler)}detachListener(){window.removeEventListener(`storage`,this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){let t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}};Yn.type=`LOCAL`;var Xn=Yn,Zn=1e3;function Qn(e){let t=e.replace(/[\\^$.*+?()[\]{}|]/g,`\\$&`),n=RegExp(`${t}=([^;]+)`);return document.cookie.match(n)?.[1]??null}function $n(e){return`${window.location.protocol===`http:`?`__dev_`:`__HOST-`}FIREBASE_${e.split(`:`)[3]}`}var er=class{constructor(){this.type=`COOKIE`,this.listenerUnsubscribes=new Map}_getFinalTarget(e){let t=new URL(`${window.location.origin}/__cookies__`);return t.searchParams.set(`finalTarget`,e),t}async _isAvailable(){return typeof isSecureContext==`boolean`&&!isSecureContext||typeof navigator>`u`||typeof document>`u`?!1:navigator.cookieEnabled??!0}async _set(e,t){}async _get(e){if(!this._isAvailable())return null;let t=$n(e);return window.cookieStore?(await window.cookieStore.get(t))?.value:Qn(t)}async _remove(e){if(!this._isAvailable()||!await this._get(e))return;let t=$n(e);document.cookie=`${t}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`,await fetch(`/__cookies__`,{method:`DELETE`}).catch(()=>void 0)}_addListener(e,t){if(!this._isAvailable())return;let n=$n(e);if(window.cookieStore){let e=(e=>{let r=e.changed.find(e=>e.name===n);r&&t(r.value),e.deleted.find(e=>e.name===n)&&t(null)});return this.listenerUnsubscribes.set(t,()=>window.cookieStore.removeEventListener(`change`,e)),window.cookieStore.addEventListener(`change`,e)}let r=Qn(n),i=setInterval(()=>{let e=Qn(n);e!==r&&(t(e),r=e)},Zn);this.listenerUnsubscribes.set(t,()=>clearInterval(i))}_removeListener(e,t){let n=this.listenerUnsubscribes.get(t);n&&(n(),this.listenerUnsubscribes.delete(t))}};er.type=`COOKIE`;var tr=class extends Kn{constructor(){super(()=>window.sessionStorage,`SESSION`)}_addListener(e,t){}_removeListener(e,t){}};tr.type=`SESSION`;var nr=tr;function rr(e){return Promise.all(e.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(e){return{fulfilled:!1,reason:e}}}))}var ir=class e{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(t){let n=this.receivers.find(e=>e.isListeningto(t));if(n)return n;let r=new e(t);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){let t=e,{eventId:n,eventType:r,data:i}=t.data,a=this.handlersMap[r];if(!a?.size)return;t.ports[0].postMessage({status:`ack`,eventId:n,eventType:r});let o=await rr(Array.from(a).map(async e=>e(t.origin,i)));t.ports[0].postMessage({status:`done`,eventId:n,eventType:r,response:o})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener(`message`,this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener(`message`,this.boundEventHandler)}};ir.receivers=[];function ar(e=``,t=10){let n=``;for(let e=0;e<t;e++)n+=Math.floor(Math.random()*10);return e+n}var or=class{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener(`message`,e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){let r=typeof MessageChannel<`u`?new MessageChannel:null;if(!r)throw Error(`connection_unavailable`);let i,a;return new Promise((o,s)=>{let c=ar(``,20);r.port1.start();let l=setTimeout(()=>{s(Error(`unsupported_event`))},n);a={messageChannel:r,onMessage(e){let t=e;if(t.data.eventId===c)switch(t.data.status){case`ack`:clearTimeout(l),i=setTimeout(()=>{s(Error(`timeout`))},3e3);break;case`done`:clearTimeout(i),o(t.data.response);break;default:clearTimeout(l),clearTimeout(i),s(Error(`invalid_response`));break}}},this.handlers.add(a),r.port1.addEventListener(`message`,a.onMessage),this.target.postMessage({eventType:e,eventId:c,data:t},[r.port2])}).finally(()=>{a&&this.removeMessageHandler(a)})}};function I(){return window}function sr(e){I().location.href=e}function cr(){return I().WorkerGlobalScope!==void 0&&typeof I().importScripts==`function`}async function lr(){if(!navigator?.serviceWorker)return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function ur(){return navigator?.serviceWorker?.controller||null}function dr(){return cr()?self:null}var fr=`firebaseLocalStorageDb`,pr=1,mr=`firebaseLocalStorage`,hr=`fbase_key`,gr=class{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener(`success`,()=>{e(this.request.result)}),this.request.addEventListener(`error`,()=>{t(this.request.error)})})}};function _r(e,t){return e.transaction([mr],t?`readwrite`:`readonly`).objectStore(mr)}function vr(){return new gr(indexedDB.deleteDatabase(fr)).toPromise()}function yr(){let e=indexedDB.open(fr,pr);return new Promise((t,n)=>{e.addEventListener(`error`,()=>{n(e.error)}),e.addEventListener(`upgradeneeded`,()=>{let t=e.result;try{t.createObjectStore(mr,{keyPath:hr})}catch(e){n(e)}}),e.addEventListener(`success`,async()=>{let n=e.result;n.objectStoreNames.contains(mr)?t(n):(n.close(),await vr(),t(await yr()))})})}async function br(e,t,n){return new gr(_r(e,!0).put({[hr]:t,value:n})).toPromise()}async function xr(e,t){let n=await new gr(_r(e,!1).get(t)).toPromise();return n===void 0?null:n.value}function Sr(e,t){return new gr(_r(e,!0).delete(t)).toPromise()}var Cr=800,wr=3,Tr=class{constructor(){this.type=`LOCAL`,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db||=await yr(),this.db}async _withRetries(e){let t=0;for(;;)try{return await e(await this._openDb())}catch(e){if(t++>wr)throw e;this.db&&=(this.db.close(),void 0)}}async initializeServiceWorkerMessaging(){return cr()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=ir._getInstance(dr()),this.receiver._subscribe(`keyChanged`,async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe(`ping`,async(e,t)=>[`keyChanged`])}async initializeSender(){if(this.activeServiceWorker=await lr(),!this.activeServiceWorker)return;this.sender=new or(this.activeServiceWorker);let e=await this.sender._send(`ping`,{},800);e&&e[0]?.fulfilled&&e[0]?.value.includes(`keyChanged`)&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||ur()!==this.activeServiceWorker))try{await this.sender._send(`keyChanged`,{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;let e=await yr();return await br(e,Gn,`1`),await Sr(e,Gn),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>br(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){let t=await this._withRetries(t=>xr(t,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>Sr(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){let e=await this._withRetries(e=>new gr(_r(e,!1).getAll()).toPromise());if(!e||this.pendingWrites!==0)return[];let t=[],n=new Set;if(e.length!==0)for(let{fbase_key:r,value:i}of e)n.add(r),JSON.stringify(this.localCache[r])!==JSON.stringify(i)&&(this.notifyListeners(r,i),t.push(r));for(let e of Object.keys(this.localCache))this.localCache[e]&&!n.has(e)&&(this.notifyListeners(e,null),t.push(e));return t}notifyListeners(e,t){this.localCache[e]=t;let n=this.listeners[e];if(n)for(let e of Array.from(n))e(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Cr)}stopPolling(){this.pollTimer&&=(clearInterval(this.pollTimer),null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}};Tr.type=`LOCAL`;var Er=Tr;function Dr(e,t){return A(e,`POST`,`/v2/accounts/mfaSignIn:start`,k(e,t))}function Or(e,t){return A(e,`POST`,`/v2/accounts/mfaSignIn:finalize`,k(e,t))}function kr(e,t){return A(e,`POST`,`/v2/accounts/mfaSignIn:finalize`,k(e,t))}Bt(`rcb`),new Me(3e4,6e4);var Ar=`recaptcha`;async function jr(e,t,n){if(!e._getRecaptchaConfig())try{await Jt(e)}catch{console.log(`Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.`)}try{let r;if(r=typeof t==`string`?{phoneNumber:t}:t,`session`in r){let t=r.session;if(`phoneNumber`in r)return E(t.type===`enroll`,e,`internal-error`),(await qt(e,{idToken:t.credential,phoneEnrollmentInfo:{phoneNumber:r.phoneNumber,clientType:`CLIENT_TYPE_WEB`}},`mfaSmsEnrollment`,async(e,t)=>t.phoneEnrollmentInfo.captchaResponse===Wt?(E(n?.type===Ar,e,`argument-error`),Vn(e,await Mr(e,t,n))):Vn(e,t),`PHONE_PROVIDER`).catch(e=>Promise.reject(e))).phoneSessionInfo.sessionInfo;{E(t.type===`signin`,e,`internal-error`);let i=r.multiFactorHint?.uid||r.multiFactorUid;return E(i,e,`missing-multi-factor-info`),(await qt(e,{mfaPendingCredential:t.credential,mfaEnrollmentId:i,phoneSignInInfo:{clientType:`CLIENT_TYPE_WEB`}},`mfaSmsSignIn`,async(e,t)=>t.phoneSignInInfo.captchaResponse===Wt?(E(n?.type===Ar,e,`argument-error`),Dr(e,await Mr(e,t,n))):Dr(e,t),`PHONE_PROVIDER`).catch(e=>Promise.reject(e))).phoneResponseInfo.sessionInfo}}else return(await qt(e,{phoneNumber:r.phoneNumber,clientType:`CLIENT_TYPE_WEB`},`sendVerificationCode`,async(e,t)=>t.captchaResponse===Wt?(E(n?.type===Ar,e,`argument-error`),dn(e,await Mr(e,t,n))):dn(e,t),`PHONE_PROVIDER`).catch(e=>Promise.reject(e))).sessionInfo}finally{n?._reset()}}async function Mr(e,t,n){E(n.type===Ar,e,`argument-error`);let r=await n.verify();E(typeof r==`string`,e,`argument-error`);let i={...t};if(`phoneEnrollmentInfo`in i){let e=i.phoneEnrollmentInfo.phoneNumber,t=i.phoneEnrollmentInfo.captchaResponse,n=i.phoneEnrollmentInfo.clientType,a=i.phoneEnrollmentInfo.recaptchaVersion;return Object.assign(i,{phoneEnrollmentInfo:{phoneNumber:e,recaptchaToken:r,captchaResponse:t,clientType:n,recaptchaVersion:a}}),i}else if(`phoneSignInInfo`in i){let e=i.phoneSignInInfo.captchaResponse,t=i.phoneSignInInfo.clientType,n=i.phoneSignInInfo.recaptchaVersion;return Object.assign(i,{phoneSignInInfo:{recaptchaToken:r,captchaResponse:e,clientType:t,recaptchaVersion:n}}),i}else return Object.assign(i,{recaptchaToken:r}),i}var Nr=class e{constructor(t){this.providerId=e.PROVIDER_ID,this.auth=P(t)}verifyPhoneNumber(e,t){return jr(this.auth,e,p(t))}static credential(e,t){return gn._fromVerification(e,t)}static credentialFromResult(t){let n=t;return e.credentialFromTaggedObject(n)}static credentialFromError(t){return e.credentialFromTaggedObject(t.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;let{phoneNumber:t,temporaryProof:n}=e;return t&&n?gn._fromTokenResponse(t,n):null}};Nr.PROVIDER_ID=`phone`,Nr.PHONE_SIGN_IN_METHOD=`phone`;function Pr(e,t){return t?N(t):(E(e._popupRedirectResolver,e,`argument-error`),e._popupRedirectResolver)}var Fr=class extends nn{constructor(e){super(`custom`,`custom`),this.params=e}_getIdTokenResponse(e){return F(e,this._buildIdpRequest())}_linkToIdToken(e,t){return F(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return F(e,this._buildIdpRequest())}_buildIdpRequest(e){let t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}};function Ir(e){return Nn(e.auth,new Fr(e),e.bypassAuthState)}function Lr(e){let{auth:t,user:n}=e;return E(n,t,`internal-error`),Mn(n,new Fr(e),e.bypassAuthState)}async function Rr(e){let{auth:t,user:n}=e;return E(n,t,`internal-error`),jn(n,new Fr(e),e.bypassAuthState)}var zr=class{constructor(e,t,n,r,i=!1){this.auth=e,this.resolver=n,this.user=r,this.bypassAuthState=i,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(e){this.reject(e)}})}async onAuthEvent(e){let{urlResponse:t,sessionId:n,postBody:r,tenantId:i,error:a,type:o}=e;if(a){this.reject(a);return}let s={auth:this.auth,requestUri:t,sessionId:n,tenantId:i||void 0,postBody:r||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(o)(s))}catch(e){this.reject(e)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case`signInViaPopup`:case`signInViaRedirect`:return Ir;case`linkViaPopup`:case`linkViaRedirect`:return Rr;case`reauthViaPopup`:case`reauthViaRedirect`:return Lr;default:C(this.auth,`internal-error`)}}resolve(e){O(this.pendingPromise,`Pending promise was never set`),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){O(this.pendingPromise,`Pending promise was never set`),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}},Br=new Me(2e3,1e4),Vr=class e extends zr{constructor(t,n,r,i,a){super(t,n,i,a),this.provider=r,this.authWindow=null,this.pollId=null,e.currentPopupAction&&e.currentPopupAction.cancel(),e.currentPopupAction=this}async executeNotNull(){let e=await this.execute();return E(e,this.auth,`internal-error`),e}async onExecution(){O(this.filter.length===1,`Popup operations only handle one event`);let e=ar();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(e=>{this.reject(e)}),this.resolver._isIframeWebStorageSupported(this.auth,e=>{e||this.reject(w(this.auth,`web-storage-unsupported`))}),this.pollUserCancellation()}get eventId(){return this.authWindow?.associatedEvent||null}cancel(){this.reject(w(this.auth,`cancelled-popup-request`))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,e.currentPopupAction=null}pollUserCancellation(){let e=()=>{if(this.authWindow?.window?.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(w(this.auth,`popup-closed-by-user`))},8e3);return}this.pollId=window.setTimeout(e,Br.get())};e()}};Vr.currentPopupAction=null;var Hr=`pendingRedirect`,Ur=new Map,Wr=class extends zr{constructor(e,t,n=!1){super(e,[`signInViaRedirect`,`linkViaRedirect`,`reauthViaRedirect`,`unknown`],t,void 0,n),this.eventId=null}async execute(){let e=Ur.get(this.auth._key());if(!e){try{let t=await Gr(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(t)}catch(t){e=()=>Promise.reject(t)}Ur.set(this.auth._key(),e)}return this.bypassAuthState||Ur.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type===`signInViaRedirect`)return super.onAuthEvent(e);if(e.type===`unknown`){this.resolve(null);return}if(e.eventId){let t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}};async function Gr(e,t){let n=Jr(t),r=qr(e);if(!await r._isAvailable())return!1;let i=await r._get(n)===`true`;return await r._remove(n),i}function Kr(e,t){Ur.set(e._key(),t)}function qr(e){return N(e._redirectPersistence)}function Jr(e){return mt(Hr,e.config.apiKey,e.name)}async function Yr(e,t,n=!1){if(S(e.app))return Promise.reject(T(e));let r=P(e),i=await new Wr(r,Pr(r,t),n).execute();return i&&!n&&(delete i.user._redirectEventId,await r._persistUserIfCurrent(i.user),await r._setRedirectUser(null,t)),i}var Xr=600*1e3,Zr=class{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!ei(e)?t:(this.hasHandledPotentialRedirect=!0,t||=(this.queuedRedirectEvent=e,!0),t)}sendToConsumer(e,t){if(e.error&&!$r(e)){let n=e.error.code?.split(`auth/`)[1]||`internal-error`;t.onError(w(this.auth,n))}else t.onAuthEvent(e)}isEventForConsumer(e,t){let n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=Xr&&this.cachedEventUids.clear(),this.cachedEventUids.has(Qr(e))}saveEventToCache(e){this.cachedEventUids.add(Qr(e)),this.lastProcessedEventTime=Date.now()}};function Qr(e){return[e.type,e.eventId,e.sessionId,e.tenantId].filter(e=>e).join(`-`)}function $r({type:e,error:t}){return e===`unknown`&&t?.code===`auth/no-auth-event`}function ei(e){switch(e.type){case`signInViaRedirect`:case`linkViaRedirect`:case`reauthViaRedirect`:return!0;case`unknown`:return $r(e);default:return!1}}async function ti(e,t={}){return A(e,`GET`,`/v1/projects`,t)}var ni=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,ri=/^https?/;async function ii(e){if(e.config.emulator)return;let{authorizedDomains:t}=await ti(e);for(let e of t)try{if(ai(e))return}catch{}C(e,`unauthorized-domain`)}function ai(e){let t=De(),{protocol:n,hostname:r}=new URL(t);if(e.startsWith(`chrome-extension://`)){let i=new URL(e);return i.hostname===``&&r===``?n===`chrome-extension:`&&e.replace(`chrome-extension://`,``)===t.replace(`chrome-extension://`,``):n===`chrome-extension:`&&i.hostname===r}if(!ri.test(n))return!1;if(ni.test(e))return r===e;let i=e.replace(/\./g,`\\.`);return RegExp(`^(.+\\.`+i+`|`+i+`)$`,`i`).test(r)}var oi=new Me(3e4,6e4);function si(){let e=I().___jsl;if(e?.H){for(let t of Object.keys(e.H))if(e.H[t].r=e.H[t].r||[],e.H[t].L=e.H[t].L||[],e.H[t].r=[...e.H[t].L],e.CP)for(let t=0;t<e.CP.length;t++)e.CP[t]=null}}function ci(e){return new Promise((t,n)=>{function r(){si(),gapi.load(`gapi.iframes`,{callback:()=>{t(gapi.iframes.getContext())},ontimeout:()=>{si(),n(w(e,`network-request-failed`))},timeout:oi.get()})}if(I().gapi?.iframes?.Iframe)t(gapi.iframes.getContext());else if(I().gapi?.load)r();else{let t=Bt(`iframefcb`);return I()[t]=()=>{gapi.load?r():n(w(e,`network-request-failed`))},Lt(`${zt()}?onload=${t}`).catch(e=>n(e))}}).catch(e=>{throw li=null,e})}var li=null;function ui(e){return li||=ci(e),li}var di=new Me(5e3,15e3),fi=`__/auth/iframe`,pi=`emulator/auth/iframe`,mi={style:{position:`absolute`,top:`-100px`,width:`1px`,height:`1px`},"aria-hidden":`true`,tabindex:`-1`},hi=new Map([[`identitytoolkit.googleapis.com`,`p`],[`staging-identitytoolkit.sandbox.googleapis.com`,`s`],[`test-identitytoolkit.sandbox.googleapis.com`,`t`]]);function gi(e){let t=e.config;E(t.authDomain,e,`auth-domain-config-required`);let n=t.emulator?Ne(t,pi):`https://${e.config.authDomain}/${fi}`,r={apiKey:t.apiKey,appName:e.name,v:le},i=hi.get(e.config.apiHost);i&&(r.eid=i);let a=e._getFrameworks();return a.length&&(r.fw=a.join(`,`)),`${n}?${oe(r).slice(1)}`}async function _i(e){let t=await ui(e),n=I().gapi;return E(n,e,`internal-error`),t.open({where:document.body,url:gi(e),messageHandlersFilter:n.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:mi,dontclear:!0},t=>new Promise(async(n,r)=>{await t.restyle({setHideOnLeave:!1});let i=w(e,`network-request-failed`),a=I().setTimeout(()=>{r(i)},di.get());function o(){I().clearTimeout(a),n(t)}t.ping(o).then(o,()=>{r(i)})}))}var vi={location:`yes`,resizable:`yes`,statusbar:`yes`,toolbar:`no`},yi=500,bi=600,xi=`_blank`,Si=`http://localhost`,Ci=class{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}};function wi(e,t,n,r=yi,i=bi){let a=Math.max((window.screen.availHeight-i)/2,0).toString(),s=Math.max((window.screen.availWidth-r)/2,0).toString(),c=``,l={...vi,width:r.toString(),height:i.toString(),top:a,left:s},u=o().toLowerCase();n&&(c=yt(u)?xi:n),_t(u)&&(t||=Si,l.scrollbars=`yes`);let d=Object.entries(l).reduce((e,[t,n])=>`${e}${t}=${n},`,``);if(Tt(u)&&c!==`_self`)return Ti(t||``,c),new Ci(null);let f=window.open(t||``,c,d);E(f,e,`popup-blocked`);try{f.focus()}catch{}return new Ci(f)}function Ti(e,t){let n=document.createElement(`a`);n.href=e,n.target=t;let r=document.createEvent(`MouseEvent`);r.initMouseEvent(`click`,!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),n.dispatchEvent(r)}var Ei=`__/auth/handler`,Di=`emulator/auth/handler`,Oi=`fac`;async function ki(e,t,n,r,i,a){E(e.config.authDomain,e,`auth-domain-config-required`),E(e.config.apiKey,e,`invalid-api-key`);let o={apiKey:e.config.apiKey,appName:e.name,authType:n,redirectUrl:r,v:le,eventId:i};if(t instanceof xn){t.setDefaultLanguage(e.languageCode),o.providerId=t.providerId||``,ve(t.getCustomParameters())||(o.customParameters=JSON.stringify(t.getCustomParameters()));for(let[e,t]of Object.entries(a||{}))o[e]=t}if(t instanceof Sn){let e=t.getScopes().filter(e=>e!==``);e.length>0&&(o.scopes=e.join(`,`))}e.tenantId&&(o.tid=e.tenantId);let s=o;for(let e of Object.keys(s))s[e]===void 0&&delete s[e];let c=await e._getAppCheckToken(),l=c?`#${Oi}=${encodeURIComponent(c)}`:``;return`${Ai(e)}?${oe(s).slice(1)}${l}`}function Ai({config:e}){return e.emulator?Ne(e,Di):`https://${e.authDomain}/${Ei}`}var ji=`webStorageSupport`,Mi=class{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=nr,this._completeRedirectFn=Yr,this._overrideRedirectResult=Kr}async _openPopup(e,t,n,r){return O(this.eventManagers[e._key()]?.manager,`_initialize() not called before _openPopup()`),wi(e,await ki(e,t,n,De(),r),ar())}async _openRedirect(e,t,n,r){return await this._originValidation(e),sr(await ki(e,t,n,De(),r)),new Promise(()=>{})}_initialize(e){let t=e._key();if(this.eventManagers[t]){let{manager:e,promise:n}=this.eventManagers[t];return e?Promise.resolve(e):(O(n,`If manager is not set, promise should be`),n)}let n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){let t=await _i(e),n=new Zr(e);return t.register(`authEvent`,t=>(E(t?.authEvent,e,`invalid-auth-event`),{status:n.onEvent(t.authEvent)?`ACK`:`ERROR`}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(ji,{type:ji},n=>{let r=n?.[0]?.[ji];r!==void 0&&t(!!r),C(e,`internal-error`)},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){let t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=ii(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Dt()||vt()||wt()}},Ni=class{constructor(e){this.factorId=e}_process(e,t,n){switch(t.type){case`enroll`:return this._finalizeEnroll(e,t.credential,n);case`signin`:return this._finalizeSignIn(e,t.credential);default:return D(`unexpected MultiFactorSessionType`)}}},Pi=class e extends Ni{constructor(e){super(`phone`),this.credential=e}static _fromCredential(t){return new e(t)}_finalizeEnroll(e,t,n){return Hn(e,{idToken:t,displayName:n,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return Or(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}},Fi=class{constructor(){}static assertion(e){return Pi._fromCredential(e)}};Fi.FACTOR_ID=`phone`;var Ii=class{static assertionForEnrollment(e,t){return Li._fromSecret(e,t)}static assertionForSignIn(e,t){return Li._fromEnrollmentId(e,t)}static async generateSecret(e){let t=e;E(t.user?.auth!==void 0,`internal-error`);let n=await Un(t.user.auth,{idToken:t.credential,totpEnrollmentInfo:{}});return Ri._fromStartTotpMfaEnrollmentResponse(n,t.user.auth)}};Ii.FACTOR_ID=`totp`;var Li=class e extends Ni{constructor(e,t,n){super(`totp`),this.otp=e,this.enrollmentId=t,this.secret=n}static _fromSecret(t,n){return new e(n,void 0,t)}static _fromEnrollmentId(t,n){return new e(n,t)}async _finalizeEnroll(e,t,n){return E(this.secret!==void 0,e,`argument-error`),Wn(e,{idToken:t,displayName:n,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)})}async _finalizeSignIn(e,t){E(this.enrollmentId!==void 0&&this.otp!==void 0,e,`argument-error`);let n={verificationCode:this.otp};return kr(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:n})}},Ri=class e{constructor(e,t,n,r,i,a,o){this.sessionInfo=a,this.auth=o,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=n,this.codeIntervalSeconds=r,this.enrollmentCompletionDeadline=i}static _fromStartTotpMfaEnrollmentResponse(t,n){return new e(t.totpSessionInfo.sharedSecretKey,t.totpSessionInfo.hashingAlgorithm,t.totpSessionInfo.verificationCodeLength,t.totpSessionInfo.periodSec,new Date(t.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),t.totpSessionInfo.sessionInfo,n)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){let n=!1;return(zi(e)||zi(t))&&(n=!0),n&&(zi(e)&&(e=this.auth.currentUser?.email||`unknownuser`),zi(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}};function zi(e){return e===void 0||e?.length===0}var Bi=`@firebase/auth`,Vi=`1.13.0`,Hi=class{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){return this.assertAuthConfigured(),this.auth.currentUser?.uid||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;let t=this.auth.onIdTokenChanged(t=>{e(t?.stsTokenManager.accessToken||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();let t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){E(this.auth._initializationPromise,`dependent-sdk-initialized-before-auth`)}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}};function Ui(e){switch(e){case`Node`:return`node`;case`ReactNative`:return`rn`;case`Worker`:return`webworker`;case`Cordova`:return`cordova`;case`WebExtension`:return`web-extension`;default:return}}function Wi(e){_e(new re(`auth`,(t,{options:n})=>{let r=t.getProvider(`app`).getImmediate(),i=t.getProvider(`heartbeat`),a=t.getProvider(`app-check-internal`),{apiKey:o,authDomain:s}=r.options;E(o&&!o.includes(`:`),`invalid-api-key`,{appName:r.name});let c=new Nt(r,i,a,{apiKey:o,authDomain:s,clientPlatform:e,apiHost:`identitytoolkit.googleapis.com`,tokenApiHost:`securetoken.googleapis.com`,apiScheme:`https`,sdkClientVersion:Ot(e)});return Xt(c,n),c},`PUBLIC`).setInstantiationMode(`EXPLICIT`).setInstanceCreatedCallback((e,t,n)=>{e.getProvider(`auth-internal`).initialize()})),_e(new re(`auth-internal`,e=>(e=>new Hi(e))(P(e.getProvider(`auth`).getImmediate())),`PRIVATE`).setInstantiationMode(`EXPLICIT`)),ne(Bi,Vi,Ui(e)),ne(Bi,Vi,`esm2020`)}var Gi=f(`authIdTokenMaxAge`)||300,Ki=null,qi=e=>async t=>{let n=t&&await t.getIdTokenResult(),r=n&&(new Date().getTime()-Date.parse(n.issuedAtTime))/1e3;if(r&&r>Gi)return;let i=n?.token;Ki!==i&&(Ki=i,await fetch(e,{method:i?`POST`:`DELETE`,headers:i?{Authorization:`Bearer ${i}`}:{}}))};function Ji(e=ce()){let t=se(e,`auth`);if(t.isInitialized())return t.getImmediate();let n=Yt(e,{popupRedirectResolver:Mi,persistence:[Er,Xn,nr]}),r=f(`authTokenSyncURL`);if(r&&typeof isSecureContext==`boolean`&&isSecureContext){let e=new URL(r,location.origin);if(location.origin===e.origin){let t=qi(e.toString());Rn(n,t,()=>t(n.currentUser)),Ln(n,e=>t(e))}}let i=d(`auth`);return i&&Zt(n,`http://${i}`),n}function Yi(){return document.getElementsByTagName(`head`)?.[0]??document}It({loadJS(e){return new Promise((t,n)=>{let r=document.createElement(`script`);r.setAttribute(`src`,e),r.onload=t,r.onerror=e=>{let t=w(`internal-error`);t.customData=e,n(t)},r.type=`text/javascript`,r.charset=`UTF-8`,Yi().appendChild(r)})},gapiScript:`https://apis.google.com/js/api.js`,recaptchaV2Script:`https://www.google.com/recaptcha/api.js`,recaptchaEnterpriseScript:`https://www.google.com/recaptcha/enterprise.js?render=`}),Wi(`Browser`);var Xi=e({auth:()=>R,db:()=>L}),Zi=ge({apiKey:`AIzaSyCoSAUVO7EA6UixbPS0B_trPTc0yVdzhAA`,authDomain:`fant-e5ae5.firebaseapp.com`,projectId:`fant-e5ae5`,storageBucket:`fant-e5ae5.firebasestorage.app`,messagingSenderId:`177376833232`,appId:`1:177376833232:web:d0b0b29a593652d27878d5`}),L=pe(Zi),R=Ji(Zi),Qi=null,$i=null;async function ea(e){Qi=e;let t=await _(y(L,`users`,e.uid));t.exists()&&($i=t.data().role)}var ta=[{id:`main`,label:`메인`,roles:[`admin`,`office`,`production`]},{id:`production`,label:`생산 입력`,roles:[`admin`,`office`,`production`]},{id:`meat`,label:`원육 재고`,roles:[`admin`,`office`,`production`]},{id:`egg`,label:`계란`,roles:[`admin`,`office`,`production`]},{id:`bag`,label:`봉투 재고`,roles:[`admin`,`office`,`production`]},{id:`frozenProduct`,label:`동결제품 입고`,roles:[`admin`,`office`,`production`]},{id:`frozenPan`,label:`동결판 재고`,roles:[`admin`,`office`,`production`]},{id:`frozenSep`,label:`동결 분리작업`,roles:[`admin`,`office`,`production`]},{id:`schedule`,label:`입고 예정관리`,roles:[`admin`,`office`,`production`]},{id:`recipe`,label:`레시피 관리`,roles:[`admin`,`office`]},{id:`stats`,label:`통계`,roles:[`admin`,`office`]},{id:`settings`,label:`설정`,roles:[`admin`,`office`,`production`]}],na=`main`;function ra(e){na=e}async function ia(){await Bn(R)}async function aa(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>설정 로딩 중...</p></div>`;let t=await oa();e.innerHTML=`
    <div class="settings-wrap">
      <h2 class="settings-title">설정</h2>

      <!-- 담당자 관리 -->
      <div class="settings-section">
        <h3 class="settings-section-title">담당자 관리</h3>
        <div class="staff-groups">
          ${sa(`senior`,`선임`,t.senior)}
          ${sa(`lead`,`주임`,t.lead)}
          ${sa(`office`,`사무`,t.office)}
        </div>
      </div>
    </div>
  `,ca(t)}async function oa(){let e={senior:[],lead:[],office:[]};for(let t of Object.keys(e)){let n=await _(y(L,`staffGroups`,t));n.exists()&&(e[t]=n.data().members||[])}return e}function sa(e,t,n){return`
    <div class="staff-group" data-group="${e}">
      <div class="staff-group-header">
        <span class="staff-group-label">${t}</span>
        <button class="btn-add-staff" data-group="${e}">+ 추가</button>
      </div>
      <div class="staff-list" id="staffList-${e}">
        ${n.map((t,n)=>`
          <div class="staff-item" data-group="${e}" data-index="${n}">
            <span>${t.name}</span>
            <button class="btn-del-staff" data-group="${e}" data-index="${n}">삭제</button>
          </div>
        `).join(``)}
        ${n.length===0?`<p class="staff-empty">담당자 없음</p>`:``}
      </div>
    </div>
  `}function ca(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=prompt(`담당자 이름을 입력해주세요:`);!r||!r.trim()||(e[n].push({id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}),await la(n,e[n]),ua(e))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index);confirm(`담당자를 삭제하시겠습니까?`)&&(e[n].splice(r,1),await la(n,e[n]),ua(e))})})}async function la(e,t){await fe(y(L,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date})}function ua(e){document.getElementById(`staffList-senior`).innerHTML=da(`senior`,e.senior),document.getElementById(`staffList-lead`).innerHTML=da(`lead`,e.lead),document.getElementById(`staffList-office`).innerHTML=da(`office`,e.office),ca(e)}function da(e,t){return t.map((t,n)=>`
    <div class="staff-item" data-group="${e}" data-index="${n}">
      <span>${t.name}</span>
      <button class="btn-del-staff" data-group="${e}" data-index="${n}">삭제</button>
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}var z=[],B=null;async function fa(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>레시피 로딩 중...</p></div>`,z=await pa(),ma()}async function pa(){return(await m(h(g(L,`recipes`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}function ma(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 레시피 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">레시피 목록</span>
          <button class="btn-primary" id="btnNewRecipe">+ 신규 추가</button>
        </div>
        <div class="recipe-list" id="recipeList">
          ${ha()}
        </div>
      </div>

      <!-- 오른쪽: 레시피 상세 -->
      <div class="recipe-detail-panel" id="recipeDetail">
        <div class="detail-empty">레시피를 선택하거나 새로 추가해주세요</div>
      </div>
    </div>
  `,va(),document.getElementById(`btnNewRecipe`).addEventListener(`click`,ya)}function ha(){return z.length===0?`<div class="list-empty">등록된 레시피 없음</div>`:z.map(e=>`
    <div class="recipe-list-item ${B===e.id?`active`:``}" data-id="${e.id}" style="border-left-color: ${e.color||`#4A7C59`}">
      <div class="recipe-list-info">
        <span class="recipe-name">${ga(e)}</span>
        <div class="recipe-tags">
          <span class="tag tag-${e.category}">${e.category===`raw`?`생식`:`동결`}</span>
          <span class="tag tag-${e.target}">${_a(e.target)}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="recipe-active-toggle" data-id="${e.id}" ${e.active?`checked`:``}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join(``)}function ga(e){return(e.target===`cat`?`고양이 `:e.target===`dog`?`강아지 `:``)+e.name}function _a(e){return e===`cat`?`고양이`:e===`dog`?`강아지`:`공용`}function va(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.toggle-switch`))return;let n=e.dataset.id;B=n,ba(z.find(e=>e.id===n)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`)})}),document.querySelectorAll(`.recipe-active-toggle`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,n=e.target.checked;await x(y(L,`recipes`,t),{active:n});let r=z.find(e=>e.id===t);r&&(r.active=n)})})}function ya(){B=null,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),ba(null)}function ba(e){let t=document.getElementById(`recipeDetail`),n=!e;t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${n?`새 레시피`:ga(e)}</span>
      <div class="detail-actions">
        ${n?``:`<button class="btn-danger" id="btnDeleteRecipe">삭제</button>`}
        <button class="btn-primary" id="btnSaveRecipe">저장</button>
      </div>
    </div>

    <div class="detail-body">
      <!-- 기본 정보 -->
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>레시피명 *</label>
            <input type="text" id="recipeName" value="${e?.name||``}" placeholder="레시피명 입력" />
          </div>
          <div class="form-group">
            <label>카테고리 *</label>
            <select id="recipeCategory">
              <option value="">선택</option>
              <option value="raw" ${e?.category===`raw`?`selected`:``}>생식</option>
              <option value="freezeDry" ${e?.category===`freezeDry`?`selected`:``}>동결건조</option>
            </select>
          </div>
          <div class="form-group">
            <label>대상 *</label>
            <select id="recipeTarget">
              <option value="">선택</option>
              <option value="cat" ${e?.target===`cat`?`selected`:``}>고양이</option>
              <option value="dog" ${e?.target===`dog`?`selected`:``}>강아지</option>
              <option value="common" ${e?.target===`common`?`selected`:``}>공용</option>
            </select>
          </div>
          <div class="form-group">
            <label>카드 색상</label>
            <input type="color" id="recipeColor" value="${e?.color||`#4A7C59`}" style="height:36px;width:60px;padding:2px;" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" id="rawFields" style="${e?.category!==`raw`&&e?.category?`display:none`:``}">
            <label>팩당 중량 (g)</label>
            <input type="number" id="packWeightG" value="${e?.packWeightG||``}" placeholder="예: 75" />
          </div>
          <div class="form-group">
            <label>비고</label>
            <input type="text" id="recipeNote" value="${e?.note||``}" placeholder="비고" />
          </div>
        </div>
        <div id="freezeDryFields" style="${e?.category===`freezeDry`?``:`display:none`}">
          <div class="form-row">
            <div class="form-group">
              <label>생산단위 1당 봉지수</label>
              <input type="number" id="freezeDryBagCount" value="${e?.freezeDryBagCountPerUnit||``}" />
            </div>
            <div class="form-group">
              <label>생산단위 1당 빵판수</label>
              <input type="number" id="breadPanCount" value="${e?.breadPanCountPerUnit||``}" />
            </div>
            <div class="form-group">
              <label>생산단위 1당 동결판수</label>
              <input type="number" id="freezePanCount" value="${e?.freezePanCountPerUnit||``}" />
            </div>
            <div class="form-group">
              <label>분리작업 필요</label>
              <select id="requiresSeparation">
                <option value="false" ${e?.requiresSeparation?``:`selected`}>아니오</option>
                <option value="true" ${e?.requiresSeparation?`selected`:``}>예</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 원료 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">원료 목록</span>
          <button class="btn-secondary" id="btnAddIngredient">+ 행 추가</button>
        </div>
        <div class="table-wrap">
          <table class="data-table" id="ingredientTable">
            <thead>
              <tr>
                <th>원료명</th>
                <th>기준 중량 (g)</th>
                <th>생산단위</th>
                <th>단위명</th>
                <th>자동차감</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="ingredientBody">
              ${xa(e?.ingredients||[])}
            </tbody>
          </table>
        </div>
        <p class="hint-text">💡 엑셀에서 원료명, 기준중량 복사 후 첫 셀에 붙여넣기 가능</p>
      </div>
    </div>
  `,document.getElementById(`recipeCategory`).addEventListener(`change`,e=>{let t=e.target.value;document.getElementById(`rawFields`).style.display=t===`raw`?``:`none`,document.getElementById(`freezeDryFields`).style.display=t===`freezeDry`?``:`none`}),document.getElementById(`btnAddIngredient`).addEventListener(`click`,()=>{let e=document.getElementById(`ingredientBody`),t=e.querySelectorAll(`tr`).length;e.insertAdjacentHTML(`beforeend`,Sa({},t)),Ca()}),document.getElementById(`ingredientBody`).addEventListener(`paste`,wa),Ca(),document.getElementById(`btnSaveRecipe`).addEventListener(`click`,()=>Ea(e?.id)),n||document.getElementById(`btnDeleteRecipe`).addEventListener(`click`,()=>Da(e.id))}function xa(e){return e.length===0?Sa({},0):e.map((e,t)=>Sa(e,t)).join(``)}function Sa(e,t){return`
    <tr data-idx="${t}">
      <td><input type="text" class="ing-name cell-input" value="${e.name||``}" placeholder="원료명" /></td>
      <td><input type="number" class="ing-weight cell-input" value="${e.baseWeightG||``}" placeholder="g" /></td>
      <td style="text-align:center">
        <input type="radio" name="productionUnit" class="ing-unit-radio" value="${t}" ${e.isProductionUnit?`checked`:``} />
      </td>
      <td><input type="text" class="ing-unit-name cell-input" value="${e.unitName||``}" placeholder="예: 마리" /></td>
      <td style="text-align:center">
        <input type="checkbox" class="ing-auto-deduct" ${e.autoDeductInventory===!1?``:`checked`} />
      </td>
      <td><button class="btn-del-row">✕</button></td>
    </tr>
  `}function Ca(){document.querySelectorAll(`.btn-del-row`).forEach(e=>{e.onclick=()=>{e.closest(`tr`).remove()}})}function wa(e){e.preventDefault();let t=e.clipboardData.getData(`text`).trim().split(`
`),n=document.getElementById(`ingredientBody`);t.forEach((e,t)=>{let r=e.split(`	`),i=r[0]?.trim()||``,a=r[1]?.trim()||``,o=n.querySelectorAll(`tr`);if(o[t])o[t].querySelector(`.ing-name`).value=i,o[t].querySelector(`.ing-weight`).value=a;else{let e=n.querySelectorAll(`tr`).length;n.insertAdjacentHTML(`beforeend`,Sa({name:i,baseWeightG:a},e)),Ca()}})}function Ta(){let e=document.querySelectorAll(`#ingredientBody tr`);return Array.from(e).map((e,t)=>({id:Date.now().toString()+t,name:e.querySelector(`.ing-name`).value.trim(),baseWeightG:parseFloat(e.querySelector(`.ing-weight`).value)||0,isProductionUnit:e.querySelector(`.ing-unit-radio`).checked,unitName:e.querySelector(`.ing-unit-name`).value.trim(),autoDeductInventory:e.querySelector(`.ing-auto-deduct`).checked,linkedToInventory:!1,meatTypeId:null,sortOrder:t})).filter(e=>e.name)}async function Ea(e){let t=document.getElementById(`recipeName`).value.trim(),n=document.getElementById(`recipeCategory`).value,r=document.getElementById(`recipeTarget`).value;if(!t||!n||!r){alert(`레시피명, 카테고리, 대상은 필수입니다.`);return}let i={name:t,displayName:(r===`cat`?`고양이 `:r===`dog`?`강아지 `:``)+t,category:n,target:r,color:document.getElementById(`recipeColor`).value,note:document.getElementById(`recipeNote`).value.trim(),active:!0,sortOrder:e?z.find(t=>t.id===e)?.sortOrder??z.length:z.length,ingredients:Ta(),version:1,updatedAt:new Date};if(n===`raw`&&(i.packWeightG=parseFloat(document.getElementById(`packWeightG`).value)||null,i.bagTypeId=null),n===`freezeDry`&&(i.freezeDryBagCountPerUnit=parseFloat(document.getElementById(`freezeDryBagCount`).value)||null,i.breadPanCountPerUnit=parseFloat(document.getElementById(`breadPanCount`).value)||null,i.freezePanCountPerUnit=parseFloat(document.getElementById(`freezePanCount`).value)||null,i.requiresSeparation=document.getElementById(`requiresSeparation`).value===`true`),e?await x(y(L,`recipes`,e),i):(i.createdAt=new Date,B=(await v(g(L,`recipes`),i)).id),z=await pa(),ma(),B){let e=z.find(e=>e.id===B);e&&(ba(e),document.querySelector(`[data-id="${B}"]`)?.classList.add(`active`))}alert(`저장되었습니다.`)}async function Da(e){confirm(`레시피를 삭제하시겠습니까?
(비활성화를 권장합니다)`)&&(await me(y(L,`recipes`,e)),z=await pa(),B=null,ma())}var Oa=540*60*1e3;function ka(e=new Date){return new Date(e.getTime()+Oa).toISOString().split(`T`)[0]}function V(){return ka(new Date)}function H(e,t=[]){let n=new Date(e+`T00:00:00+09:00`);for(let e=0;e<365;e++){n=new Date(n.getTime()+1440*60*1e3);let e=new Date(n.getTime()+Oa).getUTCDay(),r=ka(n);if(e!==0&&e!==6&&!t.includes(r))return r}throw Error(`getNextBusinessDay: 365일 초과 — 입력값 확인`)}function Aa(e){if(!e)return``;let t=e.split(`-`);if(t.length!==3)return``;let n=parseInt(t[1],10),r=parseInt(t[2],10);if(Number.isNaN(n)||Number.isNaN(r))return``;let i=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],a=new Date(e+`T12:00:00+09:00`);return`${n}/${r}(${i[new Date(a.getTime()+Oa).getUTCDay()]})`}var U=[],W=`frozen`;async function ja(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>원육 재고 로딩 중...</p></div>`,U=await Ma(),Pa()}async function Ma(){return(await m(h(g(L,`meatTypes`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function Na(e){return(await m(h(g(L,`meatStocks`),b(`incomingDate`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.stage===e&&!t.closed)}function Pa(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원육 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${W===`frozen`?`active`:``}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${W===`processed`?`active`:``}" data-tab="processed">전처리</button>
          <button class="tab-btn ${W===`repacked`?`active`:``}" data-tab="repacked">재포장</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{W=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),Fa(W)})}),Fa(W)}async function Fa(e){let t=document.getElementById(`tabContent`);t.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`;let n=await Na(e);e===`frozen`?Ia(n):e===`processed`?La(n):Ra(n)}function Ia(e){let t=document.getElementById(`tabContent`);t.innerHTML=`
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
        <button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>입고일</th>
              <th>입고량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>`:e.map(e=>`
                <tr>
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.incomingDate}</td>
                  <td>${(e.initialQtyG/1e3).toFixed(1)}kg</td>
                  <td style="font-weight:600;color:${e.remaining<1e3?`#e53e3e`:`#1a1a1a`}">${(e.remaining/1e3).toFixed(1)}kg</td>
                  <td>${e.staffName||`-`}</td>
                  <td>${e.note||`-`}</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,za),document.getElementById(`btnMeatTypes`).addEventListener(`click`,Ua),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Ha(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function La(e){let t=document.getElementById(`tabContent`);t.innerHTML=`
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>입고일</th>
              <th>전처리일</th>
              <th>개당중량</th>
              <th>개수</th>
              <th>총중량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px;">등록된 전처리 재고 없음</td></tr>`:e.map(e=>`
                <tr style="background:${e.batchColor||`white`}11">
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.incomingDate}</td>
                  <td>${e.processedDate||`-`}</td>
                  <td>${e.unitWeightG?e.unitWeightG+`g`:`-`}</td>
                  <td>${e.unitCount||`-`}</td>
                  <td>${(e.initialQtyG/1e3).toFixed(1)}kg</td>
                  <td style="font-weight:600">${(e.remaining/1e3).toFixed(1)}kg</td>
                  <td>${e.staffName||`-`}</td>
                  <td>${e.note||`-`}</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,Ba),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Ha(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ra(e){let t=document.getElementById(`tabContent`);t.innerHTML=`
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>전처리일</th>
              <th>재포장일</th>
              <th>개당중량</th>
              <th>개수</th>
              <th>총중량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px;">등록된 재포장 재고 없음</td></tr>`:e.map(e=>`
                <tr style="background:${e.batchColor||`white`}11">
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.processedDate||`-`}</td>
                  <td>${e.repackedDate||`-`}</td>
                  <td>${e.unitWeightG?e.unitWeightG+`g`:`-`}</td>
                  <td>${e.unitCount||`-`}</td>
                  <td>${(e.initialQtyG/1e3).toFixed(1)}kg</td>
                  <td style="font-weight:600">${(e.remaining/1e3).toFixed(1)}kg</td>
                  <td>${e.staffName||`-`}</td>
                  <td>${e.note||`-`}</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,Va),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Ha(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function za(){Ja(`
    <h3 class="modal-title">원육 입고 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${U.map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>중량 *</label>
        <input type="number" id="m_weight" placeholder="중량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>입고일</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${qa([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozen">추가</button>
    </div>
  `),document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),n=t.options[t.selectedIndex]?.text,r=parseFloat(document.getElementById(`m_weight`).value),i=document.getElementById(`m_unit`).value,a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!e||!r||!a){alert(`원육 종류, 중량, 날짜는 필수입니다.`);return}let c=i===`kg`?r*1e3:r;await v(g(L,`meatStocks`),{meatTypeId:e,meatNameSnapshot:n,stage:`frozen`,incomingDate:a,initialQtyG:c,remaining:c,staffName:o,note:s,closed:!1,createdAt:new Date,updatedAt:new Date}),closeModal(),Fa(`frozen`),alert(`입고 등록 완료!`)})}function Ba(){Ja(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${U.map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>전처리일</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${qa([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProcessed">추가</button>
    </div>
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),n=t.options[t.selectedIndex]?.text,r=parseFloat(document.getElementById(`m_unitWeight`).value),i=parseInt(document.getElementById(`m_count`).value),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!e||!r||!i||!a){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}let c=r*i,l=Date.now().toString(),u=Wa();await v(g(L,`meatStocks`),{meatTypeId:e,meatNameSnapshot:n,stage:`processed`,incomingDate:a,processedDate:a,unitWeightG:r,unitCount:i,initialQtyG:c,remaining:c,batchId:l,batchColor:u,staffName:o,note:s,closed:!1,createdAt:new Date,updatedAt:new Date}),closeModal(),Fa(`processed`),alert(`전처리 등록 완료!`)})}function Va(){Ja(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${U.map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>재포장일</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${qa([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveRepacked">추가</button>
    </div>
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),n=t.options[t.selectedIndex]?.text,r=parseFloat(document.getElementById(`m_unitWeight`).value),i=parseInt(document.getElementById(`m_count`).value),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!e||!r||!i||!a){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}let c=r*i,l=Date.now().toString(),u=Wa();await v(g(L,`meatStocks`),{meatTypeId:e,meatNameSnapshot:n,stage:`repacked`,incomingDate:a,repackedDate:a,unitWeightG:r,unitCount:i,initialQtyG:c,remaining:c,batchId:l,batchColor:u,staffName:o,note:s,closed:!1,createdAt:new Date,updatedAt:new Date}),closeModal(),Fa(`repacked`),alert(`재포장 등록 완료!`)})}function Ha(e,t,n){Ja(`
    <h3 class="modal-title">수동 재고 조정 — ${t}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 잔량: ${(n/1e3).toFixed(1)}kg</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량 (g)</label>
        <input type="number" id="m_adjustQty" placeholder="g" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_adjustReason" placeholder="조정 사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${qa([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_adjustType`).value,r=parseFloat(document.getElementById(`m_adjustQty`).value),i=document.getElementById(`m_adjustReason`).value.trim(),a=document.getElementById(`m_staff`).value;if(!r||!i||!a){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let o=n+(t===`plus`?r:-r);await x(y(L,`meatStocks`,e),{remaining:o,closed:o<=0,updatedAt:new Date}),closeModal(),Fa(W),alert(`조정 완료!`)})}function Ua(){Ja(`
    <h3 class="modal-title">원육 종류 관리</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>원육명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(kg)</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${U.map(e=>`
            <tr>
              <td>${e.name}</td>
              <td>${e.defaultUnitWeightG}g</td>
              <td>${(e.minimumQtyG/1e3).toFixed(1)}kg</td>
              <td><button class="btn-del-row" data-id="${e.id}">삭제</button></td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px;border:1px solid #eee;">
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 원육 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>원육명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(kg)</label>
          <input type="number" id="m_newMinQty" placeholder="예: 5" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.querySelectorAll(`.btn-del-row`).forEach(e=>{e.addEventListener(`click`,async()=>{confirm(`삭제하시겠습니까?`)&&(await me(y(L,`meatTypes`,e.dataset.id)),U=await Ma(),closeModal(),Ua())})}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_newMeatName`).value.trim(),t=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,n=parseFloat(document.getElementById(`m_newMinQty`).value)||0;if(!e){alert(`원육명은 필수입니다.`);return}await v(g(L,`meatTypes`),{name:e,defaultUnitWeightG:t,minimumQtyG:n*1e3,sortOrder:U.length,active:!0,createdAt:new Date,updatedAt:new Date}),U=await Ma(),closeModal(),Ua()})}function Wa(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var Ga={};async function Ka(){if(!(Object.keys(Ga).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(Ga[e]=t.data().members||[])}}function qa(e){let t=``;for(let n of e)(Ga[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Ja(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()}),Ka()}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};var G=[];async function Ya(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`,G=await Xa(),Qa()}async function Xa(){return(await m(h(g(L,`bagTypes`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var Za=null;function Qa(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          <button class="btn-primary" id="btnNewBag">+ 추가</button>
        </div>
        <div class="recipe-list" id="bagList">
          ${$a()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `,to(),document.getElementById(`btnNewBag`).addEventListener(`click`,ro)}function $a(){if(G.length===0)return`<div class="list-empty">등록된 봉투 없음</div>`;let e=G.filter(e=>e.category===`raw`),t=G.filter(e=>e.category===`freezeDry`),n=``;return e.length>0&&(n+=`<div class="list-group-label">생식</div>`,n+=e.map(e=>eo(e)).join(``)),t.length>0&&(n+=`<div class="list-group-label">동결건조</div>`,n+=t.map(e=>eo(e)).join(``)),n}function eo(e){let t=e.currentQty<(e.minimumQty||0);return`
    <div class="recipe-list-item ${Za===e.id?`active`:``}" data-id="${e.id}">
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${t?`#e53e3e`:`#1a1a1a`}">${e.name}</span>
        <div class="recipe-tags">
          <span class="tag tag-${e.category}">${e.category===`raw`?`생식`:`동결`}</span>
          <span style="font-size:11px;color:${t?`#e53e3e`:`#888`}">
            ${Math.floor((e.currentQty||0)/(e.piecesPerBox||1))}박스 (${e.currentQty||0}장)
          </span>
        </div>
      </div>
    </div>
  `}function to(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,()=>{Za=e.dataset.id,no(G.find(e=>e.id===Za)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`)})})}async function no(e){let t=document.getElementById(`bagDetail`),n=(await m(h(g(L,`bagLogs`),b(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.bagTypeId===e.id).slice(0,30);t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        <button class="btn-secondary" id="btnEditBag">수정</button>
        <button class="btn-secondary" id="btnAdjustBag">수동조정</button>
        <button class="btn-primary" id="btnAddBagIncoming">+ 입고 등록</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 요약 -->
      <div class="form-section">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 재고</span>
            <span class="stat-value">${e.currentQty||0}장 (${Math.floor((e.currentQty||0)/(e.piecesPerBox||1))}박스)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">박스당 장수</span>
            <span class="stat-value">${e.piecesPerBox||`-`}장</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value" style="color:${(e.currentQty||0)<(e.minimumQty||0)?`#e53e3e`:`#1a1a1a`}">
              ${Math.floor((e.minimumQty||0)/(e.piecesPerBox||1))}박스
            </span>
          </div>
        </div>
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(장)</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${n.length===0?`<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:n.map(e=>`
                  <tr>
                    <td>${e.date||`-`}</td>
                    <td>
                      <span class="tag ${e.type===`incoming`?`tag-raw`:e.type===`autoDeduct`?``:`tag-cat`}" 
                            style="${e.type===`autoDeduct`?`background:#f0f0f0;color:#666`:``}">
                        ${e.type===`incoming`?`입고`:e.type===`autoDeduct`?`자동차감`:`수동조정`}
                      </span>
                    </td>
                    <td style="color:${e.qty>0?`#2d7a3a`:`#e53e3e`}">${e.qty>0?`+`:``}${e.qty}</td>
                    <td>${e.staffName||`-`}</td>
                    <td>${e.note||e.reason||`-`}</td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddBagIncoming`).addEventListener(`click`,()=>oo(e)),document.getElementById(`btnAdjustBag`).addEventListener(`click`,()=>so(e)),document.getElementById(`btnEditBag`).addEventListener(`click`,()=>ao(e))}function ro(){io(null)}function io(e){let t=!e;fo(`
    <h3 class="modal-title">${t?`봉투 추가`:`봉투 수정`}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${e?.name||``}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${t?``:`disabled`}>
          <option value="">선택</option>
          <option value="raw" ${e?.category===`raw`?`selected`:``}>생식</option>
          <option value="freezeDry" ${e?.category===`freezeDry`?`selected`:``}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" value="${e?.piecesPerBox||``}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" value="${e?.minimumBoxQty||``}" placeholder="박스" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${t?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnSaveBag`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_bagName`).value.trim(),r=document.getElementById(`m_bagCategory`).value,i=parseInt(document.getElementById(`m_piecesPerBox`).value)||0,a=parseInt(document.getElementById(`m_minBox`).value)||0;if(!n||!r){alert(`봉투명과 종류는 필수입니다.`);return}let o={name:n,category:r,piecesPerBox:i,minimumBoxQty:a,minimumQty:a*i,sortOrder:t?G.length:e.sortOrder,active:!0,updatedAt:new Date};t?(o.currentQty=0,o.createdAt=new Date,await v(g(L,`bagTypes`),o)):await x(y(L,`bagTypes`,e.id),o),G=await Xa(),closeModal(),Qa(),alert(t?`봉투 추가 완료!`:`수정 완료!`)})}function ao(e){io(e)}function oo(e){fo(`
    <h3 class="modal-title">봉투 입고 등록 — ${e.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>수량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수 입력" />
      </div>
      <div class="form-group">
        <label>박스 환산</label>
        <span id="m_boxCalc" style="line-height:36px;font-size:12px;color:#888;">- 박스</span>
      </div>
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${uo([`lead`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBagIncoming">추가</button>
    </div>
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`}),document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value;if(!t||!n){alert(`수량과 날짜는 필수입니다.`);return}let a=e.currentQty||0,o=a+t;await x(y(L,`bagTypes`,e.id),{currentQty:o,updatedAt:new Date}),await v(g(L,`bagLogs`),{date:n,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,qty:t,before:a,after:o,staffName:r,note:i}),G=await Xa(),closeModal(),no(G.find(t=>t.id===e.id)),$a(),document.getElementById(`bagList`).innerHTML=$a(),to(),alert(`입고 등록 완료!`)})}function so(e){fo(`
    <h3 class="modal-title">수동 재고 조정 — ${e.name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${e.currentQty||0}장</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${uo([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_adjustType`).value,n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_reason`).value.trim(),i=document.getElementById(`m_staff`).value;if(!n||!r||!i){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let a=t===`plus`?n:-n,o=e.currentQty||0,s=o+a;await x(y(L,`bagTypes`,e.id),{currentQty:s,updatedAt:new Date}),await v(g(L,`bagLogs`),{date:V(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:a,before:o,after:s,staffName:i,reason:r}),G=await Xa(),closeModal(),no(G.find(t=>t.id===e.id)),document.getElementById(`bagList`).innerHTML=$a(),to(),alert(`조정 완료!`)})}var co={};async function lo(){if(!(Object.keys(co).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(co[e]=t.data().members||[])}}function uo(e){let t=``;for(let n of e)(co[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function fo(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()}),lo()}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};async function po(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`,await xo(),go(await mo(),await ho())}async function mo(){let e=await _(y(L,`eggStock`,`global`));return e.exists()?e.data():{currentQty:0,minimumQty:0}}async function ho(){return(await m(h(g(L,`eggLogs`),b(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).slice(0,50)}function go(e,t){let n=document.getElementById(`mainContent`),r=e.currentQty<e.minimumQty;n.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">계란</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnSetMinEgg">최소재고 설정</button>
          <button class="btn-secondary" id="btnAdjustEgg">수동조정</button>
          <button class="btn-secondary" id="btnEggOut">계란 출고</button>
          <button class="btn-primary" id="btnEggIn">+ 계란 입고</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 재고</span>
            <span class="stat-value" style="font-size:24px;color:${r?`#e53e3e`:`#1a1a1a`}">${e.currentQty}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value">${e.minimumQty}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">상태</span>
            <span class="stat-value" style="color:${r?`#e53e3e`:`#2d7a3a`}">${r?`⚠️ 부족`:`✅ 정상`}</span>
          </div>
        </div>
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;border:1px solid #e8e8e8;">
        <div class="section-header">
          <span class="section-title">입출고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(개)</th>
                <th>변경 전</th>
                <th>변경 후</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${t.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:t.map(e=>`
                  <tr>
                    <td>${e.date||`-`}</td>
                    <td>
                      <span class="tag ${e.type===`in`?`tag-raw`:e.type===`out`?`tag-cat`:``}"
                            style="${e.type===`adjust`?`background:#fff0e8;color:#8a4a2d`:``}">
                        ${e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`}
                      </span>
                    </td>
                    <td style="color:${e.qty>0?`#2d7a3a`:`#e53e3e`};font-weight:600">
                      ${e.qty>0?`+`:``}${e.qty}
                    </td>
                    <td>${e.before??`-`}</td>
                    <td>${e.after??`-`}</td>
                    <td>${e.staffName||`-`}</td>
                    <td>${e.note||e.reason||`-`}</td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>_o(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>_o(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>vo(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>yo(e))}function _o(e,t){let n=e===`in`;Co(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${t.currentQty}개</p>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${So([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEgg">${n?`입고`:`출고`}</button>
    </div>
  `),document.getElementById(`btnSaveEgg`).addEventListener(`click`,async()=>{let e=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_date`).value,i=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value;if(!e||!r){alert(`수량과 날짜는 필수입니다.`);return}if(!n&&e>t.currentQty){alert(`재고가 부족합니다.`);return}let o=n?e:-e,s=t.currentQty,c=s+o;await fe(y(L,`eggStock`,`global`),{currentQty:c,minimumQty:t.minimumQty,updatedAt:new Date}),await v(g(L,`eggLogs`),{date:r,timestamp:new Date,type:n?`in`:`out`,qty:o,before:s,after:c,staffName:i,note:a}),closeModal(),go(await mo(),await ho()),alert(`${n?`입고`:`출고`} 완료!`)})}function vo(e){Co(`
    <h3 class="modal-title">수동 재고 조정</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${e.currentQty}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(개) *</label>
        <input type="number" id="m_qty" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${So([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_adjustType`).value,n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_reason`).value.trim(),i=document.getElementById(`m_staff`).value;if(!n||!r||!i){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let a=t===`plus`?n:-n,o=e.currentQty,s=o+a;await fe(y(L,`eggStock`,`global`),{currentQty:s,minimumQty:e.minimumQty,updatedAt:new Date}),await v(g(L,`eggLogs`),{date:V(),timestamp:new Date,type:`adjust`,qty:a,before:o,after:s,staffName:i,reason:r}),closeModal(),go(await mo(),await ho()),alert(`조정 완료!`)})}function yo(e){Co(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${e.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_minQty`).value)||0;await fe(y(L,`eggStock`,`global`),{currentQty:e.currentQty,minimumQty:t,updatedAt:new Date}),closeModal(),go(await mo(),await ho()),alert(`설정 완료!`)})}var bo={};async function xo(){if(!(Object.keys(bo).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(bo[e]=t.data().members||[])}}function So(e){let t=``;for(let n of e)(bo[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Co(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};var wo=[],To=null;async function Eo(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결제품 입고 로딩 중...</p></div>`,await Ro(),wo=await Do(),ko()}async function Do(){return(await m(h(g(L,`frozenProducts`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function Oo(e){return(await m(h(g(L,`frozenLogs`),b(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.productId===e&&t.status!==`deleted`).slice(0,30)}function ko(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          <button class="btn-primary" id="btnNewProduct">+ 추가</button>
        </div>
        <div class="recipe-list" id="productList">
          ${Ao()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,jo(),document.getElementById(`btnNewProduct`).addEventListener(`click`,No)}function Ao(){return wo.length===0?`<div class="list-empty">등록된 제품 없음</div>`:wo.filter(e=>e.active!==!1).map(e=>`
      <div class="recipe-list-item ${To===e.id?`active`:``}" data-id="${e.id}">
        <div class="recipe-list-info">
          <span class="recipe-name">${e.name}</span>
          <div class="recipe-tags">
            <span style="font-size:11px;color:#888">${e.recipeTitleRef||`-`}</span>
          </div>
        </div>
      </div>
    `).join(``)}function jo(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async()=>{To=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await Mo(wo.find(e=>e.id===To))})})}async function Mo(e){let t=document.getElementById(`productDetail`),n=await Oo(e.id),r=`-`;if(e.bagTypeId){let t=await _(y(L,`bagTypes`,e.bagTypeId));t.exists()&&(r=t.data().name)}t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        <button class="btn-secondary" id="btnEditProduct">수정</button>
        <button class="btn-primary" id="btnAddIncoming">+ 입고 등록</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 제품 정보 -->
      <div class="form-section">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">연결 레시피</span>
            <span class="stat-value">${e.recipeTitleRef||`-`}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">연결 봉투</span>
            <span class="stat-value">${r}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">분리작업</span>
            <span class="stat-value">${e.requiresSeparation?`필요`:`불필요`}</span>
          </div>
        </div>
      </div>

      <!-- 입고 이력 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>유통기한</th>
                <th>수량(개)</th>
                <th>차감봉투(장)</th>
                <th>담당자</th>
                <th>비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${n.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:n.map(t=>`
                  <tr>
                    <td>${t.date||`-`}</td>
                    <td>${t.expiryDate||`-`}</td>
                    <td>${t.qty}</td>
                    <td>${t.deductedBagQty||`-`}</td>
                    <td>${t.staffName||`-`}</td>
                    <td>${t.note||`-`}</td>
                    <td>
                      <button class="btn-del-row" data-logid="${t.id}" data-qty="${t.qty}" data-bagqty="${t.deductedBagQty||0}" data-bagid="${e.bagTypeId||``}">삭제</button>
                    </td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddIncoming`).addEventListener(`click`,()=>Io(e)),document.getElementById(`btnEditProduct`).addEventListener(`click`,()=>Po(e)),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!confirm(`삭제하시겠습니까? 차감된 봉투 재고가 복원됩니다.`))return;let n=t.dataset.logid,r=t.dataset.bagid,i=parseInt(t.dataset.bagqty)||0;if(await x(y(L,`frozenLogs`,n),{status:`deleted`}),r&&i>0){let e=await _(y(L,`bagTypes`,r));if(e.exists()){let t=e.data().currentQty||0;await x(y(L,`bagTypes`,r),{currentQty:t+i})}}await Mo(e),alert(`삭제 완료!`)})})}function No(){Fo(null)}function Po(e){Fo(e)}async function Fo(e){let t=!e,n=(await m(h(g(L,`bagTypes`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.category===`freezeDry`);Bo(`
    <h3 class="modal-title">${t?`동결제품 추가`:`동결제품 수정`}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <input type="text" id="m_name" value="${e?.name||``}" placeholder="제품명 입력" />
    </div>
    <div class="form-group">
      <label>연결 레시피 (이름만)</label>
      <input type="text" id="m_recipeRef" value="${e?.recipeTitleRef||``}" placeholder="레시피명 입력" />
    </div>
    <div class="form-group">
      <label>연결 봉투 *</label>
      <select id="m_bagType">
        <option value="">선택</option>
        ${n.map(t=>`<option value="${t.id}" ${e?.bagTypeId===t.id?`selected`:``}>${t.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${e?.requiresSeparation?``:`selected`}>아니오</option>
        <option value="true" ${e?.requiresSeparation?`selected`:``}>예</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${t?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_name`).value.trim(),r=document.getElementById(`m_recipeRef`).value.trim(),i=document.getElementById(`m_bagType`).value,a=document.getElementById(`m_separation`).value===`true`;if(!n||!i){alert(`제품명과 연결 봉투는 필수입니다.`);return}let o={name:n,recipeTitleRef:r,bagTypeId:i,requiresSeparation:a,active:!0,sortOrder:t?wo.length:e.sortOrder,updatedAt:new Date};t?(o.createdAt=new Date,await v(g(L,`frozenProducts`),o)):await x(y(L,`frozenProducts`,e.id),o),wo=await Do(),closeModal(),ko(),alert(t?`추가 완료!`:`수정 완료!`)})}function Io(e){let t=V(),n=new Date;n.setMonth(n.getMonth()+18);let r=n.toISOString().split(`T`)[0];Bo(`
    <h3 class="modal-title">입고 등록 — ${e.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${t}" />
      </div>
      <div class="form-group">
        <label>유통기한</label>
        <input type="date" id="m_expiry" value="${r}" />
      </div>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${zo([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_date`).value,n=document.getElementById(`m_expiry`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value;if(!r||!t){alert(`수량과 날짜는 필수입니다.`);return}let o=0;if(e.bagTypeId){let t=await _(y(L,`bagTypes`,e.bagTypeId));if(t.exists()){let n=t.data().currentQty||0;if(n<r){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${n}장\n필요 수량: ${r}장`);return}await x(y(L,`bagTypes`,e.bagTypeId),{currentQty:n-r,updatedAt:new Date}),o=r}}await v(g(L,`frozenLogs`),{date:t,timestamp:new Date,productId:e.id,productNameSnapshot:e.name,expiryDate:n,qty:r,bagTypeId:e.bagTypeId||null,deductedBagQty:o,staffName:i,note:a,status:`active`}),closeModal(),await Mo(e),alert(`입고 등록 완료!`)})}var Lo={};async function Ro(){if(!(Object.keys(Lo).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(Lo[e]=t.data().members||[])}}function zo(e){let t=``;for(let n of e)(Lo[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Bo(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};async function Vo(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결판 재고 로딩 중...</p></div>`,await Xo(),J(await K(),await q())}async function K(){return(await m(h(g(L,`frozenPanStock`),b(`date`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function q(){return(await m(g(L,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}function J(e,t){let n=document.getElementById(`mainContent`),r={};t.forEach(e=>{r[e.productName]||(r[e.productName]=[]),r[e.productName].push({date:e.date,remaining:e.remaining})});let i=t.reduce((e,t)=>e+t.remaining,0);n.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결판 재고</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnAddOrderRow">+ 발주 행 추가</button>
          <button class="btn-primary" id="btnAddWorkRow">+ 작업 행 추가</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 총 동결판</span>
            <span class="stat-value" style="font-size:20px;color:${i<10?`#e53e3e`:`#1a1a1a`}">${i}판</span>
          </div>
          ${Object.entries(r).map(([e,t])=>`
            <div class="stat-item">
              <span class="stat-label">${e}</span>
              <div>
                ${t.sort((e,t)=>e.date.localeCompare(t.date)).map(e=>`
                  <div style="font-size:12px;color:#555">${e.remaining}판 <span style="color:#aaa">(${e.date})</span></div>
                `).join(``)}
              </div>
            </div>
          `).join(``)}
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>구분</th>
              <th>담당자</th>
              <th>내용</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">등록된 내역 없음</td></tr>`:e.map(e=>Ho(e)).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddWorkRow`).addEventListener(`click`,()=>Uo(e,t)),document.getElementById(`btnAddOrderRow`).addEventListener(`click`,()=>Go(e,t)),document.querySelectorAll(`.btn-order-confirm`).forEach(n=>{n.addEventListener(`click`,async()=>{let r=n.dataset.id,i=e.find(e=>e.id===r);i&&await qo(i,t)})}),document.querySelectorAll(`.btn-order-delete`).forEach(e=>{e.addEventListener(`click`,async()=>{confirm(`발주 행을 삭제하시겠습니까?`)&&(await x(y(L,`frozenPanStock`,e.dataset.id),{status:`cancelled`}),J(await K(),await q()))})}),document.querySelectorAll(`.btn-order-cancel`).forEach(n=>{n.addEventListener(`click`,async()=>{if(!confirm(`발주 확인을 취소하시겠습니까? 차감된 동결판 재고가 복원됩니다.`))return;let r=n.dataset.id,i=e.find(e=>e.id===r);i&&await Jo(i,t)})})}function Ho(e){if(e.status===`cancelled`)return``;let t=e.type===`order`,n=e.status===`confirmed`,r=``;if(t){let t=(e.items||[]).reduce((e,t)=>e+(t.orderPanQty||0),0),n=t===45?`#2d7a3a`:t>45?`#e53e3e`:`#e67e22`;r=`
      ${(e.items||[]).map(e=>`<span style="font-size:11px;margin-right:8px">${e.productName}: ${e.orderPanQty}판</span>`).join(``)}
      <span style="font-weight:600;color:${n}">총 ${t}판</span>
    `}else r=(e.items||[]).map(e=>`<span style="font-size:11px;margin-right:8px">${e.productName}: 빵판${e.breadPanQty} / 동결판${e.freezePanQty}</span>`).join(``);let i=``;return t&&!n?i=`
      <button class="btn-primary btn-order-confirm" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">발주 확인</button>
      <button class="btn-del-row btn-order-delete" data-id="${e.id}">삭제</button>
    `:t&&n&&(i=`<button class="btn-secondary btn-order-cancel" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">발주 취소</button>`),`
    <tr style="background:${t?`#fffdf0`:`white`}">
      <td>${e.date}</td>
      <td><span class="tag ${t?`tag-cat`:`tag-raw`}">${t?`발주`:`작업`}</span></td>
      <td>${e.staffName||`-`}</td>
      <td>${r}</td>
      <td>
        ${n?`<span style="color:#2d7a3a;font-size:12px">✅ 확인완료</span>`:t?`<span style="color:#e67e22;font-size:12px">⏳ 대기중</span>`:`-`}
      </td>
      <td style="white-space:nowrap">${i}</td>
    </tr>
  `}function Uo(e,t){Qo(`
    <h3 class="modal-title">작업 행 추가</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Zo([`senior`,`office`])}
        </select>
      </div>
    </div>
    <div id="workItems">
      <div class="work-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input type="text" class="wi-name cell-input" placeholder="제품명" style="flex:1" />
        <input type="number" class="wi-bread cell-input" placeholder="빵판수" style="width:80px" />
        <input type="number" class="wi-freeze cell-input" placeholder="동결판수" style="width:80px" />
        <button class="btn-del-row wi-del">✕</button>
      </div>
    </div>
    <button class="btn-secondary" id="btnAddWorkItem" style="margin-bottom:16px;">+ 제품 추가</button>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveWorkRow">저장</button>
    </div>
  `),Wo(),document.getElementById(`btnAddWorkItem`).addEventListener(`click`,()=>{document.getElementById(`workItems`).insertAdjacentHTML(`beforeend`,`
      <div class="work-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input type="text" class="wi-name cell-input" placeholder="제품명" style="flex:1" />
        <input type="number" class="wi-bread cell-input" placeholder="빵판수" style="width:80px" />
        <input type="number" class="wi-freeze cell-input" placeholder="동결판수" style="width:80px" />
        <button class="btn-del-row wi-del">✕</button>
      </div>
    `),Wo()}),document.getElementById(`btnSaveWorkRow`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_date`).value,t=document.getElementById(`m_staff`).value,n=Array.from(document.querySelectorAll(`.work-item`)).map(e=>({productName:e.querySelector(`.wi-name`).value.trim(),breadPanQty:parseInt(e.querySelector(`.wi-bread`).value)||0,freezePanQty:parseInt(e.querySelector(`.wi-freeze`).value)||0})).filter(e=>e.productName);if(!e||n.length===0){alert(`날짜와 제품을 입력해주세요.`);return}let r=await v(g(L,`frozenPanStock`),{date:e,type:`work`,status:`done`,staffName:t,items:n,createdAt:new Date,updatedAt:new Date});for(let t of n)t.freezePanQty>0&&await v(g(L,`frozenPanLots`),{productName:t.productName,date:e,initialQty:t.freezePanQty,remaining:t.freezePanQty,sourceRowId:r.id,closed:!1,createdAt:new Date,updatedAt:new Date});closeModal(),J(await K(),await q()),alert(`작업 행 추가 완료!`)})}function Wo(){document.querySelectorAll(`.wi-del`).forEach(e=>{e.onclick=()=>e.closest(`.work-item`).remove()})}function Go(e,t){Qo(`
    <h3 class="modal-title">발주 행 추가</h3>
    <div class="form-group">
      <label>날짜 (동결건조 돌리는 날짜)</label>
      <input type="date" id="m_date" value="${getToday()}" min="${getToday()}" />
    </div>
    <div id="orderItems">
      <div class="order-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input type="text" class="oi-name cell-input" placeholder="제품명" style="flex:1" />
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
        <button class="btn-del-row oi-del">✕</button>
      </div>
    </div>
    <button class="btn-secondary" id="btnAddOrderItem" style="margin-bottom:8px;">+ 제품 추가</button>
    <div style="font-size:13px;font-weight:600;margin-bottom:16px;">
      총합: <span id="orderTotal" style="color:#e67e22">0</span>판
      <span style="font-size:11px;color:#aaa;margin-left:8px">(기준: 45판)</span>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOrderRow">저장</button>
    </div>
  `),Ko(),document.getElementById(`btnAddOrderItem`).addEventListener(`click`,()=>{document.getElementById(`orderItems`).insertAdjacentHTML(`beforeend`,`
      <div class="order-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input type="text" class="oi-name cell-input" placeholder="제품명" style="flex:1" />
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
        <button class="btn-del-row oi-del">✕</button>
      </div>
    `),Ko()}),document.getElementById(`btnSaveOrderRow`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_date`).value,t=Array.from(document.querySelectorAll(`.order-item`)).map(e=>({productName:e.querySelector(`.oi-name`).value.trim(),orderPanQty:parseInt(e.querySelector(`.oi-qty`).value)||0})).filter(e=>e.productName);if(!e||t.length===0){alert(`날짜와 제품을 입력해주세요.`);return}await v(g(L,`frozenPanStock`),{date:e,type:`order`,status:`pending`,items:t,createdAt:new Date,updatedAt:new Date}),closeModal(),J(await K(),await q()),alert(`발주 행 추가 완료!`)})}function Ko(){document.querySelectorAll(`.oi-del`).forEach(e=>{e.onclick=()=>{e.closest(`.order-item`).remove(),updateOrderTotal()}})}window.updateOrderTotal=function(){let e=Array.from(document.querySelectorAll(`.oi-qty`)).reduce((e,t)=>e+(parseInt(t.value)||0),0),t=document.getElementById(`orderTotal`);t&&(t.textContent=e,t.style.color=e===45?`#2d7a3a`:e>45?`#e53e3e`:`#e67e22`)};async function qo(e,t){let n=e.items||[];for(let e of n){let n=e.orderPanQty,r=t.filter(t=>t.productName===e.productName).sort((e,t)=>e.date.localeCompare(t.date));for(let e of r){if(n<=0)break;let t=Math.min(e.remaining,n);await x(y(L,`frozenPanLots`,e.id),{remaining:e.remaining-t,closed:e.remaining-t<=0,updatedAt:new Date}),n-=t}}await x(y(L,`frozenPanStock`,e.id),{status:`confirmed`,updatedAt:new Date}),J(await K(),await q()),alert(`발주 확인 완료!`)}async function Jo(e,t){let n=e.items||[];for(let e of n){let n=t.filter(t=>t.productName===e.productName&&t.sourceRowId).sort((e,t)=>t.date.localeCompare(e.date)),r=e.orderPanQty;for(let t of n){if(r<=0)break;let n=Math.min(e.orderPanQty,r);await x(y(L,`frozenPanLots`,t.id),{remaining:t.remaining+n,closed:!1,updatedAt:new Date}),r-=n}}await x(y(L,`frozenPanStock`,e.id),{status:`pending`,updatedAt:new Date}),J(await K(),await q()),alert(`발주 취소 완료!`)}var Yo={};async function Xo(){if(!(Object.keys(Yo).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(Yo[e]=t.data().members||[])}}function Zo(e){let t=``;for(let n of e)(Yo[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Qo(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};async function $o(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결 분리작업 로딩 중...</p></div>`,await cs(),ns(await es())}async function es(){return(await m(h(g(L,`frozenSeparation`),b(`date`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}function ts(e){let t={};return e.forEach(e=>{t[e.productName]||(t[e.productName]={notSeparated:0,separated:0,noSplit:0}),t[e.productName][e.stockType]+=e.remaining}),t}function ns(e){let t=document.getElementById(`mainContent`),n=ts(e);t.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결 분리작업</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnAdjust">수동 조정</button>
          <button class="btn-secondary" id="btnOut">출고</button>
          <button class="btn-secondary" id="btnSeparate">분리 작업</button>
          <button class="btn-primary" id="btnIncoming">+ 원물 입고</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          ${Object.entries(n).length===0?`<span style="color:#aaa;font-size:13px">재고 없음</span>`:Object.entries(n).map(([e,t])=>`
              <div>
                <div style="font-size:12px;font-weight:600;color:#333;margin-bottom:6px;">${e}</div>
                ${t.notSeparated>0?`<div style="font-size:11px;color:#666">분리X: ${t.notSeparated}개</div>`:``}
                ${t.separated>0?`<div style="font-size:11px;color:#2d7a3a">분리O: ${t.separated}개</div>`:``}
                ${t.noSplit>0?`<div style="font-size:11px;color:#2d4a8a">소분X: ${t.noSplit}개</div>`:``}
              </div>
            `).join(``)}
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>제품명</th>
              <th>재고 종류</th>
              <th>수량</th>
              <th>담당자</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>`:e.map(e=>`
                <tr>
                  <td>${e.date}</td>
                  <td>${e.productName}</td>
                  <td>
                    <span class="tag ${e.stockType===`notSeparated`?`tag-cat`:e.stockType===`separated`?`tag-raw`:`tag-freezeDry`}">
                      ${e.stockType===`notSeparated`?`분리X`:e.stockType===`separated`?`분리O`:`소분X`}
                    </span>
                  </td>
                  <td style="font-weight:600">${e.remaining}개</td>
                  <td>${e.staffName||`-`}</td>
                  <td>${e.note||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnIncoming`).addEventListener(`click`,()=>rs(e)),document.getElementById(`btnSeparate`).addEventListener(`click`,()=>is(e)),document.getElementById(`btnOut`).addEventListener(`click`,()=>as(e)),document.getElementById(`btnAdjust`).addEventListener(`click`,()=>os(e))}function rs(e){us(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <input type="text" id="m_name" placeholder="제품명 입력" />
    </div>
    <div class="form-group">
      <label>분리작업 필요 여부</label>
      <select id="m_sepNeeded">
        <option value="true">분리 필요 (분리X로 입고)</option>
        <option value="false">분리 불필요 (소분X로 입고)</option>
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ls([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_name`).value.trim(),t=document.getElementById(`m_sepNeeded`).value===`true`,n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_date`).value,i=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value;if(!e||!n||!r){alert(`제품명, 수량, 날짜는 필수입니다.`);return}await v(g(L,`frozenSeparation`),{date:r,productName:e,stockType:t?`notSeparated`:`noSplit`,initialQty:n,remaining:n,staffName:i,note:a,closed:!1,createdAt:new Date,updatedAt:new Date}),await v(g(L,`frozenSeparationLogs`),{date:r,timestamp:new Date,type:`incoming`,productName:e,toStockType:t?`notSeparated`:`noSplit`,qty:n,staffName:i,note:a}),closeModal(),ns(await es()),alert(`입고 완료!`)})}function is(e){let t=e.filter(e=>e.stockType===`notSeparated`);us(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(t.map(e=>e.productName))].map(e=>`<option value="${e}">${e} (분리X: ${t.filter(t=>t.productName===e).reduce((e,t)=>e+t.remaining,0)}개)</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="분리할 개수" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ls([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `),document.getElementById(`btnSaveSeparate`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_product`).value,n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_date`).value,i=document.getElementById(`m_staff`).value;if(!e||!n||!r){alert(`제품, 수량, 날짜는 필수입니다.`);return}let a=t.filter(t=>t.productName===e).sort((e,t)=>e.date.localeCompare(t.date)),o=a.reduce((e,t)=>e+t.remaining,0);if(n>o){alert(`분리X 재고가 부족합니다. (현재: ${o}개)`);return}let s=n;for(let e of a){if(s<=0)break;let t=Math.min(e.remaining,s);await x(y(L,`frozenSeparation`,e.id),{remaining:e.remaining-t,closed:e.remaining-t<=0,updatedAt:new Date}),s-=t}await v(g(L,`frozenSeparation`),{date:r,productName:e,stockType:`separated`,initialQty:n,remaining:n,staffName:i,note:``,closed:!1,createdAt:new Date,updatedAt:new Date}),await v(g(L,`frozenSeparationLogs`),{date:r,timestamp:new Date,type:`separate`,productName:e,fromStockType:`notSeparated`,toStockType:`separated`,qty:n,staffName:i}),closeModal(),ns(await es()),alert(`분리 작업 완료!`)})}function as(e){let t=e.filter(e=>e.stockType===`separated`||e.stockType===`noSplit`);us(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${[...new Set(t.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>재고 종류 *</label>
      <select id="m_stockType">
        <option value="">선택</option>
        <option value="separated">분리O</option>
        <option value="noSplit">소분X</option>
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ls([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `),document.getElementById(`btnSaveOut`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_product`).value,n=document.getElementById(`m_stockType`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_date`).value,a=document.getElementById(`m_staff`).value;if(!e||!n||!r||!i){alert(`모든 필수 항목을 입력해주세요.`);return}let o=t.filter(t=>t.productName===e&&t.stockType===n).sort((e,t)=>e.date.localeCompare(t.date)),s=o.reduce((e,t)=>e+t.remaining,0);if(r>s){alert(`재고가 부족합니다. (현재: ${s}개)`);return}let c=r;for(let e of o){if(c<=0)break;let t=Math.min(e.remaining,c);await x(y(L,`frozenSeparation`,e.id),{remaining:e.remaining-t,closed:e.remaining-t<=0,updatedAt:new Date}),c-=t}await v(g(L,`frozenSeparationLogs`),{date:i,timestamp:new Date,type:`out`,productName:e,fromStockType:n,qty:r,staffName:a}),closeModal(),ns(await es()),alert(`출고 완료!`)})}function os(e){us(`
    <h3 class="modal-title">수동 조정</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(e.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>재고 종류 *</label>
      <select id="m_stockType">
        <option value="notSeparated">분리X</option>
        <option value="separated">분리O</option>
        <option value="noSplit">소분X</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량(개) *</label>
        <input type="number" id="m_qty" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ls([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_product`).value,n=document.getElementById(`m_stockType`).value,r=document.getElementById(`m_adjustType`).value,i=parseInt(document.getElementById(`m_qty`).value),a=document.getElementById(`m_reason`).value.trim(),o=document.getElementById(`m_staff`).value;if(!t||!i||!a||!o){alert(`모든 필수 항목을 입력해주세요.`);return}let s=r===`plus`?i:-i,c=e.filter(e=>e.productName===t&&e.stockType===n).sort((e,t)=>e.date.localeCompare(t.date));if(c.length>0){let e=c[0];await x(y(L,`frozenSeparation`,e.id),{remaining:e.remaining+s,closed:e.remaining+s<=0,updatedAt:new Date})}else await v(g(L,`frozenSeparation`),{date:V(),productName:t,stockType:n,initialQty:s,remaining:s,staffName:o,note:a,closed:!1,createdAt:new Date,updatedAt:new Date});await v(g(L,`frozenSeparationLogs`),{date:V(),timestamp:new Date,type:`adjust`,productName:t,fromStockType:n,qty:s,staffName:o,reason:a}),closeModal(),ns(await es()),alert(`조정 완료!`)})}var ss={};async function cs(){if(!(Object.keys(ss).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(ss[e]=t.data().members||[])}}function ls(e){let t=``;for(let n of e)(ss[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function us(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};async function ds(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`,await Ss(),hs(await fs())}async function fs(){return(await m(h(g(L,`schedules`),b(`date`,`asc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function ps(){return(await m(g(L,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function ms(){return(await m(g(L,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function hs(e){let t=document.getElementById(`mainContent`),n=V(),r=e.filter(e=>e.status===`scheduled`),i=e.filter(e=>e.status!==`scheduled`),a=!1;t.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">입고 예정관리</h2>
        <button class="btn-primary" id="btnAddSchedule">+ 입고 예정 등록</button>
      </div>

      <!-- 활성 목록 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>예정일</th>
              <th>구분</th>
              <th>품목명</th>
              <th>발주수량</th>
              <th>발주담당자</th>
              <th>입고메모</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${r.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:r.map(e=>gs(e,n)).join(``)}
          </tbody>
        </table>
      </div>

      <!-- 완료/취소 토글 -->
      <div style="margin-bottom:12px;">
        <button class="btn-secondary" id="btnToggleDone">완료/취소 항목 보기</button>
      </div>
      <div id="doneSection" style="display:none;">
        <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>예정일</th>
                <th>구분</th>
                <th>품목명</th>
                <th>발주수량</th>
                <th>실제수량</th>
                <th>입고담당자</th>
                <th>상태</th>
                <th>완료메모</th>
              </tr>
            </thead>
            <tbody>
              ${i.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:i.map(e=>_s(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`).addEventListener(`click`,ys),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);a=!a,e.style.display=a?``:`none`,document.getElementById(`btnToggleDone`).textContent=a?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.id,r=e.find(e=>e.id===n);r&&bs(r)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.id,n=prompt(`취소 사유를 입력해주세요:`);n&&(await x(y(L,`schedules`,t),{status:`cancelled`,cancelReason:n,cancelledAt:new Date,updatedAt:new Date}),hs(await fs()))})})}function gs(e,t){let n=e.date<t;return`
    <tr style="background:${n?`#fffdf0`:`white`}">
      <td style="color:${n?`#e67e22`:`#1a1a1a`}">${e.date} ${n?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${vs(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${e.orderedQty}${e.orderedUnit}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        <button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>
      </td>
    </tr>
  `}function _s(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${vs(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${e.orderedQty}${e.orderedUnit}</td>
      <td>${e.actualQty||`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function vs(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function ys(){let e=await ps(),t=await ms();ws(`
    <h3 class="modal-title">입고 예정 등록</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${V()}" />
    </div>
    <div class="form-group">
      <label>구분 *</label>
      <select id="m_type" onchange="updateScheduleItem()">
        <option value="">선택</option>
        <option value="meat">원육</option>
        <option value="bag">봉투</option>
        <option value="egg">계란</option>
      </select>
    </div>
    <div class="form-group" id="itemSelectWrap" style="display:none;">
      <label>품목 *</label>
      <select id="m_item">
        <option value="">선택</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>발주수량 *</label>
        <input type="number" id="m_qty" placeholder="수량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="장">장</option>
          <option value="박스">박스</option>
          <option value="개">개</option>
          <option value="판">판</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>발주 담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Cs([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">등록</button>
    </div>
  `),window.updateScheduleItem=()=>{let n=document.getElementById(`m_type`).value,r=document.getElementById(`itemSelectWrap`),i=document.getElementById(`m_item`);if(n===`egg`){r.style.display=`none`;return}r.style.display=``,i.innerHTML=`<option value="">선택</option>`,(n===`meat`?e:t).forEach(e=>{i.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`})},document.getElementById(`btnSaveSchedule`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_date`).value,t=document.getElementById(`m_type`).value,n=parseFloat(document.getElementById(`m_qty`).value),r=document.getElementById(`m_unit`).value,i=document.getElementById(`m_staff`).value,a=document.getElementById(`m_memo`).value;if(!e||!t||!n){alert(`날짜, 구분, 수량은 필수입니다.`);return}let o=null,s=`계란`;if(t!==`egg`){let e=document.getElementById(`m_item`);if(o=e.value,s=e.options[e.selectedIndex]?.dataset?.name||``,!o){alert(`품목을 선택해주세요.`);return}}await v(g(L,`schedules`),{date:e,type:t,itemId:o,itemNameSnapshot:s,orderedQty:n,orderedUnit:r,status:`scheduled`,orderStaffName:i,orderMemo:a,createdAt:new Date,updatedAt:new Date}),closeModal(),hs(await fs()),alert(`입고 예정 등록 완료!`)})}function bs(e){ws(`
    <h3 class="modal-title">입고 완료 처리 — ${e.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${e.orderedQty}${e.orderedUnit}</p>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" placeholder="실제 입고 수량 입력" />
    </div>
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Cs([`lead`])}
      </select>
    </div>
    <div class="form-group">
      <label>완료메모</label>
      <input type="text" id="m_memo" placeholder="메모" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveComplete">완료 처리</button>
    </div>
  `),document.getElementById(`btnSaveComplete`).addEventListener(`click`,async()=>{let t=parseFloat(document.getElementById(`m_actual`).value),n=document.getElementById(`m_staff`).value,r=document.getElementById(`m_memo`).value;if(!t||!n){alert(`실제 수량과 담당자는 필수입니다.`);return}let i=V();if(e.type===`meat`&&e.itemId){if((await _(y(L,`meatTypes`,e.itemId))).exists()){let r=e.orderedUnit===`kg`?t*1e3:t;await v(g(L,`meatStocks`),{meatTypeId:e.itemId,meatNameSnapshot:e.itemNameSnapshot,stage:`frozen`,incomingDate:i,initialQtyG:r,remaining:r,staffName:n,note:`입고예정 완료: ${e.orderMemo||``}`,closed:!1,createdAt:new Date,updatedAt:new Date})}}else if(e.type===`bag`&&e.itemId){let r=await _(y(L,`bagTypes`,e.itemId));if(r.exists()){let a=r.data(),o=e.orderedUnit===`박스`?t*(a.piecesPerBox||1):t,s=a.currentQty||0;await x(y(L,`bagTypes`,e.itemId),{currentQty:s+o,updatedAt:new Date}),await v(g(L,`bagLogs`),{date:i,timestamp:new Date,bagTypeId:e.itemId,bagNameSnapshot:e.itemNameSnapshot,type:`incoming`,qty:o,before:s,after:s+o,staffName:n,note:`입고예정 완료`})}}else if(e.type===`egg`){let r=await _(y(L,`eggStock`,`global`)),a=r.exists()?r.data().currentQty:0,o=r.exists()?r.data().minimumQty:0,s=e.orderedUnit===`판`?t*30:t;await x(y(L,`eggStock`,`global`),{currentQty:a+s,minimumQty:o,updatedAt:new Date}),await v(g(L,`eggLogs`),{date:i,timestamp:new Date,type:`in`,qty:s,before:a,after:a+s,staffName:n,note:`입고예정 완료`})}await x(y(L,`schedules`,e.id),{status:`completed`,actualQty:t,incomingStaffName:n,completeMemo:r,completedAt:new Date,updatedAt:new Date}),closeModal(),hs(await fs()),alert(`완료 처리되었습니다!`)})}var xs={};async function Ss(){if(!(Object.keys(xs).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(xs[e]=t.data().members||[])}}function Cs(e){let t=``;for(let n of e)(xs[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function ws(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};var Ts=[],Y=[],X=V(),Es=null;async function Ds(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>생산 입력 로딩 중...</p></div>`,await zs(),Ts=await Os(),Y=await ks(X),As()}async function Os(){return(await m(h(g(L,`recipes`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.active!==!1)}async function ks(e){return(await m(h(g(L,`productions`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.date===e&&t.status!==`deleted`)}function As(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="production-wrap">
      <!-- 왼쪽 3/4 -->
      <div class="production-left">
        <div class="production-date-bar">
          <input type="date" id="productionDate" value="${X}" />
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#555;">
            <input type="checkbox" id="isHoliday" /> 휴일 지정
          </label>
          <button class="btn-secondary" id="btnBigView" style="margin-left:auto;">크게보기</button>
        </div>
        <div class="production-cards" id="productionCards">
          ${js()}
        </div>
      </div>

      <!-- 오른쪽 1/4 -->
      <div class="production-right">
        <div class="production-form-header">
          <span style="font-size:13px;font-weight:600;color:#333;">생산 입력</span>
          <button class="btn-secondary" id="btnCopySheet" style="font-size:11px;padding:3px 10px;">생산지시서 복사</button>
        </div>
        <div id="productionForm">
          <div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">
            카드를 선택하거나 아래에서 새 생산을 추가하세요
          </div>
        </div>
        <button class="btn-primary" id="btnNewProduction" style="width:100%;margin-top:12px;">+ 새 생산 추가</button>
      </div>
    </div>
  `,document.getElementById(`productionDate`).addEventListener(`change`,async e=>{X=e.target.value,Y=await ks(X),document.getElementById(`productionCards`).innerHTML=js(),Ms()}),document.getElementById(`btnNewProduction`).addEventListener(`click`,()=>Ns(null)),document.getElementById(`btnCopySheet`).addEventListener(`click`,Is),document.getElementById(`btnBigView`).addEventListener(`click`,Ls),Ms()}function js(){return Y.length===0?`<div style="color:#aaa;font-size:13px;padding:20px;text-align:center;">오늘 생산 없음</div>`:Y.map(e=>`
    <div class="production-card ${Es===e.id?`active`:``}"
         data-id="${e.id}"
         style="border-left:4px solid ${e.color||`#4A7C59`}">
      <div class="card-title">${e.recipeName} ${e.round>1?`<span style="font-size:10px;color:#aaa">${e.round}회</span>`:``}</div>
      <div class="card-info">${e.productionUnitQty} ${e.productionUnitName}</div>
      ${e.category===`raw`?`<div class="card-sub">${e.rawBoxQty||0}박스</div>`:``}
      ${e.category===`freezeDry`?`<div class="card-sub">${e.freezeDryBagQty||0}봉 / ${e.breadPanQty||0}빵판 / ${e.freezePanQty||0}동결판</div>`:``}
      <button class="card-del" data-id="${e.id}">✕</button>
    </div>
  `).join(``)}function Ms(){document.querySelectorAll(`.production-card`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.classList.contains(`card-del`)||(Es=e.dataset.id,Ns(Y.find(e=>e.id===Es)),document.querySelectorAll(`.production-card`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`))})}),document.querySelectorAll(`.card-del`).forEach(e=>{e.addEventListener(`click`,async t=>{t.stopPropagation(),confirm(`삭제하시겠습니까?`)&&(await x(y(L,`productions`,e.dataset.id),{status:`deleted`}),Y=await ks(X),document.getElementById(`productionCards`).innerHTML=js(),Ms(),Es===e.dataset.id&&(Es=null,document.getElementById(`productionForm`).innerHTML=`<div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">카드를 선택하거나 아래에서 새 생산을 추가하세요</div>`))})})}function Ns(e){let t=!e,n=document.getElementById(`productionForm`);n.innerHTML=`
    <div style="padding:16px 0;">
      <div class="form-group" style="margin-bottom:12px;">
        <label>생산 담당자</label>
        <select id="pf_staff">
          <option value="">선택</option>
          ${Bs([`office`])}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>레시피 *</label>
        <select id="pf_recipe" ${t?``:`disabled`}>
          <option value="">선택</option>
          ${Ts.map(t=>`
            <option value="${t.id}"
              data-name="${Fs(t)}"
              data-category="${t.category}"
              data-color="${t.color||`#4A7C59`}"
              ${e?.recipeId===t.id?`selected`:``}>
              ${Fs(t)}
            </option>
          `).join(``)}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>생산단위 *</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="number" id="pf_qty" value="${e?.productionUnitQty||``}" placeholder="수량" style="flex:1" />
          <span id="pf_unitName" style="font-size:12px;color:#888;min-width:30px;">${e?.productionUnitName||``}</span>
        </div>
      </div>

      <!-- 원료 목록 -->
      <div id="pf_ingredients" style="margin-bottom:12px;max-height:200px;overflow-y:auto;font-size:12px;"></div>

      <!-- 참고 수치 -->
      <div id="pf_refs" style="font-size:11px;color:#888;margin-bottom:12px;"></div>

      <button class="btn-primary" id="btnSaveProduction" style="width:100%;">${t?`저장`:`수정`}</button>
    </div>
  `;let r=document.getElementById(`pf_recipe`),i=document.getElementById(`pf_qty`);function a(){let e=r.value,t=Ts.find(t=>t.id===e),n=parseFloat(i.value)||0;if(!t||!n){document.getElementById(`pf_ingredients`).innerHTML=``,document.getElementById(`pf_refs`).innerHTML=``;return}document.getElementById(`pf_unitName`).textContent=t.ingredients?.find(e=>e.isProductionUnit)?.unitName||``;let a=t.ingredients?.find(e=>e.isProductionUnit)?.baseWeightG||1,o=n*1e3,s=(t.ingredients||[]).map(e=>{let t=e.isProductionUnit?o.toFixed(1):(e.baseWeightG/a*o).toFixed(1);return`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5;">
        <span>${e.name}</span>
        <span style="color:#333;font-weight:500">${t}g</span>
      </div>`}).join(``);document.getElementById(`pf_ingredients`).innerHTML=s;let c=``;if(t.category===`raw`&&t.packWeightG){let e=(t.ingredients?.find(e=>e.isProductionUnit)?.baseWeightG||0)*n;c=`📦 박스수: ${Math.ceil(e/t.packWeightG/20)}박스`}else t.category===`freezeDry`&&(c=`봉지: ${(t.freezeDryBagCountPerUnit||0)*n} / 빵판: ${(t.breadPanCountPerUnit||0)*n} / 동결판: ${(t.freezePanCountPerUnit||0)*n}`);document.getElementById(`pf_refs`).textContent=c}r.addEventListener(`change`,a),i.addEventListener(`input`,a),e&&a(),document.getElementById(`btnSaveProduction`).addEventListener(`click`,async()=>{let n=r.value,a=parseFloat(i.value),o=document.getElementById(`pf_staff`).value;if(!n||!a){alert(`레시피와 생산단위는 필수입니다.`);return}let s=Ts.find(e=>e.id===n),c=s.ingredients?.find(e=>e.isProductionUnit)?.unitName||``,l=Fs(s),u=s.ingredients?.find(e=>e.isProductionUnit)?.baseWeightG||1,d=Ps(s,a);if(d.length>0){let e=d.map(e=>`⚠️ ${e}`).join(`
`);if(!confirm(`재고 부족 경고:\n${e}\n\n그래도 저장하시겠습니까?`))return}let f=Y.filter(e=>e.recipeId===n),ee=t?f.length+1:e.round,p={date:X,recipeId:n,recipeName:l,category:s.category,target:s.target,color:s.color||`#4A7C59`,round:ee,productionUnitQty:a,productionUnitName:c,ingredientsSnapshot:(s.ingredients||[]).map(e=>({name:e.name,meatTypeId:e.meatTypeId||null,requiredQtyG:e.isProductionUnit?a*1e3:e.baseWeightG/u*a*1e3,autoDeductInventory:e.autoDeductInventory!==!1,linkedToInventory:e.linkedToInventory!==!1})),staffName:o,sortOrder:t?Y.length:e.sortOrder,lockedByCompletion:!1,status:`active`,updatedAt:new Date};if(s.category===`raw`&&s.packWeightG){let e=(s.ingredients?.find(e=>e.isProductionUnit)?.baseWeightG||0)*a;p.rawBoxQty=Math.ceil(e/s.packWeightG/20)}s.category===`freezeDry`&&(p.freezeDryBagQty=(s.freezeDryBagCountPerUnit||0)*a,p.breadPanQty=(s.breadPanCountPerUnit||0)*a,p.freezePanQty=(s.freezePanCountPerUnit||0)*a),t?(p.createdAt=new Date,await v(g(L,`productions`),p)):await x(y(L,`productions`,e.id),p),Y=await ks(X),document.getElementById(`productionCards`).innerHTML=js(),Ms(),alert(t?`저장 완료!`:`수정 완료!`)})}function Ps(e,t){return[]}function Fs(e){return(e.target===`cat`?`고양이 `:e.target===`dog`?`강아지 `:``)+e.name}function Is(){let e=new Date(X),t=`${String(e.getFullYear()).slice(2)}/${e.getMonth()+1}/${e.getDate()} ${[`일`,`월`,`화`,`수`,`목`,`금`,`토`][e.getDay()]}`,n=Y.filter(e=>e.category===`raw`&&e.target===`cat`),r=Y.filter(e=>e.category===`raw`&&e.target===`dog`),i=Y.filter(e=>e.category===`freezeDry`),a=`※ ${t} 생산\n`;if(n.length>0){let e=n.map(e=>`${e.recipeName.replace(`고양이 `,``)}${e.productionUnitQty}`).join(`, `);a+=`- 고양이 생식 : ${e}\n`}if(r.length>0){let e=r.map(e=>`${e.recipeName.replace(`강아지 `,``)}${e.productionUnitQty}`).join(`, `);a+=`- 강아지 생식 : ${e}\n`}if(i.length>0){let e=i.filter(e=>e.target===`cat`).map(e=>`고양이 ${e.recipeName.replace(`고양이 `,``)}${e.productionUnitQty}`),t=i.filter(e=>e.target===`dog`).map(e=>`강아지 ${e.recipeName.replace(`강아지 `,``)}${e.productionUnitQty}`),n=i.filter(e=>e.target===`common`).map(e=>`${e.recipeName}${e.productionUnitQty}`),r=[...e,...t,...n].join(`, `);a+=`- 동결건조 : ${r}\n`}Vs(`
    <h3 class="modal-title">생산지시서 복사</h3>
    <textarea id="sheetText" style="width:100%;height:160px;font-size:13px;padding:12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;resize:none;">${a}</textarea>
    <div style="font-size:11px;color:#aaa;margin:8px 0;">비고를 추가하려면 위 텍스트를 직접 수정하세요.</div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
      <button class="btn-primary" id="btnCopy">복사하기</button>
    </div>
  `),document.getElementById(`btnCopy`).addEventListener(`click`,()=>{let e=document.getElementById(`sheetText`).value;navigator.clipboard.writeText(e).then(()=>{alert(`복사 완료!`),closeModal()})})}function Ls(){Vs(`
    <h3 class="modal-title">${X} 생산 현황</h3>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
      ${Y.length===0?`<p style="color:#aaa">생산 없음</p>`:Y.map(e=>`
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;min-width:160px;border-left:4px solid ${e.color||`#4A7C59`}">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${e.recipeName}</div>
            <div style="font-size:12px;color:#555;">${e.productionUnitQty} ${e.productionUnitName}</div>
            ${e.category===`raw`?`<div style="font-size:11px;color:#888;">${e.rawBoxQty||0}박스</div>`:``}
            ${e.category===`freezeDry`?`<div style="font-size:11px;color:#888;">${e.freezeDryBagQty||0}봉 / ${e.breadPanQty||0}빵판</div>`:``}
          </div>
        `).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}var Rs={};async function zs(){if(!(Object.keys(Rs).length>0))for(let e of[`senior`,`lead`,`office`]){let t=await _(y(L,`staffGroups`,e));t.exists()&&(Rs[e]=t.data().members||[])}}function Bs(e){let t=``;for(let n of e)(Rs[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Vs(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box" style="width:600px;max-width:90vw;">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};var Hs=[],Z=[],Us=[],Ws=[],Gs={currentQty:0,minimumQty:0},Q=null;async function Ks(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>메인 로딩 중...</p></div>`,await qs(),Js()}async function qs(){let e=V(),t=H(e),n=(await m(h(g(L,`productions`),b(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}));Hs=n.filter(t=>t.date===e&&t.status!==`deleted`),Z=n.filter(e=>e.date===t&&e.status!==`deleted`),Us=(await m(g(L,`recipes`))).docs.map(e=>({id:e.id,...e.data()})),Ws=(await m(g(L,`meatStocks`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed);let r=await _(y(L,`eggStock`,`global`));r.exists()&&(Gs=r.data());let i=await _(y(L,`productionCompletion`,e));Q=i.exists()?{id:i.id,...i.data()}:null}function Js(){let e=document.getElementById(`mainContent`),t=V(),n=H(t),r=Q?.status===`completed`,i=r?Z:Hs,a=r?`불러온 다음 영업일 생산 (${n})`:`오늘 생산`,o=r?`🥩 불러온 생산 원육 출고`:`🥩 오늘 원육 출고`,s=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],c=new Date(t+`T00:00:00`);e.innerHTML=`
    <div class="main-layout">
      <div class="main-panel-left">
        <div class="main-panel-header">
          <span class="main-panel-title">📅 ${`${c.getMonth()+1}/${c.getDate()} (${s[c.getDay()]})`} 생산</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            ${r?`<button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>`:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${Z.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기</button>`}
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${a}</span>
            ${r?`<span class="main-completed-pill">내일생산불러오기 완료</span>`:``}
          </div>
          <div class="main-production-grid">
            ${i.length===0?`<div class="main-empty">${r?`불러온 다음 영업일 생산 없음`:`오늘 생산 없음`}</div>`:i.map(e=>Ys(e)).join(``)}
          </div>
        </div>
      </div>

      <div class="main-panel-right-top">
        <div class="main-panel-header">
          <span class="main-panel-title">${o}</span>
        </div>
        <div style="padding:12px;font-size:12px;">
          ${ec(i,r)}
        </div>
      </div>

      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">🔔 알림</span>
        </div>
        <div style="padding:12px;">
          ${tc(r)}
        </div>
      </div>
    </div>
  `,document.getElementById(`btnBigView`)?.addEventListener(`click`,ac),document.getElementById(`btnTomorrowLoad`)?.addEventListener(`click`,nc),document.getElementById(`btnCancelCompletion`)?.addEventListener(`click`,ic)}function Ys(e){let t=e.ingredientsSnapshot||[],n=Xs(e,t);return`
    <div class="main-production-card" style="--recipe-color:${e.color||`#ef7bd0`}">
      <div class="main-production-card-title">
        ${e.recipeName}${e.round>1?` <span>${e.round}회</span>`:``}
      </div>
      <table class="main-ingredient-table">
        <thead>
          <tr>
            <th>부위</th>
            <th>생산수량</th>
            <th>단위</th>
          </tr>
        </thead>
        <tbody>
          <tr class="unit-row">
            <td>${n}</td>
            <td>${$s(e.productionUnitQty)}</td>
            <td>${e.productionUnitName||``}</td>
          </tr>
          ${t.map(e=>`
            <tr>
              <td>${e.name}</td>
              <td>${Zs(e)}</td>
              <td>${Qs(e)}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${e.category===`raw`?`<span>${e.rawBoxQty||0}박스</span>`:``}
        ${e.category===`freezeDry`?`<span>${e.freezeDryBagQty||0}봉</span><span>${e.breadPanQty||0}빵판</span><span>${e.freezePanQty||0}동결판</span>`:``}
      </div>
    </div>
  `}function Xs(e,t){let n=(e.productionUnitName||``).trim(),r=t.find(e=>e.name===n);return r?r.name:t.find(e=>e.meatTypeId)?.name||n||`생산단위`}function Zs(e){let t=Number(e.requiredQtyG||0);return e.meatTypeId?$s(t/1e3,1):$s(Math.round(t))}function Qs(e){return e.meatTypeId?`kg`:`g`}function $s(e,t=1){let n=Number(e||0);return Number.isInteger(n)?String(n):n.toLocaleString(`ko-KR`,{maximumFractionDigits:t})}function ec(e=Hs,t=!1){if(e.length===0)return`<div style="color:#aaa;">${t?`불러온 생산 없음`:`오늘 생산 없음`}</div>`;let n=[];return e.forEach(e=>{(e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.linkedToInventory&&n.push({name:e.name,requiredG:e.requiredQtyG})})}),n.length===0?`<div style="color:#aaa;">원육 출고 없음</div>`:n.map(e=>`
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5;">
      <span>${e.name}</span>
      <span style="font-weight:600;">${(e.requiredG/1e3).toFixed(1)}kg</span>
    </div>
  `).join(``)}function tc(e){let t=[];return Gs.minimumQty>0&&Gs.currentQty<Gs.minimumQty&&t.push(`<div style="color:#e53e3e;font-size:12px;padding:4px 0;">⚠️ 계란 부족 (현재: ${Gs.currentQty}개)</div>`),e&&t.push(`<div style="color:#2d7a3a;font-size:12px;padding:4px 0;">✅ 내일생산불러오기 완료</div>`),t.length===0&&t.push(`<div style="color:#aaa;font-size:12px;">알림 없음</div>`),t.join(``)}async function nc(){let e=V();if(Z.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(Q?.status===`completed`){alert(`오늘 내일생산불러오기는 이미 완료되었습니다.`);return}let t=await _(y(L,`staffGroups`,`lead`)),n=t.exists()&&t.data().members||[];oc(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      다음 영업일(${H(e)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${n.map(e=>`<option value="${e.name}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `),document.getElementById(`btnConfirmLoad`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_staff`).value;if(!t){alert(`담당자를 선택해주세요.`);return}closeModal(),await rc(e,t)})}async function rc(e,t){let n=H(e);try{let r={},i={};for(let e of Z){let t=Us.find(t=>t.id===e.recipeId);if(t&&((e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(r[e.meatTypeId]=(r[e.meatTypeId]||0)+e.requiredQtyG)}),t.category===`raw`&&t.bagTypeId)){let n=e.rawBoxQty||0,r=await _(y(L,`bagTypes`,t.bagTypeId));if(r.exists()){let e=r.data().piecesPerBox||1;i[t.bagTypeId]=(i[t.bagTypeId]||0)+n*e}}}for(let[e,t]of Object.entries(i)){let n=await _(y(L,`bagTypes`,e));if(n.exists()){let e=n.data().currentQty||0;if(e<t){alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${n.data().name}: 현재 ${e}장 / 필요 ${t}장`);return}}}let a=[];for(let[e,t]of Object.entries(r)){let n=t,r=Ws.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).sort((e,t)=>(e.repackedDate||``).localeCompare(t.repackedDate||``));for(let e of r){if(n<=0)break;let t=Math.min(e.remaining,n),r=e.remaining-t;await x(y(L,`meatStocks`,e.id),{remaining:r,closed:r<=0,updatedAt:new Date}),a.push({collection:`meatStocks`,docId:e.id,field:`remaining`,delta:-t,before:e.remaining,after:r,label:`${e.meatNameSnapshot} 재포장`,stockUpdatedAtSnapshot:new Date}),n-=t}if(n>0){let t=Ws.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``));for(let e of t){if(n<=0)break;let t=e.unitWeightG||1,r=Math.min(e.remaining,Math.ceil(n/t)*t),i=e.remaining-r;await x(y(L,`meatStocks`,e.id),{remaining:i,closed:i<=0,updatedAt:new Date}),a.push({collection:`meatStocks`,docId:e.id,field:`remaining`,delta:-r,before:e.remaining,after:i,label:`${e.meatNameSnapshot} 전처리`,stockUpdatedAtSnapshot:new Date}),n-=r}}if(n>0){let t=Ws.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``));for(let e of t){if(n<=0)break;let t=Math.min(e.remaining,n),r=e.remaining-t;await x(y(L,`meatStocks`,e.id),{remaining:r,closed:r<=0,updatedAt:new Date}),a.push({collection:`meatStocks`,docId:e.id,field:`remaining`,delta:-t,before:e.remaining,after:r,label:`${e.meatNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:new Date}),n-=t}}}for(let[n,r]of Object.entries(i)){let i=await _(y(L,`bagTypes`,n));if(i.exists()){let o=i.data().currentQty||0,s=o-r;await x(y(L,`bagTypes`,n),{currentQty:s,updatedAt:new Date}),a.push({collection:`bagTypes`,docId:n,field:`currentQty`,delta:-r,before:o,after:s,label:`${i.data().name} 봉투`,stockUpdatedAtSnapshot:new Date}),await v(g(L,`bagLogs`),{date:e,timestamp:new Date,bagTypeId:n,bagNameSnapshot:i.data().name,type:`autoDeduct`,qty:-r,before:o,after:s,staffName:t,note:`내일생산불러오기 자동차감`})}}let o=await v(g(L,`stockLedger`),{actionType:`productionCompletion`,actionId:e,timestamp:new Date,runDate:e,status:`active`,items:a});await fe(y(L,`productionCompletion`,e),{runDate:e,targetProductionDate:n,status:`completed`,idempotencyKey:`productionCompletion:${e}`,staffName:t,ledgerId:o.id,completedAt:new Date});for(let e of Z)await x(y(L,`productions`,e.id),{lockedByCompletion:!0});await qs(),Js(),alert(`내일생산불러오기 완료!`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function ic(){if(!confirm(`내일생산불러오기를 취소하시겠습니까?
차감된 재고가 복원됩니다.`))return;let e=prompt(`취소 사유를 입력해주세요:`);if(e){V();try{if(Q?.ledgerId){let e=await _(y(L,`stockLedger`,Q.ledgerId));if(e.exists()){let t=e.data().items||[];for(let e of t){let t=await _(y(L,e.collection,e.docId));if(!t.exists())continue;let n=t.data()[e.field];n!==e.after&&!confirm(`내일생산불러오기 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n강제 복원하시겠습니까?`)||await x(y(L,e.collection,e.docId),{[e.field]:n-e.delta,closed:!1,updatedAt:new Date})}await x(y(L,`stockLedger`,Q.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}Q?.id&&await x(y(L,`productionCompletion`,Q.id),{status:`cancelled`,cancelReason:e,cancelledAt:new Date});for(let e of Z)await x(y(L,`productions`,e.id),{lockedByCompletion:!1});await qs(),Js(),alert(`취소 완료! 재고가 복원되었습니다.`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}}function ac(){let e=Q?.status===`completed`,t=e?Z:Hs;oc(`
    <h3 class="modal-title">${e?`${H(V())} 불러온 생산`:`${V()} 생산 현황`}</h3>
    <div class="main-production-grid big-view">
      ${t.length===0?`<p style="color:#aaa">생산 없음</p>`:t.map(e=>Ys(e)).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}function oc(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`),r=e.includes(`main-production-grid big-view`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box ${r?`modal-wide`:``}">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{e.target===n&&closeModal()})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};async function sc(e){let t=document.getElementById(`mainContent`);if(t)switch(e){case`main`:await Ks();break;case`settings`:await aa();break;case`recipe`:await fa();break;case`meat`:await ja();break;case`bag`:await Ya();break;case`egg`:await po();break;case`frozenProduct`:await Eo();break;case`frozenPan`:await Vo();break;case`frozenSep`:await $o();break;case`schedule`:await ds();break;case`production`:await Ds();break;default:t.innerHTML=`
        <div class="page-placeholder">
          <h2>${cc(e)}</h2>
          <p>준비 중</p>
        </div>
      `}}function cc(e){return{main:`메인 대시보드`,production:`생산 입력`,meat:`원육 재고`,egg:`계란`,bag:`봉투 재고`,frozenProduct:`동결제품 입고`,frozenPan:`동결판 재고`,frozenSep:`동결 분리작업`,schedule:`입고 예정관리`,recipe:`레시피 관리`,stats:`통계`,settings:`설정`}[e]||e}var lc=`modulepreload`,uc=function(e){return`/fant/`+e},dc={},$=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=uc(t,n),t in dc)return;dc[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:lc,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},fc=!1;function pc(){let e=ta.filter(e=>e.roles.includes($i));document.getElementById(`app`).innerHTML=`
    <div class="app-wrapper">
      <div class="block-banner" id="blockBanner" style="display:none"></div>

      <nav class="navbar">
        <div class="navbar-menus">
          ${e.map(e=>`
            <button class="nav-btn ${na===e.id?`active`:``}" data-menu="${e.id}">
              ${e.label}
            </button>
          `).join(``)}
        </div>
        <div class="navbar-right">
          <button class="close-btn" id="closingBtn" disabled>마감</button>
          <button class="logout-btn" id="logoutBtn" title="로그아웃">↗</button>
        </div>
      </nav>

      <div class="subbar">
        <span class="subbar-item" id="subToday">📅 --</span>
        <span class="subbar-item" id="sub18months">⏳ --</span>
        <span class="subbar-item" id="subEgg">🥚 --개</span>
        <span class="subbar-item" id="subLowStock">⚠️ 부족재고 --개</span>
        <span class="subbar-item" id="subSchedule">📦 입고예정 --건</span>
        <span class="subbar-item" id="subUnread">🔔 미확인로그 --건</span>
      </div>

      <main class="main-content" id="mainContent"></main>
    </div>
  `,document.querySelectorAll(`.nav-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.menu;ra(t),pc(),sc(t)})}),document.getElementById(`logoutBtn`).addEventListener(`click`,bc),document.getElementById(`closingBtn`).addEventListener(`click`,yc);let t=document.getElementById(`blockBanner`);t&&t.addEventListener(`click`,Cc),mc(),hc(),vc(),sc(na)}async function mc(){let e=V(),t=Aa(e),n=new Date(e+`T12:00:00+09:00`);n.setUTCMonth(n.getUTCMonth()+18);let[r,i,a]=ka(n).split(`-`).map(Number),o=`${String(r).slice(2)}/${i}/${a}`;document.getElementById(`subToday`).textContent=`📅 ${t}`,document.getElementById(`sub18months`).textContent=`⏳ ${o}`;try{let{db:t}=await $(async()=>{let{db:e}=await Promise.resolve().then(()=>Xi);return{db:e}},void 0),{getDoc:n,getDocs:r,doc:i,collection:a}=await $(async()=>{let{getDoc:e,getDocs:t,doc:n,collection:r}=await import(`./index.esm-BEtDdFFW.js`).then(e=>e.t);return{getDoc:e,getDocs:t,doc:n,collection:r}},__vite__mapDeps([0,1])),o=await n(i(t,`eggStock`,`global`)),s=o.exists()?o.data().currentQty:0;document.getElementById(`subEgg`).textContent=`🥚 ${s}개`;let c=(await r(a(t,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()})),l=(await r(a(t,`meatStocks`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed),u=0;c.forEach(e=>{e.minimumQtyG&&l.filter(t=>t.meatTypeId===e.id).reduce((e,t)=>e+(t.remaining||0),0)<e.minimumQtyG&&u++}),(await r(a(t,`bagTypes`))).docs.forEach(e=>{let t=e.data();t.minimumQty&&(t.currentQty||0)<t.minimumQty&&u++}),document.getElementById(`subLowStock`).textContent=`⚠️ 부족재고 ${u}개`;let d=(await r(a(t,`schedules`))).docs.map(e=>e.data()).filter(t=>t.status===`scheduled`&&t.date<=e);document.getElementById(`subSchedule`).textContent=`📦 입고예정 ${d.length}건`,document.getElementById(`subUnread`).textContent=`🔔 미확인로그 0건`}catch(e){console.error(`서브바 업데이트 오류:`,e)}}async function hc(){let e=document.getElementById(`blockBanner`);if(e)try{let{getEarliestUnclosedWorkday:t}=await $(async()=>{let{getEarliestUnclosedWorkday:e}=await import(`./closing-B-f_EnvQ.js`);return{getEarliestUnclosedWorkday:e}},__vite__mapDeps([2,0,1])),{getAllBlockingItems:n}=await $(async()=>{let{getAllBlockingItems:e}=await import(`./closingChecks-Xx1rd8dq.js`);return{getAllBlockingItems:e}},__vite__mapDeps([3,0,1])),r=await t(),i=V();if(!r||r>=i){e.style.display=`none`,window.__blockingItems=null,gc();return}let a=await n(r);window.__blockingItems=a,e.textContent=`⚠️ ${Aa(r)} 마감 미처리 — 신규 등록이 차단되었습니다 (클릭하여 상세보기)`,e.style.display=`block`,gc(),fc||(fc=!0,_c())}catch(t){console.error(`배너 업데이트 오류:`,t),e.style.display=`none`,window.__blockingItems=null,gc()}}function gc(){document.querySelectorAll(`.nav-btn .warning-icon`).forEach(e=>e.remove());let e=window.__blockingItems;if(!e||e.totalBlocked===0)return;let t=new Set(e.items.map(e=>e.jumpMenu));document.querySelectorAll(`.nav-btn`).forEach(e=>{let n=e.dataset.menu;if(t.has(n)){let t=document.createElement(`span`);t.className=`warning-icon`,t.textContent=` ⚠️`,e.appendChild(t)}})}function _c(){let e=window.__blockingItems;if(!e)return;let t=document.getElementById(`blockingModalOverlay`);t&&t.remove();let n=Aa(e.date),r;if(e.totalBlocked===0)r=`
      <p class="blocking-modal-desc">
        ${n} 마감이 완료되지 않아 신규 등록이 차단됩니다.
      </p>
      <p class="blocking-modal-desc">
        처리할 차단 항목은 없으니, QC 계정에서 마감 버튼만 누르면 해제됩니다.
      </p>
    `;else{let t=[`①`,`②`,`③`,`④`,`⑤`,`⑥`,`⑦`];r=`
      <p class="blocking-modal-desc">
        ${n} 마감이 완료되지 않아 다음 작업들이 차단됩니다:
      </p>
      <ul class="blocking-modal-blocked">
        <li>모든 페이지의 신규 등록 (생산 추가, 입고 등록, 발주 추가 등)</li>
        <li>마감 버튼 (아래 항목 처리 후 가능)</li>
      </ul>
      <p class="blocking-modal-desc-strong">
        마감을 위해 처리해야 할 항목:
      </p>
      <div class="blocking-modal-items">
        ${e.items.map((e,n)=>`
        <div class="blocking-modal-item">
          <span class="blocking-modal-item-num">${t[n]||`${n+1}.`}</span>
          <span class="blocking-modal-item-label">${e.label}</span>
          <button class="btn-primary blocking-modal-jump" data-jump="${e.jumpMenu}">처리하러 가기</button>
        </div>
      `).join(``)}
      </div>
      <p class="blocking-modal-foot">
        위 항목 처리 후 QC 계정에서 마감 버튼을 눌러주세요.
      </p>
    `}let i=`
    <div class="modal-overlay" id="blockingModalOverlay">
      <div class="modal-box modal-blocking">
        <h3 class="blocking-modal-title">⚠️ 지난 영업일 마감이 처리되지 않았습니다</h3>
        ${r}
        <div class="modal-actions">
          <button class="btn-secondary" id="blockingModalClose">닫기</button>
        </div>
      </div>
    </div>
  `;document.body.insertAdjacentHTML(`beforeend`,i);let a=document.getElementById(`blockingModalOverlay`);document.getElementById(`blockingModalClose`).addEventListener(`click`,()=>{a.remove()}),a.addEventListener(`click`,e=>{e.target===a&&a.remove()}),a.querySelectorAll(`.blocking-modal-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;a.remove(),ra(t),pc(),sc(t)})})}window.openBlockingModal=_c;async function vc(){let e=document.getElementById(`closingBtn`);if(e)try{let{getEarliestUnclosedWorkday:t}=await $(async()=>{let{getEarliestUnclosedWorkday:e}=await import(`./closing-B-f_EnvQ.js`);return{getEarliestUnclosedWorkday:e}},__vite__mapDeps([2,0,1])),n=V(),r=await t();r===null?(e.textContent=`마감해제`,e.disabled=!1,e.dataset.mode=`release`,e.dataset.targetDate=n):r===n?(e.textContent=`오늘 마감`,e.disabled=!1,e.dataset.mode=`close`,e.dataset.targetDate=n):(e.textContent=`어제 마감`,e.disabled=!1,e.dataset.mode=`close`,e.dataset.targetDate=r)}catch(t){console.error(`updateClosingButton error`,t),e.textContent=`마감`,e.disabled=!0}}async function yc(){let e=document.getElementById(`closingBtn`);if(!e)return;let t=e.dataset.mode,n=e.dataset.targetDate;if($i!==`production`){alert(`마감은 생산실(QC) 계정에서만 가능합니다.`);return}if(t===`release`){Sc(n);return}if(t===`close`)try{let{getAllBlockingItems:e}=await $(async()=>{let{getAllBlockingItems:e}=await import(`./closingChecks-Xx1rd8dq.js`);return{getAllBlockingItems:e}},__vite__mapDeps([3,0,1])),t=await e(n);if(t.totalBlocked>0){window.__blockingItems=t,typeof window.openBlockingModal==`function`&&window.openBlockingModal();return}xc(n)}catch(e){console.error(`handleClosingClick error`,e),alert(`마감 처리 중 오류가 발생했습니다. 콘솔 확인.`)}}async function bc(){try{let{isDateClosed:e}=await $(async()=>{let{isDateClosed:e}=await import(`./closing-B-f_EnvQ.js`);return{isDateClosed:e}},__vite__mapDeps([2,0,1]));if(!await e(V())&&!confirm(`오늘 아직 마감되지 않았습니다.
로그아웃해도 자동으로 마감되지 않습니다.

로그아웃 하시겠습니까?`))return;await ia()}catch(e){console.error(`handleLogoutClick error`,e),await ia()}}async function xc(e){let t=document.getElementById(`closeConfirmOverlay`);t&&t.remove();let n=[`senior`,`lead`,`office`],r={};for(let e of n){let t=await _(y(L,`staffGroups`,e));t.exists()&&(r[e]=t.data().members||[])}let i=`<option value="">선택하세요</option>`;for(let e of n)(r[e]||[]).forEach(e=>{i+=`<option value="${e.name}">${e.name}</option>`});let a=Aa(e),o=`
    <div class="modal-overlay" id="closeConfirmOverlay">
      <div class="modal-box">
        <h3 style="margin-top:0">${a} 마감</h3>
        <p>담당자를 선택해주세요.</p>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">담당자</label>
          <select id="closeStaffSelect" style="width:100%; padding:6px; font-size:14px">
            ${i}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="closeConfirmCancel">취소</button>
          <button class="btn-primary" id="closeConfirmOk">마감</button>
        </div>
      </div>
    </div>
  `;document.body.insertAdjacentHTML(`beforeend`,o);let s=document.getElementById(`closeConfirmOverlay`);document.getElementById(`closeConfirmCancel`).addEventListener(`click`,()=>s.remove()),s.addEventListener(`click`,e=>{e.target===s&&s.remove()}),document.getElementById(`closeConfirmOk`).addEventListener(`click`,async()=>{let t=document.getElementById(`closeStaffSelect`).value;if(!t){alert(`담당자를 선택해주세요.`);return}let n=document.getElementById(`closeConfirmOk`);n.disabled=!0,n.textContent=`처리 중...`;try{let{closeDate:n}=await $(async()=>{let{closeDate:e}=await import(`./closing-B-f_EnvQ.js`);return{closeDate:e}},__vite__mapDeps([2,0,1]));await n(e,t),s.remove(),alert(`${a} 마감 완료`),vc(),hc()}catch(e){console.error(`closeDate error`,e),alert(`마감 실패: ${e.message}`),n.disabled=!1,n.textContent=`마감`}})}async function Sc(e){let t=document.getElementById(`releaseConfirmOverlay`);t&&t.remove();let n=[`senior`,`lead`,`office`],r={};for(let e of n){let t=await _(y(L,`staffGroups`,e));t.exists()&&(r[e]=t.data().members||[])}let i=`<option value="">선택하세요</option>`;for(let e of n)(r[e]||[]).forEach(e=>{i+=`<option value="${e.name}">${e.name}</option>`});let a=Aa(e),o=`
    <div class="modal-overlay" id="releaseConfirmOverlay">
      <div class="modal-box">
        <h3 style="margin-top:0">${a} 마감해제</h3>
        <p style="color:#c0392b; font-size:13px">마감을 해제하면 해당 날짜의 데이터를 다시 수정할 수 있게 됩니다.</p>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">사유 *</label>
          <textarea id="releaseReason" rows="3" style="width:100%; padding:6px; font-size:14px; font-family:inherit; box-sizing:border-box; resize:vertical" placeholder="해제 사유 입력"></textarea>
        </div>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">담당자 *</label>
          <select id="releaseStaffSelect" style="width:100%; padding:6px; font-size:14px">
            ${i}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="releaseConfirmCancel">취소</button>
          <button class="btn-primary" id="releaseConfirmOk">마감해제</button>
        </div>
      </div>
    </div>
  `;document.body.insertAdjacentHTML(`beforeend`,o);let s=document.getElementById(`releaseConfirmOverlay`);document.getElementById(`releaseConfirmCancel`).addEventListener(`click`,()=>s.remove()),s.addEventListener(`click`,e=>{e.target===s&&s.remove()}),document.getElementById(`releaseConfirmOk`).addEventListener(`click`,async()=>{let t=document.getElementById(`releaseReason`).value.trim(),n=document.getElementById(`releaseStaffSelect`).value;if(!t){alert(`사유를 입력해주세요.`);return}if(!n){alert(`담당자를 선택해주세요.`);return}let r=document.getElementById(`releaseConfirmOk`);r.disabled=!0,r.textContent=`처리 중...`;try{let{releaseClosing:r}=await $(async()=>{let{releaseClosing:e}=await import(`./closing-B-f_EnvQ.js`);return{releaseClosing:e}},__vite__mapDeps([2,0,1]));await r(e,n,t),s.remove(),alert(`${a} 마감해제 완료`),vc(),hc()}catch(e){console.error(`releaseClosing error`,e),alert(`마감해제 실패: ${e.message}`),r.disabled=!1,r.textContent=`마감해제`}})}function Cc(){if(typeof window.openBlockingModal==`function`){window.openBlockingModal();return}let e=window.__blockingItems;if(!e){alert(`차단 항목 데이터 없음 (페이지 새로고침 필요할 수 있음).`);return}if(e.totalBlocked===0){alert(`${e.date} 마감 미처리\n처리할 차단 항목 없음.\nQC 계정에서 마감 버튼만 누르면 해제됩니다.`);return}let t=e.items.map((e,t)=>`${t+1}. ${e.label}`);alert(`${e.date} 마감 차단 항목 ${e.totalBlocked}개\n\n${t.join(`
`)}`)}var wc=540*60*1e3,Tc=null,Ec=null;function Dc(){let e=Date.now(),t=new Date(e+wc);return new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()+1,0,1,0,0)).getTime()-wc-e}function Oc(){let e=Date.now(),t=new Date(e+wc),n=t.getUTCHours(),r=t.getUTCMinutes(),i=!1;return(n>23||n===23&&r>=55)&&(i=!0),new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate()+ +!!i,23,55,0,0)).getTime()-wc-e}function kc(){if(document.getElementById(`midnightLogoutToast`))return;let e=document.createElement(`div`);if(e.id=`midnightLogoutToast`,e.style.cssText=`
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
  `,e.textContent=`5분 후 자동 로그아웃됩니다. 마감 작업을 마무리해주세요.`,!document.getElementById(`midnightToastStyle`)){let e=document.createElement(`style`);e.id=`midnightToastStyle`,e.textContent=`
      @keyframes midnightToastFadeIn {
        from { opacity: 0; transform: translateY(-12px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,document.head.appendChild(e)}document.body.appendChild(e),setTimeout(()=>{e.parentNode&&e.parentNode.removeChild(e)},1e4)}function Ac(){jc();let e=Dc();Tc=setTimeout(async()=>{try{R.currentUser&&await Bn(R)}catch(e){console.error(`자정 자동 로그아웃 실패:`,e)}Tc=null},e);let t=Oc();t<e&&(Ec=setTimeout(()=>{R.currentUser&&kc(),Ec=null},t))}function jc(){Tc!==null&&(clearTimeout(Tc),Tc=null),Ec!==null&&(clearTimeout(Ec),Ec=null)}typeof window<`u`&&(window.__midnightDebug={msUntilNextKstLogoutTime:Dc,msUntilNextKstToastTime:Oc,showLogoutWarningToast:kc}),zn(R,async e=>{e?(await ea(e),pc(),Ac()):(jc(),Mc())});function Mc(){document.getElementById(`app`).innerHTML=`
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
  `,document.getElementById(`loginBtn`).addEventListener(`click`,Nc),document.getElementById(`password`).addEventListener(`keydown`,e=>{e.key===`Enter`&&Nc()})}async function Nc(){let e=document.getElementById(`email`).value.trim(),t=document.getElementById(`password`).value,n=document.getElementById(`loginError`),r=document.getElementById(`loginBtn`);if(!e||!t){n.textContent=`이메일과 비밀번호를 입력해주세요.`;return}r.textContent=`로그인 중...`,r.disabled=!0,n.textContent=``;try{await In(R,e,t)}catch{n.textContent=`이메일 또는 비밀번호가 올바르지 않습니다.`,r.textContent=`로그인`,r.disabled=!1}}export{L as i,V as n,Qi as r,H as t};