const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js');

assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
assert.match(html, /name="apple-mobile-web-app-title" content="Exam"/);
assert.match(html, /name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
assert.match(html, /rel="apple-touch-icon" sizes="192x192" href="\\.\\/icons\\/apple-touch-icon-v3\\.png"/);
assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(html, /navigator\.serviceWorker\.register\('\.\/sw\.js'/);

assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.lang, 'zh-CN');
assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.type === 'image/svg+xml' && icon.purpose.includes('maskable')));
assert.ok(read('icons/icon-512.svg').includes('width="512" height="512"'));

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function checkPng(file, size) {
  const png = fs.readFileSync(path.join(root, file));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file + ' PNG signature');
  assert.equal(png.readUInt32BE(16), size, file + ' width');
  assert.equal(png.readUInt32BE(20), size, file + ' height');
  let offset = 8, ended = false;
  const imageData = [];
  while (offset < png.length) {
    assert.ok(offset + 12 <= png.length, file + ' truncated PNG');
    const length = png.readUInt32BE(offset);
    assert.ok(offset + 12 + length <= png.length, file + ' truncated PNG chunk');
    const tag = png.toString('ascii', offset + 4, offset + 8);
    assert.equal(crc32(png.subarray(offset + 4, offset + 8 + length)),
      png.readUInt32BE(offset + 8 + length), file + ' invalid ' + tag + ' CRC');
    if (tag === 'IDAT') imageData.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (tag === 'IEND') { ended = true; break; }
  }
  assert.ok(ended && imageData.length, file + ' missing image data');
  const channels = { 2: 3, 6: 4 }[png[25]];
  assert.ok(channels && png[24] === 8, file + ' unsupported PNG format');
  const decoded = zlib.inflateSync(Buffer.concat(imageData));
  assert.equal(decoded.length, size * (1 + size * channels), file + ' invalid image scanlines');
}
for (const [file, expectedSize] of [
  ['icons/icon-192.png', 192],
  ['icons/apple-touch-icon.png', 192],
  ['icons/apple-touch-icon-v3.png', 192]
]) checkPng(file, expectedSize);
assert.ok(sw.includes('./icons/apple-touch-icon-v3.png'), 'SW must precache the current iOS icon');

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
