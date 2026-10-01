import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';

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
