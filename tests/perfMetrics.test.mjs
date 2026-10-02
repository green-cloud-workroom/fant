import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';

test('phase measurements distinguish failed work and reset with the session',async()=>{
 const e=await environment();let tick=10;
 e.context.performance={now:()=>tick};
 const metrics=await e.load('src/perf/metrics.js');
 assert.equal(await metrics.measurePhase('main:logs',async()=>{tick=35;return 'ready';}),'ready');
 await assert.rejects(()=>metrics.measurePhase('main:calendar',async()=>{tick=50;throw new Error('offline');}),/offline/);
 const phases=metrics.exportPhaseMetrics();
 assert.equal(phases[0].durationMs,25);assert.equal(phases[0].status,'ready');
 assert.equal(phases[1].durationMs,15);assert.equal(phases[1].status,'failed');
 (await e.load('src/state/sessionStore.js')).sessionStore.clear();
 assert.equal(metrics.exportPhaseMetrics().length,0);
});

test('an old session completion does not leak into new phase measurements',async()=>{
 const e=await environment(),metrics=await e.load('src/perf/metrics.js');
 let finish;
 const pending=metrics.measurePhase('startup:holidays',()=>new Promise(resolve=>{finish=resolve;}));
 (await e.load('src/state/sessionStore.js')).sessionStore.clear();
 finish('old');await pending;
 assert.equal(metrics.exportPhaseMetrics().length,0);
});

test('server response diagnostics do not inflate request or cache-hit counts',async()=>{
 const e=await environment(),metrics=await e.load('src/perf/metrics.js');
 const sample=metrics.startNavigation('main');
 metrics.recordRead(false,{kind:'query'});
 metrics.recordReadResult({kind:'query',durationMs:40,documents:2});
 assert.equal(sample.reads,1);assert.equal(sample.cacheHits,0);
 assert.equal(metrics.exportReadMetrics().length,1);
 assert.equal(metrics.exportReadResponseMetrics().length,1);
 (await e.load('src/state/sessionStore.js')).sessionStore.clear();
 assert.equal(metrics.exportReadResponseMetrics().length,0);
});

test('navigation readiness is recorded when content exists, independent of a delayed frame',async()=>{
 const e=await environment();
 const frames=[];
 e.context.requestAnimationFrame=callback=>frames.push(callback);
 e.context.document.visibilityState='visible';
 e.nodes.mainContent.dataset={};
 const metrics=await e.load('src/perf/metrics.js');
 const sample=metrics.startNavigation('main');
 metrics.finishNavigation(sample,()=>true);
 assert.equal(sample.status,'ready');
 assert.equal(e.nodes.mainContent.dataset.pageReady,'main');
 assert.equal(sample.firstContentMs,undefined);
 frames.shift()();frames.shift()();
 assert.equal(sample.frameStatus,'foreground');
 assert.equal(typeof sample.firstContentMs,'number');
});

test('background navigation does not report a frame time',async()=>{
 const e=await environment();
 e.context.document.visibilityState='hidden';
 e.nodes.mainContent.dataset={};
 const metrics=await e.load('src/perf/metrics.js');
 const sample=metrics.startNavigation('meat');
 metrics.finishNavigation(sample,()=>true);
 assert.equal(sample.status,'ready');
 assert.equal(sample.frameStatus,'background');
 assert.equal(sample.firstContentMs,undefined);
});

test('content and interaction readiness use separate observed moments',async()=>{
 const e=await environment();
 let tick=100, content=false;
 e.context.performance={now:()=>tick};
 e.context.MutationObserver=class {observe(){} disconnect(){}};
 e.context.requestAnimationFrame=()=>{};
 e.context.document.visibilityState='visible';
 e.nodes.mainContent.dataset={};
 e.nodes.mainContent.querySelector=()=>content?{}:null;
 const metrics=await e.load('src/perf/metrics.js');
 const sample=metrics.startNavigation('egg');
 metrics.observeNavigationContent(sample,e.nodes.mainContent,()=>true);
 tick=120;content=true;sample.markContent();
 tick=160;metrics.finishNavigation(sample,()=>true);
 assert.equal(sample.domReadyMs,20);
 assert.equal(sample.dataReadyMs,60);
 assert.equal(sample.interactionReadyMs,60);
});
