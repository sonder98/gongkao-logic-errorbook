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
const courseTopics=book.sections.flatMap(section=>section.topics);
assert.equal(courseTopics.length,12,'资料分析课程节点应覆盖第2至13课');
assert.equal(book.sections[0].chapter,'一、速算');
assert.deepEqual(book.sections[0].topics.map(t=>t.title),[
  '第2课 · 数据分析','第3课 · 放缩运算','第4课 · 快速估算'
]);
assert.deepEqual(courseTopics.map(t=>t.title),[
  '第2课 · 数据分析','第3课 · 放缩运算','第4课 · 快速估算',
  '第5课 · 增速的累积与拆分','第6课 · 拉平增长率',
  '第7课 · 分式混合','第8课 · 分式比较大小','第9课 · 比重特殊问题',
  '第10课 · 年均变化','第11课 · 增长贡献率与拉动增长率',
  '第12课 · 容斥问题','第13课 · 假设代入'
]);

const scaling=courseTopics.find(t=>t.id==='data-topic-course-03-scaling');
assert.ok(scaling,'放缩运算知识点 ID 必须保持稳定');
assert.ok(scaling.tables?.[0]?.headers?.length===4,'百化分速查表需显示为四列表格');
assert.equal(scaling.tables[0].rows.length,6,'百化分速查表条目不完整');
const conversionRows=JSON.stringify(scaling.tables[0].rows);
for(const item of ['0.333','0.125','0.111','0.09','0.aaa','0.667','0.286']) {
 assert.ok(conversionRows.includes(item),'缺失百化分条目：'+item);
}
assert.ok(scaling.patterns.some(s=>s.includes('错位相减')&&s.includes('10')),'缺少乘9错位相减');
assert.ok(scaling.patterns.some(s=>s.includes('错位相加')&&s.includes('11')),'缺少乘11错位相加');
assert.ok(scaling.pitfalls.some(s=>s.includes('0.09')&&s.includes('1/11')),'缺少0.09和1/11近似误差警告');
assert.deepEqual(scaling.questionIds,['data-2022-g-legal-aid-average-q1','data-2018-q-passenger-average-distance','data-2017-jiangsu-neighbors-unaware-count'],'第3课应关联三道正式题');
assert.ok(scaling.patterns.some(s=>s.includes('有效数字→量级判断')),'应保留连续两步的课堂原则');
assert.equal(materials.length,3,'应有三份真实材料');
assert.equal(questions.length,3,'应有三道真实题目');
const legalQuestion=questions[0];
assert.equal(legalQuestion.id,'data-2022-g-legal-aid-average-q1');
assert.equal(legalQuestion.materialId,'data-material-2022-g-legal-aid-average');
assert.equal(legalQuestion.answer,'A');
assert.equal(legalQuestion.options.length,4);
assert.ok(legalQuestion.analysis.formula.includes('\\frac{218}{200}'),'保留218/200的放缩过程');
assert.ok(legalQuestion.analysis.quick.includes('215.6>213'),'保留与1.1直接比较的过程');
const legalHTML=DA.explanationHtml(legalQuestion);
assert.match(legalHTML,/方法一 · 除法放缩/);
assert.match(legalHTML,/方法二 · 直接和选项比/);
assert.equal((legalHTML.match(/data-da-tex/g)||[]).length,5,'两种方法应显示5段数学公式');
const futureVertical=DA.explanationHtml({...legalQuestion,longDivision:' 1.08\\n196 ) 213\\n<bad>'});
assert.ok(futureVertical.includes('da-long-division'),'竖式渲染入口必须存在');
assert.ok(futureVertical.includes('&lt;bad&gt;'),'竖式内容必须转义为纯文本');
const distance=questions.find(q=>q.id==='data-2018-q-passenger-average-distance');
assert.ok(distance,'2018年Q省平均运输距离题未入库');
assert.equal(distance.materialId,'data-material-2018-q-transport-passenger-distance');
assert.equal(distance.answer,'D');
assert.equal(distance.options[2],'1170公里');
assert.equal(distance.options[3],'117公里');
assert.equal(distance.analysis.formulaTitle,'步骤一 · 除法放缩（先算有效数字）');
assert.equal(distance.analysis.quickTitle,'步骤二 · 看选项，确定量级');
assert.ok(distance.analysis.formula.includes('168\\times7=1176'));
assert.ok(distance.analysis.quick.includes('\\frac{1768}{15}'));
assert.ok(distance.analysis.trap.includes('连续两步'));
const distanceMaterial=materials.find(m=>m.id==='data-material-2018-q-transport-passenger-distance');
assert.equal(distanceMaterial.blocks[0].type,'table');
assert.equal(distanceMaterial.blocks[0].rows.length,11);
assert.ok(distanceMaterial.blocks[1].text.includes('1768.2亿人公里'));
assert.ok(DA.materialHtml(distanceMaterial).includes('da-table-scroll'));
assert.match(DA.explanationHtml(distance),/步骤二 · 看选项，确定量级/);
const neighbors=questions.find(q=>q.id==='data-2017-jiangsu-neighbors-unaware-count');
assert.ok(neighbors,'2017江苏邻里关系题应入库');
assert.equal(neighbors.materialId,'data-material-2016-neighbor-relationship-survey');
assert.deepEqual(neighbors.options,['275人','365人','412人','418人']);
assert.equal(neighbors.answer,'D');
assert.equal(neighbors.analysis.formulaTitle,'方法一 · 百化分并修正误差');
assert.equal(neighbors.analysis.quickTitle,'方法二 · 乘法放缩、错位相加');
assert.ok(neighbors.analysis.formula.includes('105\\times4'));
assert.ok(neighbors.analysis.quick.includes('376+37.6'));
assert.ok(neighbors.analysis.quick.includes('413.6+4'));
assert.ok(neighbors.analysis.trap.includes('945→940')&&neighbors.analysis.trap.includes('44.2%→44%'),'误差应归因于两处放缩，而非错位相加本身');
assert.ok(scaling.patterns.some(s=>s.includes('乘法放缩')&&s.includes('r^2')),'乘法反向等比例放缩公式应入知识库');
assert.ok(scaling.patterns.some(s=>s.includes('8622')&&s.includes('9000')));
const neighborHTML=DA.explanationHtml(neighbors);
assert.match(neighborHTML,/方法一 · 百化分并修正误差/);
assert.match(neighborHTML,/方法二 · 乘法放缩、错位相加/);
assert.ok((neighborHTML.match(/data-da-tex/g)||[]).length>=3);
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
