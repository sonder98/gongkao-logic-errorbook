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

  assert.equal(await page.title(), '逻辑判断 · 云同步错题本 V2');
  assert.equal(await page.locator('.nav-item').count(), 5);
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
  assert.match(await page.locator('.stats .num').first().innerText(), /^1\s*\/\s*5$/);

  await page.locator('[data-id="2022-dingcan"]').click();
  await page.locator('#show').click();
  assert.match(await page.locator('.result').innerText(), /正确答案 B/);
  assert.match(await page.locator('.stats .num').first().innerText(), /^1\s*\/\s*5$/);

  await page.locator('#note').fill('<img src=x onerror="window.__xss=true">');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.evaluate(() => window.__xss), undefined);

  const authStatus = await page.locator('#authStatus').innerText();
  assert.doesNotMatch(authStatus, /未配置 Supabase|连接配置异常/);

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('.maincard').isVisible(), true);
  assert.equal(await page.locator('.choice').first().isVisible(), true);

  await browser.close();

  console.log(JSON.stringify({
    ok: true,
    url,
    browserChannel,
    questions: 5,
    persistence: true,
    directRevealDoesNotComplete: true,
    xssEscaping: true,
    mobileViewport: true,
    authStatus,
    consoleErrors,
    failedResources
  }, null, 2));
})().catch(async error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
