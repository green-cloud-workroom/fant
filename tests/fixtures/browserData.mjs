import { fixture } from './firestore.mjs';
const {rows}=fixture.state;
rows.productions.forEach(row=>{row.status='active';});
// Synthetic, deliberately non-empty fixtures. Never loaded by the real build.
rows.meatTypes=Array.from({length:30},(_,i)=>({id:'m'+i,name:'검증 원료 '+i,category:i%5===0?'produce':'meat',sortOrder:i,active:true,minimumQtyG:0}));
rows.meatStocks=Array.from({length:300},(_,i)=>({id:'lot'+i,meatTypeId:'m'+i%30,meatNameSnapshot:'검증 원료 '+i%30,stage:'frozen',incomingDate:'2026-09-10',remaining:10000,initialQtyG:10000,closed:false}));
rows.meatLogs=Array.from({length:240},(_,i)=>({id:'ml'+String(i).padStart(3,'0'),stage:'frozen',meatTypeId:'m'+i%30,meatNameSnapshot:'검증 원료 '+i%30,type:'frozenIncoming',date:'2026-09-14',delta:10000,before:0,after:10000,staff:'검증',timestamp:1789340400000-i*60000}));
rows.bagTypes=Array.from({length:30},(_,i)=>({id:'b'+i,name:'검증 봉투 '+i,sortOrder:i,currentQty:1000,minimumQty:0,piecesPerBox:100,category:'raw'}));
rows.frozenProducts=Array.from({length:20},(_,i)=>({id:'fp'+i,name:'검증 동결제품 '+i,sortOrder:i,category:'cat-product',target:'cat',kind:'product',active:true}));
rows.equipments=[{id:'eq1',name:'검증 설비',sortOrder:0,status:'active'}];
rows.equipmentParts=[{id:'part1',equipmentId:'eq1',name:'검증 부품',sortOrder:0,currentQty:10,minimumQty:0,status:'active'}];
rows.eggLogs=Array.from({length:100},(_,i)=>({id:'el'+i,date:'2026-09-14',type:'in',qty:1,timestamp:{seconds:1789340400+i}}));
rows.freezeOrders=[];rows.breadPanLots=[];rows.breadPanLogs=[];rows.frozenPanLots=[];rows.frozenPanLogs=[];
rows.frozenSeparation=[];rows.frozenSeparationLogs=[];
