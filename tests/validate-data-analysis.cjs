const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
require('../data-analysis.js');
const DA=globalThis.DataAnalysis;
const materials=JSON.parse(fs.readFileSync(path.join(root,'data-materials.json'),'utf8'));
const questions=JSON.parse(fs.readFileSync(path.join(root,'data-questions.json'),'utf8'));
const book=JSON.parse(fs.readFileSync(path.join(root,'data-knowledge.json'),'utf8'));
const argument=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const formal=JSON.parse(fs.readFileSync(path.join(root,'formal-questions.json'),'utf8'));
const argumentBook=JSON.parse(fs.readFileSync(path.join(root,'knowledge.json'),'utf8'));
const formalBook=JSON.parse(fs.readFileSync(path.join(root,'formal-knowledge.json'),'utf8'));
assert.ok(DA.validate(materials,questions,book,
  [...argument,...formal].map(q=>q.id),
  [...argumentBook.sections,...formalBook.sections].flatMap(s=>s.topics.map(t=>t.id))));
const fixtures=[{
  id:'data-material-fixture',title:'功能验证：示例材料',year:'未知',exam:'测试',
  blocks:[
    {type:'paragraph',text:'2024 年同比增长。'},
    {type:'table',columns:['年份','收入'],rows:[['2023','120'],['2024','150']],caption:'单位：亿元'},
    {type:'chart',chartType:'bar',data:[{label:'2023',value:120},{label:'2024',value:150}]},
    {type:'image',src:'assets/data-analysis/example.webp',alt:'图片示例（仅校验路径）'}
  ]
}];
const fixtureQuestions=[{
  id:'data-fixture-question',materialId:'data-material-fixture',title:'测试题',stem:'根据材料',
  category:'增长率',ask:'2024 年的增长率是多少？',options:['10%','20%','25%','30%'],answer:'C',
  analysis:{identify:'增长率',locate:'2023 和 2024 年',formula:'\\[\\frac{150-120}{120}=25\\%\\]',quick:'30÷120',trap:'分母取基期'},rule:'分母取基期'
}];
const fixtureBook={sections:[{id:'fixture',chapter:'测试',title:'测试',topics:[{
 id:'data-topic-fixture',title:'基础',summary:'基础',questionIds:['data-fixture-question']
}]}]};
assert.ok(DA.validate(fixtures,fixtureQuestions,fixtureBook,argument.map(x=>x.id)));
const content=DA.materialHtml(fixtures[0]);
assert.match(content,/da-table-scroll/);
assert.match(content,/da-chart-scroll/);
assert.match(content,/loading="lazy"/);
assert.match(content,/assets\/data-analysis\/example.webp/);
assert.match(DA.explanationHtml(fixtureQuestions[0]),/data-da-tex/);
assert.match(DA.rich('\\(\\frac{a}{b}\\)'),/data-da-tex/);
assert.equal(DA.rich('<img src=x>'),'&lt;img src=x&gt;');
assert.throws(()=>DA.validate([{...fixtures[0],blocks:[{type:'image',src:'data:image/png;base64,abc',alt:'no'}]}],fixtureQuestions,fixtureBook),/图片/);
assert.throws(()=>DA.validate(fixtures,[{...fixtureQuestions[0],materialId:'unknown'}],fixtureBook),/关联无效/);
assert.throws(()=>DA.validate(fixtures,[fixtureQuestions[0],fixtureQuestions[0]],fixtureBook),/关联无效/);
console.log('Data analysis OK:',materials.length,'materials,',questions.length,'questions,',
  book.sections.reduce((sum,s)=>sum+s.topics.length,0),'knowledge topics; rendering fixture validated');
