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
assert.deepEqual(scaling.contentSections.map(s=>s.title),['加减法放缩','除法放缩','乘法放缩'],'第3课必须按运算类别划分');
assert.deepEqual(scaling.contentSections.map(s=>s.items.length),[3,6,2],'第3课的方法层级和数量不能丢失');
assert.ok(!scaling.patterns,'第3课不再采用按录入顺序堆积的规则列表');
const addSub=scaling.contentSections[0],division=scaling.contentSections[1],multiplication=scaling.contentSections[2];
assert.deepEqual(addSub.items.map(item=>item.title),['加法｜有借有还','平均数｜削峰填谷','减法｜公平对待']);
const averageMethod=addSub.items.find(item=>item.title==='平均数｜削峰填谷');
assert.equal(averageMethod.example,undefined,'禁止把未由用户提供的60000基准示例混入知识体系');
assert.ok(averageMethod.formula.includes('偏差之和'),'保留用户确认的基准数与偏差方法');
assert.ok(scaling.questionIds.includes('data-2015-2016-micro-service-quarterly-average'),'用户给出的平均数题须保留在正式习题集内');
const fraction=division.items.find(item=>item.title.includes('百化分')).table;
assert.ok(fraction?.headers?.length===4,'百化分速查表需在除法部分展示为四列');
assert.equal(fraction.rows.length,6,'百化分速查表条目不完整');
const fractionMethod=division.items.find(item=>item.title==='百化分｜常用分数对照');
assert.equal(fractionMethod.workedExamples?.length,1,'百化分例题应内嵌在原方法下，不增加平级知识');
const fractionExample=fractionMethod.workedExamples[0];
assert.ok(fractionExample.title.includes('27007.4')&&fractionExample.title.includes('1.225'),'例题数值必须精确');
assert.ok(fractionExample.formula.includes('\\frac{270}{123}'),'保留270/123心算步骤');
assert.ok(fractionExample.formula.includes('\\text{分母}+2')&&fractionExample.formula.includes('\\text{分子}+5'),'保留先凑分母、分子补偿顺序');
assert.ok(fractionExample.formula.includes('\\frac{275}{125}')&&fractionExample.formula.includes('275\\times8'),'保留百化分乘8步骤');
assert.ok(fractionExample.formula.includes('=2200')&&fractionExample.formula.includes('22000'),'保留有效数字与恢复量级的连续两步');
assert.ok(fractionExample.note.includes('22046.86'),'验证实际量级');
assert.ok(Math.abs(27007.4/1.225-22046.857142857)<0.01,'真实除法值不符');
const conversionRows=JSON.stringify(fraction.rows);
for(const item of ['0.333','0.125','0.111','0.09','0.aaa','0.667','0.286']) {
 assert.ok(conversionRows.includes(item),'缺失百化分条目：'+item);
}
assert.ok(division.items.some(item=>item.title.includes('错位相减')&&item.formula.includes('10')),'缺少乘9错位相减');
assert.ok(division.items.some(item=>item.title.includes('错位相加')&&item.formula.includes('11')),'缺少乘11错位相加');
assert.ok(division.items.some(item=>item.title.includes('错位相加')&&item.caution.includes('0.09')&&item.caution.includes('1/11')),'缺少0.09和1/11近似误差警告');
assert.ok(division.items.some(item=>item.title.includes('精度与量级判断')&&item.example.includes('1170')),'有效数字与量级连续步骤应保留');
assert.ok(multiplication.items.some(item=>item.title.includes('反向')&&item.formula.includes('r^2')),'缺少乘法反向放缩');
assert.ok(multiplication.items.some(item=>item.example&&item.example.includes('8622')&&item.example.includes('9000')),'缺少乘法凑整例题');
const reverse= multiplication.items.find(item=>item.title==='反向近等比例调整');
assert.ok(reverse,'乘法反向放缩方法应保留');
assert.equal(reverse.workedExamples?.length,1,'新例题应归入原有反向放缩方法，不新建同级条目');
const newExample=reverse.workedExamples[0];
assert.ok(newExample.title.includes('561.4')&&newExample.title.includes('45.8%'));
assert.ok(newExample.formula.includes('561.4+15'),'需保留用户的现期向上补偿心算过程');
assert.ok(newExample.formula.includes('576\\times\\frac49'),'须保留576乘4/9的百化分计算');
assert.ok(newExample.formula.includes('=256'),'576×4/9正确结果是256');
assert.ok(!newExample.formula.includes('2534')&&!newExample.formula.includes('2559'),'不得保留错误乘积与补偿');
assert.ok(newExample.note.includes('257.12')&&newExample.note.includes('偏小1%'),'须说明真实值和不应自动加1%');
assert.deepEqual(scaling.questionIds,['data-2022-g-legal-aid-average-q1','data-2018-q-passenger-average-distance','data-2017-jiangsu-neighbors-unaware-count','data-2015-2016-micro-service-quarterly-average','data-2018-export-cross-border-b2c-growth-rate'],'第3课应关联五道正式题');
assert.ok(division.items.some(item=>item.title==='精度与量级判断'&&item.example.includes('连续两个步骤')),'应保留有效数字、量级判断连续两步');
assert.equal(materials.length,7,'应有七份真实材料');
assert.equal(questions.length,7,'应有七道真实题目');
const meanMaterial=materials.find(m=>m.id==='data-material-2014q4-2016q4-micro-service-operations');
const meanQuestion=questions.find(q=>q.id==='data-2015-2016-micro-service-quarterly-average');
assert.ok(meanMaterial&&meanQuestion,'2015—2016年平均占比习题和图表必须入库');
assert.equal(meanMaterial.blocks.length,1,'不应上传原截图');
const meanChart=meanMaterial.blocks[0];
assert.equal(meanChart.type,'chart');
assert.equal(meanChart.chartType,'line');
assert.equal(meanChart.yMin,73);
assert.equal(meanChart.yMax,82);
assert.equal(meanChart.data.length,9,'原折线图9个季度均应保留');
assert.deepEqual(meanChart.data.map(d=>d.value),[76.7,79.5,77.2,78.2,76.2,77.9,76.5,81.1,79.5]);
assert.equal(meanQuestion.materialId,meanMaterial.id);
assert.equal(meanQuestion.category,'加减法放缩');
assert.equal(meanQuestion.type,'平均数');
assert.equal(meanQuestion.answer,'B');
assert.deepEqual(meanQuestion.options,['77.2%','78.3%','79.6%','82.8%']);
assert.equal(meanQuestion.rule,undefined,'这道题只按现有知识分类，不生造新规则');
assert.ok(meanQuestion.analysis.formula.includes('6.3')&&meanQuestion.analysis.formula.includes('4.2'));
assert.ok(meanQuestion.analysis.quick.includes('\\frac{6.3-4.2}{8}'),'偏差做差后必须除以8');
assert.ok(meanQuestion.analysis.quick.includes('78.2625'),'结果应为78.2625%');
assert.match(DA.materialHtml(meanMaterial),/da-chart-scroll/);
assert.match(DA.explanationHtml(meanQuestion),/步骤二 · 偏差做差，再除以8个季度/);
const eightValues=meanChart.data.slice(1).map(d=>d.value);
assert.ok(Math.abs(eightValues.reduce((a,b)=>a+b,0)/8-78.2625)<1e-10);
const ecommerceMaterial=materials.find(m=>m.id==='data-material-2017-2018-export-cross-border-ecommerce');
const ecommerceQuestion=questions.find(q=>q.id==='data-2018-export-cross-border-b2c-growth-rate');
assert.ok(ecommerceMaterial&&ecommerceQuestion,'跨境电商乘法放缩习题及材料须入库');
assert.equal(ecommerceMaterial.blocks.length,2,'原图不需要保存');
assert.deepEqual(ecommerceMaterial.blocks[1].rows,[['2017年','6.3','81%'],['2018年','7.1','80.3%']]);
assert.equal(ecommerceQuestion.category,'乘法放缩');
assert.equal(ecommerceQuestion.type,'增长率');
assert.equal(ecommerceQuestion.answer,'B');
assert.deepEqual(ecommerceQuestion.options,['14%','17%','20%','23%']);
assert.equal(ecommerceQuestion.rule,undefined,'不新建未经确认的方法');
assert.ok(ecommerceQuestion.analysis.formula.includes('710\\times197'));
assert.ok(ecommerceQuestion.analysis.formula.includes('700\\times200'));
assert.ok(ecommerceQuestion.analysis.formula.includes('630\\times190'));
assert.ok(ecommerceQuestion.analysis.formula.includes('600\\times200'));
assert.ok(ecommerceQuestion.analysis.quick.includes('\\frac{14-12}{12}'));
assert.ok(ecommerceQuestion.analysis.quick.includes('16.7\\%'));
assert.match(DA.explanationHtml(ecommerceQuestion),/步骤二 · 用两年的B2C规模求增长率/);
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
assert.ok(multiplication.items.some(item=>item.formula?.includes('1-r^2')),'乘法等比例误差公式应入知识库');
const neighborHTML=DA.explanationHtml(neighbors);
assert.match(neighborHTML,/方法一 · 百化分并修正误差/);
assert.match(neighborHTML,/方法二 · 乘法放缩、错位相加/);
assert.ok((neighborHTML.match(/data-da-tex/g)||[]).length>=3);
const estimation=courseTopics.find(t=>t.id==='data-topic-course-04-estimation');
assert.ok(estimation,'第4课快速估算主题须保持稳定');
assert.deepEqual(estimation.questionIds,['data-2015-hebei-2013-highway-passengers','data-2020-fujian-2018-industrial-profits']);
assert.deepEqual(estimation.contentSections.map(s=>s.title),['化除为乘','份数思想','放缩法'],'第4课应有三种独立方法');
assert.deepEqual(estimation.contentSections.map(s=>s.items.length),[8,3,2],'第4课应保持方法的内部层级');
assert.equal(estimation.patterns,undefined,'第4课不得重新堆积为扁平规则列表');
assert.equal(estimation.tables,undefined,'速查表必须归入对应的方法');
const conversion=estimation.contentSections[0],parts=estimation.contentSections[1],scalingMethod=estimation.contentSections[2];
assert.equal(estimation.methodComparison.title,'三种快速估算方法对比');
assert.deepEqual(estimation.methodComparison.rows.map(row=>row[0]),['化除为乘','份数思想','放缩法']);
assert.equal(estimation.methodComparison.rows.length,3);
assert.equal(estimation.methodComparison.rows[0][2],'快且准');
assert.equal(estimation.methodComparison.rows[1][3],'精确计算较复杂');
assert.equal(estimation.methodComparison.rows[2][2],'精准');
assert.equal(estimation.methodComparison.rows[2][3],'不够快');
assert.ok(estimation.methodComparison.rows[0][4].includes('正减负增'));
assert.ok(estimation.methodComparison.rows[1][4].includes('近似同比'));
assert.ok(estimation.methodComparison.rows[2][4].includes('分子较整时'));
assert.ok(scalingMethod.items.some(x=>x.description.includes('不够快')));
assert.ok(scalingMethod.items.some(x=>x.description.includes('放缩幅度不要太大')&&x.description.includes('分子比较整')));
assert.ok(conversion.items.some(x=>x.title.includes('正增长')&&x.formula.includes('修正')),'化除为乘应包含正增长修正');
assert.ok(conversion.items.some(x=>x.title.includes('负增长')&&x.formula.includes('1-t')),'化除为乘应包含负增长估算');
assert.ok(conversion.items.some(x=>x.title.includes('修正时机')&&x.formula.includes('16.52')),'保留提前/延后修正口径');
assert.ok(conversion.items.some(x=>x.title.includes('平方速判')&&x.example.includes('49＋40')),'保留正负增长率平方速判');
assert.ok(conversion.items.some(x=>x.title==='先算增长量再反推基期'&&x.formula.includes('185.32')),'河北例题应归入化除为乘');
assert.ok(conversion.items.some(x=>x.title==='提前修正与凑整'&&x.formula.includes('1042.8')),'福建例题应归入化除为乘');
const correction=conversion.items.find(x=>x.table).table;
assert.equal(correction.rows.length,7,'提前修正表应为7行');
for(const x of ['2.04%','3.1%','4.2%','7.5%','−7.4%'])assert.ok(JSON.stringify(correction).includes(x));
const partTable=parts.items.find(x=>x.table).table;
assert.equal(partTable.rows.length,6,'份数思想表应保留左右各6行');
assert.equal(partTable.headers.length,6,'份数思想表应为6列');
assert.deepEqual(partTable.rows.map(row=>row[0]),['50%','33.3%','25.0%','20.0%','16.7%','14.3%']);
assert.deepEqual(partTable.rows.map(row=>row[3]),['12.5%','11.1%','aa.a%','28.6%','40%','66.7%']);
assert.equal(partTable.rows[0][2],'\\(\\frac13\\)');
assert.equal(partTable.rows[1][5],'\\(\\frac1{10}\\)');
assert.equal(partTable.rows[2][4],'\\(\\frac a9\\)');
assert.equal(partTable.rows[2][5],'\\(\\frac{a}{9+a}\\)');
assert.equal(partTable.rows[3][4],'\\(\\frac27\\)');
assert.equal(partTable.rows[3][5],'\\(\\frac29\\)');
assert.ok(parts.items.some(x=>x.title.includes('份数关系')&&x.formula.includes('n+1')),'应保留份数思想核心公式');
const partsCorrection=parts.items.find(x=>x.title==='份数法修正');
assert.ok(partsCorrection,'份数法修正必须属于份数思想');
assert.deepEqual(partsCorrection.subitems.map(x=>x.title),['方法一｜增量与增长率近似同比','方法二｜事后修正','方法三｜事前修正'],'份数法修正必须按既定顺序保留三种方法');
assert.ok(partsCorrection.subitems[0].formula.includes('\\frac{1+r_2}{1+r_1}'),'方法一必须保留增长量与增长率近似同比的推导');
assert.ok(partsCorrection.subitems[0].example.includes('4.9\\%'),'方法一应区别0.7个百分点和增长量约4.9%的相对补偿');
assert.ok(partsCorrection.subitems[1].formula.includes('15\\%-14.3\\%'),'方法二应使用真实增速与近似增速的0.7个百分点之差');
assert.ok(partsCorrection.subitems[1].example.includes('0.7\\%'),'方法二必须保留用近似基期补算遗漏的增长量');
assert.ok(partsCorrection.subitems[2].description.includes('增长率估大'),'事前修正应先判断增长率是否估大');
assert.ok(partsCorrection.subitems[2].description.includes('现期量'),'事前修正应通过调整现期量来补偿');
assert.ok(partsCorrection.subitems[2].caution.includes('更好算'),'只有调整后便于凑整才优先事前修正');
assert.ok(partsCorrection.subitems[2].caution.includes('事后修正'),'无法凑整时应采用事后修正');
assert.ok(!conversion.items.some(x=>x.title.includes('份数法修正')),'份数法修正不得混入化除为乘');

const hebei=questions.find(q=>q.id==='data-2015-hebei-2013-highway-passengers');
const fujian=questions.find(q=>q.id==='data-2020-fujian-2018-industrial-profits');
assert.ok(hebei&&fujian,'2015河北、2020福建两道例题必须入库');
assert.deepEqual(hebei.options,['184.31','185.16','185.31','186.15']);
assert.deepEqual(fujian.options,['899.3','965.9','1043.1','1066.3']);
assert.equal(hebei.answer,'C');
assert.equal(fujian.answer,'C');
assert.match(hebei.analysis.formula,/5\.33/);
assert.ok(hebei.analysis.quick.includes('5.33')&&hebei.analysis.quick.includes('5.18'));
assert.ok(fujian.analysis.formula.includes('49+40=89'));
assert.ok(fujian.analysis.quick.includes('960\\times8\\%'));
assert.ok(fujian.analysis.quick.includes('1042.8'));
assert.ok(DA.explanationHtml(hebei).includes('data-da-tex'));
assert.ok(DA.explanationHtml(fujian).includes('data-da-tex'));
const fixtures=[{
  id:'data-material-fixture',title:'功能验证：示例材料',year:'2099',exam:'特殊考试出处',
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
assert.doesNotMatch(content,/2099|特殊考试出处/,'Material must hide provenance');
assert.doesNotMatch(content,/<small>/,'No reserved metadata row');
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
