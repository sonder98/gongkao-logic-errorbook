/* Single-scroll Exam practice layout, as approved 2026-11-20.
   UI only: questions, answers, sync, notes and Pencil data are untouched. */
(function(root){
 'use strict';
 let ready=false,drawerOpen=false,lastFocused=null;
 const $=id=>document.getElementById(id);
 function node(tag,className,text){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
 }
 function init(){
  if(ready)return;
  const view=$('practiceView'),aside=view?.querySelector('aside'),main=view?.querySelector('main');
  if(!aside||!main)return;
  // Keep existing search, filters and question-list nodes: all original handlers
  // and user-selected filters continue working without data migration.
  const nav=$('navCount')?.closest('.nav-heading');
  const searchLabel=document.querySelector('label[for="questionSearch"]');
  const search=$('questionSearch'),filters=$('filters'),list=$('questionList');
  const drawerBackdrop=node('div','exam-drawer-backdrop');
  drawerBackdrop.id='examDrawerBackdrop';
  drawerBackdrop.hidden=true;
  const drawer=node('section','exam-library-drawer');
  drawer.id='examLibraryDrawer';
  drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-modal','true');
  drawer.setAttribute('aria-label','完整题库');
  drawer.hidden=true;
  const head=node('div','exam-drawer-head');
  const top=node('div','exam-drawer-top');
  const intro=node('div');
  intro.append(node('div','exam-overline','STUDY LIBRARY / 完整题库'),node('h2','exam-drawer-title','完整题库'));
  const closeBtn=node('button','exam-drawer-close','✕');
  closeBtn.id='examDrawerClose';
  closeBtn.type='button';closeBtn.setAttribute('aria-label','关闭题库');
  top.append(intro,closeBtn);
  head.append(top,node('p','exam-drawer-desc','搜索、筛选并选择任意题目；打开题目后自动返回阅读页面。'));
  const content=node('div','exam-drawer-content');
  const searchRegion=node('div','exam-library-search');
  if(searchLabel)searchRegion.append(searchLabel);
  searchRegion.append(search,filters,nav);
  const entries=node('div','exam-drawer-entries');
  entries.append(list);
  content.append(searchRegion,entries);
  drawer.append(head,content);
  document.body.append(drawerBackdrop,drawer);
  const introBox=node('div','exam-page-intro');
  introBox.id='examPageIntro';
  const brow=node('div','exam-overline','QUESTION PRACTICE / 专题练习');
  const title=node('h2','exam-page-title');
  title.id='examPageTitle';
  const subt=node('p','exam-page-caption','一根主滚动条 · 资料与题目同页阅读');
  introBox.append(brow,title,subt);
  const mobileButton=node('button','exam-mobile-library','☷ 浏览完整题库');
  mobileButton.type='button';mobileButton.id='examMobileLibrary';
  const moduleAside=node('div','exam-practice-side');
  moduleAside.id='examPracticeSide';
  const heading=node('div','exam-side-heading');
  heading.append(node('span','','题库导航'));
  const selector=node('button','exam-side-selector');
  selector.type='button';selector.id='examSideCategory';
  heading.append(selector);
  const relatedHead=node('div','exam-related-heading');
  relatedHead.id='examRelatedHeading';
  const relatedList=node('div','exam-related-list');
  relatedList.id='examRelatedList';
  const openBtn=node('button','exam-open-library','☷ 浏览完整题库 ↗');
  openBtn.type='button';openBtn.id='examOpenLibrary';
  const hint=node('p','exam-side-hint','目录不再独立滚动。全部题目、搜索及分类筛选均在完整题库中。');
  moduleAside.append(heading,relatedHead,relatedList,openBtn,hint);
  aside.append(moduleAside);
  main.prepend(mobileButton,introBox);
  // Other controls remain available without filling the left reading sidebar.
  const settings=node('details','exam-extra-settings');
  settings.id='examExtraSettings';
  const summary=node('summary','','复习设置、备份与云端账号');
  const box=node('div','exam-extra-settings-content');
  const protectedIds=new Set(['examPracticeSide']);
  for(const element of Array.from(aside.children)){
   if(element.classList.contains('site-tabs')||protectedIds.has(element.id))continue;
   box.append(element);
  }
  // On mobile, the legacy responsive layout may already have moved the auth
  // panel outside the sidebar: include it in the same expandable settings.
  const auth=$('authPanel');
  if(auth&&auth.parentElement!==box)box.append(auth);
  // Practice sidebar contains only the course switcher and small related list.
  settings.append(summary,box);
  main.append(settings);
  drawerBackdrop.onclick=closeLibrary;
  closeBtn.onclick=closeLibrary;
  [openBtn,selector,mobileButton].forEach(btn=>btn.onclick=openLibrary);
  list.addEventListener('click',event=>{
   if(event.target.closest('[data-id]'))closeLibrary();
  });
  document.addEventListener('keydown',event=>{
   if(!drawerOpen)return;
   if(event.key==='Escape'){event.preventDefault();closeLibrary();return}
   if(event.key==='Tab'){
    const possible=Array.from(drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'))
     .filter(el=>el.getClientRects().length);
    if(!possible.length)return;
    const first=possible[0],last=possible[possible.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  });
  ready=true;
 }
 function openLibrary(){
  if(!ready)init();
  if(!ready||drawerOpen)return;
  drawerOpen=true;
  lastFocused=document.activeElement;
  $('examLibraryDrawer').hidden=false;
  $('examDrawerBackdrop').hidden=false;
  document.body.classList.add('exam-drawer-open');
  $('practiceView').inert=true;
  $('knowledgeView').inert=true;
  $('examDrawerClose').focus();
  const current=$('questionList')?.querySelector('.nav-item.active');
  if(current)requestAnimationFrame(()=>current.scrollIntoView({block:'nearest'}));
 }
 function closeLibrary(){
  if(!drawerOpen)return;
  drawerOpen=false;
  $('examLibraryDrawer').hidden=true;
  $('examDrawerBackdrop').hidden=true;
  document.body.classList.remove('exam-drawer-open');
  $('practiceView').inert=false;
  $('knowledgeView').inert=false;
  if(lastFocused?.isConnected)lastFocused.focus({preventScroll:true});
 }
 function onRender(question,filtered,all,module,answerState){
  if(!ready)init();
  if(!ready)return;
  const names={argument:'论证逻辑',formal:'形式逻辑',data:'资料分析'};
  const name=names[module]||'专题练习';
  $('examPageTitle').textContent=name+' / 专题练习';
  if(!question){
   $('examRelatedList').textContent='当前筛选暂无题目。';
   $('examSideCategory').textContent='全部分类';
   $('examRelatedHeading').textContent='';
   return;
  }
  const set=all.filter(q=>module==='data'?q.materialId===question.materialId:q.category===question.category);
  const related=set.length>=2?set:all.filter(q=>q.category===question.category).slice(0,4);
  const selected=related.length?related:all.slice(Math.max(0,all.indexOf(question)-1),all.indexOf(question)+2);
  $('examSideCategory').textContent=question.category+' · '+all.filter(q=>q.category===question.category).length+'题  ⌄';
  $('examRelatedHeading').textContent=module==='data'?'当前共用资料 · '+selected.length+' 道题':'同类知识练习 · '+selected.length+' 道题';
  const list=$('examRelatedList');
  list.textContent='';
  for(const q of selected.slice(0,5)){
   const button=node('button','exam-related-entry'+(q.id===question.id?' active':''));
   button.type='button';button.dataset.questionId=q.id;
   const num=node('span','exam-related-number',String(all.indexOf(q)+1).padStart(2,'0'));
   const label=node('span','exam-related-title',q.title);
   button.append(num,label);
   button.setAttribute('aria-current',q.id===question.id?'true':'false');
   button.onclick=()=>{
    if(q.id===question.id)return;
    closeLibrary();
    if(typeof root.navigatePracticeQuestion==='function')root.navigatePracticeQuestion(q.id);
    else{root.active=q.id;root.render();root.updateViewHash();}
   };
   list.append(button);
  }
  const at=all.indexOf(question)+1;
  $('examPageIntro').dataset.module=module;
  const cap=$('examPageIntro').querySelector('.exam-page-caption');
  cap.textContent=at+' / '+all.length+' · '+(module==='data'?'按共用材料连续阅读':'按知识类别连续练习')+' · 浏览器主滚动';
 }
 function jumpToMaterial(){
  const target=$('card')?.querySelector('.da-material');
  if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
 }
 root.ExamLayout={init,onRender,openLibrary,closeLibrary,isDrawerOpen:()=>drawerOpen,jumpToMaterial,isInitialized:()=>ready};
})(window);