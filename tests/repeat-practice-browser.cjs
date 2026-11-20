const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const target=process.env.TEST_URL||'http://127.0.0.1:8000/';
const tally=async page=>(await page.locator('#card .practice-accuracy').innerText()).replace(/\s+/g,' ').trim();
const ready=async page=>page.locator('#examRelatedList .exam-related-entry').first().waitFor({state:'visible',timeout:20000});
const correctLetter=page=>page.evaluate(()=>QUESTIONS.find(q=>q.id===active).answer);
(async()=>{
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:30000});
  await ready(page);
  // Older stored records must not leak their last answer or attempt count.
  const originalId=await page.evaluate(()=>{
   const id=active;
   state[id]={attempts:17,selected:'E',submitted:true,revealed:true,
     note:'保留旧复盘',analysisOverride:'保留旧个人解析',review:true,wrong:true};
   persistUserState();ExamPractice.leave();render();return id;
  });
  assert.match(await tally(page),/练习 0 次.*答对 0 次.*正确率 —/);
  assert.equal(await page.locator('#card .result').count(),0);
  assert.equal(await page.locator('#card .choice.chosen').count(),0);
  assert.equal(await page.locator('#note').inputValue(),'保留旧复盘');
  const wrong=await page.evaluate(()=>{
   const q=QUESTIONS.find(q=>q.id===active);
   return 'ABCDE'.slice(0,q.options.length).split('').find(c=>c!==q.answer);
  });
  await page.locator('[data-answer="'+wrong+'"]').click();
  assert.equal(await page.locator('#submit').isEnabled(),true);
  await page.locator('#submit').click();
  assert.match(await page.locator('#card .result').innerText(),/答错了/);
  assert.match(await tally(page),/练习 1 次.*答对 0 次.*正确率 0%/);
  assert.equal(await page.locator('#card .choice.chosen').count(),1);
  assert.equal(await page.locator('#card .choice.correct').count(),1);
  assert.equal(await page.locator('#submit').isDisabled(),true);
  assert.equal(await page.evaluate(()=>state[active].attempts),undefined,
    'Old counter must be removed when saving new performance');
  assert.equal(await page.evaluate(()=>state[active].submitted),undefined);
  assert.equal(await page.evaluate(()=>cloudRecord(state[active]).practiceAttempts),1);
  await page.evaluate(()=>render());
  assert.match(await page.locator('#card .result').innerText(),/答错了/,
    'Background re-render during the current visit should retain feedback');
  await page.locator('#next').click();
  await page.locator('#prev').click();
  assert.equal(await page.evaluate(()=>active),originalId);
  assert.equal(await page.locator('#card .result').count(),0,
    'Returning to an earlier question starts a new attempt');
  assert.equal(await page.locator('#card .choice.chosen').count(),0);
  assert.equal(await page.locator('#submit').isDisabled(),true);
  assert.match(await tally(page),/练习 1 次.*答对 0 次.*正确率 0%/);
  assert.equal(await page.locator('#note').inputValue(),'保留旧复盘');
  const answer=await correctLetter(page);
  await page.locator('[data-answer="'+answer+'"]').click();
  await page.locator('#submit').click();
  assert.match(await page.locator('#card .result').innerText(),/答对了/);
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/);
  await page.locator('#retry').click();
  assert.equal(await page.locator('#card .result').count(),0);
  assert.equal(await page.locator('#card .choice.chosen').count(),0);
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/);
  await page.locator('#show').click();
  assert.match(await page.locator('#card .result').innerText(),/正确答案/);
  await page.locator('[data-answer="'+answer+'"]').click();
  await page.locator('#submit').click();
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/,
    'Reading analysis before submitting must not inflate accuracy');
  await page.locator('#academicKnowledgeMode').click();
  await page.locator('#academicPracticeMode').click();
  assert.equal(await page.locator('#card .result').count(),0);
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/);
  assert.equal(await page.locator('#note').inputValue(),'保留旧复盘');
  await page.reload({waitUntil:'domcontentloaded'});
  await ready(page);
  assert.equal(await page.locator('#card .result').count(),0,
    'Page reload must not restore the last submitted outcome');
  assert.equal(await page.locator('#card .choice.chosen').count(),0);
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/);
  assert.equal(await page.locator('#note').inputValue(),'保留旧复盘');
  assert.equal(await page.locator('#review').isChecked(),true);
  const back=await page.evaluate(()=>normalizeImportedRecord({
   attempts:99,selected:'D',submitted:true,revealed:true,note:'导入笔记',review:true,
   analysisOverride:'导入的解析'
  }));
  assert.equal(back.practiceAttempts,0);
  assert.equal(back.practiceCorrect,0);
  assert.equal(back.note,'导入笔记');
  assert.equal(back.analysisOverride,'导入的解析');
  assert.equal(Object.hasOwn(back,'attempts'),false);
  for(const tab of ['#tabFormalPractice','#tabDataPractice']){
   await page.locator(tab).click();
   assert.equal(await page.locator('#card .result').count(),0);
   assert.match(await tally(page),/练习 0 次.*答对 0 次.*正确率 —/);
   const right=await correctLetter(page);
   await page.locator('[data-answer="'+right+'"]').click();
   await page.locator('#submit').click();
   assert.match(await page.locator('#card .result').innerText(),/答对了/);
   assert.match(await tally(page),/练习 1 次.*答对 1 次.*正确率 100%/);
   await page.locator('#academicKnowledgeMode').click();
   await page.locator('#academicPracticeMode').click();
   assert.equal(await page.locator('#card .result').count(),0,
     'Subject '+tab+' must reset after leaving the practice view');
  }
  await page.locator('#tabPractice').click();
  assert.match(await tally(page),/练习 2 次.*答对 1 次.*正确率 50%/,
    'Subjects must retain independent, synced counters');
  assert.equal(await page.locator('#card .result').count(),0);
  assert.deepEqual(errors,[],'JavaScript errors while switching and submitting');
  console.log('Repeated practice Chrome regression passed: fresh visits, no legacy counts, 3 subjects, notes, reload');
 }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
