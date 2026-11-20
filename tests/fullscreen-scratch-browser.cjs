const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const target=process.env.TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const hit=async(x,y)=>page.evaluate(({x,y})=>{
   const el=document.elementFromPoint(x,y);
   return {id:el?.id,tag:el?.tagName,overlay:!!el?.closest('#scratchOverlay')};
 },{x,y});
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#examRelatedList .exam-related-entry').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('#scratchOverlay').evaluate(el=>el.parentElement===document.body),true,
   'One persistent overlay must be directly under body, outside card and side panels');
  assert.equal(await page.locator('#scratchOverlay').isVisible(),false);
  // All three subjects use the exact same single full-screen shield.
  for(const tab of ['#tabPractice','#tabFormalPractice','#tabDataPractice']){
   await page.locator(tab).click();
   await page.locator('#openScratch').click();
   assert.equal(await page.locator('#scratchOverlay').isVisible(),true,'Drawing shield must open for '+tab);
   const geometry=await page.locator('#scratchCanvas').evaluate(el=>{
     const r=el.getBoundingClientRect();
     return {x:r.x,y:r.y,width:r.width,height:r.height,
       vw:innerWidth,vh:innerHeight,position:getComputedStyle(el.parentElement).position};
   });
   assert.ok(Math.abs(geometry.x)<1&&Math.abs(geometry.y)<1
     &&Math.abs(geometry.width-geometry.vw)<2&&Math.abs(geometry.height-geometry.vh)<2,
     'Canvas must span the entire viewport in '+tab+': '+JSON.stringify(geometry));
   assert.equal(geometry.position,'fixed');
   // Sticky topbar, sidebar catalog and unrelated practice widgets are shielded.
   assert.equal((await hit(35,24)).id,'scratchCanvas','Top app header is protected');
   assert.equal((await hit(125,385)).id,'scratchCanvas','Left directory is protected');
   assert.equal((await hit(530,420)).id,'scratchCanvas','Practice content is protected');
   const before=await page.locator('#card .choice.chosen').count();
   const choice=await page.locator('#card .choice').first().boundingBox();
   if(choice&&choice.y>0&&choice.y<850){
    await page.mouse.click(choice.x+Math.min(40,choice.width/2),choice.y+Math.min(20,choice.height/2));
    assert.equal(await page.locator('#card .choice.chosen').count(),before,
      'A click through the overlay cannot accidentally select an answer');
   }
   await page.locator('#scratchDone').click();
   assert.equal(await page.locator('#scratchOverlay').isVisible(),false);
  }
  await page.locator('#tabDataPractice').click();
  await page.locator('#card .da-material').first().scrollIntoViewIfNeeded();
  await page.locator('#openScratch').click();
  const material=await page.locator('#card .da-material').first().boundingBox();
  const mx=Math.min(material.x+30,900);
  const my=Math.max(155,Math.min(700,material.y+150));
  assert.equal((await hit(mx,my)).id,'scratchCanvas',
    'Data Analysis shared material is inside full-screen drawing protection');
  await page.mouse.move(mx,my);
  await page.mouse.down();
  await page.mouse.move(mx+24,my+15,{steps:4});
  await page.mouse.up();
  const storage=await page.evaluate(()=>Object.keys(localStorage)
    .filter(k=>k.startsWith('exam_scratch_v1:'))
    .map(k=>JSON.parse(localStorage.getItem(k)||'[]'))
    .flat());
  assert.ok(storage.length>0,'Drawing on source material must persist strokes');
  assert.equal(storage.at(-1).origin?.length,4,'New strokes keep page-coordinate anchor');
  const scrollStart=await page.evaluate(()=>scrollY);
  await page.locator('#scratchMode').click();
  assert.equal(await page.locator('#scratchOverlay').evaluate(el=>el.classList.contains('is-scrolling')),true);
  const blocked=await page.locator('#scratchOverlay').evaluate(el=>{
   const event=new MouseEvent('click',{bubbles:true,cancelable:true});
   el.dispatchEvent(event);
   return document.elementFromPoint(100,350)?.id;
  });
  assert.equal(blocked,'scratchOverlay','Scroll mode still shields accidental underlying clicks');
  await page.mouse.move(500,570);
  await page.mouse.wheel(0,380);
  await page.waitForTimeout(150);
  assert.ok(await page.evaluate(()=>scrollY)>=scrollStart,'Scroll mode must allow normal vertical reading');
  await page.locator('#scratchMode').click();
  await page.locator('#openScratch').click();
  assert.equal(await page.locator('#scratchOverlay').isVisible(),false);
  const scrolled=await page.evaluate(()=>scrollY);
  await page.locator('#openScratch').click();
  assert.equal(await page.evaluate(()=>scrollY),scrolled,'Reopening scratch never jumps to top');
  await page.locator('#academicKnowledgeMode').click({force:true}).catch(()=>{});
  // The study view switch should close the standalone overlay even when changed programmatically.
  await page.evaluate(()=>switchView('knowledge'));
  assert.equal(await page.locator('#scratchOverlay').isVisible(),false,
    'Entering knowledge must always remove full-screen input blocking');
  assert.deepEqual(errors,[],'No JavaScript errors in fullscreen drawing mode');
  console.log('Full-screen Pencil overlay browser tests passed across logic, data material, sidebar and scroll');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
