/* Exam mobile/pad gestures. One-finger intentional horizontal swipes navigate
   filtered practice questions; two-finger pinch is blocked in practice where
   the browser allows it. Normal vertical reading and Pencil tools remain. */
(function(root){
 'use strict';
 const defaultIgnore='a,button,input,textarea,select,summary,[contenteditable],'+
  '.da-table-scroll,.da-chart-scroll,.da-figure,.exam-library-drawer,'+
  '.scratch-overlay,.scratch-toolbar,.scratch-fab,.exam-extra-settings';
 function create({getState,onNavigate,isTouchDevice,viewportWidth}){
  let origin=null,aborted=false;
  const enabled=()=>isTouchDevice()&&!!getState()?.enabled;
  function blocked(target){return !!target?.closest?.(defaultIgnore)}
  function start(event){
   origin=null;
   if(!enabled())return;
   if(event.touches?.length!==1){aborted=true;return}
   aborted=false;
   if(blocked(event.target))return;
   const finger=event.touches[0],width=viewportWidth();
   if(!finger||finger.clientX<28||finger.clientX>width-28)return;
   origin={id:finger.identifier,x:finger.clientX,y:finger.clientY,time:Date.now()};
  }
  function move(event){
   if(event.touches?.length!==1){origin=null;aborted=true;return}
   if(!origin||aborted)return;
   const finger=Array.from(event.touches||[]).find(t=>t.identifier===origin.id);
   if(!finger)return;
   const dx=finger.clientX-origin.x,dy=finger.clientY-origin.y;
   // Once the gesture has clearly become vertical reading, it stays vertical.
   if(Math.abs(dy)>38&&Math.abs(dy)>Math.abs(dx)*1.05)origin=null;
  }
  function end(event){
   if(!origin||aborted||!enabled()){origin=null;return}
   const beginning=origin;origin=null;
   const finger=Array.from(event.changedTouches||[]).find(t=>t.identifier===beginning.id);
   if(!finger)return;
   const dx=finger.clientX-beginning.x,dy=finger.clientY-beginning.y;
   const min=Math.max(65,Math.min(120,viewportWidth()*.12));
   if(Date.now()-beginning.time>1400||Math.abs(dx)<min||
      Math.abs(dx)<Math.abs(dy)*1.65)return;
   const direction=dx<0?1:-1; // finger left -> next, finger right -> previous
   const state=getState();
   const next=state?.at+direction;
   if(state?.enabled&&next>=0&&next<state.ids.length)onNavigate(state.ids[next]);
  }
  function cancel(){origin=null;aborted=true}
  return {start,move,end,cancel};
 }
 function install({getState,onNavigate}){
  const view=document.getElementById('practiceView');
  if(!view)return;
  const mobile=()=>!!root.matchMedia?.('(pointer: coarse)').matches;
  const active=()=>mobile()&&getState()?.enabled;
  const tracker=create({getState,onNavigate,isTouchDevice:mobile,viewportWidth:()=>root.innerWidth});
  // Do not block single-touch scroll. Two fingers cancel the possible swipe
  // and request that WebKit not zoom the study sheet.
  view.addEventListener('touchstart',event=>{
   if(event.touches?.length>1&&active()){
    tracker.cancel();
    if(event.cancelable)event.preventDefault();
   }else tracker.start(event);
  },{passive:false});
  view.addEventListener('touchmove',event=>{
   if(event.touches?.length>1&&active()){
    tracker.cancel();
    if(event.cancelable)event.preventDefault();
   }else tracker.move(event);
  },{passive:false});
  view.addEventListener('touchend',tracker.end,{passive:true});
  view.addEventListener('touchcancel',tracker.cancel,{passive:true});
  const pinch=event=>{
   if(!active()||!view.contains(event.target))return;
   tracker.cancel();
   if(event.cancelable)event.preventDefault();
  };
  // On Safari, viewport maximum-scale alone may be ignored.
  document.addEventListener('gesturestart',pinch,{capture:true,passive:false});
  document.addEventListener('gesturechange',pinch,{capture:true,passive:false});
 }
 const api={create,install};
 root.ExamSwipe=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
