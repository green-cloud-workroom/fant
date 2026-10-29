import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
// Test the exact pure server arithmetic; real transaction failures and races
// are covered separately by productionClosingCommand.integration.mjs.
const serverSource=readFileSync('src/domain/closingSnapshot.ts','utf8');
const {closingSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(serverSource)).toString('base64'));

const reserved=['__proto__','constructor','toString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','toLocaleString','__defineGetter__','__defineSetter__','__lookupGetter__','__lookupSetter__'];
const extra=['정상','a.b','a`b','a[0]','a/b','두 단어','é','e\u0301','__x__'];
const allNames=[...reserved,...extra];
async function fixture(){
  const rows={closings:[],meatStocks:[],bagTypes:[],frozenPanLots:[],frozenSeparation:[]};
  const collection=name=>rows[name].map(({id,...data})=>({id,data}));
  return {e:{state:{rows},today:'2026-09-14'},closing:{
    buildSnapshots:()=>closingSnapshot({egg:rows.eggStock?.[0],bags:collection('bagTypes'),meats:collection('meatStocks'),pans:collection('frozenPanLots'),separations:collection('frozenSeparation')}),
    __prototypeNames:()=>[Object.prototype,Object,Object.prototype.toString].map(x=>Object.getOwnPropertyNames(x).sort()),
  }};
}
const normalized=value=>JSON.parse(JSON.stringify(value));

test('all literal names and three stock types survive closing as values without prototype changes',async()=>{
  const {e,closing}=await fixture();
  const prototypeBefore=normalized(closing.__prototypeNames());
  e.state.rows.frozenSeparation=allNames.flatMap((productName,i)=>
    ['notSeparated','separated','noSplit'].map((stockType,j)=>({
      id:'s'+i+'_'+j,productName,stockType,remaining:j+1,closed:j===2
    })));
  const snapshots=await closing.buildSnapshots();
  assert.equal(Object.hasOwn(snapshots,'frozenSep'),false);
  assert.equal(snapshots.frozenSepRows.length,allNames.length*3);
  assert.deepEqual([...new Set(snapshots.frozenSepRows.map(row=>row.productName))].sort(),[...allNames].sort());
  for(const name of allNames){
    assert.deepEqual(normalized(snapshots.frozenSepRows.filter(row=>row.productName===name)),[
      {productName:name,stockType:'notSeparated',remaining:1},
      {productName:name,stockType:'separated',remaining:2},
      {productName:name,stockType:'noSplit',remaining:3},
    ]);
  }
  assert.notEqual('é','e\u0301');
  assert.deepEqual(normalized(closing.__prototypeNames()),prototypeBefore);

});

test('duplicate lots add exactly, nonpositive rows skip, and legacy released closing becomes v2',async()=>{
  const {e,closing}=await fixture();
  e.state.rows.closings=[{id:e.today,status:'released',snapshots:{frozenSep:{normal:{미지정:99}}}}];
  e.state.rows.frozenSeparation=[
    {id:'a',productName:'constructor',stockType:'separated',remaining:1.25},
    {id:'b',productName:'constructor',stockType:'separated',remaining:.75},
    {id:'c',productName:'constructor',stockType:'separated',remaining:0},
    {id:'d',productName:'constructor',stockType:'separated',remaining:-2},
    {id:'e',productName:'constructor',stockType:'noSplit',remaining:3,closed:true},
    {id:'f',productName:'constructor',stockType:'notSeparated'},
  ];
  const snapshots=closing.buildSnapshots();
  assert.equal(Object.hasOwn(snapshots,'frozenSep'),false);
  assert.deepEqual(normalized(snapshots.frozenSepRows),[
    {productName:'constructor',stockType:'separated',remaining:2},
    {productName:'constructor',stockType:'noSplit',remaining:3},
  ]);
});

test('meat stage allowlist and document ID keys preserve valid totals without inherited values',async()=>{
  const {e,closing}=await fixture();
  const before=normalized(closing.__prototypeNames());
  e.state.rows.meatStocks=[
    {id:'m1',stage:'frozen',meatTypeId:'constructor',remaining:2,closed:false},
    {id:'m2',stage:'frozen',meatTypeId:'constructor',remaining:3,closed:false},
    {id:'m3',stage:'processed',meatTypeId:'toString',remaining:4,closed:false},
    {id:'m4',stage:'repacked',meatTypeId:'normal',remaining:5,closed:false},
    {id:'m5',stage:'frozen',meatTypeId:'ignored',remaining:6,closed:true},
    {id:'m6',stage:'frozen',meatTypeId:'_delegate',remaining:7,closed:false},
  ];
  const snapshots=await closing.buildSnapshots();
  assert.deepEqual(normalized(snapshots.meatRows),[
    {stage:'frozen',meatTypeId:'_delegate',remaining:7},
    {stage:'frozen',meatTypeId:'constructor',remaining:5},
    {stage:'processed',meatTypeId:'toString',remaining:4},
    {stage:'repacked',meatTypeId:'normal',remaining:5},
  ]);
  assert.equal(Object.hasOwn(snapshots,'meatByStage'),false);
  assert.deepEqual(normalized(closing.__prototypeNames()),before);
});

test('bag document IDs remain values, including SDK-reserved _delegate',async()=>{
  const {e,closing}=await fixture();
  e.state.rows.bagTypes=[
    {id:'_delegate',currentQty:7},
    {id:'constructor',currentQty:2},
    {id:'toString',currentQty:3},
  ];
  const snapshots=await closing.buildSnapshots();
  assert.equal(Object.hasOwn(snapshots,'bags'),false);
  assert.deepEqual(normalized(snapshots.bagRows),[
    {bagTypeId:'_delegate',currentQty:7},
    {bagTypeId:'constructor',currentQty:2},
    {bagTypeId:'toString',currentQty:3},
  ]);
});

test('frozen-pan factory names cannot become snapshot keys',async()=>{
  const {e,closing}=await fixture();
  e.state.rows.frozenPanLots=[
    {id:'f1',factory:'__proto__',remaining:2},
    {id:'f2',factory:'constructor',remaining:3},
    {id:'f3',remaining:4},
    {id:'f4',remaining:0},
  ];
  const snapshots=await closing.buildSnapshots();
  assert.deepEqual(normalized(snapshots.frozenPan),{'미지정':9});
  assert.equal(Object.hasOwn(snapshots.frozenPan,'__proto__'),false);
});

const invalid=[
  ['missing stockType','frozenSeparation',{productName:'x',remaining:1},'stockType'],
  ['unknown stockType','frozenSeparation',{productName:'x',stockType:'other',remaining:1},'stockType'],
  ['legacy type only','frozenSeparation',{productName:'x',separationType:'separated',remaining:1},'stockType'],
  ['conflicting types','frozenSeparation',{productName:'x',stockType:'separated',separationType:'noSplit',remaining:1},'stockType'],
  ['string remaining','frozenSeparation',{productName:'x',stockType:'separated',remaining:'5'},'remaining'],
  ['NaN remaining','frozenSeparation',{productName:'x',stockType:'separated',remaining:NaN},'remaining'],
  ['infinite remaining','frozenSeparation',{productName:'x',stockType:'separated',remaining:Infinity},'remaining'],
  ['invalid product','frozenSeparation',{productName:42,stockType:'separated',remaining:1},'productName'],
  ['empty product','frozenSeparation',{productName:'',stockType:'separated',remaining:1},'productName'],
  ['numeric zero product','frozenSeparation',{productName:0,stockType:'separated',remaining:1},'productName'],
  ['prototype meat stage','meatStocks',{stage:'__proto__',meatTypeId:'m',remaining:1},'stage'],
  ['constructor meat stage','meatStocks',{stage:'constructor',meatTypeId:'m',remaining:1},'stage'],
  ['unknown meat stage','meatStocks',{stage:'unknown',meatTypeId:'m',remaining:1},'stage'],
  ['missing meat ID','meatStocks',{stage:'frozen',remaining:1},'meatTypeId'],
  ['string frozen-pan remaining','frozenPanLots',{remaining:'5'},'remaining'],
  ['string bag currentQty','bagTypes',{currentQty:'5'},'currentQty'],
];
for(const [label,collection,row,field] of invalid)test('invalid '+label+' blocks closing before any write',async()=>{
  const {e,closing}=await fixture();
  e.state.rows[collection]=[{id:'bad',...row}];
  assert.throws(()=>closing.buildSnapshots());
  assert.equal(e.state.rows.closings.length,0);
});

test('overflowing aggregate blocks closing without a partial document',async()=>{
  const {e,closing}=await fixture();
  e.state.rows.frozenSeparation=[
    {id:'a',productName:'x',stockType:'separated',remaining:Number.MAX_VALUE},
    {id:'b',productName:'x',stockType:'separated',remaining:Number.MAX_VALUE},
  ];
  assert.throws(()=>closing.buildSnapshots(),/overflow/);
});

for(const value of ['5',NaN,Infinity,false,{}])test('invalid egg '+String(value)+' never becomes zero',()=>{
  assert.throws(()=>closingSnapshot({egg:{currentQty:value},bags:[],meats:[],pans:[],separations:[]}),/finite/);
});
