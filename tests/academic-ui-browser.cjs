const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const target=process.env.TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.nav-item').first().waitFor({state:'visible',timeout:20000});
  assert.equal(await page.locator('header.academic-topbar').isVisible(),true);
  assert.equal(await page.locator('#academicPracticeMode').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#practiceView > aside > .site-tabs').count(),1);
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(246, 245, 241)');
  await page.locator('#academicKnowledgeMode').click();
  await page.locator('#knowledgeCard h2').waitFor({state:'visible'});
  assert.equal(await page.locator('#academicKnowledgeMode').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#knowledgeView > aside > .site-tabs').count(),1);
  assert.equal(await page.locator('#knowledgeCard .academic-eyebrow').count(),1);

  await page.locator('#tabFormalKnowledge').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/翻译推理|条件翻译/);
  await page.locator('#tabDataKnowledge').click();
  const scalingTopic=page.locator('[data-knowledge-topic="data-topic-course-03-scaling"]');
  if(await scalingTopic.count()===0)await page.locator('[data-knowledge-section="data-speed"]').click();
  await scalingTopic.click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/放缩运算/);
  assert.equal(await page.locator('#knowledgeCard .kb-structured-jump button').count(),3);
  assert.equal(await page.locator('#knowledgeCard .kb-structured-group').count(),3);
  await page.setViewportSize({width:1500,height:950});
  assert.equal(await page.locator('#academicReadingRail').isVisible(),true);
  assert.ok(await page.locator('#academicReadingRail .academic-rail-link').count()>=3);
  const head=page.locator('#knowledgeCard .kb-structured-head').first();
  assert.equal(await head.evaluate(el=>getComputedStyle(el).position),'sticky');
  await head.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollBy(0,260));
  const topInfo=await head.evaluate(el=>({
   top:el.getBoundingClientRect().top,header:document.querySelector('header.academic-topbar').getBoundingClientRect().height
  }));
  assert.ok(topInfo.top>=topInfo.header-3,'Sticky subsection heading should stay below masthead: '+JSON.stringify(topInfo));

  await page.locator('#academicPracticeMode').click();
  await page.locator('.choice').first().waitFor({state:'visible'});
  assert.equal(await page.locator('#academicPracticeMode').getAttribute('aria-pressed'),'true');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),1,'Explanation still opens');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),0,'Explanation still closes');
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.querySelector('.site-tabs')?.parentElement===document.body);
  assert.equal(await page.locator('#practiceView > #authPanel').count(),1);
  await page.locator('#next').click();
  await page.waitForFunction(()=>{
   const top=document.getElementById('card').getBoundingClientRect().top;
   const header=document.querySelector('header.academic-topbar').getBoundingClientRect().height;
   return top>=header+2&&top<=header+32;
  });
  const dims=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dims.page<=dims.viewport+1,'Mobile horizontal overflow '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'No app JavaScript errors');
  console.log('Academic UI browser checks OK: tabs, lessons, cards, rail, sticky headings, practice, mobile paging');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});