import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';

test('saved form baseline detects removed ingredient rows and changed preset chips',async()=>{
 const env=await environment({session:true});
 const {markFieldsSaved,hasDirtyFields}=await env.load('src/utils/formDraft.js');
 const field=value=>({id:'ingredient',name:'',type:'text',tagName:'INPUT',value,defaultValue:value});
 let fields=[field('닭'),field('물')],presets=[1,2];
 const root={querySelectorAll:()=>fields};
 markFieldsSaved(root,{extra:()=>presets});
 assert.equal(hasDirtyFields(root),false);
 fields.pop();assert.equal(hasDirtyFields(root),true);
 fields.push(field('물'));assert.equal(hasDirtyFields(root),false);
 presets.pop();assert.equal(hasDirtyFields(root),true);
 markFieldsSaved(root,{extra:()=>presets});assert.equal(hasDirtyFields(root),false);
 fields[0].value='오리';assert.equal(hasDirtyFields(root),true);
});
