const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const target=process.env.TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const topic=()=>page.evaluate(()=>selectedTopic);
 const idle=()=>page.waitForFunction(()=>!document.getElementById('knowledgeCard')
  ?.classList.contains('exam-swipe-moving'),null,{timeout:4000});
 const changed=before=>page.waitForFunction(old=>selectedTopic!==old,before,{timeout:4000});
 const gesture=({selector='#knowledgeCard .kb-summary',dx,dy=0,multi=false})=>page.evaluate(args=>{
  const element=document.querySelector(args.selector);
  if(!element)throw Error('Knowledge swipe target missing: '+args.selector);
  const t=(id,x,y)=>new Touch({identifier:id,target:element,clientX:x,clientY:y,
   screenX:x,screenY:y,pageX:x+scrollX,pageY:y+scrollY,radiusX:2,radiusY:2,force:1});
  const first=t(17,180,340),second=t(18,215,340),last=t(17,180+args.dx,340+args.dy);
  const touch=(type,touches,changed)=>element.dispatchEvent(new TouchEvent(type,{
   bubbles:true,cancelable:true,touches,changedTouches:changed,targetTouches:touches}));
  touch('touchstart',args.multi?[first,second]:[first],args.multi?[first,second]:[first]);
  if(!args.multi)touch('touchmove',[last],[last]);
  touch('touchend',[],[last]);
 },{selector,dx,dy,multi});
 async function setModule(module){
  await page.evaluate(mod=>{
   activateModule(mod);
   switchView('knowledge');
   const first=knowledgeTopics[0];
   if(first)openKnowledge(first.id,false);
  },module);
  await page.locator('#knowledgeCard .kb-heading').waitFor({state:'visible'});
 }
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#card .stem').waitFor({state:'visible',timeout:20000});
  await page.locator('#academicKnowledgeMode').click();
  await page.locator('#knowledgeCard .kb-heading').waitFor({state:'visible'});
  assert.equal(await page.locator('#knowledgeCard .kb-summary').evaluate(el=>getComputedStyle(el).touchAction),
   'pan-y','Knowledge text allows vertical scroll and intentional horizontal paging');
  for(const module of ['argument','formal','data']){
   if(module==='formal')await page.waitForFunction(()=>!!FORMAL_KNOWLEDGE?.sections?.length);
   if(module==='data')await page.waitForFunction(()=>!!DATA_KNOWLEDGE?.sections?.length);
   await setModule(module);
   const sequence=await page.evaluate(()=>knowledgeTopics.map(item=>item.id));
   assert.ok(sequence.length>2,module+' has real lesson order');
   const first=await topic();
   assert.equal(first,sequence[0],module+' starts on first lesson');
   await gesture({dx:90,dy:1});
   await idle();
   assert.equal(await topic(),first,module+' cannot swipe before first lesson');
   await gesture({dx:-93,dy:7});
   const moving=await page.locator('#knowledgeCard').evaluate(el=>({
    active:el.classList.contains('exam-swipe-moving'),transform:el.style.transform}));
   assert.ok(moving.active&&moving.transform.includes('translate3d'),
    module+' shows immediate drag/transition response');
   await changed(first);await idle();
   assert.equal(await topic(),sequence[1],module+' swipes next in footer order');
   const second=await topic();
   await gesture({selector:'#knowledgeCard .kb-heading',dx:92,dy:5});
   await changed(second);await idle();
   assert.equal(await topic(),first,module+' swipes previous from heading');
   await gesture({dx:-115,dy:170});
   await idle();
   assert.equal(await topic(),first,module+' long diagonal remains vertical reading');
   await gesture({dx:-105,dy:2,selector:'#knowledgeCard [data-kb-next]'});
   await idle();
   assert.equal(await topic(),first,module+' navigation button retains touch safety');
   await gesture({dx:-110,dy:0,multi:true});
   await idle();
   assert.equal(await topic(),first,module+' pinch never changes lesson');
   // Footer navigation and the swipe use the same unfiltered topic order.
   await page.evaluate(()=>openKnowledge(knowledgeTopics.at(-1).id,false));
   const last=await topic();
   await gesture({dx:-90,dy:2});
   await idle();
   assert.equal(await topic(),last,module+' cannot swipe after final lesson');
   await page.evaluate(()=>openKnowledge(knowledgeTopics[0].id,false));
   await page.locator('#knowledgeCard .kb-heading').waitFor({state:'visible'});
   // A card may contain links and images: neither should be commandeered.
   if(await page.locator('#knowledgeCard a').count()){
    await gesture({selector:'#knowledgeCard a',dx:-98,dy:1});
    await idle();
    assert.equal(await topic(),sequence[0],module+' excludes content hyperlinks');
   }
   const cross=await page.evaluate(()=>{
    let start=0,offset=0,found=null;
    for(const section of KNOWLEDGE.sections){
     const count=section.topics.length;
     if(start>0&&count){
      found={start:knowledgeTopics[start-1].id,next:knowledgeTopics[start].id};
      break;
     }
     start+=count;
    }
    return found;
   });
   if(cross){
    await page.evaluate(id=>openKnowledge(id,false),cross.start);
    await gesture({dx:-90,dy:3});
    await changed(cross.start);await idle();
    assert.equal(await topic(),cross.next,module+' swipe crosses chapter boundaries');
   }
  }
  // Knowledge's long articles should land at the beginning of the next lesson,
  // rather than retaining the old article's bottom-of-page scroll position.
  await setModule('argument');
  const beforeScroll=await topic();
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await gesture({dx:-96,dy:3});
  await changed(beforeScroll);await idle();
  const position=await page.evaluate(()=>{
   const element=document.getElementById('knowledgeCard');
   const header=document.querySelector('header.academic-topbar');
   const desired=scrollY+element.getBoundingClientRect().top-header.getBoundingClientRect().height-12;
   return {actual:scrollY,desired:Math.max(0,Math.min(
    document.documentElement.scrollHeight-innerHeight,desired))};
  });
  assert.ok(Math.abs(position.actual-position.desired)<28,
   'Swiping from the article bottom returns to the new chapter start '+JSON.stringify(position));
  await page.locator('#academicPracticeMode').click();
  const stayed=await topic();
  await gesture({dx:-94,dy:2});
  assert.equal(await topic(),stayed,'Practice mode never silently navigates knowledge');
  await page.locator('#academicKnowledgeMode').click();
  await page.setViewportSize({width:1024,height:768});
  await setModule('data');
  const tablet=await topic();
  await gesture({dx:-84,dy:4});
  await changed(tablet);await idle();
  assert.notEqual(await topic(),tablet,'1024px iPad recognizes 84px knowledge swipes');
  assert.deepEqual(errors,[],'Knowledge swiping has no browser JS errors');
  console.log('Knowledge swipe: three modules, tap/scroll/links, ends, chapter boundary, article alignment and iPad OK');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
