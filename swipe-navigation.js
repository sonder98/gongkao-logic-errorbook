/* Exam · one-finger page navigation.
 * The practice card (including answer options) accepts deliberate horizontal
 * gestures without stealing vertical reading, option taps or Pencil drawing.
 * Touch recognition and visual animation are intentionally separate so the
 * threshold decisions remain independently unit-testable. */
(function(root){
 'use strict';
 const defaultIgnore='a,button,input,textarea,select,summary,[contenteditable],'+
  '.da-table-scroll,.da-chart-scroll,.da-figure,.da-option-image,'+
  '.exam-library-drawer,.scratch-overlay,.scratch-toolbar,.scratch-fab,'+
  '.exam-extra-settings,.kb-table-scroll';
 const MOTION='cubic-bezier(.2,0,0,1)';
 function create({getState,onNavigate,isTouchDevice,viewportWidth,
                  onDrag=()=>{},onCancel=()=>{},isBusy=()=>false,now=()=>Date.now(),
                  ignoreSelector=defaultIgnore,allowChoice=true}){
  let origin=null,aborted=false;
  const enabled=()=>isTouchDevice()&&!!getState()?.enabled&&!isBusy();
  function blocked(target){
   if(!target?.closest)return false;
   // Answer cards are buttons. Exclude *other* controls but let a sideways
   // drag that starts on A/B/C/D navigate (including their letter/text spans).
   const option=allowChoice&&target.closest('#card .choices .choice[data-answer]');
   return !option&&!!target.closest(ignoreSelector);
  }
  function cancel(){
   if(origin?.axis==='horizontal')onCancel();
   origin=null;
   aborted=true;
  }
  function start(event){
   origin=null;
   if(!enabled())return;
   if(event.touches?.length!==1){aborted=true;return}
   aborted=false;
   if(blocked(event.target))return;
   const finger=event.touches[0],width=viewportWidth();
   // Avoid the browser's native navigation gestures along the screen edge.
   if(!finger||finger.clientX<24||finger.clientX>width-24)return;
   origin={id:finger.identifier,x:finger.clientX,y:finger.clientY,time:now(),axis:'pending'};
  }
  function move(event){
   if(event.touches?.length!==1){cancel();return}
   if(!origin||aborted)return;
   const finger=Array.from(event.touches).find(t=>t.identifier===origin.id);
   if(!finger)return;
   const dx=finger.clientX-origin.x,dy=finger.clientY-origin.y;
   if(origin.axis==='pending'){
    if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;
    if(Math.abs(dx)>Math.abs(dy)*1.15)origin.axis='horizontal';
    else if(Math.abs(dy)>Math.abs(dx)*1.08){origin=null;return}
    else if(Math.max(Math.abs(dx),Math.abs(dy))>=28){
     if(Math.abs(dx)>Math.abs(dy))origin.axis='horizontal';
     else{origin=null;return}
    }
   }
   if(origin?.axis==='horizontal'){
    // Do not suppress a normal tap. Only a confirmed horizontal gesture gets
    // preventDefault, which also avoids its synthetic click selecting an option.
    if(event.cancelable)event.preventDefault();
    onDrag(dx);
   }
  }
  function end(event){
   if(!origin||aborted||!enabled()){if(origin?.axis==='horizontal')onCancel();origin=null;return}
   const beginning=origin;origin=null;
   const finger=Array.from(event.changedTouches||[]).find(t=>t.identifier===beginning.id);
   if(!finger||beginning.axis!=='horizontal')return;
   const dx=finger.clientX-beginning.x,dy=finger.clientY-beginning.y;
   const elapsed=Math.max(0,now()-beginning.time),width=viewportWidth();
   // Phones: ~56px rather than 65; landscape iPad: ~77px instead of 120.
   // A deliberate fast flick may finish even sooner, but never a 12px tap.
   const distance=Math.max(56,Math.min(80,width*.075));
   const flick=Math.abs(dx)>=42&&elapsed>=65&&elapsed<=500&&
    Math.abs(dx)/elapsed>=.42;
   if((Math.abs(dx)<distance&&!flick)||
      Math.abs(dx)<Math.abs(dy)*1.25){onCancel();return}
   const state=getState(),direction=dx<0?1:-1,next=state?.at+direction;
   if(!state?.enabled||next<0||next>=state.ids.length){onCancel();return}
   onNavigate(state.ids[next],direction,{fromId:state.ids[state.at],dx});
  }
  return {start,move,end,cancel,blocked};
 }
 function installSurface({viewId,cardId,getState,onNavigate,
                         ignoreSelector=defaultIgnore,allowChoice=true,preventPinch=false}){
  const view=document.getElementById(viewId);
  if(!view)return;
  const mobile=()=>!!(root.matchMedia?.('(pointer: coarse)').matches||
   root.matchMedia?.('(any-pointer: coarse)').matches||
   root.navigator?.maxTouchPoints>0);
  let busy=false,visualId=0;
  const active=()=>mobile()&&getState()?.enabled&&!busy;
  const card=()=>view.querySelector(cardId);
  const reduced=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function clearVisual(el){
   if(!el)return;
   el.style.removeProperty('transition');
   el.style.removeProperty('transform');
   el.style.removeProperty('opacity');
   el.classList.remove('exam-swipe-moving');
  }
  function drag(dx){
   if(busy)return;
   const el=card();if(!el)return;
   visualId++;
   el.classList.add('exam-swipe-moving');
   el.style.transition='none';
   const travel=Math.sign(dx)*Math.min(60,Math.abs(dx)*.4);
   el.style.transform='translate3d('+travel+'px,0,0)';
   el.style.opacity=String(1-Math.min(.12,Math.abs(dx)/900));
  }
  function snapBack(){
   if(busy)return;
   const el=card();if(!el)return;
   const token=++visualId;
   if(reduced()){clearVisual(el);return}
   el.style.transition='transform 160ms '+MOTION+',opacity 160ms '+MOTION;
   el.style.transform='translate3d(0,0,0)';
   el.style.opacity='1';
   root.setTimeout(()=>{if(visualId===token&&!busy)clearVisual(el)},180);
  }
  function navigateAnimated(id,direction,meta){
   if(busy)return;
   const el=card();if(!el){onNavigate(id);return}
   if(reduced()){clearVisual(el);onNavigate(id);return}
   busy=true;
   const token=++visualId;
   el.classList.add('exam-swipe-moving');
   el.style.transition='transform 90ms '+MOTION+',opacity 90ms '+MOTION;
   el.style.transform='translate3d('+(-direction*80)+'px,0,0)';
   el.style.opacity='.1';
   root.setTimeout(()=>{
    const state=getState();
    if(token!==visualId||!state?.enabled||state.ids[state.at]!==meta.fromId){
     clearVisual(el);busy=false;return;
    }
    el.style.transition='none';
    el.style.transform='translate3d('+(direction*36)+'px,0,0)';
    el.style.opacity='.28';
    try{onNavigate(id)}catch(error){clearVisual(el);busy=false;throw error}
    root.requestAnimationFrame(()=>root.requestAnimationFrame(()=>{
     if(token!==visualId)return;
     el.style.transition='transform 175ms '+MOTION+',opacity 175ms '+MOTION;
     el.style.transform='translate3d(0,0,0)';
     el.style.opacity='1';
     root.setTimeout(()=>{if(token===visualId){clearVisual(el);busy=false}},205);
    }));
   },95);
  }
  const tracker=create({getState,onNavigate:navigateAnimated,isTouchDevice:mobile,
   viewportWidth:()=>root.innerWidth,onDrag:drag,onCancel:snapBack,
   isBusy:()=>busy,ignoreSelector,allowChoice});
  // Each handler is bound to its own visible article: switching tabs never
  // reuses a pending touch or accidentally flips between different modules.
  view.addEventListener('touchstart',event=>{
   if(event.touches?.length>1){
    tracker.cancel();
    if(preventPinch&&active()&&event.cancelable)event.preventDefault();
   }else if(card()?.contains(event.target))tracker.start(event);
   else tracker.cancel();
  },{capture:true,passive:false});
  view.addEventListener('touchmove',event=>{
   if(event.touches?.length>1){
    tracker.cancel();
    if(preventPinch&&active()&&event.cancelable)event.preventDefault();
   }else tracker.move(event);
  },{capture:true,passive:false});
  view.addEventListener('touchend',tracker.end,{capture:true,passive:true});
  view.addEventListener('touchcancel',tracker.cancel,{capture:true,passive:true});
  if(preventPinch){
   const pinch=event=>{
    if(!active()||!view.contains(event.target))return;
    tracker.cancel();
    if(event.cancelable)event.preventDefault();
   };
   document.addEventListener('gesturestart',pinch,{capture:true,passive:false});
   document.addEventListener('gesturechange',pinch,{capture:true,passive:false});
  }
 }
 function install({getState,onNavigate}){
  installSurface({viewId:'practiceView',cardId:'#card',getState,onNavigate,
   preventPinch:true});
 }
 function installKnowledge({getState,onNavigate}){
  // Knowledge can contain horizontally scrollable formula tables and links;
  // those subtrees keep native touch handling. Paragraphs and headings swipe.
  const knowledgeIgnore=defaultIgnore+
   ',table,figure,pre,svg,canvas,iframe,.katex-display,'+
   '.kb-formula-table,.kb-lesson-mindmap,.kb-method-comparison';
  installSurface({viewId:'knowledgeView',cardId:'#knowledgeCard',getState,
   onNavigate,ignoreSelector:knowledgeIgnore,allowChoice:false});
 }
 const api={create,install,installKnowledge};
 root.ExamSwipe=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
