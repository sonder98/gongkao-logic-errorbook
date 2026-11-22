const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=(process.env.TEST_URL||'http://127.0.0.1:8000/').split('#')[0];
const lesson='data-topic-course-07-fraction-mix';
const section='fraction-mix-flexible-recognition';
const ready=page=>page.waitForFunction(()=>typeof devicePositionReady!=='undefined'&&devicePositionReady,{timeout:30000});
const viewState=page=>page.evaluate(()=>({module:currentModule,view:currentView,question:active,
 topic:selectedTopic,reading:devicePosition.bookmark('data','knowledge'),
 last:devicePosition.last(),scroll:window.scrollY}));
async function open(page,url=root){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await ready(page);
}
async function scrollInto74(page){
 await page.locator('#kb-structured-'+section).waitFor({state:'attached'});
 await page.evaluate(id=>{
  const el=document.getElementById('kb-structured-'+id),header=document.querySelector('header.academic-topbar');
  window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-header.getBoundingClientRect().height-17+118,behavior:'instant'});
 },section);
 await page.waitForFunction(id=>{
  const raw=JSON.parse(localStorage.getItem('exam_device_reading_position_v1')||'null');
  return raw?.modules?.data?.knowledge?.reading?.sectionId===id&&
   raw.modules.data.knowledge.reading.offset>=95;
 },section,{timeout:9000});
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const pcContext=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
 const padContext=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 const pc=await pcContext.newPage(),pad=await padContext.newPage();
 const errors=[];pc.on('pageerror',e=>errors.push('desktop '+e.message));
 pad.on('pageerror',e=>errors.push('ipad '+e.message));
 try{
  await open(pc);
  await pc.evaluate(id=>{activateModule('data');openKnowledge(id,false)},lesson);
  await pc.locator('#knowledgeCard .kb-heading').waitFor({state:'visible'});
  await scrollInto74(pc);
  const saved=await viewState(pc);
  assert.equal(saved.topic,lesson);
  assert.equal(saved.reading.reading.sectionId,section,'7.4 has its own subsection bookmark');
  assert.ok(saved.reading.reading.offset>=95);
  // Reload with the existing route and then reopen the plain home URL:
  // both must restore the concrete lesson and its internal 7.4 position.
  await pc.reload({waitUntil:'domcontentloaded'});
  await ready(pc);
  await pc.waitForFunction(id=>{
   const node=document.getElementById('kb-structured-'+id);
   if(!node)return false;
   return node.getBoundingClientRect().top<50;
  },section);
  assert.equal((await viewState(pc)).topic,lesson,'Refresh returns to the same lesson');
  await open(pc,root);
  await pc.waitForFunction(id=>{
   const el=document.getElementById('kb-structured-'+id);
   return !!el&&el.getBoundingClientRect().top<50;
  },section);
  assert.deepEqual((await viewState(pc)).last,{module:'data',view:'knowledge',id:lesson});
  // Each module retains its own Knowledge and Practice entries.
  const pcQuestion=await pc.evaluate(()=>{
   activateModule('argument');
   switchView('practice');
   const q=ARGUMENT_QUESTIONS[46];
   navigatePracticeQuestion(q.id);
   return q.id;
  });
  assert.equal((await viewState(pc)).question,pcQuestion);
  assert.equal((await viewState(pc)).last.id,pcQuestion);
  await pc.evaluate(()=>{activateModule('data');switchView('knowledge')});
  await pc.waitForFunction(id=>{
   const node=document.getElementById('kb-structured-'+id);
   return currentModule==='data'&&currentView==='knowledge'&&selectedTopic==='data-topic-course-07-fraction-mix'&&
    !!node&&node.getBoundingClientRect().top<50;
  },section);
  assert.equal((await viewState(pc)).reading.reading.sectionId,section,
   'Switching modules or modes does not reset 7.4');
  await open(pc,root);
  assert.equal((await viewState(pc)).last.id,lesson,'Last page updates after returning to knowledge');
  // Completely separate browser storage: tablet has no PC course position.
  await open(pad);
  assert.equal((await viewState(pad)).module,'argument');
  assert.equal((await viewState(pad)).view,'practice');
  assert.notEqual((await viewState(pad)).question,pcQuestion,'iPad begins with its own bookmark');
  await pad.evaluate(id=>navigatePracticeQuestion(id,'swipe'),pcQuestion);
  await pad.waitForFunction(id=>active===id,pcQuestion);
  await open(pad,root);
  assert.equal((await viewState(pad)).question,pcQuestion,
   'iPad home resumes its 47th stored question ID, not a position index');
  await open(pc,root);
  assert.equal((await viewState(pc)).topic,lesson,
   'The desktop still resumes 7.4 after the iPad studies a different question');
  // A shared deep link takes precedence over the iPad's local 47th question.
  await open(pad,root+'#data/knowledge/'+encodeURIComponent(lesson));
  assert.equal((await viewState(pad)).topic,lesson);
  assert.equal((await viewState(pad)).view,'knowledge');
  assert.equal((await viewState(pad)).module,'data');
  // An invalid link should not strand the learner: use the latest valid
  // device bookmark instead of routing to an empty lesson.
  await open(pad,root+'#data/knowledge/no-such-lesson-404');
  assert.equal((await viewState(pad)).topic,lesson);
  assert.ok(locationHashDoesNotContainStale(await pad.evaluate(()=>location.hash)));
  // On returning to Practice, the iPad retains its previous question.
  await pad.evaluate(()=>{activateModule('argument');switchView('practice')});
  assert.equal((await viewState(pad)).question,pcQuestion,
   'Per-module Practice location persists even after visiting Data Analysis');
  // A new install still starts at the default instead of adopting either device.
  const freshContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const fresh=await freshContext.newPage();
  await open(fresh);
  assert.equal((await viewState(fresh)).module,'argument');
  assert.equal((await viewState(fresh)).view,'practice');
  assert.notEqual((await viewState(fresh)).question,pcQuestion);
  await freshContext.close();
  assert.deepEqual(errors,[],'No JavaScript errors during storage and deep-link restoration');
  console.log('Device resume: 7.4 anchor, refresh/reopen, 47th question, per-module memory, device isolation and shared links OK');
 }finally{
  await pcContext.close();await padContext.close();await browser.close();
 }
})();
function locationHashDoesNotContainStale(hash){return !hash.includes('no-such-lesson-404')}
