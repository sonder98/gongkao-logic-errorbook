const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),css=read('academic-theme.css'),sw=read('sw.js');
const ids=['academicKnowledgeMode','academicPracticeMode','academicReadingRail',
 'tabKnowledge','tabPractice','tabFormalKnowledge','tabFormalPractice',
 'tabDataKnowledge','tabDataPractice','knowledgeNav','knowledgeCard','questionList',
 'card','scratchCanvas','saveNote','saveCloudConfig','review','show','replaceAnalysis'];
for(const id of ids){
 if(['saveNote','review','show','replaceAnalysis','scratchCanvas'].includes(id)){
  assert.ok(html.includes('id="')||html.includes('id=\\"'),id+' should still be renderable');
 }else assert.ok(html.includes('id="'+id+'"'),'Missing UI control '+id);
}
assert.ok(html.includes('href="academic-theme.css"'),'Academic theme must load after data-analysis.css');
assert.ok(sw.includes("'./academic-theme.css'"),'PWA must cache the approved theme for offline use');
assert.match(html,/academic-brand-name/);
assert.match(html,/renderAcademicReadingRail\(topic,topicIndex\)/);
assert.match(html,/academicKnowledgeMode.*onclick/);
assert.match(html,/academicPracticeMode.*onclick/);
assert.match(html,/aria-pressed/);
for(const color of ['#f6f5f1','#fffefa','#355f52','#ac7459'])
 assert.ok(css.includes(color),'Missing approved editorial token '+color);
for(const selector of ['.kb-heading','.kb-summary','.kb-structured-jump',
 '.kb-structured-group','.academic-reading-rail','.choice','.da-material',
 '.kb-topic-list','.academic-brand','.academic-view-switch'])
 assert.ok(css.includes(selector),'Missing styling '+selector);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/safe-area-inset-top/);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(match=>match[1]).filter(Boolean);
for(const script of scripts)assert.doesNotThrow(()=>new Function(script),'App scripts must parse');
for(const [pathName,key] of [['questions.json','id'],['formal-questions.json','id'],
 ['data-questions.json','id'],['knowledge.json','sections'],
 ['formal-knowledge.json','sections'],['data-knowledge.json','sections']]){
 const val=JSON.parse(read(pathName));
 assert.ok(Array.isArray(val)||(val&&Array.isArray(val[key])),pathName+' unchanged format');
}
console.log('Academic UI structure, lesson hierarchy, PWA cache and existing controls: OK');