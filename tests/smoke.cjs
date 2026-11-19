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
  // No exam year/province metadata in visible or accessible exercise chrome.
  assert.match((await page.locator('.qtop .subtle').innerText()).trim(),/^\d+ \/ \d+$/);
  assert.doesNotMatch(await page.locator('.qtop').innerText(),/管综联考/);
  assert.doesNotMatch(await page.locator('.nav-item').first().getAttribute('title'),/管综联考|2008/);
  assert.doesNotMatch(await page.locator('.nav-item').first().getAttribute('aria-label'),/管综联考|2008/);
  // Compact navigation should remain bounded as the catalog grows.
  const navMetrics=await page.locator('#questionList').evaluate(element=>({
    maxHeight:parseFloat(getComputedStyle(element).maxHeight),
    direction:getComputedStyle(element).flexDirection,
    overflow:getComputedStyle(element).overflowY
  }));
  assert.equal(navMetrics.direction,'column');
  assert.ok(navMetrics.maxHeight<=400);
  assert.equal(navMetrics.overflow,'auto');
  // Desktop wheel should scroll all 59+ catalog entries, even from category chips.
  const scrollInfo=()=>page.locator('#questionList').evaluate(el=>({
    top:el.scrollTop,max:el.scrollHeight-el.clientHeight
  }));
  const initialScroll=await scrollInfo();
  assert.ok(initialScroll.max>300,'Question catalog needs a genuinely scrollable viewport');
  await page.locator('#filters').hover();
  await page.mouse.wheel(0,500);
  await page.waitForFunction(()=>document.querySelector('#questionList').scrollTop>80);
  assert.ok((await scrollInfo()).top>80,'Wheel over filters should scroll the catalog');
  await page.locator('#questionList').hover();
  await page.mouse.wheel(0,20000);
  await page.waitForFunction(()=>{
    const el=document.querySelector('#questionList');
    return el.scrollHeight-el.clientHeight-el.scrollTop<2;
  });
  assert.equal(await page.locator('.nav-item').last().count(),1,'Last question remains in the list');
  await page.mouse.wheel(0,-20000);
  await page.waitForFunction(()=>document.querySelector('#questionList').scrollTop<2);
  assert.ok((await scrollInfo()).top<2,'Wheel upward returns to the first question');
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
  await page.locator('#questionSearch').fill('管综联考');
  assert.equal(await page.locator('.nav-item').count(),0,'Exam provenance must not be a search field');
  await page.locator('#questionSearch').fill('');
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
  const linkedArrows=await page.locator('#knowledgeCard .kb-related-sub').allTextContents();
  assert.ok(linkedArrows.length>0&&linkedArrows.every(text=>text.trim()==='→'),
    'Knowledge related questions should display arrows, not provenance');
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
  assert.match((await page.locator('.qtop .subtle').innerText()).trim(),/^\d+ \/ \d+$/);
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
  // Phone pagination should land at the next question, not the site header.
  await page.locator('.nav-item').first().click();
  const firstQuestionId=await page.locator('.nav-item.active').getAttribute('data-id');
  assert.equal(await page.locator('#prev').isDisabled(),true);
  await page.locator('#next').click();
  await page.waitForFunction(()=>{
    const top=document.getElementById('card').getBoundingClientRect().top;
    return top>=0&&top<=35;
  });
  const secondQuestionId=await page.locator('.nav-item.active').getAttribute('data-id');
  assert.notEqual(secondQuestionId,firstQuestionId);
  assert.match(page.url(),new RegExp('#practice/'+secondQuestionId+'$'));
  await page.locator('#prev').click();
  await page.waitForFunction(()=>{
    const top=document.getElementById('card').getBoundingClientRect().top;
    return top>=0&&top<=35;
  });
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),firstQuestionId);
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
  await page.locator('#next').click();
  await page.waitForFunction(()=>{
    const top=document.getElementById('card').getBoundingClientRect().top;
    return top>=0&&top<=35;
  });
  assert.equal(await page.locator('.nav-item.active').getAttribute('data-id'),secondQuestionId);
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
  assert.equal(await page.locator('.kb-structured-group').count(),3,'放缩运算应有三个运算类别');
  assert.deepEqual(await page.locator('.kb-structured-head h3').allInnerTexts(),['加减法放缩','除法放缩','乘法放缩']);
  assert.deepEqual(await page.locator('.kb-structured-group').first().locator('.kb-structured-item h4').allInnerTexts(),['加法｜有借有还','平均数｜削峰填谷','减法｜公平对待']);
  assert.equal(await page.locator('#kb-structured-multiplication .kb-structured-item').count(),3,'百分数乘法量级判断应显示在乘法放缩');
  assert.match(await page.locator('#kb-structured-multiplication').innerText(),/先用1%判断量级/);
  assert.match(await page.locator('#kb-structured-division').innerText(),/1111/);

  assert.equal(await page.locator('.kb-structured-jump button').count(),3,'应提供三级结构的类别跳转');
  assert.equal(await page.locator('#knowledgeCard .kb-article-section>h3').filter({hasText:'结构与核心规则'}).count(),0,'不应再用流水账式规则列表');
  assert.equal(await page.locator('.kb-formula-table thead th').count(),4,'百化分表的四列表头');
  assert.equal(await page.locator('.kb-formula-table tbody tr').count(),6,'百化分表必须有六行');
  assert.match(await page.locator('#knowledgeCard').innerText(),/错位相减/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/错位相加/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/0.aaa/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/0.09/);
  assert.equal(await page.locator('[data-open-question="data-2015-2016-micro-service-quarterly-average"]').count(),1,'平均数习题必须关联第3课');
  assert.equal(await page.locator('[data-open-question="data-2018-export-cross-border-b2c-growth-rate"]').count(),1,'乘法放缩习题必须关联第3课');
  assert.equal(await page.locator('#kb-structured-division .kb-structured-worked-example').count(),1,'百化分必须有且仅有一条嵌套例题');
  assert.match(await page.locator('#kb-structured-division .kb-structured-worked-example').innerText(),/27007.4/);
  assert.match(await page.locator('#kb-structured-division .kb-structured-worked-example').innerText(),/22046.86/);
  await page.locator('#kb-structured-division .kb-structured-worked-example .katex').first().waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('#kb-structured-multiplication .kb-structured-worked-example').count(),1,'新增例题应在乘法反向放缩方法下');
  assert.match(await page.locator('#kb-structured-multiplication .kb-structured-worked-example').innerText(),/561.4/);
  assert.match(await page.locator('#kb-structured-multiplication .kb-structured-worked-example').innerText(),/257.12/);
  await page.locator('#kb-structured-multiplication .kb-structured-worked-example .katex').first().waitFor({state:'visible',timeout:15000});
  // The sequential navigation should work from the second topic (放缩运算).
  assert.equal(await page.locator('#knowledgeCard [data-kb-prev]').isDisabled(),false);
  await page.locator('#knowledgeCard [data-kb-next]').click();
  assert.match(page.url(),/#data\/knowledge\//);
  assert.match((await page.locator('#knowledgeCard .kb-footer-nav .pill').innerText()).trim(),/^3 \/ \d+$/);
  await page.locator('#knowledgeCard [data-kb-prev]').click();
  assert.match((await page.locator('#knowledgeCard .kb-footer-nav .pill').innerText()).trim(),/^2 \/ \d+$/);
  await page.locator('#tabDataPractice').click();
  assert.equal(await page.locator('#tabDataPractice').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('.nav-item').count(),12);
  assert.equal(await page.locator('.nav-item').first().getAttribute('data-id'),'data-2022-g-legal-aid-average-q1');
  assert.match((await page.locator('.qtop .subtle').innerText()).trim(),/^\d+ \/ \d+$/);
  assert.equal(await page.locator('.da-material-header small').count(),0);
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
  await page.locator('[data-id="data-2015-2016-micro-service-quarterly-average"]').click();
  assert.equal(await page.locator('.da-chart-scroll svg circle').count(),9,'九个季度都应在折线图上显示');
  assert.equal(await page.locator('.da-chart-scroll svg polyline').count(),1);
  assert.match(await page.locator('.da-material').innerText(),/2014年4季度以来小微服务业/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/步骤一 · 以78%为基准/);
  assert.match(await page.locator('.da-explanation').innerText(),/步骤二 · 偏差做差，再除以8个季度/);
  assert.match(await page.locator('.da-explanation').innerText(),/78.2625/);
  await page.locator('[data-id="data-2018-export-cross-border-b2c-growth-rate"]').click();
  assert.equal(await page.locator('.da-material .da-figure table tbody tr').count(),2);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/710/);
  assert.match(await page.locator('.da-explanation').innerText(),/16.7/);
  await page.locator('[data-id="data-2020-national-disposable-income-2019-base"]').click();
  assert.match(await page.locator('.da-material').innerText(),/32189/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/步骤一 · 化除为乘估算增长量/);
  assert.match(await page.locator('.da-explanation').innerText(),/30589/);
  assert.match(await page.locator('.da-explanation').innerText(),/155元/);
  await page.locator('[data-id="data-manufacturing-profit-2010-from-high-tech-share"]').click();
  assert.match(await page.locator('.da-material').innerText(),/7233.7/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/12.6/);
  assert.match(await page.locator('.da-explanation').innerText(),/21696/);
  assert.match(await page.locator('.da-explanation').innerText(),/2.17/);
  await page.locator('[data-id="data-2014-civil-aviation-turnover-growth-jan-nov"]').click();
  assert.equal(await page.locator('.da-material .da-figure table tbody tr').count(),10,'本题10行运输数据应展示');
  assert.match(await page.locator('.da-material').innerText(),/168.7/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/乘法放缩，算完后修正/);
  assert.match(await page.locator('.da-explanation').innerText(),/增长率提前修正/);
  assert.match(await page.locator('.da-explanation').innerText(),/13.44/);
  await page.locator('[data-id="data-2020-poverty-alleviated-counties-rural-income-base"]').click();
  assert.match(await page.locator('.da-material').innerText(),/14051/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/小幅放缩/);
  assert.match(await page.locator('.da-explanation').innerText(),/错位相减/);
  assert.match(await page.locator('.da-explanation').innerText(),/12591/);
  await page.locator('[data-id="data-2022-chemical-api-monthly-growth-over-three"]').click();
  assert.equal(await page.locator('.da-material .da-figure table tbody tr').count(),11,'原图11行统计表须展示');
  assert.match(await page.locator('.da-material').innerText(),/26.9/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/份数思想估算/);
  assert.match(await page.locator('.da-explanation').innerText(),/2.99/);
  assert.match(await page.locator('.da-explanation').innerText(),/3.23/);
  assert.match(await page.locator('.da-explanation').innerText(),/4个月/);
  await page.locator('[data-id="data-2020-rural-income-growth-amount-6p9"]').click();
  assert.match(await page.locator('.da-material').innerText(),/17131/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/乘法放缩/);
  assert.match(await page.locator('.da-explanation').innerText(),/化除为乘的误差修正/);
  assert.match(await page.locator('.da-explanation').innerText(),/1106.7/);
  await page.locator('[data-id="data-2018-tea-export-value-growth-rate"]').click();
  assert.equal(await page.locator('.da-material .da-figure table tbody tr').count(),6,'茶叶出口走势图六年数据应以表格呈现');
  assert.match(await page.locator('.da-material').innerText(),/17.89亿美元/);
  assert.match(await page.locator('.da-material').innerText(),/4.9/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/方法一 · 乘积增长率估算/);
  assert.match(await page.locator('.da-explanation').innerText(),/方法二 · 增长率范围速判/);
  assert.match(await page.locator('.da-explanation').innerText(),/12.05/);
  assert.match(await page.locator('.da-explanation').innerText(),/13.08/);
  await page.locator('[data-id="data-2012-surveying-services-2006-multiple"]').click();
  assert.equal(await page.locator('.da-material .da-figure table tbody tr').count(),6,'测绘服务六年完整数值须展示');
  assert.match(await page.locator('.da-material').innerText(),/30.93/);
  assert.match(await page.locator('.da-material').innerText(),/74.92/);
  await page.locator('#show').click();
  assert.match(await page.locator('.da-explanation').innerText(),/除法放缩/);
  assert.match(await page.locator('.da-explanation').innerText(),/两段倍数直接相乘/);
  assert.match(await page.locator('.da-explanation').innerText(),/2.664/);
  assert.match(await page.locator('.da-explanation').innerText(),/2.7倍/);
  assert.doesNotMatch(await page.locator('.da-explanation').innerText(),/2\.62|乘积不是|笔误|易错点/,'第15题不要将个人笔误当成题目易错点');
  await page.locator('#tabDataKnowledge').click();
  await page.locator('[data-knowledge-topic="data-topic-course-04-estimation"]').click();
  assert.equal(await page.locator('.kb-structured-group').count(),3,'第4课必须按三种方法分组');
  assert.deepEqual(await page.locator('.kb-structured-head h3').allInnerTexts(),['化除为乘','份数思想','放缩法']);
  assert.equal(await page.locator('.kb-structured-jump button').count(),3,'第4课应有三个方法跳转');
  assert.equal(await page.locator('#knowledgeCard .kb-article-section>h3').filter({hasText:'结构与核心规则'}).count(),0,'不得恢复流水账规则列表');
  assert.equal(await page.locator('.kb-formula-table').count(),3,'三方法汇总表及两张速查表必须共存');
  assert.equal(await page.locator('.kb-method-comparison .kb-formula-table tbody tr').count(),3);
  assert.match(await page.locator('.kb-method-comparison').innerText(),/正减负增/);
  assert.match(await page.locator('.kb-method-comparison').innerText(),/分子较整时/);
  assert.equal(await page.locator('.kb-structured-group').first().locator('.kb-formula-table tbody tr').count(),7,'提前修正表必须归属化除为乘');
  assert.equal(await page.locator('.kb-structured-group').nth(1).locator('.kb-formula-table thead th').count(),6);
  assert.equal(await page.locator('.kb-structured-group').nth(1).locator('.kb-formula-table tbody tr').count(),6,'份数思想表必须归属份数思想');
  assert.match(await page.locator('#knowledgeCard').innerText(),/化除为乘/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/提前修正/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/份数思想/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/aa.a%/);
  assert.equal(await page.locator('.kb-structured-group').nth(1).locator('.kb-structured-subitem').count(),3,'份数法修正必须在份数思想中独立展示三种方法');
  assert.deepEqual(await page.locator('.kb-structured-group').nth(1).locator('.kb-structured-subitem h5').allInnerTexts(),['方法一｜增量与增长率近似同比','方法二｜事后修正','方法三｜事前修正']);
  assert.deepEqual(await page.locator('.kb-structured-group').last().locator('.kb-structured-item h4').allInnerTexts(),['适用范围与特点','凑整与结果修正']);
  assert.match(await page.locator('#knowledgeCard').innerText(),/0.7个百分点/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/4.9%/);
  const partsGroup=page.locator('#kb-structured-parts-method');
  assert.equal(await partsGroup.locator('.kb-structured-key-point').count(),2,'份数法两条重点说明必须原位显示');
  assert.match(await partsGroup.locator('.kb-structured-key-point').first().innerText(),/绝对值较大的负数/);
  assert.match(await partsGroup.locator('.kb-structured-key-point').first().innerText(),/放缩法/);
  assert.match(await partsGroup.locator('.kb-structured-key-point').last().innerText(),/分母是近似增长率/);
  assert.equal(await partsGroup.locator('.kb-structured-key-point .da-inline-math').count(),5,'增长率符号与误差公式必须可渲染为LaTeX');
  assert.match(await page.locator('#knowledgeCard').innerText(),/调小现期量/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/更好算/);
  await page.locator('[data-knowledge-section="data-growth-rate"]').click();
  await page.locator('[data-knowledge-topic="data-topic-course-05-growth-decomposition"]').click();
  assert.equal(await page.locator('.kb-structured-group').count(),3,'第5课应有增长率累积、增速拆分和快速计算三节');
  assert.deepEqual(await page.locator('.kb-structured-head h3').allInnerTexts(),['增长率累积· 乘积增长率/间隔增长率','增速的拆分','快速计算']);
  assert.deepEqual(await page.locator('.kb-structured-item h4').allInnerTexts(),['给出两段增长率','给出两段倍数','已知累计增长率与一部分增长率','两段增长率同正或同负','交叉乘积的小数点位次','增速拆分的快速计算','同比增速速判环比增速的跨年变化']);
  assert.match(await page.locator('#knowledgeCard').innerText(),/交叉乘积/);
  assert.match(await page.locator('#knowledgeCard').innerText(),/总倍数基础上减去1/);
  assert.equal(await page.locator('.kb-structured-formula [data-da-tex]').count(),6,'三节共六条公式应正常显示');
  assert.equal(await page.locator('#kb-structured-growth-quick-calculation .kb-structured-example [data-da-tex]').count(),1,'示例应通过公式渲染');
  assert.match(await page.locator('#kb-structured-growth-quick-calculation').innerText(),/同正或同负/);
  assert.match(await page.locator('#kb-structured-growth-quick-calculation').innerText(),/除以100/);
  assert.match(await page.locator('#kb-structured-growth-rate-decomposition').innerText(),/再除以/);
  const splitMethod=page.locator('#kb-structured-growth-quick-calculation .kb-structured-item').nth(2);
  assert.match(await splitMethod.innerText(),/类比为/);
  assert.match(await splitMethod.innerText(),/化除为乘/);
  assert.match(await splitMethod.innerText(),/份数思想/);
  assert.match(await splitMethod.innerText(),/放缩估算/);
  assert.equal(await splitMethod.locator('.kb-structured-formula [data-da-tex]').count(),1,'拆分公式的现期与增长率类比须可渲染');
  const yoyMomMethod=page.locator('#kb-structured-growth-quick-calculation .kb-structured-item').last();
  assert.match(await yoyMomMethod.locator('h4').innerText(),/同比增速速判环比增速的跨年变化/);
  assert.match(await yoyMomMethod.innerText(),/去年同月/);
  assert.match(await yoyMomMethod.innerText(),/同比降低/);
  assert.match(await yoyMomMethod.innerText(),/不代表环比增速一定为正/);
  assert.equal(await yoyMomMethod.locator('.kb-structured-formula [data-da-tex]').count(),1,'同比倍数之比公式须正确渲染');
  await page.locator('#tabPractice').click();
  assert.equal(await page.locator('.nav-item').count(),expectedQuestions);

  await page.locator('[data-knowledge-topic="data-topic-course-06-flatten-growth"]').click();
  assert.deepEqual(await page.locator('.kb-structured-head h3').allInnerTexts(),['基期比','基期比较','增量比较','基期和差'],'第6课应只显示4个主节');
  assert.deepEqual(await page.locator('.kb-structured-jump button').allInnerTexts(),['基期比','基期比较','增量比较','基期和差'],'节内导航也应只有4项');
  assert.equal(await page.locator('.kb-structured-group > .kb-structured-head').count(),4,'四个主节编号标题仍可吸顶');
  const baseRatioSection=page.locator('#kb-structured-flatten-growth-basics');
  assert.deepEqual(await baseRatioSection.locator(':scope > .kb-structured-subtopic > .kb-structured-subtopic-heading').allInnerTexts(),[
    '适用场景与第一步｜平均数增长率',
    '第二步｜给增长率较低的一方补正',
    '计算顺序｜先除后补 / 先补后除'
  ],'三个原小节完整保留在基期比下');
  assert.equal(await baseRatioSection.locator('.kb-structured-subtopic').count(),3,'基期比中必须包含原有三组子知识');
  assert.match(await baseRatioSection.locator('.kb-structured-subtopic').first().innerText(),/平均数增长率/);
  const correctionSection=page.locator('#kb-structured-flatten-growth-correction');
  assert.deepEqual(await correctionSection.locator('.kb-structured-item > h5').allInnerTexts(),['r₁＞r₂｜分母增长率较低，补正分母','r₁＜r₂｜分子增长率较低，补正分子']);
  const orderSection=page.locator('#kb-structured-flatten-growth-calculation-order');
  assert.equal(await orderSection.locator('.kb-flowchart').count(),1,'原决策流程图须保留在计算顺序子知识下');
  assert.deepEqual(await orderSection.locator('.kb-flow-branch .kb-flow-result strong').allInnerTexts(),['先除后补','先补后除']);
  assert.ok((await orderSection.locator('.kb-flowchart').innerText()).includes('A/B 是否好算'));
  assert.deepEqual(await orderSection.locator('.kb-structured-item > h5').allInnerTexts(),['方法一｜先除后补（现期比好算）','方法二｜先补后除（现期比不好算）']);
  assert.equal(await orderSection.locator('.kb-structured-tip').count(),1,'TIP必须跟随原计算顺序方法');
  assert.match(await orderSection.locator('.kb-structured-tip').innerText(),/凑整/);
  assert.match(await orderSection.locator('.kb-structured-tip').innerText(),/倍数关系/);
  assert.match(await orderSection.locator('.kb-structured-tip').innerText(),/10%、25%、33%/);
  assert.equal(await orderSection.locator('.kb-structured-tip li').count(),2);
  assert.equal(await orderSection.locator('.kb-structured-tip').evaluate(el=>getComputedStyle(el).position),'static','TIP不可误吸顶');
  assert.equal(await page.locator('.kb-structured-head').first().evaluate(el=>getComputedStyle(el).position),'sticky','基期比主标题须吸顶');
  assert.equal(await baseRatioSection.locator('.kb-structured-intro').first().evaluate(el=>getComputedStyle(el).position),'static','说明随正文滚动');
  assert.equal(await orderSection.locator('.kb-structured-subtopic-heading').evaluate(el=>getComputedStyle(el).position),'static','子知识标题不应占用额外吸顶空间');
  const comparisonSection=page.locator('#kb-structured-flatten-growth-base-comparison');
  await baseRatioSection.evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top+155));
  await page.waitForFunction(()=>Math.abs(document.querySelector('#kb-structured-flatten-growth-basics > .kb-structured-head').getBoundingClientRect().top)<5);
  await comparisonSection.evaluate(el=>window.scrollTo(0,window.scrollY+el.getBoundingClientRect().top+160));
  await page.waitForFunction(()=>Math.abs(document.querySelector('#kb-structured-flatten-growth-base-comparison > .kb-structured-head').getBoundingClientRect().top)<5);
  assert.ok(await baseRatioSection.locator(':scope > .kb-structured-head').evaluate(el=>el.getBoundingClientRect().top)<-10,'下一主节到来后基期比标题不再吸顶');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await baseRatioSection.locator(':scope > .kb-structured-head').evaluate(el=>getComputedStyle(el).position),'sticky','窄屏主标题仍吸顶');
  assert.equal(await orderSection.locator('.kb-structured-tip').evaluate(el=>getComputedStyle(el).position),'static');
  await page.setViewportSize({width:1280,height:900});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.equal(await page.locator('.knowledge-shell > aside').evaluate(el=>getComputedStyle(el).position),'sticky','桌面端左侧目录依旧吸顶');
  assert.equal(await orderSection.locator('.kb-structured-subitem').count(),4,'计算顺序的四种修正方向均须保留');
  assert.equal(await orderSection.locator('.kb-structured-subitem .kb-structured-formula [data-da-tex]').count(),4);
  assert.equal(await orderSection.locator('.kb-structured-worked-example').count(),2,'原两道例题须保留');
  const ex1=orderSection.locator('.kb-structured-item').nth(1).locator('.kb-structured-subitem').first();
  const ex2=orderSection.locator('.kb-structured-item').first().locator('.kb-structured-subitem').nth(1);
  assert.match(await ex1.locator('.kb-structured-worked-example').innerText(),/7358/);
  assert.match(await ex2.locator('.kb-structured-worked-example').innerText(),/1027/);
  assert.equal(await orderSection.locator('.kb-structured-worked-example .kb-structured-formula [data-da-tex]').count(),4);

  assert.equal(await comparisonSection.locator('.kb-structured-head h3').innerText(),'基期比较');
  assert.deepEqual(await comparisonSection.locator('.kb-structured-item h4').allInnerTexts(),['现期大小与增速大小不同边｜直接判断','现期大小与增速大小同边｜补正后直接除法，与1比较']);
  assert.ok(await comparisonSection.locator('.kb-structured-formula [data-da-tex]').count()>=2);
  assert.match(await comparisonSection.innerText(),/现期比/);
  assert.equal(await comparisonSection.locator('.kb-structured-head').evaluate(el=>getComputedStyle(el).position),'sticky');

  const growthComparisonSection=page.locator('#kb-structured-flatten-growth-increment-comparison');
  assert.equal(await growthComparisonSection.locator('.kb-structured-head h3').innerText(),'增量比较');
  assert.deepEqual(await growthComparisonSection.locator('.kb-structured-subtopic-heading').allInnerTexts(),['增量倍数比较','增量大小比较']);
  assert.deepEqual(await growthComparisonSection.locator('.kb-structured-subtopic').first().locator('.kb-structured-item>h5').allInnerTexts(),['方法一｜分别计算增长量','方法二｜基期比 × 增长率之比']);
  assert.deepEqual(await growthComparisonSection.locator('#kb-structured-subtopic-increment-size-comparison .kb-structured-item>h5').allInnerTexts(),['方法一｜现期与增速同边：大大则大','方法二｜现期与增速不同边：比较基期比与增速比']);
  assert.match(await growthComparisonSection.locator('#kb-structured-subtopic-increment-size-comparison').innerText(),/补正分子/);
  assert.ok(await growthComparisonSection.locator('#kb-structured-subtopic-increment-size-comparison [data-da-tex]').count()>=2);
  assert.equal(await growthComparisonSection.locator('.kb-structured-worked-example').count(),2);
  assert.ok(await growthComparisonSection.locator('.kb-structured-formula [data-da-tex]').count()>=4);
  assert.match(await growthComparisonSection.locator('.kb-structured-worked-example').innerText(),/41.96/);
  const directExample=growthComparisonSection.locator('.kb-structured-item').first().locator('.kb-structured-worked-example');
  assert.equal(await directExample.count(),1);
  assert.match(await directExample.innerText(),/教育支出同比增量/);
  assert.match(await directExample.innerText(),/6.03/);
  assert.match(await directExample.innerText(),/2.28/);
  assert.match(await directExample.innerText(),/最接近B/);
  assert.ok(await directExample.locator('[data-da-tex]').count()>=1);
  assert.equal(await growthComparisonSection.locator('.kb-structured-head').evaluate(el=>getComputedStyle(el).position),'sticky');

  const baseSumDiffSection=page.locator('#kb-structured-flatten-growth-base-sum-difference');
  assert.equal(await baseSumDiffSection.locator('.kb-structured-head h3').innerText(),'基期和差');
  assert.deepEqual(await baseSumDiffSection.locator('.kb-structured-item h4').allInnerTexts(),['增长量容易计算｜现期和差减去增长量和差','r₁＞r₂｜补正B，再计算基期差','r₂＞r₁｜补正A，再计算基期差']);
  assert.ok(await baseSumDiffSection.locator('.kb-structured-formula [data-da-tex]').count()>=3);
  assert.match(await baseSumDiffSection.locator('.kb-structured-item').first().innerText(),/增长量a、b/);
  assert.match(await baseSumDiffSection.innerText(),/补正B本身/);
  assert.match(await baseSumDiffSection.innerText(),/补正A本身/);
  assert.equal(await baseSumDiffSection.locator('.kb-structured-worked-example').count(),0);
  assert.equal(await baseSumDiffSection.locator('.kb-structured-head').evaluate(el=>getComputedStyle(el).position),'sticky');

  // Scanned trend choices should remain visible, and selecting the A–D button still works.
  await page.locator('#tabDataPractice').click();
  await page.locator('[data-id="data-2022-q4-iron-ore-monthly-mom-trend"]').click();
  const figure=page.locator('.da-option-image img');
  assert.equal(await figure.count(),1,'铁矿石趋势题须展示原图选项');
  assert.match(await figure.getAttribute('src'),/iron-ore-mom-options\.webp$/);
  assert.equal(await page.locator('.choice[data-answer]').count(),4,'扫描图选项同时保留A-D选择按钮');
  await page.waitForFunction(()=>{const img=document.querySelector('.da-option-image img');return img&&img.complete&&img.naturalWidth>0},{timeout:12000});
  assert.equal(await figure.evaluate(img=>img.naturalWidth),800,'原始选项图尺寸应为800px宽');
  await page.locator('.choice[data-answer="A"]').click();
  assert.match(await page.locator('.choice[data-answer="A"]').getAttribute('class'),/chosen/);

  // Reproduce early tab switching while data-knowledge.json has not finished loading.
  // The selected module must show its own loading state and repaint automatically.
  const raceContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const racePage=await raceContext.newPage();
  let releaseData;
  const dataGate=new Promise(resolve=>{releaseData=resolve;});
  await raceContext.route('**/data-knowledge.json',async route=>{
    await dataGate;
    await route.continue();
  });
  try{
    await racePage.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await racePage.waitForSelector('.nav-item',{timeout:15000});
    await racePage.locator('#tabKnowledge').click();
    await racePage.locator('#knowledgeCard h2').waitFor({state:'visible',timeout:15000});
    const argumentTitle=await racePage.locator('#knowledgeCard h2').innerText();
    await racePage.locator('#tabDataKnowledge').click();
    assert.equal(await racePage.locator('#tabDataKnowledge').getAttribute('aria-selected'),'true');
    assert.match(await racePage.locator('#knowledgeCard').innerText(),/当前模块的知识体系加载中/);
    assert.doesNotMatch(await racePage.locator('#knowledgeCard').innerText(),new RegExp(argumentTitle));
    releaseData();
    await racePage.waitForFunction(
      ()=>document.querySelector('#knowledgeCard h2')?.textContent.includes('第2课 · 数据分析'),
      null,{timeout:30000}
    );
    assert.match(await racePage.locator('#knowledgeNav').innerText(),/放缩运算/);
    assert.equal(await racePage.locator('#tabDataKnowledge').getAttribute('aria-selected'),'true');
    await racePage.locator('#tabKnowledge').click();
    assert.equal(await racePage.locator('#knowledgeCard h2').innerText(),argumentTitle);
    await racePage.locator('#tabDataKnowledge').click();
    assert.match(await racePage.locator('#knowledgeCard h2').innerText(),/第2课 · 数据分析/);
  }finally{
    releaseData();
    await raceContext.close();
  }

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
