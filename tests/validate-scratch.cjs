// Headless Pencil interaction regression checks, no browser dependencies.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element {
 constructor(id){
  this.id=id;this.hidden=true;this.disabled=false;this.textContent='';
  this.attrs={};this.handlers=new Map();this.width=0;this.height=0;
  this.clientWidth=680;this.clientHeight=720;
  const flags=new Set();
  this.classList={
   add:v=>flags.add(v),remove:v=>flags.delete(v),contains:v=>flags.has(v),
   toggle:(v,state)=>{if(state)flags.add(v);else flags.delete(v)}
  };
 }
 addEventListener(type,fn){this.handlers.set(type,fn)}
 emit(type,event){const listener=this.handlers.get(type);assert.ok(listener,'Handler '+type);listener(event)}
 setAttribute(k,v){this.attrs[k]=v}
 getAttribute(k){return this.attrs[k]}
 getBoundingClientRect(){return {left:0,top:0,width:680,height:720}}
 setPointerCapture(){}
 getContext(){return {
  setTransform(){},clearRect(){},beginPath(){},arc(){},fill(){},
  moveTo(){},lineTo(){},stroke(){},set lineCap(v){},set lineJoin(v){},
  set strokeStyle(v){},set fillStyle(v){},set lineWidth(v){}
 }}
}
const storage=new Map(),raf=new Map();
let nodes=new Map(),nextRaf=0,confirmAnswer=false;
function fresh(){
 nodes=new Map(['scratchZone','scratchOverlay','scratchCanvas','openScratch',
  'scratchDone','scratchClear','scratchUndo','scratchMode'].map(id=>[id,new Element(id)]));
 return Object.fromEntries(nodes);
}
function pointer(type,x,y,id=9){
 return {pointerType:type,pointerId:id,isPrimary:true,button:0,clientX:x,clientY:y,
   cancelable:true,preventDefault(){}};
}
const context={
 window:{devicePixelRatio:2},
 document:{getElementById:id=>nodes.get(id)||null},
 localStorage:{
  getItem:k=>storage.has(k)?storage.get(k):null,
  setItem:(k,v)=>storage.set(k,String(v)),
  removeItem:k=>storage.delete(k)
 },
 requestAnimationFrame:cb=>{const id=++nextRaf;raf.set(id,cb);return id},
 cancelAnimationFrame:id=>raf.delete(id),
 ResizeObserver:class{observe(){}disconnect(){}},
 confirm:()=>confirmAnswer
};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../scratch-overlay.js'),'utf8'),context);
const scratch=context.window.ExamScratch;
const key='exam_scratch_v1:guest:q1';
assert.equal(scratch.isDrawing(),false,'Before mounting there is no active Pencil stroke');
let elements=fresh();
scratch.mount('q1','guest');
assert.equal(scratch.isDrawing(),false,'Idle canvas is not drawing');
assert.equal(scratch.isOpen(),false);
elements.openScratch.onclick();
assert.equal(scratch.isOpen(),true);
assert.equal(elements.scratchOverlay.hidden,false);
assert.equal(elements.openScratch.getAttribute('aria-expanded'),'true');

const draw=(type,id=9)=>{
 elements.scratchCanvas.emit('pointerdown',pointer(type,100,180,id));
 elements.scratchCanvas.emit('pointermove',pointer(type,160,200,id));
 elements.scratchCanvas.emit('pointerup',pointer(type,160,200,id));
};
draw('touch');assert.equal(storage.has(key),false,'Finger does not paint');
draw('pen');assert.equal(JSON.parse(storage.get(key)).length,1);
assert.equal(JSON.parse(storage.get(key))[0].points.length,2);
draw('mouse',10);assert.equal(JSON.parse(storage.get(key)).length,2);
elements.scratchUndo.onclick();assert.equal(JSON.parse(storage.get(key)).length,1);

elements.scratchMode.onclick();assert.equal(elements.scratchOverlay.classList.contains('is-scrolling'),true);
draw('pen',11);assert.equal(JSON.parse(storage.get(key)).length,1,'Scrolling must not draw');
elements.scratchMode.onclick();assert.equal(elements.scratchOverlay.classList.contains('is-scrolling'),false);
elements.scratchClear.onclick();assert.equal(JSON.parse(storage.get(key)).length,1,'Cancel clear');
confirmAnswer=true;elements.scratchClear.onclick();assert.equal(storage.has(key),false);
draw('pen',12);assert.equal(JSON.parse(storage.get(key)).length,1);
elements.scratchDone.onclick();assert.equal(scratch.isOpen(),false);
assert.equal(elements.scratchOverlay.hidden,true);
elements=fresh();scratch.mount('q1','guest');
assert.equal(scratch.isOpen(),false,'Closed mode persists across mount');
elements.openScratch.onclick();assert.equal(elements.scratchUndo.disabled,false,'Restores sketch on question revisit');

elements=fresh();scratch.mount('q2','guest');assert.equal(scratch.isOpen(),false);
elements.openScratch.onclick();assert.equal(elements.scratchUndo.disabled,true,'Different question isolated');
elements=fresh();scratch.mount('q1','other-account');
elements.openScratch.onclick();assert.equal(elements.scratchUndo.disabled,true,'Different account isolated');
scratch.clearQuestions(['q1'],'guest');assert.equal(storage.has(key),false);
console.log('iPad Pencil scratch layer: pen/mouse draw, palm ignore, scroll, undo, confirm clear, local isolation OK');
