// Dedicated local UI fixture. Both Auth and Firestore are replaced at build time.
import { build, preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const path = name => resolve(name).replaceAll('\\', '/');
const entry = resolve('output/stats-preview-entry');
await mkdir(entry, { recursive: true });
await writeFile(resolve(entry, 'index.html'), '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
  '<body style="margin:0;display:block"><aside style="padding:10px;background:#fff3cd">통계 개편 로컬 검증 · 합성 데이터 · 운영 DB 연결 없음</aside>' +
  '<main id="mainContent" style="height:calc(100vh - 48px);display:block"></main><script type="module" src="./main.mjs"></script></body></html>');
await writeFile(resolve(entry, 'main.mjs'), [
  'import ' + JSON.stringify(path('src/style.css')) + ';',
  'import ' + JSON.stringify(path('tests/fixtures/statsBrowserData.mjs')) + ';',
  'import {beginPage} from ' + JSON.stringify(path('src/utils/pageLifecycle.js')) + ';',
  'import {renderStats} from ' + JSON.stringify(path('src/pages/stats.js')) + ';',
  'beginPage(document.getElementById("mainContent"),"stats"); await renderStats();',
].join('\n'));
await build({ configFile: false, root: entry, base: '/', logLevel: 'warn',
  define: { 'import.meta.env.VITE_PERF_SHELL': '"true"', 'import.meta.env.VITE_PERF_STORE': '"true"',
    'import.meta.env.VITE_PERF_ROUTES': '"stats"', 'import.meta.env.VITE_INSTANT_PAGE_ROUTES': '"stats"' },
  resolve: { alias: { 'firebase/firestore': path('tests/fixtures/firestore.mjs'), 'firebase/auth': path('tests/fixtures/auth.mjs') } },
  plugins: [{ name: 'stats-local-only', enforce: 'pre',
    load(id) { if (id.replaceAll('\\', '/').endsWith('/src/firebase.js')) return 'import {fixtureAuth} from ' + JSON.stringify(path('tests/fixtures/auth.mjs')) + ';export const db={};export const auth=fixtureAuth;'; },
    transform(code, id) { if (id.replaceAll('\\', '/').endsWith('/src/utils/date.js')) return code.replace('return formatKstDate(new Date());', "return '2026-09-14';"); },
  }],
  build: { outDir: resolve('output/stats-preview'), emptyOutDir: false, target: 'esnext' },
});
if (!process.argv.includes('--build-only')) await preview({ configFile: false, root: entry, build: { outDir: resolve('output/stats-preview') },
  preview: { host: '127.0.0.1', port: 4303, strictPort: true } }).then(server => server.printUrls());
