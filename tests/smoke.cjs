const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const url = process.env.TEST_URL || 'https://sonder98.github.io/gongkao-logic-errorbook/';
const browserChannel = process.env.BROWSER_CHANNEL || 'chrome';

(async () => {
  const browser = await chromium.launch({ channel: browserChannel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedResources = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() });
  });
  page.on('pageerror', error => consoleErrors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failedResources.push({ status: response.status(), url: response.url() });
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.nav-item', { timeout: 15000 });
  // Plain root always defaults to practice; explicit topic links may open knowledge.
  assert.equal(await page.locator('#practiceView').isVisible(),true);
  assert.equal(await page.locator('#knowledgeView').isVisible(),false);
  assert.equal(await page.locator('#tabPractice').getAttribute('aria-selected'),'true');

  assert.equal(await page.title(), 'Exam');
  const expectedQuestions = Number((await page.locator('#navCount').innerText()).split('/')[1].trim().split(' ')[0]);
  assert.ok(expectedQuestions >= 8, 'Question count must be at least eight');
  assert.equal(await page.locator('.nav-item').count(), expectedQuestions);
  // Compact navigation should remain bounded as the catalog grows.
  const navMetrics=await page.locator('#questionList').evaluate(element=>({
    maxHeight:parseFloat(getComputedStyle(element).maxHeight),
    direction:getComputedStyle(element).flexDirection,
    overflow:getComputedStyle(element).overflowY
  }));
  assert.equal(navMetrics.direction,'column');
  assert.ok(navMetrics.maxHeight<=400);
  assert.equal(navMetrics.overflow,'auto');
  assert.equal(await page.locator('#navCount').innerText(),expectedQuestions+' / '+expectedQuestions+' 题');
  await page.locator('#questionSearch').fill('蟠桃');
  assert.equal(await page.locator('.nav-item').count(),1);
  assert.equal(await page.locator('.nav-item').getAttribute('data-id'),'unknown-peach-bagging-small-fruit');
  await page.locator('#questionSearch').fill('根本没有这个词');
  assert.equal(await page.locator('.nav-item').count(),0);
  assert.match(await page.locator('#card').innerText(),/没有符合条件/);
  await page.locator('#questionSearch').fill('');
  assert.equal(await page.locator('.nav-item').count(),expectedQuestions);
  assert.equal(await page.locator('#questionSearch').inputValue(),'');
  assert.equal(await page.locator('.nav-title').first().getAttribute('title'),null);

  const jsonResponse=await page.request.get(new URL('questions.json',url).href);
  assert.equal(jsonResponse.status(),200,'questions.json HTTP 200');
  const catalog=await jsonResponse.json();
  assert.equal(catalog.length,expectedQuestions);
  assert.equal(new Set(catalog.map(q=>q.id)).size,expectedQuestions);
  assert.equal(catalog.filter(q=>q.image.startsWith('legacy:')).length,6);
  // Editorial importance is visible, searchable and separate from personal review.
  const keyQuestion=catalog.find(q=>q.id==='unknown-black-carbon-neurocognition');
  assert.equal(keyQuestion.important,true);
  assert.equal(keyQuestion.answer,'D');
  await page.locator('#importantFilter').check();
  assert.equal(await page.locator('.nav-item').count(),catalog.filter(q=>q.important===true).length);
  await page.locator('[data-id="unknown-black-carbon-neurocognition"]').click();
  assert.match(await page.locator('.qtop').innerText(),/重点题/);
  assert.equal(await page.locator('.choice').count(),4);
  assert.equal(await page.locator('#review').isChecked(),false);
  await page.locator('#importantFilter').uncheck();
  assert.equal(await page.locator('.nav-item').count(),expectedQuestions);
  await page.locator('[data-id="2008-yumi"]').click();



  // Knowledge tab: searchable navigation, structured notes, and both-way links.
  await page.locator('#tabKnowledge').click();
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.equal(await page.locator('#practiceView').isVisible(),false);
  const knowledgeResponse=await page.request.get(new URL('knowledge.json',url).href);
  assert.equal(knowledgeResponse.status(),200);
  const book=await knowledgeResponse.json();
  const totalTopics=book.sections.reduce((n,s)=>n+s.topics.length,0);
  assert.ok(book.sections.some(s=>s.topics.some(t=>t.id==='susceptibility-selection-bias'&&t.questionIds.includes('unknown-black-carbon-neurocognition'))));

  assert.ok(totalTopics>=15,'Knowledge library should contain substantive topics');
  const initialTopics=book.sections[0].topics.length;
  assert.equal(await page.locator('[data-knowledge-section]').count(),book.sections.length);
  assert.equal(await page.locator('[data-knowledge-topic]').count(),initialTopics,
    'Only current chapter should be expanded initially');
  assert.equal(await page.locator('[data-knowledge-section="foundation"]').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('[data-knowledge-section="effect"]').getAttribute('aria-expanded'),'false');
  const knowledgeNavMetrics=await page.locator('#knowledgeNav').evaluate(el=>({
   maxHeight:parseFloat(getComputedStyle(el).maxHeight),
   overflowY:getComputedStyle(el).overflowY
  }));
  assert.ok(knowledgeNavMetrics.maxHeight<=420,'Knowledge nav should have bounded height');
  assert.equal(knowledgeNavMetrics.overflowY,'auto');
  // Knowledge sections can be read sequentially without reopening the catalog.
  const orderedTopics=book.sections.flatMap(section=>section.topics);
  assert.equal(await page.locator('#knowledgeCard [data-kb-prev]').isDisabled(),true);
  assert.equal(await page.locator('#knowledgeCard [data-kb-next]').isEnabled(),true);
  assert.equal((await page.locator('#knowledgeCard .kb-footer-nav .pill').innerText()).trim(),
    '1 / '+totalTopics);
  await page.locator('#knowledgeCard [data-kb-next]').click();
  assert.equal(await page.locator('#knowledgeCard h2').innerText(),orderedTopics[1].title);
  assert.match(page.url(),new RegExp('#knowledge/'+orderedTopics[1].id+'$'));
  await page.locator('#knowledgeCard [data-kb-prev]').click();
  assert.equal(await page.locator('#knowledgeCard h2').innerText(),orderedTopics[0].title);
  assert.equal(await page.locator('#knowledgeCard [data-kb-prev]').isDisabled(),true);
  const firstChapterTopics=book.sections[0].topics;
  await page.locator('[data-knowledge-topic="'+firstChapterTopics.at(-1).id+'"]').click();
  await page.locator('#knowledgeCard [data-kb-next]').click();
  assert.equal(await page.locator('#knowledgeCard h2').innerText(),book.sections[1].topics[0].title);
  assert.equal(await page.locator('[data-knowledge-section="'+book.sections[1].id+'"]').getAttribute('aria-expanded'),'true');
  await page.locator('#knowledgeCard [data-kb-prev]').click();
  assert.equal(await page.locator('#knowledgeCard h2').innerText(),firstChapterTopics.at(-1).title);
  // Last knowledge section disables Next; Previous stays within the same module.
  const lastTopic=orderedTopics.at(-1);
  await page.locator('[data-knowledge-section="'+book.sections.at(-1).id+'"]').click();
  await page.locator('[data-knowledge-topic="'+lastTopic.id+'"]').click();
  assert.equal(await page.locator('#knowledgeCard [data-kb-next]').isDisabled(),true);
  await page.locator('#knowledgeCard [data-kb-prev]').click();
  assert.equal(await page.locator('#knowledgeCard h2').innerText(),orderedTopics.at(-2).title);
  await page.locator('[data-knowledge-section="effect"]').click();
  assert.equal(await page.locator('[data-knowledge-section="effect"]').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('[data-knowledge-section="foundation"]').getAttribute('aria-expanded'),'false');
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/由果推因/);
  assert.match(page.url(),/#knowledge\/effect-overview$/);
  assert.equal(await page.locator('[data-knowledge-topic]').count(),
    book.sections.find(s=>s.id==='effect').topics.length);
  await page.locator('#knowledgeSearch').fill('规范性前提');
  assert.ok((await page.locator('[data-knowledge-topic]').count())>0);
  assert.match(page.url(),/#knowledge\//,'Search results should retain a shareable knowledge link');
  assert.equal(await page.locator('[data-knowledge-section]').count(),0,
    'Searching should show matching topics directly rather than collapsed groups');
  await page.locator('#knowledgeSearch').fill('');
  await page.locator('[data-knowledge-section="effect"]').click();
  await page.locator('[data-knowledge-topic="alternative-causes"]').click();
  assert.match(await page.locator('#knowledgeCard').innerText(),/他因分析/);
  await page.locator('#knowledgeCard [data-open-question="unknown-peach-bagging-small-fruit"]').click();
  assert.equal(await page.locator('#practiceView').isVisible(),true);
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'unknown-peach-bagging-small-fruit');
  assert.match(page.url(),/#practice\/unknown-peach-bagging-small-fruit$/);
  await page.locator('#card [data-open-topic="alternative-causes"]').click();
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/他因分析/);
  assert.match(page.url(),/#knowledge\/alternative-causes$/);
  // Explicit deep link to a topic reopens its collapsed section.
  await page.goto(new URL('#knowledge/experiment-comparability',url).href, {waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-knowledge-topic="experiment-comparability"]');
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.equal(await page.locator('[data-knowledge-section="correlation"]').getAttribute('aria-expanded'),'true');
  // Independent formal logic catalogs and both tabs.
  const formalQuestionResponse=await page.request.get(new URL('formal-questions.json',url).href);
  const formalKnowledgeResponse=await page.request.get(new URL('formal-knowledge.json',url).href);
  assert.equal(formalQuestionResponse.status(),200);
  assert.equal(formalKnowledgeResponse.status(),200);
  const formalQuestions=await formalQuestionResponse.json();
  assert.equal(formalQuestions.length,30);
  assert.equal(formalQuestions.filter(q=>q.category==='翻译推理').length,10);
  assert.equal(formalQuestions.filter(q=>q.category==='矛盾推理').length,6);
  assert.equal(formalQuestions.filter(q=>q.category==='真假推理').length,5);
  assert.equal(formalQuestions.filter(q=>q.category==='综合推理').length,9);
  assert.equal(Number(await page.locator('#questionCount').innerText()), expectedQuestions+formalQuestions.length);
  assert.equal(formalQuestions.find(q=>q.id==='formal-2013-jilin-not-all-people-like-you').answer,'B');
  const fujian=formalQuestions.find(q=>q.id==='formal-2015-fujian-disaster-unless-disagreement');
  assert.equal(fujian.answer,'A');
  assert.match(fujian.trap,/D.*可.*推出/);
  const formalBook=await formalKnowledgeResponse.json();
  assert.deepEqual(formalBook.sections.map(section=>section.title),["一、翻译推理","二、矛盾推理","三、真假推理","四、综合推理"]);
  assert.equal(formalBook.sections[0].topics.length,4);
  assert.ok(formalBook.sections[0].topics.some(t=>t.id==='formal-translation-nested-negation'));
  assert.ok(formalBook.sections[0].topics.some(topic=>topic.id==='formal-translation-quantifiers'));
  assert.equal(formalBook.sections[1].topics.length,1);
  assert.equal(formalBook.sections[1].topics[0].id,'formal-contradiction-two-patterns');
  assert.equal(formalBook.sections[1].topics[0].questionIds.length,6);
  assert.deepEqual(formalBook.sections[2].topics.map(t=>t.id),['formal-truth-contradictions','formal-truth-linked']);
  assert.deepEqual(formalBook.sections[3].topics.map(t=>t.id),["formal-comprehensive-overview","formal-comprehensive-selection","formal-comprehensive-matching","formal-comprehensive-order","formal-comprehensive-grouping"]);
  await page.locator('#tabFormalPractice').click();
  assert.equal(await page.locator('#practiceView').isVisible(),true);
  assert.equal(await page.locator('#tabFormalPractice').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('.nav-item').count(),30);
  assert.match(page.url(),/#formal\/practice\/formal-2013-jilin-not-all-people-like-you$/);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g,''),'0/30');
  assert.equal((await page.locator('#show').innerText()).trim(),'查看解析');
  assert.equal(await page.locator('#show').getAttribute('aria-expanded'),'false');
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(),/正确答案 B/);
   assert.match(await page.locator('.result').innerText(),/可迁移方法/);
   assert.doesNotMatch(await page.locator('.result').innerText(),/一句话记忆/);
  assert.equal((await page.locator('#show').innerText()).trim(),'收起解析');
  assert.equal(await page.locator('#show').getAttribute('aria-expanded'),'true');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),0);
  assert.equal((await page.locator('#show').innerText()).trim(),'查看解析');
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(),/正确答案 B/);
  await page.locator('[data-id="formal-2015-fujian-disaster-unless-disagreement"]').click();
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(),/D.*可.*推出/);
   assert.doesNotMatch(await page.locator('.result').innerText(),/可迁移方法|一句话记忆/);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g,''),'0/30');
  await page.locator('#tabFormalKnowledge').click();
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.equal(await page.locator('#tabFormalKnowledge').getAttribute('aria-selected'),'true');
  assert.match(await page.locator('#knowledgeCard').innerText(),/翻译推理/);
  assert.equal(await page.locator('[data-knowledge-section]').count(),4);
  await page.locator('[data-knowledge-topic="formal-translation-quantifiers"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/所有与有些/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),9);
  assert.match(await page.locator('#knowledgeCard').innerText(),/共同起点找交集/);
  await page.locator('#knowledgeCard [data-open-question="formal-2023-shanghai-film-indian-nonscifi"]').click();
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'formal-2023-shanghai-film-indian-nonscifi');
  await page.locator('#tabFormalKnowledge').click();
  await page.locator('[data-knowledge-topic="formal-translation-quantifiers"]').click();
  assert.match(page.url(),/#formal\/knowledge\/formal-translation-quantifiers$/);
  await page.locator('[data-knowledge-topic="formal-translation-nested-negation"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/嵌套否定/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),2);
  await page.locator('#knowledgeCard [data-open-question="formal-2015-fujian-disaster-unless-disagreement"]').click();
  assert.equal(await page.locator('#tabFormalPractice').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'formal-2015-fujian-disaster-unless-disagreement');
  await page.locator('#tabFormalKnowledge').click();
  await page.locator('[data-knowledge-section="formal-contradiction"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/矛盾推理：两种结构/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/A→B/);
  assert.match(page.url(),/#formal\/knowledge\/formal-contradiction-two-patterns$/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),6);
  await page.locator('#knowledgeCard [data-open-question="formal-2022-sichuan-excellent-team"]').click();
  assert.equal(await page.locator('#card .title').innerText(),'2022四川：陈与肖至少一人优秀');
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'formal-2022-sichuan-excellent-team');
  await page.locator('#tabFormalKnowledge').click();
  await page.locator('[data-knowledge-section="formal-translation"]').click();
  await page.locator('[data-knowledge-section="formal-contradiction"]').click();
  await page.locator('[data-knowledge-section="formal-translation"]').click();
  assert.match(await page.locator('#knowledgeCard').innerText(),/翻译推理/);
  assert.match(page.url(),/#formal\/knowledge\/formal-translation-basics$/);
  await page.locator('[data-knowledge-section="formal-truth"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/真假推理：找矛盾/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),3);
  await page.locator('[data-knowledge-topic="formal-truth-linked"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/真假推理：同真同假/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),3);
  await page.locator('#knowledgeCard [data-open-question="formal-unknown-singing-ranking-one-true"]').click();
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'formal-unknown-singing-ranking-one-true');
  await page.locator('#tabFormalKnowledge').click();
  await page.locator('[data-knowledge-section="formal-comprehensive"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/综合推理：六类题型/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),8);
  await page.locator('[data-knowledge-topic="formal-comprehensive-grouping"]').click();
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/分组方式/);
  assert.equal(await page.locator('#knowledgeCard [data-open-question]').count(),4);
  await page.locator('#knowledgeCard [data-open-question="formal-unknown-weekly-movies-cover-days"]').click();
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),'formal-unknown-weekly-movies-cover-days');
  await page.goto(new URL('#formal/practice',url).href,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#card .choices');
  assert.equal(await page.locator('#tabFormalPractice').getAttribute('aria-selected'),'true');
  await page.locator('#tabKnowledge').click();
  assert.equal(await page.locator('[data-knowledge-section="foundation"]').getAttribute('aria-expanded'),'true');
  await page.locator('#tabPractice').click();
  assert.equal(await page.locator('.nav-item').count(),expectedQuestions);
  await page.locator('[data-id="2008-yumi"]').click();

  assert.equal(await page.locator('.choice').count(), 5);

  // iPad: Pencil/desktop pointer strokes on a nearly transparent question overlay.
  assert.equal(await page.locator('#scratchOverlay').isVisible(),false);
  await page.locator('#openScratch').click();
  assert.equal(await page.locator('#scratchOverlay').isVisible(),true);
  assert.equal(await page.locator('#openScratch').getAttribute('aria-expanded'),'true');
  const overlayShade=await page.locator('#scratchOverlay').evaluate(el=>getComputedStyle(el).backgroundColor);
  assert.match(overlayShade,/rgba\([^)]*,\s*0\.0\d+\)/,'Question remains readable under overlay');
  const canvasBox=await page.locator('#scratchCanvas').boundingBox();
  assert.ok(canvasBox.width>100&&canvasBox.height>100,'Canvas must cover question region');
  const drawX=canvasBox.x+Math.min(60,canvasBox.width*.14);
  const drawY=canvasBox.y+Math.min(150,canvasBox.height*.36);
  await page.mouse.move(drawX,drawY);
  await page.mouse.down();
  await page.mouse.move(drawX+55,drawY+30,{steps:7});
  await page.mouse.up();
  const sketchCount=()=>page.evaluate(()=>Object.keys(localStorage)
    .filter(key=>key.startsWith('exam_scratch_v1:'))
    .reduce((n,key)=>n+JSON.parse(localStorage.getItem(key)||'[]').length,0));
  assert.equal(await sketchCount(),1,'Mouse stroke persists locally');
  await page.locator('#scratchMode').click();
  assert.equal(await page.locator('#scratchOverlay').evaluate(el=>el.classList.contains('is-scrolling')),true);
  await page.locator('#scratchMode').click();
  assert.equal(await page.locator('#scratchOverlay').evaluate(el=>el.classList.contains('is-scrolling')),false);
  await page.locator('#scratchUndo').click();
  assert.equal(await sketchCount(),0,'Undo removes last stroke');
  await page.locator('#scratchCanvas').evaluate(canvas=>{
    const rect=canvas.getBoundingClientRect();
    for(const [type,x,y] of [
      ['pointerdown',60,100],['pointermove',115,128],['pointerup',115,128]
    ]){
      canvas.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerType:'pen',
        pointerId:991,isPrimary:true,button:0,clientX:rect.left+x,clientY:rect.top+y}));
    }
  });
  assert.equal(await sketchCount(),1,'Pencil pointer events draw');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#scratchClear').click();
  assert.equal(await sketchCount(),1,'Cancelled clear does not erase');
  await page.locator('#scratchDone').click();
  await page.locator('#openScratch').click();
  assert.equal(await sketchCount(),1,'Closing and reopening preserves strokes');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#scratchClear').click();
  assert.equal(await sketchCount(),0,'Confirmed clear erases current question');
  await page.locator('#scratchDone').click();
  assert.equal(await page.locator('#scratchOverlay').isVisible(),false);
  assert.equal(await page.locator('#openScratch').getAttribute('aria-expanded'),'false');
  await page.locator('[data-answer="E"]').click();
  await page.locator('#submit').click();
  assert.match(await page.locator('.result').innerText(), /答对了/);
  assert.equal((await page.locator('#show').innerText()).trim(),'收起解析');
  await page.locator('#show').click();
  assert.equal(await page.locator('.result').count(),0,'Submitted analysis can be collapsed');
  assert.equal((await page.locator('#show').innerText()).trim(),'查看解析');
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(), /答对了/);

  const shortNoteHeight=await page.locator('#note').evaluate(el=>el.getBoundingClientRect().height);
  await page.locator('#note').fill(Array.from({length:18},(_,i)=>'我的复盘第'+(i+1)+'行').join('\n'));
  const longNoteHeight=await page.locator('#note').evaluate(el=>el.getBoundingClientRect().height);
  assert.ok(longNoteHeight>shortNoteHeight+80,'Note textarea should expand to fit text');
  await page.locator('#note').fill('自动化冒烟测试笔记');
  assert.equal(await page.locator('#saveNote').isEnabled(),true);
  assert.match(await page.locator('#noteStatus').innerText(),/尚未提交/);
  assert.equal(await page.evaluate(() => state[active].note||''),'','Draft must not change submitted note');
  await page.locator('[data-id="2022-dingcan"]').click();
  await page.locator('[data-id="2008-yumi"]').click();
  assert.equal(await page.locator('#note').inputValue(),'自动化冒烟测试笔记','Draft survives question navigation');
  await page.locator('#review').check();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.nav-item', { timeout: 15000 });

  assert.equal(await page.locator('#note').inputValue(), '自动化冒烟测试笔记');
  assert.equal(await page.evaluate(() => state[active].note||''),'','Draft should still be unsubmitted after reload');
  await page.locator('#saveNote').click();
  assert.equal(await page.evaluate(() => state[active].note),'自动化冒烟测试笔记');
  assert.equal(await page.locator('#saveNote').isDisabled(),true);
  assert.equal(await page.locator('#review').isChecked(), true);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''), '1/'+expectedQuestions);

  // Personal review notes can replace visible analysis only after explicit confirmation.
  // The replacement must never overwrite the shared question-bank explanation.
  const customAnalysis='我的新解析：\n第一行 → 论据与结论\n第二行 <script>alert(1)</script>';
  await page.locator('#note').fill(customAnalysis);
  assert.equal(await page.locator('#replaceAnalysis').isEnabled(),true);
  assert.match(await page.locator('#noteStatus').innerText(),/尚未提交/);
  page.once('dialog', dialog=>dialog.dismiss());
  await page.locator('#replaceAnalysis').click();
  assert.equal(await page.locator('#note').inputValue(),customAnalysis,'Cancelling preserves the draft');
  assert.match(await page.locator('.result').innerText(),/逻辑结构/,'Cancelling preserves original analysis');
  page.once('dialog', dialog=>dialog.accept());
  await page.locator('#replaceAnalysis').click();
  assert.equal(await page.locator('#note').inputValue(),'','Replacement clears note field');
  assert.equal(await page.evaluate(()=>state[active].note),'','Replacement clears saved note');
  assert.equal(await page.evaluate(()=>noteDrafts[active]),undefined,'Replacement clears draft');
  assert.equal(await page.evaluate(()=>state[active].analysisOverride),customAnalysis,'Complete note is preserved');
  assert.equal(await page.locator('.personal-analysis-body').textContent(),customAnalysis);
  assert.equal(await page.locator('.result b').count(),0,'Original analysis sections must be replaced');
  assert.equal(await page.evaluate(()=>window.__xss),undefined);
  assert.equal(await page.locator('#replaceAnalysis').isDisabled(),true);
  assert.equal(await page.locator('#restoreAnalysis').isEnabled(),true);
  await page.locator('#show').click();
  assert.equal(await page.locator('.personal-analysis-body').count(),0);
  await page.locator('#show').click();
  assert.equal(await page.locator('.personal-analysis-body').textContent(),customAnalysis);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#restoreAnalysis');
  assert.equal(await page.locator('.personal-analysis-body').textContent(),customAnalysis,'Override survives reload');
  assert.equal(await page.locator('#note').inputValue(),'');
  page.once('dialog', dialog=>dialog.dismiss());
  await page.locator('#restoreAnalysis').click();
  assert.equal(await page.locator('.personal-analysis-body').textContent(),customAnalysis,'Cancelling restore preserves override');
  page.once('dialog', dialog=>dialog.accept());
  await page.locator('#restoreAnalysis').click();
  assert.equal(await page.locator('.personal-analysis-body').count(),0);
  assert.match(await page.locator('.result').innerText(),/逻辑结构/);
  assert.equal(await page.evaluate(()=>state[active].analysisOverride),undefined);
  assert.equal(await page.locator('#note').inputValue(),'');
  assert.equal(await page.locator('#replaceAnalysis').isDisabled(),true);
  await page.locator('#note').fill('新的笔记内容');
  assert.equal(await page.locator('#replaceAnalysis').isEnabled(),true,'Replace button responds to new draft typing');
  await page.locator('#note').fill('');
  assert.equal(await page.locator('#replaceAnalysis').isDisabled(),true);
  const importRecord=await page.evaluate(()=>normalizeImportedRecord({analysisOverride:'来自备份的个人解析'}));
  assert.equal(importRecord.analysisOverride,'来自备份的个人解析');
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''),'1/'+expectedQuestions);

  await page.locator('[data-id="2022-dingcan"]').click();
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(), /正确答案 B/);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''), '1/'+expectedQuestions);


  await page.locator('[data-id="2024-hebei-diet-cognition"]').click();
  assert.equal(await page.locator('.choice').count(), 4);
  assert.match(await page.locator('.qtop').innerText(), /两句式推理/);
  await page.locator('#toggleImage').click();
  await page.waitForFunction(() => {const img=document.querySelector('#shot'); return Boolean(img&&img.complete&&img.naturalWidth>0)},null,{timeout:12000});
  await page.locator('[data-answer="D"]').click();
  await page.locator('#submit').click();
  assert.match(await page.locator('.result').innerText(), /答对了/);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''), '2/'+expectedQuestions);


  // New text-only questions: four choices, correct answer D, no screenshot control.
  for (const id of ['2025-guangdong-sanzhiyifu-adhd-intervention','unknown-peach-bagging-small-fruit']) {
    await page.locator('[data-id="'+id+'"]').click();
    assert.equal(await page.locator('.choice').count(), 4);
    assert.match(await page.locator('.qtop').innerText(), /由果推因/);
    assert.equal(await page.locator('#toggleImage').count(), 0);
    await page.locator('[data-answer="D"]').click();
    await page.locator('#submit').click();
    assert.match(await page.locator('.result').innerText(), /答对了/);
  }
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''), '4/'+expectedQuestions);

  // Existing IDs and answers continue to work after appending two new questions.
  await page.locator('[data-id="medical"]').click();
  assert.match(await page.locator('.qtop').innerText(), /两句式推理/);
  assert.equal(await page.locator('.choice').count(), 5);
  await page.locator('[data-id="unknown-peach-bagging-small-fruit"]').click();

  await page.locator('#note').fill('<img src=x onerror="window.__xss=true">');
  await page.locator('#saveNote').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.__xss), undefined);

  const authStatus = await page.locator('#authStatus').innerText();
  assert.doesNotMatch(authStatus, /未配置 Supabase|连接配置异常/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#tabKnowledge').click();
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.equal(await page.locator('#knowledgeCard h2').isVisible(),true);
  const mobileKbNavMax=await page.locator('#knowledgeNav').evaluate(el=>parseFloat(getComputedStyle(el).maxHeight));
  assert.ok(mobileKbNavMax<=220,'Mobile knowledge nav must remain compact');
  await page.locator('#tabPractice').click();
  assert.equal(await page.locator('.maincard').isVisible(), true);
  assert.equal(await page.locator('.choice').first().isVisible(), true);
  const mobileLayout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')]
      .map(element => ({
        tag: element.tagName,
        id: element.id,
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(element.getBoundingClientRect().left),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width)
      }))
      .filter(item => item.left < -1 || item.right > document.documentElement.clientWidth + 1)
      .slice(0, 20)
  }));
  assert.equal(
    mobileLayout.pageWidth,
    mobileLayout.viewportWidth,
    `mobile page overflows horizontally: ${JSON.stringify(mobileLayout)}`
  );
  await page.setViewportSize({ width: 320, height: 720 });
  const narrowMobileLayout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth
  }));
  assert.equal(
    narrowMobileLayout.pageWidth,
    narrowMobileLayout.viewportWidth,
    `narrow mobile page overflows horizontally: ${JSON.stringify(narrowMobileLayout)}`
  );

  // Data analysis course map: 12 lesson nodes, courses 2-4 grouped under speed calculation.
  await page.locator('#tabDataKnowledge').click();
  assert.equal(await page.locator('#tabDataKnowledge').getAttribute('aria-selected'),'true');
  assert.match(page.url(),/#data\/knowledge/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/第2课 · 数据分析/);
  assert.match(await page.locator('#knowledgeNav').innerText(),/速算/);
  assert.match(await page.locator('#knowledgeNav').innerText(),/放缩运算/);
  assert.match(await page.locator('#knowledgeNav').innerText(),/快速估算/);
  await page.locator('[data-knowledge-topic="data-topic-course-03-scaling"]').click();
  assert.equal(await page.locator('.kb-formula-table thead th').count(),4,'百化分表的四列表头');
  assert.equal(await page.locator('.kb-formula-table tbody tr').count(),6,'百化分表必须有六行');
  assert.match(await page.locator('#knowledgeCard').innerText(),/错位相减/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/错位相加/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/0.aaa/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/0.09/);
  // The sequential navigation should work from the second topic (放缩运算).
  assert.equal(await page.locator('#knowledgeCard [data-kb-prev]').isDisabled(),false);
  await page.locator('#knowledgeCard [data-kb-next]').click();
  assert.match(page.url(),/#data\/knowledge\//);
  assert.match((await page.locator('#knowledgeCard .kb-footer-nav .pill').innerText()).trim(),/^3 \/ \d+$/);
  await page.locator('#knowledgeCard [data-kb-prev]').click();
  assert.match((await page.locator('#knowledgeCard .kb-footer-nav .pill').innerText()).trim(),/^2 \/ \d+$/);
  await page.locator('#tabDataPractice').click();
  assert.equal(await page.locator('#tabDataPractice').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('.nav-item').count(),5);
  assert.equal(await page.locator('.nav-item').first().getAttribute('data-id'),'data-2022-g-legal-aid-average-q1');
  assert.match(await page.locator('.da-material').innerText(),/195779/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/方法一 · 除法放缩/);
  assert.match(await page.locator('.da-explanation').innerText(),/方法二 · 直接和选项比/);
  assert.equal(await page.locator('.da-explanation [data-da-tex]').count(),5);
  await page.locator('.da-explanation .katex').first().waitFor({state:'visible',timeout:15000});
  await page.locator('#show').click();
  assert.equal(await page.locator('.da-explanation').count(),0);
  await page.locator('#show').click();
  assert.equal(await page.locator('.da-explanation').count(),1);
  await page.locator('[data-id="data-2018-q-passenger-average-distance"]').click();
  assert.match(await page.locator('.da-material').innerText(),/1768.2/);
  assert.equal(await page.locator('.da-figure table tbody tr').count(),11);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/步骤一 · 除法放缩/);
  assert.match(await page.locator('.da-explanation').innerText(),/步骤二 · 看选项，确定量级/);
  assert.match(await page.locator('.da-explanation').innerText(),/1176/);
  assert.match(await page.locator('.da-explanation').innerText(),/1170公里/);
  await page.locator('#show').click();
  assert.equal(await page.locator('.da-explanation').count(),0);
  await page.locator('[data-id="data-2017-jiangsu-neighbors-unaware-count"]').click();
  assert.match(await page.locator('.da-material').innerText(),/951/);
  assert.match(await page.locator('.da-material').innerText(),/55.8%/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/方法一 · 百化分并修正误差/);
  assert.match(await page.locator('.da-explanation').innerText(),/方法二 · 乘法放缩、错位相加/);
  assert.match(await page.locator('.da-explanation').innerText(),/413.6/);
  assert.match(await page.locator('.da-explanation').innerText(),/417.6/);
  await page.locator('[data-id="data-2015-hebei-2013-highway-passengers"]').click();
  assert.match(await page.locator('.da-material').innerText(),/190.5/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/步骤二 · 修正增长量/);
  await page.locator('[data-id="data-2020-fujian-2018-industrial-profits"]').click();
  assert.match(await page.locator('.da-material').innerText(),/965.9/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/步骤一 · 选择提前修正/);
  assert.match(await page.locator('.da-explanation').innerText(),/1042.8/);
  await page.locator('#tabDataKnowledge').click();
  await page.locator('[data-knowledge-topic="data-topic-course-04-estimation"]').click();
  assert.equal(await page.locator('.kb-formula-table tbody tr').count(),7);
  assert.match(await page.locator('#knowledgeCard').innerText(),/化除为乘/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/提前修正/);
  await page.locator('#tabPractice').click();
  assert.equal(await page.locator('.nav-item').count(),expectedQuestions);

  await browser.close();

  console.log(JSON.stringify({
    ok: true,
    url,
    browserChannel,
    questions: expectedQuestions,
    persistence: true,
    directRevealDoesNotComplete: true,
    xssEscaping: true,
    mobileViewport: true,
    mobileWidths: [390, 320],
    mobileHorizontalOverflow: false,
    authStatus,
    consoleErrors,
    failedResources
  }, null, 2));
})().catch(async error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
