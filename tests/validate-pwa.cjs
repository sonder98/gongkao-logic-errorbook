const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js');

assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
assert.match(html, /name="apple-mobile-web-app-title" content="公考错题本"/);
assert.match(html, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
assert.match(html, /rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png"/);
assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js'/);

assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.lang, 'zh-CN');
assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose.includes('maskable')));

for (const [file, expectedSize] of [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/apple-touch-icon.png', 180]
]) {
  const png = fs.readFileSync(path.join(root, file));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file + ' must be a PNG');
  assert.equal(png.readUInt32BE(16), expectedSize, file + ' width');
  assert.equal(png.readUInt32BE(20), expectedSize, file + ' height');
}

for (const file of [
  'questions.json',
  'knowledge.json',
  'formal-questions.json',
  'formal-knowledge.json',
  'data-materials.json',
  'data-questions.json',
  'data-knowledge.json'
]) {
  assert.ok(sw.includes('./' + file), 'Service Worker should precache ' + file);
  assert.match(html, new RegExp("fetch\\('" + file.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + "'\\s*,\\s*\\{\\s*cache\\s*:\\s*'no-cache'\\s*\\}\\)"));
}

assert.match(sw, /async function networkFirst\(request\)/);
assert.match(sw, /const response = await fetch\(request\)/);
assert.match(sw, /await cache\.put\(request, response\.clone\(\)\)/);
assert.match(sw, /if \(cached\) return cached/);

console.log('PWA manifest, iOS metadata, icons, service worker and no-cache data loading: OK');
