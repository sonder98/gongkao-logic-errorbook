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
 const id=()=>page.evaluate(()=>active);
 const gesture=({dx,dy=0,selector='#card .stem',pinch=false})=>page.evaluate(args=>{
  const element=document.querySelector(args.selector);
  if(!element)throw Error('Touch target missing: '+args.selector);
  const t=(identifier,x,y)=>new Touch({identifier,target:element,clientX:x,clientY:y,
    screenX:x,screenY:y,pageX:x+scrollX,pageY:y+scrollY,radiusX:2,radiusY:2,force:1});
  const first=t(7,180,350),second=t(8,220,350),finish=t(7,180+args.dx,350+args.dy);
  const touch=(type,touches,changed)=>element.dispatchEvent(new TouchEvent(type,{
   bubbles:true,cancelable:true,touches,changedTouches:changed,targetTouches:touches}));
  const prevented=touch('touchstart',args.pinch?[first,second]:[first],
    args.pinch?[first,second]:[first]);
  if(!args.pinch)touch('touchmove',[finish],[finish]);
  touch('touchend',[],[finish]);
  return {prevented};
 },{dx,dy,selector,pinch});
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#card .stem').waitFor({state:'visible',timeout:20000});
  assert.equal(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches),true,
    'Test must emulate a coarse-touch mobile device');
  assert.match(await page.locator('meta[name=viewport]').getAttribute('content'),/maximum-scale=1/);
  assert.equal(await page.locator('#card .scratch-zone').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');
  const first=await id();
  await gesture({dx:-125,dy:8});
  assert.notEqual(await id(),first,'Left swipe must advance to the next visible question');
  const second=await id();
  await gesture({dx:122,dy:5});
  assert.equal(await id(),first,'Right swipe must go back to previous question');
  await gesture({dx:-55,dy:4});
  assert.equal(await id(),first,'Short horizontal drag must not change questions');
  await gesture({dx:-135,dy:170});
  assert.equal(await id(),first,'Diagonal vertical reading must not navigate');
  await gesture({dx:-130,dy:2,selector:'#note'});
  assert.equal(await id(),first,'Swipe inside textarea must not navigate');
  const multitouch=await gesture({dx:-170,pinch:true});
  assert.equal(multitouch.prevented,false,'Two-finger touch is cancelled on an active study page');
  assert.equal(await id(),first,'Two-finger gesture must not change questions');
  const pinchPrevented=await page.locator('#card .stem').evaluate(el=>{
   const e=new Event('gesturestart',{bubbles:true,cancelable:true});
   el.dispatchEvent(e);return e.defaultPrevented;
  });
  assert.equal(pinchPrevented,true,'Practice-view WebKit pinch gesture is requested to be blocked');
  await page.locator('#openScratch').click();
  const openId=await id();
  await gesture({dx:-140,dy:3});
  assert.equal(await id(),openId,'Pencil overlay blocks swipe page navigation');
  await page.locator('#openScratch').click();
  await page.locator('#examMobileLibrary').click();
  await gesture({dx:-130,dy:0});
  assert.equal(await id(),openId,'Full question bank drawer blocks swipe navigation');
  await page.locator('#examDrawerClose').click();
  await gesture({dx:-130,dy:2});
  assert.notEqual(await id(),openId,'Swipe navigation works again after closing drawer');
  await page.locator('#academicKnowledgeMode').click();
  const knowledgeId=await id();
  await gesture({dx:-130,dy:0});
  assert.equal(await id(),knowledgeId,'Knowledge section must not be a swipe-to-question surface');
  await page.locator('#academicPracticeMode').click();
  await page.setViewportSize({width:1024,height:768});
  await page.locator('#card .stem').waitFor();
  const tabletStart=await id();
  await gesture({dx:140,dy:8});
  assert.notEqual(await id(),tabletStart,'iPad-sized viewport supports swipe-to-previous');
  assert.deepEqual(errors,[],'No JavaScript runtime errors in touch handling');
  console.log('Mobile + iPad gesture regression: swipes, vertical reading, pinch, Pencil, drawer, notes OK');
 }finally{await context.close();await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
