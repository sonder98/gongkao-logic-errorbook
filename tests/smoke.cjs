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

  assert.equal(await page.title(), '逻辑判断 · 知识体系与云同步错题本');
  const expectedQuestions = Number(await page.locator('#questionCount').innerText());
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


  // Knowledge tab: searchable navigation, structured notes, and both-way links.
  await page.locator('#tabKnowledge').click();
  assert.equal(await page.locator('#knowledgeView').isVisible(),true);
  assert.equal(await page.locator('#practiceView').isVisible(),false);
  const knowledgeResponse=await page.request.get(new URL('knowledge.json',url).href);
  assert.equal(knowledgeResponse.status(),200);
  const book=await knowledgeResponse.json();
  const totalTopics=book.sections.reduce((n,s)=>n+s.topics.length,0);
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
  await page.locator('[data-knowledge-section="effect"]').click();
  assert.equal(await page.locator('[data-knowledge-section="effect"]').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('[data-knowledge-section="foundation"]').getAttribute('aria-expanded'),'false');
  assert.match(await page.locator('#knowledgeCard h2').innerText(),/由果推因/);
  assert.match(page.url(),/#knowledge\/effect-overview$/);
  assert.equal(await page.locator('[data-knowledge-topic]').count(),
    book.sections.find(s=>s.id==='effect').topics.length);
  await page.locator('#knowledgeSearch').fill('规范性前提');
  assert.ok((await page.locator('[data-knowledge-topic]').count())>0);
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
  await page.locator('#tabPractice').click();
  await page.locator('[data-id="2008-yumi"]').click();

  assert.equal(await page.locator('.choice').count(), 5);

  await page.locator('[data-answer="E"]').click();
  await page.locator('#submit').click();
  assert.match(await page.locator('.result').innerText(), /答对了/);

  await page.locator('#note').fill('自动化冒烟测试笔记');
  await page.locator('#review').check();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.nav-item', { timeout: 15000 });

  assert.equal(await page.locator('#note').inputValue(), '自动化冒烟测试笔记');
  assert.equal(await page.locator('#review').isChecked(), true);
  assert.equal((await page.locator('.stats .num').first().innerText()).replace(/\s/g, ''), '1/'+expectedQuestions);

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
