// Layout-only regression suite: never changes source app HTML or runtime handlers.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const url=process.env.TEST_URL||'http://127.0.0.1:8000/';
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#examRelatedList .exam-related-entry').first().waitFor({state:'visible',timeout:20000});
  const chrome=await page.evaluate(()=>{
   const box=selector=>document.querySelector(selector).getBoundingClientRect();
   const css=selector=>getComputedStyle(document.querySelector(selector));
   return {
    intro:box('#examPageIntro'),stats:box('#stats'),
    aside:css('#practiceView>aside').display,
    asideWidth:box('#practiceView>aside').width,
    mainWidth:box('#practiceView>main').width,
    titleFont:css('#examPageTitle').fontSize,
    theme:css('#openScratch').backgroundColor,
    shadow:css('#openScratch').boxShadow,
    subjectGroups:document.querySelectorAll('#practiceView>aside .site-tabs .module-group').length,
    knowledgeButtonHidden:css('#tabKnowledge').display,
    practiceButtonVisible:css('#tabPractice').display
   };
  });
  assert.ok(chrome.intro.height<=52&&chrome.stats.height<=52,
   'Compact practice strip must be <=52px '+JSON.stringify(chrome));
  assert.ok(Math.abs(chrome.intro.top-chrome.stats.top)<2,
   'Title and stats must live in one row');
  assert.notEqual(chrome.aside,'none','iPad landscape must retain a usable subject list');
  assert.equal(chrome.subjectGroups,3,'All subject rows remain present');
  assert.equal(chrome.knowledgeButtonHidden,'none','Hide duplicate Knowledge button in practice rail');
  assert.notEqual(chrome.practiceButtonVisible,'none','Keep clickable subject Practice button');
  assert.ok(chrome.mainWidth>chrome.asideWidth*3,
   'The exercise lane must retain at least 75% of column width');
  assert.equal(chrome.theme,'rgb(44, 76, 62)','Pencil launcher should use forest green');
  assert.match(chrome.shadow,/rgba\(44, 76, 62, 0\.22\)/);
  await page.locator('#tabFormalPractice').click();
  assert.equal(await page.locator('#tabFormalPractice').getAttribute('aria-selected'),'true');
  await page.locator('#tabPractice').click();
  assert.equal(await page.locator('#tabPractice').getAttribute('aria-selected'),'true');
  const shortest=await page.evaluate(()=>{
    const candidates=QUESTIONS.filter(q=>q.options.length>=4);
    const weight=q=>q.stem.length+q.ask.length+q.options.slice(0,4).join('').length;
    const q=candidates.sort((a,b)=>weight(a)-weight(b))[0];
    active=q.id;ExamPractice.leave();render();window.scrollTo({top:0,behavior:'instant'});
    return {id:q.id,weight:weight(q)};
  });
  await page.waitForTimeout(100);
  const question=await page.evaluate(()=>{
    const box=selector=>document.querySelector(selector).getBoundingClientRect();
    const title=box('#card .title'),metrics=box('#card .practice-accuracy');
    const zone=box('#card'),choices=[...document.querySelectorAll('#card .choice')].map(x=>x.getBoundingClientRect());
    const style=getComputedStyle(document.querySelector('#card .stem'));
    return {
      title:{top:title.top,bottom:title.bottom},
      metrics:{top:metrics.top,bottom:metrics.bottom},
      fourthChoiceBottom:choices[3].bottom,
      cardTop:zone.top,cardPadding:getComputedStyle(document.querySelector('#card')).padding,
      first4:choices.length,stemLineHeight:parseFloat(style.lineHeight),stemFontSize:parseFloat(style.fontSize)
    };
  });
  assert.ok(Math.abs(question.title.top-question.metrics.top)<14,
   'Topic title and cumulative practice statistics must align on one row: '+JSON.stringify(question));
  assert.equal(question.first4>=4,true,'The test requires a four-answer exercise');
  assert.ok(question.fourthChoiceBottom<=768,
   'Representative short 4-choice exercise should fit in a 1024×768 first screen: '+
   JSON.stringify({shortest,question}));
  assert.ok(question.stemLineHeight/question.stemFontSize>=1.6,
   'Editorial stem retains comfortable line height');
  await page.setViewportSize({width:1500,height:950});
  await page.locator('#academicKnowledgeMode').click();
  await page.locator('#knowledgeCard h2').waitFor({state:'visible'});
  const knowledge=await page.locator('#knowledgeCard').evaluate(el=>{
   const s=getComputedStyle(el);
   return {width:el.getBoundingClientRect().width,maxWidth:s.maxWidth};
  });
  assert.equal(knowledge.maxWidth,'840px','Editorial knowledge width cap should be 840px');
  assert.ok(knowledge.width<=840+1);
  await page.setViewportSize({width:390,height:844});
  await page.locator('#academicPracticeMode').click();
  await page.locator('#card .choice').first().waitFor({state:'visible'});
  const mobile=await page.evaluate(()=>{
   const css=s=>getComputedStyle(document.querySelector(s));
   const box=s=>document.querySelector(s).getBoundingClientRect();
   return {
    aside:css('#practiceView>aside').display,
    library:css('#examMobileLibrary').display,
    choiceHeight:box('#card .choice').height,
    sidePadding:parseFloat(css('#practiceView.shell').paddingLeft),
    scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth
   };
  });
  assert.equal(mobile.aside,'none','Phone uses the collapsed catalog');
  assert.notEqual(mobile.library,'none','Phone retains the full library launcher');
  assert.ok(mobile.sidePadding>=12&&mobile.sidePadding<=16,'Phone uses compact gutters');
  assert.ok(mobile.choiceHeight>=48,'Mobile answer tap target at least 48px');
  assert.ok(mobile.scrollWidth<=mobile.clientWidth+1,'No horizontal overflow');
  assert.deepEqual(errors,[],'The CSS-only revision must not break JS');
  console.log('Compact Editorial browser checks OK: iPad 1024x768, PC reading, phone tap targets, Pencil button');
 }finally{await context.close();await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
