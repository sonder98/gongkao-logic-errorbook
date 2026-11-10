/* Transparent Apple Pencil / mouse annotation layer. No question JSON or cloud changes. */
(function (global) {
 'use strict';
 const PREFIX='exam_scratch_v1:';
 const MAX_STROKES=250;
 const MAX_POINTS=1000;
 let mounted=null,openKey=null;

 function storageKey(key){return PREFIX+key}
 function load(key){
  try {
   const value=JSON.parse(localStorage.getItem(storageKey(key))||'[]');
   if(!Array.isArray(value))return [];
   return value.filter(s=>s&&Array.isArray(s.points))
    .slice(-MAX_STROKES).map(s=>({points:s.points.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)).slice(0,MAX_POINTS)}));
  } catch (_) {return []}
 }
 function save(m){
  try{
   if(!m.strokes.length)localStorage.removeItem(storageKey(m.key));
   else localStorage.setItem(storageKey(m.key),JSON.stringify(m.strokes));
  }catch(_){ /* Keep working if local storage is unavailable or full. */ }
 }
 function draw(m){
  if(!m.open)return;
  const canvas=m.canvas,ctx=canvas.getContext('2d');
  if(!ctx)return;
  const width=canvas.clientWidth,height=canvas.clientHeight;
  const dpr=Math.min(global.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle='rgba(207,72,59,.83)';
  ctx.fillStyle='rgba(207,72,59,.83)';
  ctx.lineWidth=2.8;
  for(const stroke of m.strokes){
   const points=stroke.points;
   if(!points.length)continue;
   if(points.length===1){
    ctx.beginPath();ctx.arc(points[0][0]*width,points[0][1]*height,1.5,0,Math.PI*2);ctx.fill();
    continue;
   }
   ctx.beginPath();ctx.moveTo(points[0][0]*width,points[0][1]*height);
   for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0]*width,points[i][1]*height);
   ctx.stroke();
  }
 }
 function resize(m){
  if(!m.open)return;
  if(m.raf)cancelAnimationFrame(m.raf);
  m.raf=requestAnimationFrame(()=>{m.raf=0;if(mounted===m)draw(m)});
 }
 function finish(m){
  if(m.pointerId===null)return;
  m.pointerId=null;
  save(m);
  m.undo.disabled=!m.strokes.length;
 }
 function point(m,e){
  const rect=m.canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const clamp=v=>Math.max(0,Math.min(1,v));
  return [clamp((e.clientX-rect.left)/rect.width),clamp((e.clientY-rect.top)/rect.height)];
 }
 function start(m,e){
  if(mounted!==m||!m.open||m.scrolling)return;
  // Apple Pencil takes priority; fingers and palms never paint.
  if(e.pointerType==='touch'||e.isPrimary===false)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(m.pointerId!==null)return;
  const pos=point(m,e);if(!pos)return;
  m.pointerId=e.pointerId;
  if(m.strokes.length>=MAX_STROKES)m.strokes.shift();
  m.strokes.push({points:[pos]});
  try{m.canvas.setPointerCapture(e.pointerId)}catch(_){}
  if(e.cancelable)e.preventDefault();
  resize(m);
 }
 function move(m,e){
  if(e.pointerId!==m.pointerId||m.pointerId===null)return;
  const stroke=m.strokes[m.strokes.length-1];
  const events=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[e];
  for(const sample of events.length?events:[e]){
   const pos=point(m,sample),last=stroke.points[stroke.points.length-1];
   if(pos&&stroke.points.length<MAX_POINTS&&Math.hypot(pos[0]-last[0],pos[1]-last[1])>.0002)stroke.points.push(pos);
  }
  if(e.cancelable)e.preventDefault();
  resize(m);
 }
 function close(m){
  finish(m);
  m.open=false;openKey=null;
  m.overlay.hidden=true;
  m.zone.classList.remove('scratch-active');
  if(m.observer){m.observer.disconnect();m.observer=null}
  if(m.raf){cancelAnimationFrame(m.raf);m.raf=0}
  m.launch.setAttribute('aria-expanded','false');
 }
 function open(m){
  if(mounted!==m)return;
  m.open=true;openKey=m.key;m.scrolling=false;
  m.zone.classList.add('scratch-active');
  m.overlay.hidden=false;
  m.overlay.classList.remove('is-scrolling');
  m.mode.textContent='滚动页面';
  m.launch.setAttribute('aria-expanded','true');
  m.undo.disabled=!m.strokes.length;
  resize(m);
  if(typeof ResizeObserver!=='undefined'){
   m.observer=new ResizeObserver(()=>resize(m));
   m.observer.observe(m.zone);
  }
 }
 function dispose(){
  if(!mounted)return;
  finish(mounted);
  if(mounted.observer)mounted.observer.disconnect();
  if(mounted.raf)cancelAnimationFrame(mounted.raf);
  mounted=null;
 }
 function mount(questionId,account){
  dispose();
  const zone=document.getElementById('scratchZone');
  if(!zone)return;
  const key=String(account||'guest')+':'+String(questionId);
  if(openKey!==key)openKey=null;
  const m={
   key,zone,overlay:document.getElementById('scratchOverlay'),
   canvas:document.getElementById('scratchCanvas'),
   launch:document.getElementById('openScratch'),
   close:document.getElementById('scratchDone'),
   clear:document.getElementById('scratchClear'),
   undo:document.getElementById('scratchUndo'),
   mode:document.getElementById('scratchMode'),
   strokes:load(key),open:false,scrolling:false,pointerId:null,observer:null,raf:0
  };
  mounted=m;
  m.launch.onclick=()=>open(m);
  m.close.onclick=()=>close(m);
  m.undo.onclick=()=>{
   finish(m);m.strokes.pop();save(m);m.undo.disabled=!m.strokes.length;resize(m);
  };
  m.clear.onclick=()=>{
   finish(m);
   if(!m.strokes.length)return;
   if(!confirm('清空当前题目的所有手写草稿吗？'))return;
   m.strokes=[];save(m);m.undo.disabled=true;resize(m);
  };
  m.mode.onclick=()=>{
   finish(m);
   m.scrolling=!m.scrolling;
   m.overlay.classList.toggle('is-scrolling',m.scrolling);
   m.mode.textContent=m.scrolling?'继续书写':'滚动页面';
  };
  m.canvas.addEventListener('pointerdown',e=>start(m,e));
  m.canvas.addEventListener('pointermove',e=>move(m,e));
  m.canvas.addEventListener('pointerup',e=>{if(e.pointerId===m.pointerId){finish(m);resize(m)}});
  m.canvas.addEventListener('pointercancel',e=>{if(e.pointerId===m.pointerId){finish(m);resize(m)}});
  m.canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===m.pointerId){finish(m);resize(m)}});
  m.canvas.addEventListener('contextmenu',e=>e.preventDefault());
  if(openKey===key)open(m);
 }
 function clearQuestions(ids,account){
  const scope=String(account||'guest');
  for(const id of ids){
   const key=scope+':'+id;
   try{localStorage.removeItem(storageKey(key))}catch(_){}
   if(mounted?.key===key){mounted.strokes=[];mounted.undo.disabled=true;resize(mounted)}
  }
 }
 global.ExamScratch={mount,clearQuestions,isDrawing:()=>mounted?.pointerId!==null,isOpen:()=>!!mounted?.open};
})(window);
