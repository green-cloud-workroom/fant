import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';

// These exact, argument-free handlers were reviewed in the current source.
// Adding/removing/changing an inline HTML handler requires an explicit review
// and policy update; never derive the allowlist from arbitrary source content.
export const REVIEWED_INLINE_HANDLERS=Object.freeze({
  'closeModal()':'sha256-OXqjjmv8hsJ7lR+n3ceuDu6KBNh8WlE7+5+vLocG1f4=',
  'event.stopPropagation()':'sha256-jHF5hTIlMDyGZRAsNK0HO/WFYrwPvI2I1q0o1xKKB6I=',
  'updateSepGuide()':'sha256-MveeZJERVNRjU5rOkE2EPMq+TmRxNtA0HmQuCC01qzk=',
  'updateOutType()':'sha256-nLaPaUNd5PJbtVG0DZ+9IsBSzBDC6J4bHGowJwyafVk=',
  'updateScheduleItem()':'sha256-Xku7fkAtCbU3dNURbT3HAModJQ3EIKr4GT2Qyd5pkXs=',
});
const handlerHash=code=>'sha256-'+createHash('sha256').update(code,'utf8').digest('base64');

export function inspectInlineHandlers(files,{requireAll=true}={}) {
  const occurrences=[],seen=new Set();
  for(const [path,source]of Object.entries(files)){
    // Dot/property handlers (.onclick = function) are trusted script assignments,
    // not HTML attributes. All current HTML handlers are literal quoted values.
    const attribute=/\son[a-z][a-z0-9:_-]*\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    for(const tag of source.matchAll(/<[a-z](?:"[^"]*"|'[^']*'|[^'">])*?>/gi))for(const match of tag[0].matchAll(attribute)){
      const code=match[1]??match[2]??match[3],hash=REVIEWED_INLINE_HANDLERS[code];
      if(!hash||hash!==handlerHash(code))throw Error(`Unreviewed inline handler in ${path}:${source.slice(0,tag.index+match.index).split('\n').length}`);
      seen.add(code);occurrences.push({path,code,hash});
    }
  }
  if(requireAll&&Object.keys(REVIEWED_INLINE_HANDLERS).some(code=>!seen.has(code)))throw Error('Reviewed inline handler set changed; remove obsolete policy hashes explicitly');
  return {reviewedHandlerCount:Object.keys(REVIEWED_INLINE_HANDLERS).length,occurrenceCount:occurrences.length,occurrences};
}

export function productionCsp() {
  const hashes=Object.values(REVIEWED_INLINE_HANDLERS).map(value=>`'${value}'`).join(' ');
  return [
    "default-src 'none'",
    `script-src 'self' 'unsafe-hashes' ${hashes}`,
    // Limit hash exceptions to HTML attributes on CSP3 browsers; injected
    // script elements must still come from this origin.
    "script-src-elem 'self'",
    `script-src-attr 'unsafe-hashes' ${hashes}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://asia-northeast3-fant-e5ae5.cloudfunctions.net",
    "frame-src https://fant-e5ae5.firebaseapp.com",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export function injectProductionCsp(html) {
  if(/<meta\b[^>]*http-equiv\s*=\s*["']?content-security-policy(?:["'\s>])/i.test(html))throw Error('Existing CSP requires explicit integration');
  const head=/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html);
  if(!head)throw Error('HTML head required for CSP');
  const charset=/<meta\b[^>]*charset\s*=\s*["']?utf-8["']?[^>]*>/i.exec(head[1]);
  if(!charset||/<(?:script|link|style|base|iframe|object)\b/i.test(head[1].slice(0,charset.index)))throw Error('UTF-8 charset must precede active resources for CSP insertion');
  const at=head.index+head[0].indexOf(head[1])+charset.index+charset[0].length;
  const policy=productionCsp().replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  return html.slice(0,at)+`\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`+html.slice(at);
}

export async function inspectProjectInlineHandlers(root) {
  const files={'index.html':await readFile(join(root,'index.html'),'utf8')};
  async function visit(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const path=join(directory,entry.name);
      if(entry.isSymbolicLink())throw Error('Source symlinks require explicit CSP audit');
      if(entry.isDirectory())await visit(path);
      else if(/\.(?:js|html|svg)$/i.test(entry.name))files[relative(root,path).replaceAll('\\','/')]=await readFile(path,'utf8');
    }
  }
  await visit(join(root,'src'));
  return inspectInlineHandlers(files);
}

export function productionCspPlugin(){
  let root;
  return {
    name:'reviewed-production-csp',apply:'build',enforce:'pre',
    configResolved(config){root=resolve(config.root);},
    async buildStart(){await inspectProjectInlineHandlers(root);},
    transformIndexHtml:{order:'pre',handler:injectProductionCsp},
  };
}
