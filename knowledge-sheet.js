/* Phone-only knowledge directory. Reuses the live sidebar controls. */
(function(root){
 'use strict';
 const $=id=>document.getElementById(id);
 const phone=()=>root.matchMedia('(max-width:767px)').matches;
 let opened=false,initialized=false,scrollY=0,previousStyle=null,start=null,closingTimer;
 function init(){
  if(initialized)return;
  initialized=true;
  $('knowledgeDirectoryFab').onclick=open;
  $('knowledgeDirectoryClose').onclick=close;
  $('knowledgeDirectoryBackdrop').onclick=close;
  const sheet=$('knowledgeDirectorySheet'),handle=$('knowledgeSheetHandle');
  handle.addEventListener('pointerdown',e=>{
   if(e.target.closest('button'))return;
   start={id:e.pointerId,x:e.clientX,y:e.clientY};
   handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
   if(!start||start.id!==e.pointerId)return;
   const dy=Math.max(0,e.clientY-start.y);
   sheet.style.transition='none';
   sheet.style.transform='translateY('+dy+'px)';
  });
  const finish=e=>{
   if(!start||start.id!==e.pointerId)return;
   const dy=e.clientY-start.y;
   start=null;
   sheet.style.removeProperty('transition');
   sheet.style.removeProperty('transform');
   if(e.type!=='pointercancel'&&dy>65)close();
  };
  handle.addEventListener('pointerup',finish);
  handle.addEventListener('pointercancel',finish);
  root.addEventListener('resize',()=>{if(opened&&!phone())close()});
  document.addEventListener('keydown',e=>{
   if(!opened)return;
   if(e.key==='Escape'){e.preventDefault();close();return}
   if(e.key!=='Tab')return;
   const controls=Array.from(sheet.querySelectorAll('button:not(:disabled),input:not(:disabled)')).filter(el=>el.getClientRects().length);
   const first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  });
 }
 function open(){
  if(opened||!phone()||$('knowledgeView').hidden)return;
  flushDeviceReading();
  clearTimeout(closingTimer);
  opened=true;
  const sheet=$('knowledgeDirectorySheet'),backdrop=$('knowledgeDirectoryBackdrop');
  const sidebar=$('knowledgeSidebar');
  scrollY=root.scrollY;
  previousStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
  document.body.style.position='fixed';document.body.style.top=-scrollY+'px';document.body.style.width='100%';document.body.style.overflow='hidden';
  $('knowledgeSheetContent').append(sidebar);
  $('knowledgeView').inert=true;
  document.querySelector('.academic-topbar').inert=true;
  document.querySelector('.site-tabs').inert=true;
  $('knowledgeDirectoryFab').setAttribute('aria-expanded','true');
  sheet.hidden=false;backdrop.hidden=false;
  sheet.getBoundingClientRect();
  sheet.classList.add('is-open');backdrop.classList.add('is-open');
  $('knowledgeDirectoryClose').focus({preventScroll:true});
  const nav=$('knowledgeNav'),current=nav.querySelector('.current');
  if(current){
   const a=nav.getBoundingClientRect(),b=current.getBoundingClientRect();
   nav.scrollTop+=b.top-a.top-(a.height-b.height)/2;
  }
 }
 function close(){
  if(!opened)return;
  opened=false;start=null;
  const sheet=$('knowledgeDirectorySheet'),backdrop=$('knowledgeDirectoryBackdrop');
  sheet.style.removeProperty('transform');sheet.style.removeProperty('transition');
  sheet.classList.remove('is-open');backdrop.classList.remove('is-open');
  $('knowledgeView').prepend($('knowledgeSidebar'));
  $('knowledgeView').inert=false;
  document.querySelector('.academic-topbar').inert=false;
  document.querySelector('.site-tabs').inert=false;
  Object.assign(document.body.style,previousStyle);
  root.scrollTo({top:scrollY,behavior:'instant'});
  $('knowledgeDirectoryFab').setAttribute('aria-expanded','false');
  $('knowledgeDirectoryFab').focus({preventScroll:true});
  closingTimer=setTimeout(()=>{if(!opened){sheet.hidden=true;backdrop.hidden=true}},220);
 }
 function preserveArticle(fn){fn()}
 root.ExamKnowledgeSheet={init,open,close,isOpen:()=>opened,preserveArticle};
})(window);
