const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const htmlSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(htmlSource.includes('.shell>aside{padding:20px;position:sticky;top:18px}'),'吸顶样式仅应用到导航栏');
assert.ok(htmlSource.includes('.shell>aside,.maincard,.stats{'),'通用导航卡片样式不得影响知识TIP');
assert.ok(!htmlSource.includes('}aside{padding:20px;position:sticky;top:18px}'),'不得恢复全局aside吸顶样式');
const dataStyleSource=fs.readFileSync(path.join(root,'data-analysis.css'),'utf8');
assert.ok(dataStyleSource.includes('.kb-structured-head{position:sticky;top:0;'),'编号章节标题要吸顶');
assert.ok(dataStyleSource.includes('.kb-structured-intro{'),'章节说明独立排版');
assert.ok(htmlSource.includes("safe(section.title)+'</h3></div>'"),'吸顶标题只包含编号与标题');
assert.ok(htmlSource.includes('class="kb-structured-intro"'),'章节说明不参与吸顶');
assert.ok(!dataStyleSource.includes('.kb-structured-tip{position:sticky'),'避免TIP误吸顶');


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



// 第8课「分式比较大小」：仅按用户已讲授的两大部分和四种方法入库。
const lesson08=courseTopics.find(t=>t.id==='data-topic-course-08-fraction-compare');
assert.ok(lesson08&&Array.isArray(lesson08.contentSections),'第8课必须启用结构化知识体系');
assert.deepEqual(lesson08.contentSections.map(s=>s.title),[
  '8.1 分子、分母大小不同边',
  '8.2 分子、分母大小同边'
],'第8课应分两大部分');
assert.deepEqual(lesson08.contentSections[1].items.map(i=>i.title),[
  '方法一：直接计算法',
  '方法二：平均数增速比较',
  '方法三：分式混合比较',
  '方法四：基准线法'
],'第8课四个方法须保持用户讲授顺序');
assert.deepEqual(lesson08.questionIds,[],'用户仅讲授教材例题，不创建正式习题');
const opposite08=lesson08.contentSections[0];
assert.ok(opposite08.description.includes('分子更大、分母更小'),'不同边直接判断');
assert.ok(opposite08.items[0].formula.includes(String.raw`\frac AB>\frac CD`),'不同边基本判断公式');
const methods08=lesson08.contentSections[1].items;
assert.ok(methods08.every(i=>i.workedExamples?.length===1),'四种方法各有用户原例题');
const e81=methods08[0].workedExamples[0];
assert.ok(e81.formula.includes(String.raw`\frac{155}{500}=0.31`),'直接计算法第一式153加2为155');
assert.ok(e81.formula.includes(String.raw`\frac{402}{1250}`),'直接计算法第二式保留用户分母凑1250、分子加5');
assert.ok(e81.formula.includes(String.raw`0.3216`),'化除为乘结果为0.3216');
const e82=methods08[1].workedExamples[0];
assert.ok(e82.formula.includes(String.raw`\frac{340-284}{284}`)&&e82.formula.includes(String.raw`\frac{56}{284}`),'平均数增速分子实际为284加56');
assert.ok(e82.formula.includes(String.raw`\frac{66}{300}`),'分母增长率33/150上下同乘2');
assert.ok(e82.formula.includes(String.raw`\frac{340}{183}<\frac{284}{150}`),'平均数增速比较结论正确');
const e83=methods08[2].workedExamples[0];
assert.ok(methods08[2].description.includes('第7课'),'分式混合比较联系第7课');
assert.ok(e83.formula.includes(String.raw`\frac{34}{73}=\frac{340}{730}`),'分式混合中加入部分应是34/73');
assert.ok(e83.formula.includes(String.raw`\frac{260}{729}>\frac{226}{656}`),'分式混合比较方向正确');
const e84=methods08[3].workedExamples[0];
assert.ok(methods08[3].description.includes('0.1'),'基准线为0.1');
assert.ok(e84.formula.includes(String.raw`\frac{7.5}{3065}`)&&e84.formula.includes(String.raw`\frac{8.8}{4722}`),'基准线减法余量正确');
assert.ok(e84.description.includes('54%')&&e84.description.includes('12.5%'),'分母增幅54%、分子粗估增幅12.5%');
assert.ok(e84.formula.includes(String.raw`\frac{314}{3065}>\frac{481}{4722}`),'基准线比较方向正确');
for(const [x,y,expected] of [
  [153/493,397/1231,-1],
  [340/183,284/150,-1],
  [260/729,226/656,1],
  [314/3065,481/4722,1]
]){
  assert.equal(Math.sign(x-y),expected,'第8课例题的准确大小关系须和教材一致');
}
for(const formula of [
  ...opposite08.items.map(i=>i.formula).filter(Boolean),
  ...methods08.flatMap(item=>[item.formula,...(item.workedExamples||[]).map(ex=>ex.formula)].filter(Boolean))
]){
  assert.ok(DA.rich(formula).includes('data-da-tex'),'第8课 LaTeX 应交给公式渲染器');
}
assert.ok(!lesson08.contentSections.some(s=>s.tip||s.caution),'不自行添加未经用户讲授的限制提示');

const lesson07=courseTopics.find(t=>t.id==='data-topic-course-07-fraction-mix');
assert.ok(lesson07,'第7课课程ID须保持稳定');
assert.deepEqual(lesson07.contentSections.map(s=>s.title),
 ['7.1 分式混合的基本概念','7.2 累计增速混合','7.3 混合定量','7.4 灵活识别分式混合题型','7.5 分式混合与拉平增长率'],
 '第7课各知识节顺序保持完整');
const cumulativeMix=lesson07.contentSections[1];
assert.equal(cumulativeMix.id,'fraction-mix-cumulative-growth');
assert.deepEqual(cumulativeMix.items.map(item=>item.title),[
 '累计量的组成关系','定性判断：累计增速位于两者之间','讲义示例：根据累计增速判断5月增速'
]);
assert.ok(cumulativeMix.items[0].description.includes('上月累计量＋当月量＝当月累计量'),
 '累计量关系须严格遵守讲义');
assert.ok(cumulativeMix.items[1].formula.includes(String.raw`r_{1\sim n-1}<r_{1\sim n}`)&&
 cumulativeMix.items[1].formula.includes(String.raw`r_{1\sim n-1}>r_{1\sim n}`),
 '累计增速上升和下降对应的大小方向须完整');
assert.ok(cumulativeMix.items[2].formula.includes('10\\%<11\\%<r_5')&&
 cumulativeMix.items[2].formula.includes('r_5>11\\%'),
 '讲义示例应由10%升至11%推得5月增速大于11%');
assert.equal(lesson07.contentSections[0].subtopics.length,4,
 '加入7.2不改原7.1的四个子知识点');
for(const [prev,cumulative] of [[.1,.11],[.15,.08]]){
 const month=(cumulative-.6*prev)/.4;
 assert.equal(Math.sign(month-cumulative),Math.sign(cumulative-prev),
  '累计增速和上月累计增速的变化方向与当月增速相对累计增速一致');
}


const quantitativeMix=lesson07.contentSections[2];
assert.equal(quantitativeMix.id,'fraction-mix-quantitative','7.3保持独立章节');
assert.deepEqual(quantitativeMix.items.map(item=>item.title),[
 '基本原则｜分母反比确定距离比',
 '增速差距≤20%｜可用现期比近似',
 '增速差距＞20%｜关注差距影响'
],'7.3只包含用户讲授的基本原则和两种增速差距情况');
assert.ok(quantitativeMix.items[0].formula.includes(String.raw`\frac{|A-C|}{|C-B|}=\frac{n}{m}`),
 '保持7.1分母反比与距离比的公式，不自加新计算方法');
assert.ok(quantitativeMix.items[0].description.includes('基期量'),
 '增长率混合中用于计算距离比的是基期量');
assert.ok(quantitativeMix.items[1].description.includes('现期比近似代替基期比'),
 '增速差距不超过20%时按用户讲授的近似策略');
assert.ok(quantitativeMix.items[2].description.includes('先计算基期比'),
 '增速差距超过20%时必要情况下计算基期比');
assert.ok(quantitativeMix.items.every(item=>item.caution===undefined&&item.example===undefined),
 '不得给7.3自创额外边界或提示');
assert.ok(quantitativeMix.items[0].workedExamples===undefined&&quantitativeMix.items[2].workedExamples===undefined,
 '不得把用户例题挂到其他方法下');
const quantitativeExample=quantitativeMix.items[1].workedExamples;
assert.ok(Array.isArray(quantitativeExample)&&quantitativeExample.length===2,'7.3保留两道由用户指定的教材例题');
const example73=quantitativeExample[0];
assert.ok(example73.description.includes('1.47万亿元')&&example73.description.includes('8.0%')&&example73.description.includes('4.1个百分点'),
 '教材例题保留完整原始材料的信息');
for(const token of ['2601亿元','9.8%','6409亿元','3.3%','A. 4.5%','B. 5.1%','C. 6.2%','D. 7.0%'])
 assert.ok(example73.description.includes(token),'例题材料及选项不得缺漏：'+token);
for(const token of [String.raw`\frac{6409}{2601}`,String.raw`\frac{64}{26}`,String.raw`\frac{5}{2}`,
 String.raw`9.8\%-3.3\%`,String.raw`\frac{6.5\%}{7}\times 2`,
 String.raw`1.8\%+3.3\%=5.1\%`,String.raw`6.2\%-3.3\%=2.9\%`])
 assert.ok(example73.formula.includes(token),'保留用户原始速算链：'+token);
assert.ok(example73.formula.includes('先定性判断，排除D')&&example73.formula.includes('不必精算基期比'),
 '例题展示先定性、后现期比估算及误差对线段距离的影响');
assert.equal(example73.materialImage,undefined,'文字教材例题不擅自新增截图文件');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课关联三道正式课后习题，原教材例题不入习题库');
const exactExample73=(2601+6409)/(2601/1.098+6409/1.033)-1;
assert.ok(Math.abs(exactExample73-.051)<0.001,'题目增长率计算独立校验约5.1%，答案B');

const example73Water=quantitativeExample[1];
assert.ok(example73Water.title.includes('非养殖水产品产量同比变化'),'第二道教材例题须紧跟电信业务例题');
for(const token of ['2700.09万吨','3.20%','2114.38万吨','4.13%',
 'A. -20%','B. 0%','C. 5%','D. 10%'])
 assert.ok(example73Water.description.includes(token),'水产品例题原题内容不完整：'+token);
for(const token of [
 '第一步：定性排除','排除C（5%）和D（10%）','代入A（-20%）',
 String.raw`3.20\%-(-20\%)=23.20\%`,String.raw`4.13\%-3.20\%=0.93\%`,
 String.raw`\frac{23.2\%}{0.93\%}`,
 String.raw`2700.09-2114.38=585.71`,
 String.raw`\frac{2114.38}{585.71}\approx3.6`,
 '基期比不可能达到约25倍','结论：选B（0%）'
]) assert.ok(example73Water.formula.includes(token),'水产品例题应忠实保留用户解题链：'+token);
assert.equal(example73Water.materialImage,undefined,'本题作为教材文字例题，不新建独立图像资源');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课关联三道正式课后习题，原教材例题不入习题库');
const waterActualRate=((2700.09-2114.38)/
 ((2700.09/1.032)-(2114.38/1.0413))-1);
assert.ok(Math.abs(waterActualRate)<0.003,'非养殖水产品实际增长率接近0%，B符合计算');
const waterImpliedRatio=(3.2-(-20))/(4.13-3.2);
assert.ok(waterImpliedRatio>24&&waterImpliedRatio<26,'假设A时距离比大约25，排除异常基期比');

assert.equal(lesson07.contentSections[0].subtopics.length,4,'7.1内容不变');
assert.equal(lesson07.contentSections[1].items.length,3,'7.2内容不变');


const flexibleMix=lesson07.contentSections[3];
assert.equal(flexibleMix.id,'fraction-mix-flexible-recognition','7.4使用独立且稳定的子节ID');
assert.equal(flexibleMix.title,'7.4 灵活识别分式混合题型');
assert.equal(flexibleMix.items.length,1,'7.4只写识别乘法关系的原有方法');
assert.ok(flexibleMix.description.includes('A＝B×C'),'保留用户提出的识别乘法关系');
assert.ok(flexibleMix.items[0].formula.includes(String.raw`\text{增长量}=\text{基期量}\times\text{增长率}`),
 '例题以增长量、基期量、增长率的乘法关系识别混合');
assert.equal(flexibleMix.items[0].workedExamples?.length,1,'7.4只新增用户提供的一道教材例题');
const phoneMixExample=flexibleMix.items[0].workedExamples[0];
assert.ok(phoneMixExample.title.includes('2014年第一、二季度国内手机市场出货量之比'));
for(const token of ['2.37亿部','7.4%','2G手机增长6.0%','3G手机下降90.6%','4G手机增长381.8%',
 '6.7%','8.2%','A. 0.75','B. 0.88','C. 1.14','D. 1.81']){
 assert.ok(phoneMixExample.description.includes(token),'7.4教材例题材料与选项需完整：'+token);
}
for(const token of [
 String.raw`\frac{\text{2014年一季度出货量}}{\text{2014年二季度出货量}}`,
 String.raw`\frac{8.2\%-7.4\%}{7.4\%-6.7\%}`,
 String.raw`\frac{0.8}{0.7}`,
 '所以选择C（1.14）'
]){
 assert.ok(phoneMixExample.formula.includes(token),'7.4教材例题须按距离比反比求基期比：'+token);
}
assert.ok(!flexibleMix.items[0].caution&&!phoneMixExample.note,'不得额外增加数学限制与警告');
assert.equal(phoneMixExample.materialImage,undefined,'本题直接使用文字教材材料，不创建正式习题图片');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课关联三道正式课后习题，原教材例题不入习题库');
assert.ok(Math.abs((8.2-7.4)/(7.4-6.7)-8/7)<1e-12,'增长率距离之比为8/7，最接近C');

const flattenedMix=lesson07.contentSections[4];
const chapter75Intro=lesson07.contentSections[4].items[0].description;
assert.equal(chapter75Intro,'已知整体和部分1的现期量及增长率，求部分2增长率。','7.5保留精简题型引言');
const chapter75List=lesson07.contentSections[4].items[0].list;
assert.deepEqual(chapter75List,{
 title:'题型特点',
 items:[
  '部分2的现期量可由整体减去部分1得到，但增长率未知，无法直接求基期比。',
  '若结合选项判断两部分增速相差较大，直接用现期比估算基期比可能产生较大误差。'
 ],
 footerTitle:'解题顺序',
 footer:'拉平增长率→补正现期量→计算基期比→利用距离比求未知增长率。'
},'7.5列表只组织用户确认的内容，不扩写知识');
assert.ok(htmlSource.includes('<ul class="kb-structured-bullets">'),'7.5特点应以语义化项目列表渲染');
assert.ok(htmlSource.includes("item.list.items.map(point=>'<li>'"),'每条特点独立成li');
assert.ok(htmlSource.includes('item.list.footerTitle'),'解题顺序应保持独立于题型特点');
assert.ok(htmlSource.includes('item.list.title,...(item.list.items||[])'),'7.5项目列表应可搜索');
assert.ok(dataStyleSource.includes('list-style:disc outside'),'项目符号需真实显示');
assert.ok(dataStyleSource.includes('.kb-structured-list-footer{'),'解题顺序具有独立行距');
assert.ok(htmlSource.includes('function structuredKnowledgeDescriptionHtml(value)'),'页面应有独立的正文段落渲染函数');
assert.ok(htmlSource.includes('structuredKnowledgeDescriptionHtml(item.description)'),'知识条目应使用分段渲染');
assert.ok(htmlSource.includes('structuredKnowledgeDescriptionHtml(ex.description)'),'教材例题也应保留分行');
assert.ok(dataStyleSource.includes('text-indent:2em'),'正文段落须有两个汉字的首行缩进');
assert.ok(dataStyleSource.includes('.kb-structured-desc+.kb-structured-desc{margin-top:10px}'),'连续段落之间应有清晰间距');

assert.equal(flattenedMix.id,'fraction-mix-flatten-growth');
assert.deepEqual(flattenedMix.items.map(i=>i.title),['一、题型识别','二、拉平增长率的数学原理','三、考场计算','四、知识关联','五、延伸应用'],'7.5只包含五个正文部分');
assert.deepEqual(flattenedMix.items[0].table.rows,[['整体（进出口）','680.7亿元','80.3%'],['部分1（出口）','584.7亿元','86.9%'],['部分2（进口）','整体－出口','待求']]);
const principle75=flattenedMix.items[1].subitems;
assert.deepEqual(principle75.map(x=>x.title),['1. 修正增长率的来源','2. 拉平后为什么可以直接计算基期比']);
const steps75=flattenedMix.items[2].subitems;
assert.deepEqual(steps75.map(x=>x.title),['第一步：拉平增长率','第二步：补正整体现期量','第三步：计算基期比','第四步：根据分式距离比求进口增长率']);
assert.deepEqual(flattenedMix.items[3].table.rows,[['第5课：乘积增长率','推导修正增长率公式'],['第6课：拉平增长率','统一增长倍数，获得基期比'],['第7课：分式混合','根据基期比确定距离比，求未知增长率']]);
assert.ok(flattenedMix.items.every(x=>x.workedExamples===undefined&&x.caution===undefined),'7.5不建立例题卡或新数学边界');
assert.ok(!JSON.stringify(flattenedMix).includes('不是')&&!JSON.stringify(flattenedMix).includes('而是'),'7.5使用简洁教材语言');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课关联三道正式课后习题，原教材例题不入习题库');
const trueImportRate=(680.7-584.7)/(680.7/1.803-584.7/1.869)-1;
assert.ok(Math.abs(trueImportRate-.4839)<.002,'准确核对示例答案C');
assert.ok(flattenedMix.items[0].list.items[1].includes("现期比估算基期比可能产生较大误差"),"推导及速算路径需保留：现期比估算基期比可能产生较大误差");
assert.ok(principle75[0].formula.includes("B(1+r_1)(1+r_{\\text{补}})&=B(1+r_2)"),"推导及速算路径需保留：B(1+r_1)(1+r_{\\text{补}})&=B(1+r_2)");
assert.ok(principle75[0].formula.includes("(1+r_1)(1+r_{\\text{补}})&=1+r_2"),"推导及速算路径需保留：(1+r_1)(1+r_{\\text{补}})&=1+r_2");
assert.ok(principle75[0].formula.includes("r_{\\text{补}}(1+r_1)&=r_2-r_1"),"推导及速算路径需保留：r_{\\text{补}}(1+r_1)&=r_2-r_1");
assert.ok(principle75[0].formula.includes("\\frac{r_2-r_1}{1+r_1}"),"推导及速算路径需保留：\\frac{r_2-r_1}{1+r_1}");
assert.ok(principle75[1].formula.includes("(A+B)\\times1.803"),"推导及速算路径需保留：(A+B)\\times1.803");
assert.ok(principle75[1].formula.includes("A\\times1.869"),"推导及速算路径需保留：A\\times1.869");
assert.ok(principle75[1].formula.includes("(A+B)\\times1.869-A\\times1.869"),"推导及速算路径需保留：(A+B)\\times1.869-A\\times1.869");
assert.ok(principle75[1].formula.includes("\\frac{B\\times1.869}{A\\times1.869}"),"推导及速算路径需保留：\\frac{B\\times1.869}{A\\times1.869}");
assert.ok(principle75[1].formula.includes("\\boxed{\\frac BA}"),"推导及速算路径需保留：\\boxed{\\frac BA}");
assert.ok(steps75[0].formula.includes("\\frac{86.9\\%-80.3\\%}{1+80.3\\%}"),"推导及速算路径需保留：\\frac{86.9\\%-80.3\\%}{1+80.3\\%}");
assert.ok(steps75[0].formula.includes("\\frac{86\\%-80\\%}{1.8}"),"推导及速算路径需保留：\\frac{86\\%-80\\%}{1.8}");
assert.ok(steps75[0].formula.includes("\\approx3.3\\%"),"推导及速算路径需保留：\\approx3.3\\%");
assert.ok(steps75[1].formula.includes("680\\times(1+3\\%)\\approx700"),"推导及速算路径需保留：680\\times(1+3\\%)\\approx700");
assert.ok(steps75[2].formula.includes("(700-584)/584"),"推导及速算路径需保留：(700-584)/584");
assert.ok(steps75[2].formula.includes("\\frac15"),"推导及速算路径需保留：\\frac15");
assert.ok(steps75[3].formula.includes("\\frac{86\\%-80\\%}{80\\%-r}\\approx\\frac15"),"推导及速算路径需保留：\\frac{86\\%-80\\%}{80\\%-r}\\approx\\frac15");
assert.ok(steps75[3].formula.includes("80\\%-30\\%"),"推导及速算路径需保留：80\\%-30\\%");
assert.ok(steps75[3].keyPoint.includes("选择C（48%）"),"推导及速算路径需保留：选择C（48%）");

const applications75=flattenedMix.items[4];
assert.equal(applications75.title,'五、延伸应用','两道应用题统一归属第五部分');
assert.deepEqual(applications75.subitems.map(s=>s.title),['（一）多个对象的基期排名','（二）累计量拉平求基期环比','（三）拉平增长率求基期差'],'三个应用均为第五部分内的并列小节');
assert.ok(htmlSource.includes('function structuredKnowledgeSubitemHtml(sub, titleTag)'),'两层子节必须能正常显示');
assert.ok(htmlSource.includes('sub.subitems.map(step=>structuredKnowledgeSubitemHtml(step'),'每个应用中的计算步骤继续显示');
assert.ok(htmlSource.includes('...(sub.subitems||[]).flatMap(step=>'),'各应用内的步骤能被搜索到');
assert.ok(dataStyleSource.includes('.kb-structured-substeps>.kb-structured-subitem'),'两层内容有独立排版');
const ranking75=applications75.subitems[0];
assert.equal(ranking75.title,'（一）多个对象的基期排名','多对象排名属于第五部分的第一小节');
assert.ok(ranking75.description.includes('2022年，全国规模以上文化及相关产业企业')&&ranking75.description.includes('D. 文化辅助生产和中介服务'),'保留题目与正确选项');
assert.deepEqual(ranking75.subitems.map(s=>s.title),['第一步：排除明显较小的三个行业','第二步：排除最大的内容创作生产','第三步：拉平增长率，比较剩余五个行业','第四步：确定排名'],'保留用户排除、拉平、排序顺序');
assert.ok(ranking75.subitems[0].description.includes('文化投资运营')&&ranking75.subitems[0].description.includes('文化娱乐休闲服务')&&ranking75.subitems[0].description.includes('文化装备生产'),'先排除的三个小行业不得遗漏');
assert.ok(ranking75.subitems[1].description.includes('内容创作生产')&&ranking75.subitems[1].description.includes('第三'),'排除最大的内容创作生产，剩余第三即原第四');
assert.ok(ranking75.subitems[2].description.includes('15.5%')&&ranking75.subitems[2].description.includes('约15%'),'按新闻信息服务约15%的增速近似拉平');
assert.deepEqual(ranking75.subitems[2].table.headers,['行业','现期量（亿元）','同比增速','拉平后的粗算值（亿元）']);
assert.deepEqual(ranking75.subitems[2].table.rows,[["新闻信息服务","17243","15.5%","17243（不补正）"],["创意设计服务","21249","8.7%","21249×(1+6%)≈22500"],["文化传播渠道","14797","11.9%","14797×(1+3%)≈15200"],["文化辅助生产和中介服务","15468","0.4%","15468×(1+15%)≈18000"],["文化消费终端生产","23787","3.3%","23787×(1+11%)≈26400"]],'保留五个行业速算数字；最后一项按11%修正孤立笔误');
assert.ok(ranking75.subitems[3].description.includes('第三位是文化辅助生产和中介服务')&&ranking75.subitems[3].description.includes('选D'),'最终选项D与排名对应');
assert.ok(htmlSource.includes('...(sub.table?[sub.table.title'),'内层数据表须加入站内搜索索引');
assert.ok(ranking75.workedExamples===undefined,'新增方法写入7.5知识正文，不另设例题卡');
const ranks75=[['新闻信息服务',17243,15.5],['内容创作生产',28262,10.7],['创意设计服务',21249,8.7],['文化传播渠道',14797,11.9],['文化投资运营',669,24.4],['文化娱乐休闲服务',1758,63.2],['文化辅助生产和中介服务',15468,.4],['文化装备生产',6282,-2.6],['文化消费终端生产',23787,3.3]].map(([name,value,rate])=>({name,base:value/(1+rate/100)})).sort((a,b)=>b.base-a.base);
assert.equal(ranks75[3].name,'文化辅助生产和中介服务','按原表全部9个行业的基期值独立校验第四名');
assert.ok(Math.abs(23787*1.11-26400)<20,'11%补正得到约26400');

const quarterMix=applications75.subitems[1];
assert.equal(quarterMix.title,'（二）累计量拉平求基期环比','累计量拉平属于第五部分的第二小节');
assert.ok(quarterMix.description.includes('2022年第四季度')&&quarterMix.description.includes('A. 0.4%')&&quarterMix.description.includes('D. 4.9%'),'题干和四个选项应保留');
assert.deepEqual(quarterMix.table.headers,['2023年累计时间','累计工业用电量（亿千瓦时）','累计同比增速']);
assert.deepEqual(quarterMix.table.rows,[['1—6月','1036.2','3.6%'],['1—9月','1566.2','3.6%'],['1—12月','2122.4','4.8%']],'保留用户提供的三组累计量及同比');
assert.deepEqual(quarterMix.subitems.map(s=>s.title),['第一步：拉平累计同比增速','第二步：累计量相减，构造季度量','第三步：计算2022年第四季度环比增速','原理：增长倍数统一后，季度量比等于基期比'],'保留原计算三步与数学推导');
assert.ok(quarterMix.subitems[0].description.includes('将12月的4.8%拉平至3.6%'),'选择拉平目标必须与用户思路一致');
assert.ok(quarterMix.subitems[0].formula.includes(String.raw`\frac{4.8\%-3.6\%}{1+4.8\%}`),'下调累计增速使用现期修正率');
assert.ok(quarterMix.subitems[0].formula.includes(String.raw`2122.4\times(1-1.15\%)`)&&quarterMix.subitems[0].formula.includes(String.raw`\approx2098`),'修正后的12月累计量约2098');
assert.ok(quarterMix.subitems[1].formula.includes('2098-1566=532')&&quarterMix.subitems[1].formula.includes('1566-1036=530'),'按累计量相减得到季度量');
assert.ok(quarterMix.subitems[2].formula.includes(String.raw`532/530-1`)&&quarterMix.subitems[2].formula.includes(String.raw`2/530`)&&quarterMix.subitems[2].formula.includes(String.raw`0.4\%`),'速算顺序532/530-1=2/530≈0.4%');
assert.ok(quarterMix.subitems[2].keyPoint.includes('选择A（0.4%）'),'最终答案A');
assert.ok(quarterMix.subitems[3].formula.includes(String.raw`1.036(C-B)`)&&quarterMix.subitems[3].formula.includes(String.raw`1.036(B-A)`)&&quarterMix.subitems[3].formula.includes(String.raw`\frac{C-B}{B-A}`),'同一增长倍数可还原2022年季度比');
assert.ok(!quarterMix.workedExamples&&!quarterMix.caution,'新内容为独立知识正文，不新增例题卡和条件');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课关联三道正式课后习题，原教材例题不入习题库');
const q4Leveled=2122.4*1.036/1.048-1566.2;
const q3Leveled=1566.2-1036.2;
assert.ok(Math.abs((q4Leveled/q3Leveled-1)-.0036)<.0004,'按真实累计同比独立核算约0.36%选A');

const baseDiff75=applications75.subitems[2];
assert.equal(baseDiff75.title,'（三）拉平增长率求基期差','新增第三个并列应用');
for(const token of ['2019年7月','3289万吨','13.4%','579万吨','18736万吨','同比增长7%','2018年','A. 14221万吨','B. 14610万吨','C. 15447万吨','D. 15836万吨'])assert.ok(baseDiff75.description.includes(token),'题目材料及选项保留：'+token);
assert.deepEqual(baseDiff75.subitems.map(s=>s.title),['第一步：列出基期差，选择拉平方向','第二步：计算补正增长率，退还3289','第三步：求基期差并判断选项'],'严格保留用户选择补退方向的解题顺序');
assert.ok(baseDiff75.subitems[0].description.includes('修正较小的3289'),'选择修正较小现期量');
assert.ok(baseDiff75.subitems[0].formula.includes(String.raw`\frac{18736}{1+7\%}-\frac{3289}{1+13.4\%}`),'基期差由两个原始基期量相减');
assert.ok(baseDiff75.subitems[0].formula.includes(String.raw`\frac{18736-3289/(1+r_{\text{补}})}{1+7\%}`),'退还3289后统一除以1.07');
assert.ok(baseDiff75.subitems[1].formula.includes(String.raw`\frac{13.4\%-7\%}{1+7\%}`),'沿用第6课修正率公式');
assert.ok(baseDiff75.subitems[1].formula.includes(String.raw`3289-3289\times6\%`)&&baseDiff75.subitems[1].formula.includes(String.raw`\approx3100`),'用户口述近似计算后退还3289约3100');
assert.ok(baseDiff75.subitems[2].formula.includes(String.raw`(18736-3100)/1.07`)&&baseDiff75.subitems[2].formula.includes(String.raw`\approx14600`),'基期差速算不遗漏最后除以1.07');
assert.ok(baseDiff75.subitems[2].keyPoint.includes('B（14610万吨）'),'选择B');
assert.ok(!baseDiff75.workedExamples&&!baseDiff75.caution,'与前两应用同为知识正文');
const exactBaseDiff75=18736/1.07-3289/1.134;
assert.ok(Math.abs(exactBaseDiff75-14610)<.3,'原始数据独立核算约14610万吨');
assert.ok(htmlSource.includes('sub.subitems.map(step=>structuredKnowledgeSubitemHtml(step'),'第三应用的三个步骤仍可显示');

const lesson06=courseTopics.find(t=>t.id==='data-topic-course-06-flatten-growth');
assert.equal(lesson06.mindmapImage,'assets/data-analysis/lesson-06-flatten-growth-mindmap.svg','第6课思维导图应放在原有知识节前');
const mapAssetPath=path.join(root,lesson06.mindmapImage);
assert.ok(fs.existsSync(mapAssetPath),'第6课思维导图文件必须在仓库中');
const mindmapSvg=fs.readFileSync(mapAssetPath,'utf8');
assert.ok(mindmapSvg.startsWith('<svg ')&&mindmapSvg.includes('</svg>'),'思维导图必须是可浏览的完整SVG图片');
for(const heading of ['基期比','基期比较','增量比较','基期和差','先除后补','先补后除','做题'])
 assert.ok(mindmapSvg.includes(heading),'导图缺少主干或方法：'+heading);
assert.ok(htmlSource.includes('class="kb-lesson-mindmap"'),'课程标题下应该显示导图');
assert.ok(htmlSource.includes("+'</h2>'+mindmapHtml+'<p class=\"kb-summary\""),'导图必须放在第6课标题和既有简介之间');
assert.ok(dataStyleSource.includes('.kb-lesson-mindmap{'),'导图需要响应式缩放');
assert.ok(!mindmapSvg.includes('<script'),'SVG必须保持静态不包含脚本');

assert.ok(lesson06,'第6课知识ID保持稳定');
assert.equal(lesson06.title,'第6课 · 拉平增长率');
assert.deepEqual(lesson06.questionIds,['data-2008-autumn-grain-share-of-total','data-2016-may-imported-drug-mom-growth','data-2022-q4-iron-ore-monthly-mom-trend','data-2012-jiangsu-export-regions-base-comparison','data-2020-industrial-enterprise-profit-smallest-by-type','data-2019-city-congestion-highest-from-2020','data-2019-tier-one-city-congestion-ranking-from-2020','data-2016-s-city-processing-vs-special-customs-mobile-export-multiple','data-2021-s-city-wholesale-retail-vs-accommodation-increase-multiple','data-2020-g-province-import-commodity-unit-price-decline','data-2019-express-nonlocal-vs-intracity-base-ratio'],'第6课应包含基期比较正式习题');
assert.equal(lesson06.patterns,undefined,'第6课必须采用结构化课程而非扁平规则列表');
assert.deepEqual(lesson06.contentSections.map(x=>x.id),['flatten-growth-basics','flatten-growth-base-comparison','flatten-growth-increment-comparison','flatten-growth-base-sum-difference'],'原前三节合并成一级基期比，其余三节顺延');
assert.deepEqual(lesson06.contentSections.map(x=>x.title),['基期比','基期比较','增量比较','基期和差']);
const baseRatioSection=lesson06.contentSections[0];
assert.deepEqual(baseRatioSection.subtopics.map(s=>s.id),['flatten-growth-basics-intro','flatten-growth-correction','flatten-growth-calculation-order'],'原三个步骤独立保留为子知识点');
assert.deepEqual(baseRatioSection.subtopics.map(s=>s.title),['适用场景与第一步｜平均数增长率','第二步｜给增长率较低的一方补正','计算顺序｜先除后补 / 先补后除']);
assert.equal(baseRatioSection.id,'flatten-growth-basics','第一节稳定ID保留');
assert.ok(baseRatioSection.subtopics[1].legacySection&&baseRatioSection.subtopics[2].legacySection,'原第二、三节链接仍应访问新的子知识点');
const [flattenBasics,flattenCorrection,flattenOrder]=baseRatioSection.subtopics;
assert.deepEqual(flattenBasics.items.map(x=>x.title),['计算平均数增长率']);
assert.ok(flattenBasics.items[0].formula.includes('r_1-r_2')&&flattenBasics.items[0].formula.includes('1+r_2'),'第一步沿用原平均数增长率公式');
assert.deepEqual(flattenCorrection.items.map(x=>x.title),['r₁＞r₂｜分母增长率较低，补正分母','r₁＜r₂｜分子增长率较低，补正分子']);
const flattenDen=flattenCorrection.items[0],flattenNum=flattenCorrection.items[1];
assert.ok(flattenDen.formula.includes(String.raw`\frac{1}{1+\dfrac{r_1-r_2}{1+r_2}}`),'r1>r2时按截图用正差补分母');
assert.ok(flattenNum.formula.includes(String.raw`\left(1+\frac{r_2-r_1}{1+r_1}\right)`),'r1<r2时按截图用正差补分子');
assert.ok(flattenCorrection.description.includes('较低')&&flattenCorrection.description.includes('为正'),'保持补正增速低的一方和大减小的核心要点');
assert.ok(baseRatioSection.subtopics.every(group=>(group.items||[]).every(item=>item.example===undefined&&item.workedExamples===undefined)),'既有第6课四节不应新增未授权教材例题');
for(const [a,b,r1,r2] of [[200,100,0.2,0.05],[200,100,0.03,0.18]]){
  const base=(a/(1+r1))/(b/(1+r2));
  const flattened=r1>r2?(a/b)/(1+(r1-r2)/(1+r2)):(a/b)*(1+(r2-r1)/(1+r1));
  assert.ok(Math.abs(base-flattened)<1e-12,'两支拉平增长率公式必须精确等价');
}
// flattenOrder is the original calculation-order subsection, retained under base ratio.
assert.ok(flattenOrder,'第6课新增计算顺序必须保留在既有课程');
assert.equal(flattenOrder.flowchart.first.title,'第一步：比较 r₁ 与 r₂');
assert.ok(flattenOrder.flowchart.first.detail.includes('谁的增长率低'));
assert.ok(flattenOrder.flowchart.decision.title.includes('A/B 是否好算'));
assert.deepEqual(flattenOrder.flowchart.branches.map(b=>b.title),['先除后补','先补后除']);
assert.deepEqual(flattenOrder.flowchart.branches.map(b=>b.condition),['好算','不好算']);
assert.deepEqual(flattenOrder.items.map(item=>item.title),['方法一｜先除后补（现期比好算）','方法二｜先补后除（现期比不好算）']);
assert.equal(flattenOrder.tip.title,'TIP｜如何选择计算顺序','新TIP须归属第6课计算顺序');
assert.deepEqual(flattenOrder.tip.points.map(p=>p.label),['先除后补','先补后除'],'TIP必须保留两项选择依据');
assert.ok(flattenOrder.tip.points[0].description.includes('凑整')&&flattenOrder.tip.points[0].description.includes('倍数关系')&&flattenOrder.tip.points[0].description.includes('A/B'),'先除后补：凑整或倍数关系明显');
for(const s of ['10%','25%','33%','百化分']){
 assert.ok(flattenOrder.tip.points[1].description.includes(s),'先补后除应保留用户列举的比例：'+s);
}
assert.equal(lesson06.contentSections.length,4,'四大节依次为基期比、基期比较、增量比较和基期和差');

assert.deepEqual(flattenOrder.items.map(item=>item.subitems.length),[2,3]);
const [beforeDivide,afterDivide]=flattenOrder.items;
assert.ok(beforeDivide.subitems[0].formula.includes('underbrace')&&beforeDivide.subitems[0].formula.includes('r_2-r_1')&&beforeDivide.subitems[0].formula.includes('1+r_1'),'先除后补：分子补正');
assert.ok(beforeDivide.subitems[1].formula.includes('r_1-r_2')&&beforeDivide.subitems[1].formula.includes('1+r_2'),'先除后补：分母补正');
assert.ok(afterDivide.subitems[0].formula.includes('先补正分子')&&afterDivide.subitems[0].formula.includes('r_2-r_1'),'先补后除：先补正分子');
assert.ok(afterDivide.subitems[2].formula.includes('先补正分母')&&afterDivide.subitems[2].formula.includes('r_1-r_2'),'先补后除：先补正分母');
assert.ok(baseRatioSection.subtopics.every(group=>(group.items||[]).every(item=>item.example===undefined&&item.workedExamples===undefined)),'既有第6课四节不应引入额外练习');
for(const [A,B,r1,r2] of [[1200,310,0.08,0.14],[1200,310,0.21,0.09]]){
 const baseline=(A/(1+r1))/(B/(1+r2));
 const firstDivide=r1<r2?(A/B)*(1+(r2-r1)/(1+r1)):(A/B)/(1+(r1-r2)/(1+r2));
 const firstCorrect=r1<r2?A*(1+(r2-r1)/(1+r1))/B:A/(B*(1+(r1-r2)/(1+r2)));
 assert.ok(Math.abs(firstDivide-baseline)<1e-12&&Math.abs(firstCorrect-baseline)<1e-12,'两种运算顺序同值，补正方向保持一致');
}
const lesson6ExampleFirst=afterDivide.subitems[0].workedExamples;
const lesson6ExampleSecond=beforeDivide.subitems[1].workedExamples;
assert.equal(lesson6ExampleFirst?.length,1,'先补后除必须有用户指定例题');
assert.equal(lesson6ExampleSecond?.length,1,'先除后补必须有用户指定例题');
assert.equal(lesson6ExampleFirst[0].title,'例题1｜先补正分子，再做除法');
assert.equal(lesson6ExampleSecond[0].title,'例题2｜先计算现期比，再补正分母');
assert.ok(lesson6ExampleFirst[0].formula.includes('7358')&&lesson6ExampleFirst[0].formula.includes('3909')&&lesson6ExampleFirst[0].formula.includes('7700')&&lesson6ExampleFirst[0].formula.includes('5.8'),'第1例必须保留先补分子与再除分母的顺序');
assert.ok(lesson6ExampleSecond[0].formula.includes('1027')&&lesson6ExampleSecond[0].formula.includes('7475')&&lesson6ExampleSecond[0].formula.includes('7500')&&lesson6ExampleSecond[0].formula.includes('13.7')&&lesson6ExampleSecond[0].formula.includes('1+5'),'第2例必须先除现期比再补分母');
assert.ok(!lesson6ExampleSecond[0].formula.includes('13.3'),'1027/7500应约为13.7%');
const moveFactorSubitem=afterDivide.subitems[1];
assert.equal(moveFactorSubitem.title,'r₁＜r₂｜分子补正不便时，改为分母退还凑整');
assert.ok(moveFactorSubitem.description.includes('分母退还')&&moveFactorSubitem.description.includes('凑整'),'新技巧归属于先补后除的分子补正特例');
assert.ok(moveFactorSubitem.formula.includes(String.raw`\frac{A}{\dfrac{B}{1+r_{\text{补}}}}`),'补正倍数移入分母的代数变形准确');
assert.equal(moveFactorSubitem.workedExamples?.length,1,'2022年一季度城镇农村收入比只能加入一条教材例题');
const householdWorkedExample=moveFactorSubitem.workedExamples[0];
for(const s of ['14388','6131','4.0','6.1','2022年一季度','A.2.78','B.2.54','C.2.39','D.2.35'])
 assert.ok(householdWorkedExample.description.includes(s)||householdWorkedExample.formula.includes(s),'例题原始数据或选项缺失：'+s);
assert.ok(householdWorkedExample.formula.includes(String.raw`\frac{6.1\%-4.0\%}{1+4.0\%}`),'先计算平均数补正增长率约2%');
assert.ok(householdWorkedExample.formula.includes(String.raw`\frac{14388(1+2\%)}{6131}`),'明确原本的分子补正式');
assert.ok(householdWorkedExample.formula.includes(String.raw`\frac{14388}{\dfrac{6131}{1+2\%}}`),'将分子补正移入分母退还2%');
assert.ok(householdWorkedExample.formula.includes(String.raw`\frac{14388}{6000}`)&&householdWorkedExample.formula.includes('2.4'),'用6000整除得近似2.4');
assert.ok(householdWorkedExample.formula.includes('C项（2.39）'),'教材例题答案选C');
assert.ok(!lesson06.questionIds.includes('data-2022-urban-rural-income-base-ratio'),'教材例题不得放入正式题库');
const directIncomeRatio=(14388/1.04)/(6131/1.061);
const movedIncomeRatio=14388/(6131/(1+(0.061-0.04)/(1.04)));
assert.ok(Math.abs(directIncomeRatio-movedIncomeRatio)<1e-12,'补正倍数移入分母的公式与真实基期比相等');
assert.ok(directIncomeRatio>2.39&&directIncomeRatio<2.40,'基期比与C选项一致');
const allLesson6Examples=[...baseRatioSection.subtopics,...lesson06.contentSections.slice(1)].flatMap(g=>(g.items||[]).flatMap(i=>[...(i.workedExamples||[]),...(i.subitems||[]).flatMap(s=>s.workedExamples||[])]));
assert.equal(allLesson6Examples.length,5,'原有四个教材例题及新增移项凑整例题均属于知识体系，不新增习题');
assert.ok(Math.abs((7358/1.109)/(3909/1.167)-2)<.03,'第一例基期比约2');
assert.ok(Math.abs((1027/1.293)/(7475/1.237)-.13)<.003,'第二例基期比约13%');
assert.ok(Math.abs(1027/7500*100-13.7)<.1,'第二例乘数近似可保留小数精度');
const baseCompareSection=lesson06.contentSections[1];
assert.equal(baseCompareSection.id,'flatten-growth-base-comparison','第四节基期比较保持在第6课内');
assert.equal(baseCompareSection.title,'基期比较');
assert.deepEqual(baseCompareSection.items.map(x=>x.title),['现期大小与增速大小不同边｜直接判断','现期大小与增速大小同边｜补正后直接除法，与1比较']);
assert.ok(baseCompareSection.items[0].formula.includes('A>B')&&baseCompareSection.items[0].formula.includes('r_A<r_B'),'不同边直接比较现期大且增速小的量');
assert.ok(baseCompareSection.items[1].formula.includes(String.raw`\frac{A}{B(1+r_{\text{补}})}`),'同边直接算A除以补正后的分母B');
assert.ok(baseCompareSection.items[1].formula.includes(String.raw`\frac{r_A-r_B}{1+r_B}`),'按之前拉平增长率公式计算分母补正率');
assert.ok(baseCompareSection.items[1].formula.includes('R>1')&&baseCompareSection.items[1].formula.includes('R<1'),'只判断补正后商与1的大小');
assert.ok(baseCompareSection.items[1].keyPoint.includes('直接计算')&&baseCompareSection.items[1].keyPoint.includes('相对于1'),'严格保留补正后做除法再比较1的实际操作');
assert.ok(baseCompareSection.items.every(x=>!x.workedExamples&&!x.example),'未提供教材例题，不得编造');
for(const [A,B,rA,rB] of [[130,100,.03,.11],[130,100,.6,.03],[130,100,.1,.05]]){
 const baseA=A/(1+rA),baseB=B/(1+rB);
 if(rA<rB)assert.ok(baseA>baseB,'现期大、增速小对应基期大');
 else{
  const correctionRate=(rA-rB)/(1+rB);
  const flattenedRatio=A/(B*(1+correctionRate));
  assert.equal(Math.sign(baseA-baseB),Math.sign(flattenedRatio-1),'同边：先补正分母，再看商与1的大小');
 }
}
const incrementComparisonSection=lesson06.contentSections[2];
assert.equal(incrementComparisonSection.id,'flatten-growth-increment-comparison','第五节需归入原第6课');
assert.equal(incrementComparisonSection.title,'增量比较');
assert.deepEqual(incrementComparisonSection.items.map(x=>x.title),['方法一｜分别计算增长量','方法二｜基期比 × 增长率之比'],'仅有用户教授的两种比较路径');
assert.equal(incrementComparisonSection.itemsTitle,'增量倍数比较','既有两种方法归属于增量倍数比较');
assert.equal(incrementComparisonSection.subtopics?.length,1,'增量大小比较应为第五节内的子知识点，而非第六节');
const sizeCompareSubtopic=incrementComparisonSection.subtopics[0];
assert.equal(sizeCompareSubtopic.id,'increment-size-comparison');
assert.equal(sizeCompareSubtopic.title,'增量大小比较');
assert.deepEqual(sizeCompareSubtopic.items.map(x=>x.title),['方法一｜现期与增速同边：大大则大','方法二｜现期与增速不同边：比较基期比与增速比']);
assert.ok(sizeCompareSubtopic.items[0].description.includes('正增长'),'同边判断应明确适用正增长');
assert.ok(sizeCompareSubtopic.items[0].formula.includes(String.raw`\dfrac1{r_1}+1`),'同边大大则大的增长量公式需正确呈现');
assert.ok(sizeCompareSubtopic.items[1].formula.includes(String.raw`\frac{r_2}{r_1}`)&&sizeCompareSubtopic.items[1].formula.includes(String.raw`\frac AB`),'不同边先比较现期比与增速比');
assert.ok(sizeCompareSubtopic.items[1].keyPoint.includes('补正分子'),'r1<r2必须补正分子A，不能反向补分母');
assert.ok(sizeCompareSubtopic.items[1].formula.includes(String.raw`\frac{r_2-r_1}{1+r_1}`),'不同边修正差额应使用r2-r1以及1+r1');
assert.ok(sizeCompareSubtopic.items[1].formula.includes('R>1')&&sizeCompareSubtopic.items[1].formula.includes('R<1'),'最终只需判断增量比是否大于1');
assert.ok(sizeCompareSubtopic.items.every(item=>!item.workedExamples&&!item.example),'用户未给增量大小题的数字例题，不得编造');
assert.equal(lesson06.contentSections[2].subtopics.length,1,'增量大小比较仍应是第五节的子知识点，不另建节');
for(const [A,B,r1,r2] of [[150,100,.3,.1],[130,100,.15,.25],[140,100,.2,.29]]){
  const growthA=A*r1/(1+r1),growthB=B*r2/(1+r2);
  if(r1>r2){assert.ok(growthA>growthB,'同边正增长大大则大');continue;}
  const rawRatio=A/B,rateRatio=r2/r1;
  const correction=1+(r2-r1)/(1+r1);
  const sizeRatio=rawRatio*correction/rateRatio;
  assert.equal(Math.sign(sizeRatio-1),Math.sign(growthA-growthB),'不同边补分子后比较结果必须等价于实际增长量');
}

assert.ok(incrementComparisonSection.items[0].description.includes('化除为乘')&&incrementComparisonSection.items[0].description.includes('份数法'),'直接速算应复用已有知识');
assert.ok(incrementComparisonSection.items[1].formula.includes(String.raw`\frac{x}{y}`)&&incrementComparisonSection.items[1].formula.includes(String.raw`\frac{r_1}{r_2}`),'增量比必须拆为基期比乘增长率之比');
assert.ok(incrementComparisonSection.items[1].formula.includes(String.raw`\dfrac{r_1-r_2}{1+r_2}`),'基期比使用此前的分母拉平补正');
assert.equal(incrementComparisonSection.items[0].workedExamples?.length,1,'方法一应收录用户提供的预算支出份数法例题');
const budgetExample=incrementComparisonSection.items[0].workedExamples?.[0];
assert.ok(budgetExample&&budgetExample.title.includes('教育支出同比增量'),'预算支出例题必须归入方法一');
assert.ok(budgetExample.description.includes('6.03亿元')&&budgetExample.description.includes('2.28亿元'),'教材例题必须有原题相关金额与单位');
assert.ok(budgetExample.description.includes('51.7%')&&budgetExample.description.includes('14.4%'),'教材例题必须保留原题两项增长率');
for(const s of ['A. 4倍','B. 7倍','C. 10倍','D. 14倍'])assert.ok(budgetExample.description.includes(s),'教材例题保留原选项：'+s);
for(const s of [String.raw`\frac12`,String.raw`\frac17`,String.raw`\frac{6.03}{3}`,String.raw`\frac{2.28}{8}`,String.raw`\frac{2}{0.28}`])
 assert.ok(budgetExample.formula.includes(s),'教材例题必须沿用用户份数法顺序：'+s);
assert.ok(budgetExample.formula.includes('7.1')&&budgetExample.formula.includes('最接近B'),'份数法求比值应选B');
assert.ok(budgetExample.note.includes('增长率较大')&&budgetExample.note.includes('百化分'),'保留例题强调的大增速接近百化分适用条件');
assert.ok(incrementComparisonSection.items[0].description.includes('化除为乘')&&incrementComparisonSection.items[0].description.includes('份数法'),'方法一兼顾小增速化除为乘与较大增速份数法');
const educationGrowth=6.03*.517/(1+.517),medicalGrowth=2.28*.144/(1+.144);
assert.ok(Math.abs(educationGrowth/medicalGrowth-7.16)<.02,'原题实际增长量倍数约7.16，符合B选项');
const incrementExample=incrementComparisonSection.items[1].workedExamples?.[0];
assert.ok(incrementExample,'方法二必须有用户给出的真实教材例题');
for(const s of ['41.96','28.63','18.77','9.91','1.5','2.75','1.47','1.89','8.1','2.57'])
 assert.ok(incrementExample.formula.includes(s),'教材例题数值缺失：'+s);
assert.equal(lesson06.questionIds.length,11,'新增进口单价下降量与快递基期比两道正式习题，教材例题仍不计入');
const deltaA=41.96*.1877/(1+.1877),deltaB=28.63*.0991/(1+.0991);
const ratioViaFlatten=((41.96/28.63)/(1+(.1877-.0991)/(1+.0991)))*(.1877/.0991);
assert.ok(Math.abs(deltaA/deltaB-ratioViaFlatten)<1e-12,'拉平后基期比乘增速比须等于原增长量之比');
assert.ok(Math.abs(deltaA/deltaB-2.57)<.01,'较高精度算得增长量比约2.57');
const baseSumDifferenceSection=lesson06.contentSections[3];
assert.equal(baseSumDifferenceSection.id,'flatten-growth-base-sum-difference');
assert.equal(baseSumDifferenceSection.title,'基期和差');
assert.ok(baseSumDifferenceSection.description.includes('增长量是否方便直接计算'),'两条计算路径以增长量是否容易算为分界');
assert.deepEqual(baseSumDifferenceSection.items.map(x=>x.title),['增长量容易计算｜现期和差减去增长量和差','r₁＞r₂｜补正B，再计算基期差','r₂＞r₁｜补正A，再计算基期差']);
const easyIncrementBase=baseSumDifferenceSection.items[0];
assert.ok(easyIncrementBase.description.includes('a、b专指增长量'),'新公式变量不得和旧基期a、b混淆');
assert.ok(easyIncrementBase.formula.includes(String.raw`(A-B)-(a-b)`),'基期差应为现期差减增量差');
assert.ok(easyIncrementBase.formula.includes(String.raw`(A+B)-(a+b)`),'基期和应为现期和减增量和');
assert.ok(easyIncrementBase.keyPoint.includes('代表增量'),'新方法需明确小写a、b含义');
assert.equal(easyIncrementBase.workedExamples,undefined,'不得自编教材例题');
const highR1=baseSumDifferenceSection.items[1],highR2=baseSumDifferenceSection.items[2];
assert.ok(highR1.formula.includes(String.raw`\frac{A-B\left(1+\dfrac{r_1-r_2}{1+r_2}\right)}{1+r_1}`),'r1>r2时须补正B并统一除以1+r1');
assert.ok(highR2.formula.includes(String.raw`\frac{A\left(1+\dfrac{r_2-r_1}{1+r_1}\right)-B}{1+r_2}`),'r2>r1时须补正A并统一除以1+r2');
assert.ok(highR1.keyPoint.includes('补正B本身')&&highR2.keyPoint.includes('补正A本身'),'两个方向都直接补正低增速现期量');
assert.ok(baseSumDifferenceSection.tip.points[0].description.includes('加法'),'题型涉及基期和，应说明沿用同一补正顺序');
assert.ok(baseSumDifferenceSection.items.every(x=>!x.workedExamples&&!x.example),'用户没有提供数值例题，不得编造');
for(const [A,B,r1,r2] of [[280,160,.3,.1],[280,160,.06,.23],[160,280,.18,.05]]){
 const increaseA=A*r1/(1+r1),increaseB=B*r2/(1+r2);
 const directDifference=(A-B)-(increaseA-increaseB);
 const directSum=(A+B)-(increaseA+increaseB);
 assert.ok(Math.abs(directDifference-(A/(1+r1)-B/(1+r2)))<1e-12,'现期差扣增长量差须得到基期差');
 assert.ok(Math.abs(directSum-(A/(1+r1)+B/(1+r2)))<1e-12,'现期和扣增长量和须得到基期和');
 const baseline=A/(1+r1)-B/(1+r2);
 const fixed=r1>r2?(A-B*(1+(r1-r2)/(1+r2)))/(1+r1):
  (A*(1+(r2-r1)/(1+r1))-B)/(1+r2);
 assert.ok(Math.abs(baseline-fixed)<1e-12,'两个增速大小情形的基期差拉平公式应精确等价');
 const sum=A/(1+r1)+B/(1+r2);
 const fixedSum=r1>r2?(A+B*(1+(r1-r2)/(1+r2)))/(1+r1):
  (A*(1+(r2-r1)/(1+r1))+B)/(1+r2);
 assert.ok(Math.abs(sum-fixedSum)<1e-12,'基期求和只改变统一分子里的加减号');
}
const lesson05=courseTopics.find(t=>t.id==='data-topic-course-05-growth-decomposition');
assert.ok(lesson05,'第5课稳定知识ID必须保留');
assert.equal(lesson05.title,'第5课 · 增速的累积与拆分');
assert.deepEqual(lesson05.contentSections.map(s=>s.title),['增长率累积· 乘积增长率/间隔增长率','增速的拆分','快速计算'],'第5课应严格保留三个并列部分');
assert.ok(lesson05.contentSections[0].description.includes('一回事'));
assert.deepEqual(lesson05.contentSections[0].items.map(x=>x.title),['给出两段增长率','给出两段倍数']);
assert.ok(lesson05.contentSections[0].items[0].formula.includes('r_1+r_2+r_1r_2'),'两段增长率公式必须包含乘积项');
assert.ok(lesson05.contentSections[0].items[0].caution.includes('估算'),'交叉乘积一般估算');
assert.ok(lesson05.contentSections[0].items[1].formula.includes('r_1\\times r_2-1'),'给两段倍数时增长率须减去1');
const growthSplit=lesson05.contentSections[1];
assert.equal(growthSplit.id,'growth-rate-decomposition','拆分节须有稳定ID');
assert.equal(growthSplit.items.length,1,'用户只讲了一种拆分条件');
assert.ok(growthSplit.description.includes('累计增长率')&&growthSplit.description.includes('r₂'),'保持用户变量定义');
assert.ok(growthSplit.items[0].formula.includes('\\frac{r_1-r_2}{1+r_2}'),'拆分公式分子必须为r1-r2，分母必须为1+r2');
const growthQuick=lesson05.contentSections[2];
assert.equal(growthQuick.id,'growth-quick-calculation');
assert.deepEqual(growthQuick.items.map(i=>i.title),['两段增长率同正或同负','交叉乘积的小数点位次','增速拆分的快速计算','同比增速速判环比增速的跨年变化']);
assert.ok(growthQuick.items[0].description.includes('同正或同负')&&growthQuick.items[0].description.includes('更大'),'必须保留同正负时增长率高于两项之和');
assert.ok(growthQuick.items[1].description.includes('去掉百分号')&&growthQuick.items[1].description.includes('除以100'),'按数字计算交叉乘积，最后除以100');
assert.ok(growthQuick.items[1].formula.includes('\\frac{r_1\\times r_2}{100}'),'检查百分数前数字的乘积位次');
assert.ok(growthQuick.items[1].example.includes('2.08\\times6.45')&&growthQuick.items[1].example.includes('8.66416'),'用户提供的2013、2014年增长率示例必须保留');
assert.ok(Math.abs(2.08+6.45+2.08*6.45/100-8.66416)<1e-10,'两年复合增长率必须计算准确');
const splitQuick=growthQuick.items[2];
assert.ok(splitQuick.description.includes('类比为“现期量”')&&splitQuick.description.includes('把 r₂ 视为“增长率”'),'增速拆分应类比现期量与增长率');
assert.ok(splitQuick.formula.includes('\\underbrace{r_1-r_2}')&&splitQuick.formula.includes('\\underbrace{r_2}'),'原拆分公式中的类比对象要对应准确');
assert.ok(splitQuick.caution.includes('|r₂|≤10%：化除为乘'),'小增速按绝对值10%以内归入化除为乘');
assert.ok(splitQuick.caution.includes('接近常用百化分增速：份数思想'),'较大增速接近常用分数用份数思想');
assert.ok(splitQuick.caution.includes('不接近常用百化分增速：放缩估算'),'其他较大增速用放缩估算');
assert.ok(splitQuick.caution.includes('绝对值较大的负增长率'),'大幅负增长避免份数法');
assert.equal(splitQuick.example,undefined,'不得自编示例或新题');
const yoyToMom=growthQuick.items[3];
assert.ok(yoyToMom.description.includes('当月的同比增长率')&&yoyToMom.description.includes('上月的同比增长率'),'区分当月与上月同比率');
assert.ok(yoyToMom.formula.includes('\\frac{1+a}{1+b}'),'同比增长率必须转成同比倍数后相除');

assert.ok(yoyToMom.formula.includes(String.raw`(\text{26年5月}/\text{26年4月})`)&&
 yoyToMom.formula.includes(String.raw`(\text{25年5月}/\text{25年4月})`),
 '先将两年环比倍数写为左右横排的比值');
assert.ok(yoyToMom.formula.includes(String.raw`(\text{26年5月}/\text{25年5月})`)&&
 yoyToMom.formula.includes(String.raw`(\text{26年4月}/\text{25年4月})`),
 '再直接重组为两个月的同比倍数，不使用层叠的复合分式');
assert.equal((yoyToMom.formula.match(/\\frac/g)||[]).length,1,
 '最终结果才采用分数线，推导过程须保持横向斜杠');

assert.ok(yoyToMom.formula.includes('26年5月环比倍数')&&yoyToMom.formula.includes('25年5月环比倍数'),'示例左边必须是两年5月环比倍数之比');
for(const word of ['同比增速a＞上月同比增速b','同比降低','同比不变','不代表今年当月环比增速高于或低于今年上月环比增速','不代表环比增速一定为正'])
  assert.ok(yoyToMom.caution.includes(word),'速判应保留条件和比较对象：'+word);
assert.equal(yoyToMom.example,undefined,'不得新增未提供的数字例题');

const aprilJExample=yoyToMom.workedExamples?.[0];
assert.ok(aprilJExample&&yoyToMom.workedExamples.length===1,'第5课环比跨年比较只增加用户指定的一道教材例题');
assert.ok(aprilJExample.title.includes('2020年4月J省发电量环比增速'),'例题题目要与讲义一致');
assert.ok(aprilJExample.description.includes('是否快于上年同期'),'保留用户原问法');
assert.equal(aprilJExample.materialImage,'assets/data-analysis/lesson-05-j-province-2020-cumulative-power-chart.svg');
const aprilJChart=fs.readFileSync(path.join(root,aprilJExample.materialImage),'utf8');
assert.ok(aprilJChart.startsWith('<svg')&&aprilJChart.includes('</svg>')&&!aprilJChart.includes('<script'),
 '完整教材图表须是安全的静态SVG');
const jLabels=['1-2月','1-3月','1-4月','1-5月','1-6月','1-7月','1-8月','1-9月','1-10月','1-11月','1-12月'];
const jVolumes=[155.4,228.6,299.8,376.8,450.8,534.1,612,690.9,765.8,852.8,944.7];
const jGrowth=[2.5,0.2,0.7,2.8,3.1,3.8,3.6,5.3,5.5,6.2,5.9];
for(let i=0;i<jLabels.length;i++){
 assert.ok(aprilJChart.includes(jLabels[i]+'累计发电量'+jVolumes[i]+'亿千瓦时'),
  '图表须保留完整累计发电量：'+jLabels[i]);
 assert.ok(aprilJChart.includes(jLabels[i]+'同比增长率'+jGrowth[i]+'%'),
  '图表须保留完整同比增速：'+jLabels[i]);
}
assert.ok(aprilJExample.formula.includes('1～3月累计增速0.2%')&&
 aprilJExample.formula.includes('1～4月累计增速0.7%'),
 '4月单月增速由1～3月0.2%升至1～4月0.7%推得大于0.7%');
assert.ok(aprilJExample.formula.includes('1～2月累计增速2.5%')&&
 aprilJExample.formula.includes('1～3月累计增速0.2%'),
 '3月单月增速由1～2月2.5%降至1～3月0.2%推得小于0.2%');
assert.ok(aprilJExample.formula.includes(String.raw`\boxed{\text{20年4月环比倍数}>\text{19年4月环比倍数}}`),
 '按用户的同比倍数对比路线得出最终结论');
assert.ok(htmlSource.includes('class="kb-example-material"')&&htmlSource.includes('ex.materialImage'),
 '教材例题须展示图表材料而不是只有题目文字');
assert.ok(dataStyleSource.includes('.kb-example-material img{display:block;width:100%;height:auto'),
 '手机与iPad教材图表必须按可用宽度缩放');

const prevMay=120,prevApr=100,curMay=144,curApr=110;
assert.ok(Math.abs((curMay/curApr)/(prevMay/prevApr)-(1+0.2)/(1+0.1))<1e-12,'环比倍数跨年比值公式应正确');
assert.deepEqual(lesson05.questionIds,['data-2018-tea-export-value-growth-rate','data-2012-surveying-services-2006-multiple','data-2018-social-retail-sales-2015-multiple','data-2016-national-cotton-yield-per-area-growth','data-2020-real-estate-development-funding-2019-increase','data-2016-may-imported-drug-mom-growth','data-2022-q4-iron-ore-monthly-mom-trend'],'第5课关联七道正式习题，包含跨年环比趋势比较');
assert.equal(lesson05.patterns,undefined,'第5课不得变成扁平规则列表');
const teaMaterial=materials.find(m=>m.id==='data-material-2013-2018-tea-export-quantity-price');
const teaQuestion=questions.find(q=>q.id==='data-2018-tea-export-value-growth-rate');
assert.ok(teaMaterial&&teaQuestion,'茶叶出口总额增长率习题和完整材料必须存在');
assert.equal(teaMaterial.blocks.length,2,'原文与六年出口量均价数据须完整保留');
assert.equal(teaMaterial.blocks[0].type,'paragraph');
assert.match(teaMaterial.blocks[0].text,/585.6万吨/);
assert.match(teaMaterial.blocks[0].text,/17.89亿美元/);
assert.match(teaMaterial.blocks[0].text,/36.5万吨/);
assert.equal(teaMaterial.blocks[1].type,'table');
assert.equal(teaMaterial.blocks[1].rows.length,6,'原图六年数据应完整记录');
assert.deepEqual(teaMaterial.blocks[1].rows[4],['2017年','35.5','4.5']);
assert.deepEqual(teaMaterial.blocks[1].rows[5],['2018年','36.5','4.9']);
assert.equal(teaQuestion.answer,'A');
assert.deepEqual(teaQuestion.options,['12%','16%','20%','24%']);
assert.equal(teaQuestion.category,'乘积增长率');
assert.equal(teaQuestion.rule,undefined,'不编造新规律');
assert.equal(teaQuestion.materialId,teaMaterial.id);
assert.equal(teaQuestion.analysis.formulaTitle,'方法一 · 乘积增长率估算');
assert.equal(teaQuestion.analysis.quickTitle,'方法二 · 增长率范围速判');
assert.ok(teaQuestion.analysis.formula.includes('\\frac4{45}')&&teaQuestion.analysis.formula.includes('45\\times9\\%'),'方法一的均价增速必须展示如何估算');
assert.ok(teaQuestion.analysis.formula.includes('\\frac{2.8\\times9}{100}')&&teaQuestion.analysis.formula.includes('12.05'),'方法一应保留交叉项位次和结果');
assert.ok(teaQuestion.analysis.quick.includes('2.8\\%\\times10\\%=0.28\\%'),'方法二必须保留用户的上界判断');
assert.ok(teaQuestion.analysis.quick.includes('13.08')&&teaQuestion.analysis.quick.includes('16%'),'方法二排除较大选项');
assert.ok(!teaQuestion.analysis.quick.includes('8.9'),'方法二只用10%范围速判');
assert.ok(Math.abs(((4.9/4.5)*(1.028)-1)*100-11.94)<0.05,'原图四舍五入数据应接近12%');
assert.match(DA.explanationHtml(teaQuestion),/方法一 · 乘积增长率估算/);
assert.match(DA.explanationHtml(teaQuestion),/方法二 · 增长率范围速判/);
const mappingMaterial=materials.find(m=>m.id==='data-material-2007-2012-surveying-services-value-growth');
const mappingQuestion=questions.find(q=>q.id==='data-2012-surveying-services-2006-multiple');
assert.ok(mappingMaterial&&mappingQuestion,'2007—2012年测绘服务总值习题和完整材料必须存在');
assert.equal(mappingMaterial.blocks.length,1);
assert.equal(mappingMaterial.blocks[0].type,'table');
assert.equal(mappingMaterial.blocks[0].rows.length,6,'原图2007—2012年六组数据必须完整保留');
assert.deepEqual(mappingMaterial.blocks[0].columns,['年份','测绘服务总值（亿元）','同比增速（%）']);
assert.deepEqual(mappingMaterial.blocks[0].rows[0],['2007年','30.93','11.0']);
assert.deepEqual(mappingMaterial.blocks[0].rows[5],['2012年','74.92','15.6']);
assert.equal(mappingQuestion.answer,'C');
assert.deepEqual(mappingQuestion.options,['2.2','2.4','2.7','3.3']);
assert.equal(mappingQuestion.category,'乘积增长率');
assert.equal(mappingQuestion.type,'倍数');
assert.equal(mappingQuestion.rule,undefined,'不能额外自编方法');
assert.equal(mappingQuestion.materialId,mappingMaterial.id);
assert.ok(mappingQuestion.analysis.formula.includes('1+11.0\\%')&&mappingQuestion.analysis.formula.includes('1.11'),'2007年同比倍数正确');
assert.ok(mappingQuestion.analysis.formula.includes('\\frac{75}{31}')&&mappingQuestion.analysis.formula.includes('\\frac{72}{30}'),'必须保留用户指定的除法放缩');
assert.ok(mappingQuestion.analysis.quick.includes('2.4\\times1.11')&&mappingQuestion.analysis.quick.includes('2.664'),'两段倍数的计算必须准确');
assert.ok(mappingQuestion.analysis.quick.includes('2.7'),'选择C');
assert.ok(!mappingQuestion.analysis.quick.includes('+1'),'倍数不再额外加1');
assert.ok(Math.abs(2.4*1.11-2.664)<1e-12,'倍数乘积要准确');
assert.ok(Math.abs((74.92/30.93)*1.11-2.69)<0.02,'真实数据对应约2.69倍');
assert.match(DA.explanationHtml(mappingQuestion),/除法放缩/);
assert.match(DA.explanationHtml(mappingQuestion),/两段倍数直接相乘/);
assert.equal(mappingQuestion.analysis.trap,'','本题无独立题目易错点时保持为空');
assert.doesNotMatch(DA.explanationHtml(mappingQuestion),/易错点|2\.62|笔误/,'个人打字笔误不能展示成题目易错点');
const scaling=courseTopics.find(t=>t.id==='data-topic-course-03-scaling');
assert.ok(scaling,'放缩运算知识点 ID 必须保持稳定');
assert.deepEqual(scaling.contentSections.map(s=>s.title),['加减法放缩','除法放缩','乘法放缩'],'第3课必须按运算类别划分');
assert.deepEqual(scaling.contentSections.map(s=>s.items.length),[3,6,3],'第3课保持三类运算，新加入乘法量级判断');
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
assert.deepEqual(scaling.questionIds,['data-2022-g-legal-aid-average-q1','data-2018-q-passenger-average-distance','data-2017-jiangsu-neighbors-unaware-count','data-2015-2016-micro-service-quarterly-average','data-2018-export-cross-border-b2c-growth-rate','data-2020-poverty-alleviated-counties-rural-income-base'],'第3课应关联六道正式题');
assert.ok(division.items.some(item=>item.title==='精度与量级判断'&&item.example.includes('连续两个步骤')),'应保留有效数字、量级判断连续两步');
assert.equal(materials.length,31,'新增两道课后习题材料后共三十一份真实材料');
assert.equal(questions.length,32,'新增两道课后习题后共三十二道真实题目');
const povertyMaterial=materials.find(m=>m.id==='data-material-2021-poverty-alleviated-counties-rural-income');
const povertyQuestion=questions.find(q=>q.id==='data-2020-poverty-alleviated-counties-rural-income-base');
assert.ok(povertyMaterial&&povertyQuestion,'脱贫县人均收入基期量习题与材料必须存在');
assert.equal(povertyMaterial.blocks.length,1,'不应保存题目原图');
assert.equal(povertyMaterial.blocks[0].type,'paragraph');
assert.match(povertyMaterial.blocks[0].text,/14051元/);
assert.match(povertyMaterial.blocks[0].text,/11.6%/);
assert.match(povertyMaterial.blocks[0].text,/1.1个百分点/);
assert.deepEqual(povertyQuestion.options,['12450','12483','12591','12638']);
assert.equal(povertyQuestion.answer,'C');
assert.equal(povertyQuestion.category,'除法放缩');
assert.equal(povertyQuestion.type,'基期量');
assert.equal(povertyQuestion.rule,undefined,'不编造新的通用规则');
assert.equal(povertyQuestion.materialId,povertyMaterial.id);
assert.ok(povertyQuestion.analysis.formula.includes('1116-5'));
assert.ok(povertyQuestion.analysis.formula.includes('1405-6'));
assert.ok(povertyQuestion.analysis.quick.includes('1399-139.9'));
assert.ok(povertyQuestion.analysis.quick.includes('1259.1'));
assert.ok(povertyQuestion.analysis.quick.includes('12591'));
assert.ok(povertyQuestion.analysis.trap.includes('份数法')&&povertyQuestion.analysis.trap.includes('D附近'));
assert.match(DA.explanationHtml(povertyQuestion),/错位相减/);
assert.ok(Math.abs(14051/1.116-12591)<1,'正确选项与原题精确值不符');
assert.ok(Math.abs(10*(1399-139.9)-12591)<1e-8);
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
const incomeMaterial=materials.find(m=>m.id==='data-material-2020-national-disposable-income');
const incomeQuestion=questions.find(q=>q.id==='data-2020-national-disposable-income-2019-base');
assert.ok(incomeMaterial&&incomeQuestion,'居民人均可支配收入基期量习题应入库');
assert.equal(incomeMaterial.blocks.length,1,'仅使用文字材料，不上传原题截图');
assert.equal(incomeMaterial.blocks[0].text,'2020年全国居民人均可支配收入32189元，比上年增长4.7%。');
assert.equal(incomeQuestion.materialId,incomeMaterial.id);
assert.deepEqual(incomeQuestion.options,['31527元','30744元','32189元','27540元']);
assert.equal(incomeQuestion.answer,'B');
assert.equal(incomeQuestion.category,'化除为乘');
assert.equal(incomeQuestion.type,'基期量');
assert.equal(incomeQuestion.rule,undefined,'不应额外发明规则');
assert.ok(incomeQuestion.analysis.formula.includes('32189\\times4.7\\%'));
assert.ok(incomeQuestion.analysis.formula.includes('32000\\times5\\%'));
assert.ok(incomeQuestion.analysis.quick.includes('32189-1600')&&incomeQuestion.analysis.quick.includes('30589'));
assert.ok(incomeQuestion.analysis.trap.includes('155元'),'必须修正用户对误差量级的口误');
assert.ok(Math.abs(32189/1.047-30744)<0.1,'原题正确选项和基期量数值不符');
assert.ok(Math.abs(1600-(32189-32189/1.047)-155)<0.1,'增长量偏差必须约155元');
assert.match(DA.explanationHtml(incomeQuestion),/步骤二 · 现期减去估算增长量/);
const manufacturerMaterial=materials.find(m=>m.id==='data-material-high-tech-manufacturing-profit-2015');
const manufacturerQuestion=questions.find(q=>q.id==='data-manufacturing-profit-2010-from-high-tech-share');
assert.ok(manufacturerMaterial&&manufacturerQuestion,'高技术制造业利润正式习题及材料必须存在');
assert.equal(manufacturerMaterial.blocks.length,1,'该题应仅保存文字材料，不上传截图');
assert.equal(manufacturerMaterial.blocks[0].type,'paragraph');
assert.match(manufacturerMaterial.blocks[0].text,/7233\.7亿元/);
assert.match(manufacturerMaterial.blocks[0].text,/165\.5%/);
assert.match(manufacturerMaterial.blocks[0].text,/13\.1%/);
assert.match(manufacturerMaterial.blocks[0].text,/0\.5个百分点/);
assert.equal(manufacturerQuestion.category,'放缩法');
assert.equal(manufacturerQuestion.type,'基期量与比重');
assert.equal(manufacturerQuestion.answer,'C');
assert.deepEqual(manufacturerQuestion.options,['1.3','1.7','2.2','2.8']);
assert.equal(manufacturerQuestion.rule,undefined,'不应为本题新增用户未讲授的新规则');
assert.ok(manufacturerQuestion.analysis.formula.includes('13.1\\%-0.5\\%'));
assert.ok(manufacturerQuestion.analysis.quick.includes('\\frac{723}{265}'));
assert.ok(manufacturerQuestion.analysis.quick.includes('\\frac{678}{250}'));
assert.ok(manufacturerQuestion.analysis.quick.includes('678\\times4'));
assert.ok(manufacturerQuestion.analysis.quick.includes('2712\\times8'));
assert.ok(manufacturerQuestion.analysis.quick.includes('21696'));
assert.ok(manufacturerQuestion.analysis.quick.includes('2.17'));
assert.match(DA.explanationHtml(manufacturerQuestion),/步骤二、三 · 放缩求基期利润/);
const fullManufacturingProfitInTrillion=(7233.7/2.655/0.126)/10000;
assert.ok(Math.abs(fullManufacturingProfitInTrillion-2.162)<0.002,'正确选项应是2.2万亿元');
assert.equal(678*4,2712);
assert.equal(2712*8,21696);
const cargoMaterial=materials.find(m=>m.id==='data-material-2014-cargo-transport-jan-nov');
const cargoQuestion=questions.find(q=>q.id==='data-2014-civil-aviation-turnover-growth-jan-nov');
assert.ok(cargoMaterial&&cargoQuestion,'民航货物周转量同比增长量习题与资料必须入库');
assert.equal(cargoMaterial.blocks.length,1,'材料只包含结构化统计表');
assert.equal(cargoMaterial.blocks[0].type,'table');
assert.equal(cargoMaterial.blocks[0].rows.length,10,'保留原图10行数据');
assert.deepEqual(cargoMaterial.blocks[0].rows[9],['民航（亿吨公里）','17.6','8.5','168.7','8.8']);
assert.equal(cargoQuestion.category,'化除为乘');
assert.equal(cargoQuestion.type,'增长量');
assert.equal(cargoQuestion.answer,'A');
assert.deepEqual(cargoQuestion.options,['13.65','15.21','12.17','20.08']);
assert.equal(cargoQuestion.materialId,cargoMaterial.id);
assert.equal(cargoQuestion.rule,undefined,'不应为习题自创额外知识法则');
assert.ok(cargoQuestion.analysis.formula.includes('160\\times9\\%'));
assert.ok(cargoQuestion.analysis.formula.includes('14.4\\times9\\%'));
assert.ok(cargoQuestion.analysis.formula.includes('1.296'));
assert.ok(cargoQuestion.analysis.formula.includes('13.1\\times(1+4\\%)'));
assert.ok(cargoQuestion.analysis.quick.includes('168\\times8\\%'));
assert.ok(cargoQuestion.analysis.quick.includes('13.44'));
assert.ok(cargoQuestion.analysis.trap.includes('12.96'),'纠正144×9%的笔误');
assert.match(DA.explanationHtml(cargoQuestion),/方法一 · 乘法放缩，算完后修正/);
assert.match(DA.explanationHtml(cargoQuestion),/方法二 · 增长率提前修正/);
assert.ok(Math.abs(168.7*0.088/1.088-13.6456)<0.001,'正确增长量须约13.65');
assert.ok(Math.abs(160*0.09-14.4)<1e-12,'浮点误差不应造成乘法验证失败');
assert.ok(Math.abs(14.4-14.4*0.09-13.104)<1e-12);
assert.equal(168*0.08,13.44);
const chemicalMaterial=materials.find(m=>m.id==='data-material-2021-2022-chemical-api-monthly-output');
const chemicalQuestion=questions.find(q=>q.id==='data-2022-chemical-api-monthly-growth-over-three');
assert.ok(chemicalMaterial&&chemicalQuestion,'化学药品原药同比增长量习题与材料必须存在');
assert.equal(chemicalMaterial.blocks.length,1,'材料应只保存结构化表格');
assert.equal(chemicalMaterial.blocks[0].type,'table');
assert.equal(chemicalMaterial.blocks[0].rows.length,11,'原图11行月度数据要完整保留');
assert.deepEqual(chemicalMaterial.blocks[0].rows[6],['2022年6月','30.6','171.0','18.6','12.6']);
assert.deepEqual(chemicalMaterial.blocks[0].rows[7],['2022年7月','26.9','197.1','13.5','12.9']);
assert.deepEqual(chemicalMaterial.blocks[0].rows[9],['2022年9月','29.3','250.5','12.7','12.8']);
assert.equal(chemicalQuestion.category,'份数思想');
assert.equal(chemicalQuestion.type,'增长量比较');
assert.deepEqual(chemicalQuestion.options,['3','4','5','6']);
assert.equal(chemicalQuestion.answer,'B');
assert.equal(chemicalQuestion.materialId,chemicalMaterial.id);
assert.equal(chemicalQuestion.rule,undefined,'不编造通用方法');
assert.ok(chemicalQuestion.analysis.formula.includes('\\frac{26.9}{9}'),'必须保留7月份数法原始计算');
assert.ok(chemicalQuestion.analysis.formula.includes('2.99'),'7月份初估值必须是2.99');
assert.ok(chemicalQuestion.analysis.quick.includes('13.5\\%-12.5\\%'),'增长率近似误差必须是1个百分点');
assert.ok(chemicalQuestion.analysis.quick.includes('2.99\\times(1+8\\%)'),'按用户的近似同比方法修正');
assert.ok(chemicalQuestion.analysis.quick.includes('3.23')&&chemicalQuestion.analysis.quick.includes('4个月'),'7月修正后必须计入4个月');
assert.match(DA.explanationHtml(chemicalQuestion),/增量与增长率近似同比/);
const months2022=chemicalMaterial.blocks[0].rows.slice(3);
const significant=months2022.filter(row=>Number(row[1])*Number(row[3])/100/(1+Number(row[3])/100)>3);
assert.deepEqual(significant.map(row=>row[0]),['2022年5月','2022年6月','2022年7月','2022年9月']);
assert.ok(Math.abs(26.9*0.135/1.135-3.199)<0.002,'7月实际增长量约3.20万吨');
const ruralIncomeMaterial=materials.find(m=>m.id==='data-material-2020-rural-disposable-income-growth');
const ruralIncomeQuestion=questions.find(q=>q.id==='data-2020-rural-income-growth-amount-6p9');
assert.ok(ruralIncomeMaterial&&ruralIncomeQuestion,'2020年农村居民收入增长量题及材料必须入库');
assert.equal(ruralIncomeMaterial.blocks.length,1,'材料为原文段落，不上传截图');
assert.equal(ruralIncomeMaterial.blocks[0].text,'2020年，农村居民人均可支配收入17131元，比上年增长6.9%。');
assert.equal(ruralIncomeQuestion.category,'化除为乘');
assert.equal(ruralIncomeQuestion.type,'增长量');
assert.equal(ruralIncomeQuestion.answer,'A');
assert.deepEqual(ruralIncomeQuestion.options,['1106元','1182元','651元','1927元']);
assert.equal(ruralIncomeQuestion.rule,undefined,'不得增编新规则');
assert.ok(ruralIncomeQuestion.analysis.formula.includes('17131\\times6.9\\%'));
assert.ok(ruralIncomeQuestion.analysis.formula.includes('17000\\times7\\%'));
assert.ok(ruralIncomeQuestion.analysis.formula.includes('1190'));
assert.ok(ruralIncomeQuestion.analysis.quick.includes('1190\\times7\\%'));
assert.ok(ruralIncomeQuestion.analysis.quick.includes('83.3'));
assert.ok(ruralIncomeQuestion.analysis.quick.includes('1106.7'));
assert.ok(ruralIncomeQuestion.analysis.trap.includes('乘法放缩')&&ruralIncomeQuestion.analysis.trap.includes('误差修正'));
assert.ok(ruralIncomeQuestion.analysis.trap.includes('不能直接写为77'),'纠正乘法笔误');
assert.ok(Math.abs(17131*0.069/1.069-1105.87)<0.3,'正确选项A的增长量约1106');
assert.ok(Math.abs(1190-1190*0.07-1106.7)<1e-9,'延后修正计算应为1106.7');
assert.match(DA.explanationHtml(ruralIncomeQuestion),/步骤一 · 乘法放缩/);
assert.match(DA.explanationHtml(ruralIncomeQuestion),/步骤二 · 化除为乘的误差修正/);
const estimation=courseTopics.find(t=>t.id==='data-topic-course-04-estimation');
assert.ok(estimation,'第4课快速估算主题须保持稳定');
assert.deepEqual(estimation.questionIds,['data-2015-hebei-2013-highway-passengers','data-2020-fujian-2018-industrial-profits','data-2020-national-disposable-income-2019-base','data-manufacturing-profit-2010-from-high-tech-share','data-2014-civil-aviation-turnover-growth-jan-nov','data-2022-chemical-api-monthly-growth-over-three','data-2020-rural-income-growth-amount-6p9']);
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
const partsApplicability=parts.items.find(x=>x.title==='适用与份数关系');
assert.ok(partsApplicability.keyPoint.includes('绝对值较大的负数')&&partsApplicability.keyPoint.includes('放缩法'),'份数思想须强调大幅负增长避免份数法');
assert.ok(partsApplicability.keyPoint.includes('误差过大'),'须说明大幅负增长的误差风险');
const partsCorrection=parts.items.find(x=>x.title==='份数法修正');
assert.ok(partsCorrection,'份数法修正必须属于份数思想');
assert.ok(partsCorrection.keyPoint.includes('相对估算误差比例'),'误差比例重点说明必须位于份数法修正');
assert.ok(partsCorrection.keyPoint.includes('\\frac{r-t}{t}'),'误差比例公式必须以近似增长率t作为分母');
assert.ok(partsCorrection.keyPoint.includes('不是原增长率'),'必须强调不能除以r');
const rateOriginal=0.135,rateApprox=0.125;
assert.ok(Math.abs((rateOriginal-rateApprox)/rateApprox-0.08)<1e-10,'应以估算增长率为分母校验8%');
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
const socialRetail=questions.find(q=>q.id==='data-2018-social-retail-sales-2015-multiple');
const socialRetailMaterial=materials.find(m=>m.id==='data-material-2016-2018-social-retail-sales-monthly-cumulative');
assert.ok(socialRetail&&socialRetailMaterial,'社会消费品零售总额倍数题与材料必须存在');
assert.equal(socialRetail.answer,'C');
assert.deepEqual(socialRetail.options,['1.0','1.2','1.4','1.6']);
assert.equal(socialRetailMaterial.blocks[0].rows.length,6,'保留2016—2018年绝对量及增速六行');
assert.equal(socialRetailMaterial.blocks[0].columns.length,13,'保留2至12月全部11个月');
assert.deepEqual([socialRetailMaterial.blocks[0].rows[1][12],socialRetailMaterial.blocks[0].rows[3][12],socialRetailMaterial.blocks[0].rows[5][12]],['12.0','10.7','10.0']);
assert.equal(lesson05.questionIds.filter(x=>x==='data-2018-social-retail-sales-2015-multiple').length,1,'第5课关联本题一次');
assert.ok(socialRetail.analysis.formula.includes('12')&&socialRetail.analysis.formula.includes('10.7')&&socialRetail.analysis.formula.includes('23.9'),'第一步按两年增长率计算');
assert.ok(socialRetail.analysis.quick.includes('23.9')&&socialRetail.analysis.quick.includes('36.3'),'第二步接续2017/2015增速');
assert.ok(!JSON.stringify(socialRetail.analysis).includes('1.12\\\\times'),'不得自行添加同比倍数相乘方法');
assert.ok(DA.explanationHtml(socialRetail).includes('data-da-tex'));
const cottonQuestion=questions.find(q=>q.id==='data-2016-national-cotton-yield-per-area-growth');
const cottonMaterial=materials.find(m=>m.id==='data-material-2016-national-cotton-output-sowing-area');
assert.ok(cottonQuestion&&cottonMaterial,'棉花单位面积产量题与材料存在');
assert.equal(cottonQuestion.answer,'D');
assert.deepEqual(cottonQuestion.options,['下降6.8%','下降3.9%','上升2.6%','上升7.2%']);
assert.ok(cottonQuestion.analysis.formula.includes('26')&&cottonQuestion.analysis.formula.includes('420'),'棉花题先算分子与分母增长率');
assert.ok(cottonQuestion.analysis.quick.includes('0.89')&&cottonQuestion.analysis.quick.includes('6.7'),'棉花题依用户顺序算平均数增速');
assert.equal(cottonQuestion.important,undefined,'只有房地产题标重点');
assert.ok(DA.explanationHtml(cottonQuestion).includes('data-da-tex'));
const estateQuestion=questions.find(q=>q.id==='data-2020-real-estate-development-funding-2019-increase');
const estateMaterial=materials.find(m=>m.id==='data-material-2021-real-estate-development-funding');
assert.ok(estateQuestion&&estateMaterial,'房地产增长量题与材料存在');
assert.equal(estateQuestion.important,true,'房地产题必须重点标记');
assert.deepEqual(estateQuestion.options,['3456.7','11563.7','14399.8','22506.8']);
assert.equal(estateQuestion.answer,'C');
assert.ok(estateQuestion.analysis.formula.includes('8.4')&&estateQuestion.analysis.formula.includes('1.042'),'先算2020年同比8%');
assert.ok(estateQuestion.analysis.quick.includes('16088')&&estateQuestion.analysis.quick.includes('16214'),'借用2021年的值再做反向比例修正');
assert.ok(DA.explanationHtml(estateQuestion).includes('data-da-tex'));
assert.ok(Math.abs((201132/1.126)*((1.126/1.042)-1)-14399.8)<1,'房地产题真实增量与正确选项相符');
const autumnGrainQuestion=questions.find(q=>q.id==='data-2008-autumn-grain-share-of-total');
const autumnGrainMaterial=materials.find(m=>m.id==='data-material-2009-grain-output-summer-autumn');
assert.ok(autumnGrainQuestion&&autumnGrainMaterial,'秋粮基期比重习题及完整材料均已收录');
assert.equal(autumnGrainQuestion.category,'拉平增长率');
assert.equal(autumnGrainQuestion.answer,'D');
assert.deepEqual(autumnGrainQuestion.options,['53.4%','53.1%','52.5%','52.2%']);
assert.equal(autumnGrainMaterial.blocks.length,1);
assert.equal(autumnGrainMaterial.blocks[0].type,'paragraph');
for(const s of ['4316.3万吨','1.3%','2047.7万吨','0.6%','2268.6万吨','1.9%'])
 assert.ok(autumnGrainMaterial.blocks[0].text.includes(s),'材料数值缺失: '+s);
assert.deepEqual(lesson06.questionIds,['data-2008-autumn-grain-share-of-total','data-2016-may-imported-drug-mom-growth','data-2022-q4-iron-ore-monthly-mom-trend','data-2012-jiangsu-export-regions-base-comparison','data-2020-industrial-enterprise-profit-smallest-by-type','data-2019-city-congestion-highest-from-2020','data-2019-tier-one-city-congestion-ranking-from-2020','data-2016-s-city-processing-vs-special-customs-mobile-export-multiple','data-2021-s-city-wholesale-retail-vs-accommodation-increase-multiple','data-2020-g-province-import-commodity-unit-price-decline','data-2019-express-nonlocal-vs-intracity-base-ratio']);
assert.ok(autumnGrainQuestion.analysis.formula.includes('432\\times1\\%')&&autumnGrainQuestion.analysis.formula.includes('4346'),'先估1%确定量级、再补正分母');
assert.ok(autumnGrainQuestion.analysis.quick.includes('98\\times52\\%')&&autumnGrainQuestion.analysis.quick.includes('2319')&&autumnGrainQuestion.analysis.quick.includes('579.75'),'按选项比例补正分子、再按乘9错位相减');
assert.ok(DA.explanationHtml(autumnGrainQuestion).includes('data-da-tex'));
assert.ok(Math.abs((2268.6/1.019)/(4316.3/1.013)*100-52.2)<0.06,'2008年秋粮占比须接近52.2%');
assert.ok(scaling.contentSections.find(s=>s.title==='除法放缩').items.find(x=>x.title==='分子补偿').keyPoint.includes('选项'));
assert.ok(!scaling.contentSections.find(s=>s.title==='除法放缩').items.find(x=>x.title==='精度与量级判断').keyPoint,'百分数乘法量级技巧应从除法放缩移出');
assert.equal(autumnGrainQuestion.analysis.formulaTitle,'步骤一、二 · 拉平增长率，补正分母');
assert.match(autumnGrainQuestion.analysis.formula,/432\\times6/,'应保留先算432×6再用1%标杆还原量级的实际心算');
assert.match(autumnGrainQuestion.analysis.formula,/432\\times0\.6\\%&=2\.592/);
assert.match(autumnGrainQuestion.analysis.formula,/小于4\.32/,'1%的作用是判断结果数量级');
assert.match(autumnGrainQuestion.analysis.quickTitle,/步骤三 · 除法放缩/);
assert.match(autumnGrainQuestion.analysis.quick,/4444=4\\times1111/,'先识别4444=4×1111');
assert.match(autumnGrainQuestion.analysis.quick,/1\/1111\\approx9\/10000/,'借1111乘9错位相减');
assert.match(autumnGrainQuestion.analysis.quick,/除法放缩时/,'选项百分比补分子只属于除法放缩');
const smallPctMethod=multiplication.items.find(item=>item.title==='小百分数乘法｜先用1%判断量级');
assert.ok(smallPctMethod,'百分数乘法量级判断应归入乘法章节');
assert.match(smallPctMethod.description,/数量级标杆/);
assert.match(smallPctMethod.formula,/432\\times6/);
assert.ok(division.items.find(x=>x.title==='错位相减｜乘9').keyPoint.includes('1111'),'补充1111对应乘9的原方法入口');
assert.match(division.items.find(x=>x.title==='分子补偿').keyPoint,/为了更方便计算除法/);
const importedDrugQuestion=questions.find(q=>q.id==='data-2016-may-imported-drug-mom-growth');
const importedDrugMaterial=materials.find(m=>m.id==='data-material-2017-2018-imported-drug-amount-yoy');
assert.ok(importedDrugQuestion&&importedDrugMaterial,'跨年环比进口药品题及图表材料均须存在');
assert.equal(importedDrugQuestion.important,true,'这题须标为重点题');
assert.equal(importedDrugQuestion.answer,'C');
assert.deepEqual(importedDrugQuestion.options,['超过100%','在40%～100%之间','在0%～40%之间','低于0%']);
assert.equal(importedDrugMaterial.blocks.length,1);
assert.equal(importedDrugMaterial.blocks[0].type,'table','原图按结构化月度表格保留');
assert.equal(importedDrugMaterial.blocks[0].rows.length,12,'必须保留2017年3月至2018年2月全部12个月数据');
assert.deepEqual(importedDrugMaterial.blocks[0].columns,['月份','进口药品金额（亿美元）','同比增速（%）']);
const importedDrugRows=importedDrugMaterial.blocks[0].rows;
assert.deepEqual(importedDrugRows[1],['2017年4月','18.8','12.2']);
assert.deepEqual(importedDrugRows[2],['2017年5月','27.8','54.5']);
assert.deepEqual(importedDrugRows[4],['2017年7月','19.6','-4.6'],'图中负增长也须完整保留');
assert.deepEqual(importedDrugRows.at(-1),['2018年2月','15.6','1.7']);
assert.equal(lesson05.questionIds.filter(x=>x==='data-2016-may-imported-drug-mom-growth').length,1,'需关联第5课同比增速速判跨年环比');
assert.equal(lesson06.questionIds.filter(x=>x==='data-2016-may-imported-drug-mom-growth').length,1,'需关联第6课拉平增长率');
assert.ok(importedDrugQuestion.analysis.formula.includes('27.8')&&importedDrugQuestion.analysis.formula.includes('18.8')&&importedDrugQuestion.analysis.formula.includes('1.5'),'先计算现期环比倍数');
assert.ok(importedDrugQuestion.analysis.quick.includes('54.5')&&importedDrugQuestion.analysis.quick.includes('12.2')&&importedDrugQuestion.analysis.quick.includes('1.4^{-}')&&importedDrugQuestion.analysis.quick.includes('1.1-1'),'按先除后补、环比倍数减1的计算顺序');
assert.ok(DA.explanationHtml(importedDrugQuestion).includes('data-da-tex'));
const actualCrossYearMom=((27.8/1.545)/(18.8/1.122)-1)*100;
assert.ok(actualCrossYearMom>0&&actualCrossYearMom<40,'原数据对应选项C');
const ironOreQuestion=questions.find(q=>q.id==='data-2022-q4-iron-ore-monthly-mom-trend');
const ironOreMaterial=materials.find(m=>m.id==='data-material-2023-iron-ore-monthly-output-yoy');
assert.ok(ironOreQuestion&&ironOreMaterial,'铁矿石跨年环比趋势题和材料均须完整录入');
assert.equal(ironOreQuestion.answer,'A');
assert.deepEqual(ironOreQuestion.options,['图 A','图 B','图 C','图 D']);
assert.equal(ironOreQuestion.optionImage,'assets/data-analysis/2022-q4-iron-ore-mom-options.webp');
assert.ok(ironOreQuestion.optionImageAlt.includes('四幅原题折线图'));
assert.equal(ironOreMaterial.blocks[0].type,'table');
assert.equal(ironOreMaterial.blocks[0].rows.length,11);
assert.deepEqual(ironOreMaterial.blocks[0].rows.slice(-4),[['9月','8437','-0.9'],['10月','8645','29.8'],['11月','8577','6.6'],['12月','8603','0.4']]);
assert.equal(lesson05.questionIds.filter(x=>x==='data-2022-q4-iron-ore-monthly-mom-trend').length,1);
assert.equal(lesson06.questionIds.filter(x=>x==='data-2022-q4-iron-ore-monthly-mom-trend').length,1);
assert.ok(ironOreQuestion.analysis.formula.includes('8645')&&ironOreQuestion.analysis.formula.includes('8437')&&ironOreQuestion.analysis.formula.includes('8577')&&ironOreQuestion.analysis.formula.includes('8603'),'先看现期环比倍数均约为1');
assert.ok(ironOreQuestion.analysis.quick.includes('23.2')&&ironOreQuestion.analysis.quick.includes('6.2')&&ironOreQuestion.analysis.quick.includes('10月：补正分母'),'保持用户的修正项判断顺序');
assert.ok(DA.explanationHtml(ironOreQuestion).includes('data-da-tex'));
assert.throws(()=>DA.validate(materials,[...questions.filter(q=>q.id!==ironOreQuestion.id),{...ironOreQuestion,optionImage:'data:image/webp;base64,AA'}],book),/选项图片/,'禁止选项图片内联Base64');
const mom2022=[
 (8645/1.298)/(8437/.991),
 (8577/1.066)/(8645/1.298),
 (8603/1.004)/(8577/1.066)
];
assert.ok(mom2022[1]>mom2022[2]&&mom2022[2]>mom2022[0],'10月低、11月高、12月居中，答案应为A');
const jiangsuBaseQuestion=questions.find(q=>q.id==='data-2012-jiangsu-export-regions-base-comparison');
const jiangsuBaseMaterial=materials.find(m=>m.id==='data-material-2013-jiangsu-exports-destinations');
assert.ok(jiangsuBaseQuestion&&jiangsuBaseMaterial,'江苏省基期出口额比较正式习题与材料必须存在');
assert.equal(jiangsuBaseQuestion.category,'拉平增长率');
assert.equal(jiangsuBaseQuestion.type,'基期比较');
assert.equal(jiangsuBaseQuestion.answer,'A');
assert.deepEqual(jiangsuBaseQuestion.options,['美国、欧盟、中国香港、日本','美国、欧盟、日本、中国香港','欧盟、美国、中国香港、日本','欧盟、美国、日本、中国香港']);
assert.equal(jiangsuBaseQuestion.important,undefined,'本题未要求标记为重点');
assert.equal(jiangsuBaseMaterial.blocks.length,1);
assert.equal(jiangsuBaseMaterial.blocks[0].type,'paragraph');
for(const s of ['5508.4','0.5%','3288.5','0.1%','2219.9','1.1%','571.2','654.3','312.4','368.3','-9.7%','2.6%','1.3%','9.2%'])
 assert.ok(jiangsuBaseMaterial.blocks[0].text.includes(s),'完整保留材料数据：'+s);
assert.equal(lesson06.questionIds.filter(x=>x==='data-2012-jiangsu-export-regions-base-comparison').length,1,'本题仅关联第6课一次');
assert.ok(jiangsuBaseQuestion.analysis.formula.includes('312')&&jiangsuBaseQuestion.analysis.formula.includes('368')&&jiangsuBaseQuestion.analysis.formula.includes('8\\%'),'先比较日本与中国香港，并补正日本');
assert.ok(jiangsuBaseQuestion.analysis.quick.includes('12.3')&&jiangsuBaseQuestion.analysis.quick.includes('9.7')&&jiangsuBaseQuestion.analysis.quick.includes('13.5'),'欧盟修正率先化除为乘');
assert.ok(jiangsuBaseQuestion.analysis.quick.includes('571}{8}')&&jiangsuBaseQuestion.analysis.quick.includes('71+6=77')&&jiangsuBaseQuestion.analysis.quick.includes('648<654'),'利用八分之一与1%补正欧盟后比较美国');
assert.ok(!jiangsuBaseQuestion.analysis.formula.includes('2012年出口额='),'不得另加基期公式硬算路径');
assert.ok(DA.explanationHtml(jiangsuBaseQuestion).includes('data-da-tex'),'题解公式须可由网页渲染');
const base2012={us:654.3/1.026,eu:571.2/.903,hk:368.3/1.092,jp:312.4/1.013};
assert.ok(base2012.us>base2012.eu&&base2012.eu>base2012.hk&&base2012.hk>base2012.jp,'原题数据应选美国、欧盟、中国香港、日本');
const industryBaseQuestion=questions.find(q=>q.id==='data-2020-industrial-enterprise-profit-smallest-by-type');
const industryBaseMaterial=materials.find(m=>m.id==='data-material-2021-industrial-profit-economic-type');
assert.ok(industryBaseQuestion&&industryBaseMaterial,'工业利润基期比较题目及材料必须存在');
assert.equal(industryBaseQuestion.answer,'A');
assert.equal(industryBaseQuestion.type,'基期比较');
assert.equal(industryBaseQuestion.category,'拉平增长率');
assert.deepEqual(industryBaseQuestion.options,['国有控股企业','股份制企业','外商及港澳台商投资企业','私营企业']);
assert.equal(industryBaseMaterial.blocks[0].type,'paragraph');
for(const value of ['87092','34.3%','22770','56.0%','62702','40.2%','22846','21.1%','29150','27.6%'])
 assert.ok(industryBaseMaterial.blocks[0].text.includes(value),'工业利润材料数据缺失：'+value);
assert.match(industryBaseQuestion.analysis.identify,/现期最小、增速最大/,'第一题应使用不同边直接判断');
assert.ok(DA.explanationHtml(industryBaseQuestion).includes('data-da-tex'));
const industryValues=[['A',22770,.56],['B',62702,.402],['C',22846,.211],['D',29150,.276]];
assert.equal(industryValues.map(([option,amount,r])=>[option,amount/(1+r)]).sort((a,b)=>a[1]-b[1])[0][0],'A','工业利润基期最小选A');

const congestionBaseQuestion=questions.find(q=>q.id==='data-2019-city-congestion-highest-from-2020');
const congestionBaseMaterial=materials.find(m=>m.id==='data-material-2020-major-cities-congestion-traffic');
assert.ok(congestionBaseQuestion&&congestionBaseMaterial,'拥堵指数基期比较题目及材料必须存在');
assert.equal(congestionBaseQuestion.answer,'C');
assert.deepEqual(congestionBaseQuestion.options,['北京','上海','重庆','南京']);
assert.equal(congestionBaseMaterial.blocks[0].type,'table');
assert.equal(congestionBaseMaterial.blocks[0].rows.length,19,'保留交通状况完整19个城市的数据');
assert.equal(congestionBaseMaterial.blocks[0].columns.length,7);
for(const row of congestionBaseMaterial.blocks[0].rows)assert.equal(row.length,7,'所有城市行列数一致');
const congestionRows=congestionBaseMaterial.blocks[0].rows;
for(const [city,index,yoy] of [['北京','2.063','1.15'],['上海','1.932','11.08'],['重庆','2.260','4.40'],['南京','1.822','6.84']]){
 const row=congestionRows.find(r=>r[0]===city);
 assert.ok(row&&row[2]===index&&row[3]===yoy,'拥堵指数主要选项数据：'+city);
}
assert.ok(congestionBaseQuestion.analysis.formula.includes('上海')&&congestionBaseQuestion.analysis.formula.includes('南京'),'先用不同边规则排除上海南京');
for(const s of ['3.25','3.2','2.06','2.26','10%'])assert.ok(congestionBaseQuestion.analysis.quick.includes(s),'北京补正与现期10%差距速判：'+s);
assert.ok(!congestionBaseQuestion.analysis.quick.includes('2.129'),'保留用户要求的差距粗估而非补完后精算');
assert.ok(DA.explanationHtml(congestionBaseQuestion).includes('data-da-tex'));
const congestionBaseValues=[['北京',2.063,.0115],['上海',1.932,.1108],['重庆',2.260,.044],['南京',1.822,.0684]];
assert.equal(congestionBaseValues.map(([city,amount,r])=>[city,amount/(1+r)]).sort((a,b)=>b[1]-a[1])[0][0],'重庆','2019年拥堵指数最大是重庆');
assert.equal(lesson06.questionIds.filter(id=>id==='data-2020-industrial-enterprise-profit-smallest-by-type'||id==='data-2019-city-congestion-highest-from-2020').length,2,'两题应各自关联第6课一次');
const cityRankingQuestion=questions.find(q=>q.id==='data-2019-tier-one-city-congestion-ranking-from-2020');
assert.ok(cityRankingQuestion,'一线城市拥堵排序题须存在');
assert.equal(cityRankingQuestion.materialId,'data-material-2020-major-cities-congestion-traffic','新题必须复用第24题同一材料');
assert.equal(cityRankingQuestion.materialId,congestionBaseQuestion.materialId,'第24、25题引用同一份交通状况材料');
assert.equal(materials.filter(m=>m.id==='data-material-2020-major-cities-congestion-traffic').length,1,'共用材料只能存在一份');
assert.equal(materials.filter(m=>m.id===congestionBaseMaterial.id).length,1,'第24和25题共享交通材料，不重复');
assert.equal(cityRankingQuestion.category,'拉平增长率');
assert.equal(cityRankingQuestion.type,'基期比较');
assert.equal(cityRankingQuestion.answer,'D');
assert.deepEqual(cityRankingQuestion.options,['北京、上海、广州、深圳','上海、北京、深圳、广州','深圳、北京、上海、广州','北京、广州、上海、深圳']);
assert.equal(lesson06.questionIds.filter(q=>q==='data-2019-tier-one-city-congestion-ranking-from-2020').length,1,'新题关联第6课一次即可');
for(const s of ['北京','广州','上海','深圳'])assert.ok(cityRankingQuestion.analysis.locate.includes(s),'原材料定位须包含四城：'+s);
assert.ok(cityRankingQuestion.analysis.formula.includes('排除B、C'),'首先从北京最大排除B和C');
assert.ok(cityRankingQuestion.analysis.quick.includes('11.08')&&cityRankingQuestion.analysis.quick.includes('8.24')&&cityRankingQuestion.analysis.quick.includes('2.6'),'第二步先补正广州约2.6%');
for(const s of ['1932-1887','45}{1887}','450}{189}','450+25','189+11','475}{200}','2.37'])
 assert.ok(cityRankingQuestion.analysis.quick.includes(s),'保留分子分母同步放缩凑整速算：'+s);
assert.ok(cityRankingQuestion.analysis.quick.indexOf('2.6')<cityRankingQuestion.analysis.quick.indexOf('1932-1887'),'严格先算补正再看两城现期差距');
assert.ok(!cityRankingQuestion.analysis.quick.includes('1.887\\times(1+'),'不用硬算广州补正后的具体拥堵指数');
assert.ok(DA.explanationHtml(cityRankingQuestion).includes('data-da-tex'),'速算公式应正确渲染');
const cityNumbers=[['北京',2.063,.0115],['上海',1.932,.1108],['广州',1.887,.0824],['深圳',1.673,.0461]];
assert.deepEqual(cityNumbers.map(([city,amt,r])=>[city,amt/(1+r)]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]),['北京','广州','上海','深圳'],'原题四城基期排序必须为D');
assert.ok((.1108-.0824)/(1+.0824)>(1.932-1.887)/1.887,'广州补正率高于追赶上海所需增幅');
const mobileTradeQ=questions.find(q=>q.id==='data-2016-s-city-processing-vs-special-customs-mobile-export-multiple');
const mobileTradeMaterial=materials.find(m=>m.id==='data-material-2017-s-city-mobile-export-trade-types');
assert.ok(mobileTradeQ&&mobileTradeMaterial,'手机出口基期比题目和材料必须完整录入');
assert.equal(mobileTradeQ.materialId,mobileTradeMaterial.id);
assert.equal(mobileTradeQ.type,'基期比');
assert.equal(mobileTradeQ.category,'拉平增长率');
assert.equal(mobileTradeQ.answer,'B','按核对的原始题面，2.6位于B项');
assert.deepEqual(mobileTradeQ.options,['2.1','2.6','2.9','3.5'],'依据完整原题选项录入，不得推测为C');
assert.equal(mobileTradeMaterial.blocks.length,1);
for(const s of ['1.8亿台','22.1%','699.9万台','30.7%','245.2万台','36.6%'])
 assert.ok(mobileTradeMaterial.blocks[0].text.includes(s),'手机出口材料数据缺失：'+s);
assert.ok(mobileTradeQ.analysis.formula.includes(String.raw`\frac{5.9\%}{0.634}`),'大降幅补正时必须保留分母0.634');
assert.ok(mobileTradeQ.analysis.formula.includes('9.3')&&mobileTradeQ.analysis.formula.includes('10'),'修正率精估9.3%再取整为10%速算');
assert.ok(mobileTradeQ.analysis.quick.includes(String.raw`245\times(1+10\%)`),'给现期分母245补正近10%');
assert.ok(mobileTradeQ.analysis.quick.includes(String.raw`\frac{700}{270}`)&&mobileTradeQ.analysis.quick.includes('2.6'),'700/270≈2.6，保留原教法');
assert.ok(DA.explanationHtml(mobileTradeQ).includes('data-da-tex'),'LaTeX公式应正常渲染');
assert.equal(lesson06.questionIds.filter(q=>q==='data-2016-s-city-processing-vs-special-customs-mobile-export-multiple').length,1,'新题只需关联原课程一次');
const mobileRatio=(699.9/(1-.307))/(245.2/(1-.366));
assert.ok(mobileRatio>2.60&&mobileRatio<2.62,'原题确切基期比约2.61，对应2.6');
assert.equal(materials.filter(x=>x.id===mobileTradeMaterial.id).length,1,'手机出口材料唯一，上一组交通题依然共用同一份');
const retailerIncreaseQ=questions.find(q=>q.id==='data-2021-s-city-wholesale-retail-vs-accommodation-increase-multiple');
const retailerIncreaseM=materials.find(m=>m.id==='data-material-2021-s-city-retail-sales-by-sector');
assert.ok(retailerIncreaseQ&&retailerIncreaseM,'第27题与材料均需存在');
assert.equal(retailerIncreaseQ.materialId,retailerIncreaseM.id);
assert.equal(retailerIncreaseQ.category,'拉平增长率');
assert.equal(retailerIncreaseQ.type,'增长量比较');
assert.equal(retailerIncreaseQ.answer,'C');
assert.deepEqual(retailerIncreaseQ.options,['3','5','7','9']);
assert.equal(retailerIncreaseM.blocks.length,1);
for(const s of ['9048.44','2104.14','8287.13','28.4%','761.31','54.0%'])assert.ok(retailerIncreaseM.blocks[0].text.includes(s),'材料数值必须保留：'+s);
assert.ok(retailerIncreaseQ.analysis.identify.includes('基期比×增速比'),'必须遵循已学增量倍数比较方法');
assert.ok(retailerIncreaseQ.analysis.formula.includes(String.raw`\frac{8287}{761}`),'先算现期倍数');
assert.ok(retailerIncreaseQ.analysis.formula.includes(String.raw`\frac{28.4\%}{54\%}`),'再算增速倍数');
assert.ok(retailerIncreaseQ.analysis.formula.includes('11\\times0.5=5.5'),'先得到暂估5.5倍');
assert.ok(retailerIncreaseQ.analysis.quick.includes(String.raw`\frac{54\%-28.4\%}{1+28.4\%}`),'增速较低的分子修正方向正确');
assert.ok(retailerIncreaseQ.analysis.quick.includes('20\\%')&&retailerIncreaseQ.analysis.quick.includes('5.5\\times1.2')&&retailerIncreaseQ.analysis.quick.includes('6.6'),'补正约20%，用5.5×1.2≈6.6选C');
assert.ok(DA.explanationHtml(retailerIncreaseQ).includes('data-da-tex'),'题目公式须由网站正常渲染');
assert.equal(lesson06.questionIds.filter(x=>x==='data-2021-s-city-wholesale-retail-vs-accommodation-increase-multiple').length,1,'只关联第6课一次');
const exactRetailGrowthRatio=(8287.13*.284/(1+.284))/(761.31*.54/(1+.54));
assert.ok(exactRetailGrowthRatio>6.8&&exactRetailGrowthRatio<6.95,'精算核对答案约7倍');
assert.equal(materials.filter(m=>m.id===retailerIncreaseM.id).length,1,'原第27题材料必须唯一，不能误重复创建');
const priceDeclineQuestion=questions.find(q=>q.id==='data-2020-g-province-import-commodity-unit-price-decline');
const priceDeclineMaterial=materials.find(m=>m.id==='data-material-2020-g-province-import-commodity-prices');
assert.ok(priceDeclineQuestion&&priceDeclineMaterial,'G省进口单价下降量题目及材料必须存在');
assert.equal(priceDeclineQuestion.materialId,priceDeclineMaterial.id);
assert.equal(priceDeclineQuestion.type,'增长量比较');
assert.equal(priceDeclineQuestion.answer,'C');
assert.deepEqual(priceDeclineQuestion.options,['原油','天然气','铜材','成品油']);
assert.equal(priceDeclineMaterial.blocks[0].type,'table','原材料必须结构化保留全部表格');
assert.equal(priceDeclineMaterial.blocks[0].rows.length,13,'原材料13个进口商品全部录入');
assert.equal(priceDeclineMaterial.blocks[0].columns.length,6);
for(const row of priceDeclineMaterial.blocks[0].rows)assert.equal(row.length,6,'进口商品行的数值列必须齐全');
for(const [name,quantity,qtyYoY,amount,amountYoY] of [
 ['原油','54239','7.3','12218','-26.8'],
 ['天然气','10166','5.3','2315','-19.4'],
 ['铜材','2023','64.4','1165','19.8'],
 ['成品油','2835','-7.2','818','-30.4']
]){
 const row=priceDeclineMaterial.blocks[0].rows.find(r=>r[0]===name);
 assert.ok(row&&row[2]===quantity&&row[3]===qtyYoY&&row[4]===amount&&row[5]===amountYoY,'单价题必要数据必须正确：'+name);
}
for(const s of [String.raw`\frac{12218}{54239}`,String.raw`\frac{2315}{10166}`,String.raw`\frac{1165}{2023}`,String.raw`\frac{818}{2835}`])
 assert.ok(priceDeclineQuestion.analysis.formula.includes(s),'第一步须分别计算现期单价：'+s);
for(const s of ['-32','-25','-23.5','-27'])
 assert.ok(priceDeclineQuestion.analysis.quick.includes(s),'第二步须有四项单价增长率：'+s);
assert.ok(priceDeclineQuestion.analysis.quick.includes('铜材的单价下降量最大'),'沿用用户现期优势及降幅接近的判断');
assert.ok(DA.explanationHtml(priceDeclineQuestion).includes('data-da-tex'),'单价题数学公式应渲染');
const actualDeclines=[
 {name:'原油',price:12218/54239,priceYoY:(-.268-.073)/(1+.073)},
 {name:'天然气',price:2315/10166,priceYoY:(-.194-.053)/(1+.053)},
 {name:'铜材',price:1165/2023,priceYoY:(.198-.644)/(1+.644)},
 {name:'成品油',price:818/2835,priceYoY:(-.304-(-.072))/(1-.072)}
];
assert.equal(actualDeclines.map(x=>({name:x.name,decline:-x.price*x.priceYoY/(1+x.priceYoY)})).sort((a,b)=>b.decline-a.decline)[0].name,'铜材','单价下降量最大确为铜材');
const expressBaseQuestion=questions.find(q=>q.id==='data-2019-express-nonlocal-vs-intracity-base-ratio');
const expressBaseMaterial=materials.find(m=>m.id==='data-material-2020-national-express-service-business');
assert.ok(expressBaseQuestion&&expressBaseMaterial,'快递基期倍数题目及材料必须存在');
assert.equal(expressBaseQuestion.materialId,expressBaseMaterial.id);
assert.equal(expressBaseQuestion.type,'基期比');
assert.equal(expressBaseQuestion.answer,'C');
assert.deepEqual(expressBaseQuestion.options,['5.7','5.3','4.6','4.2']);
for(const s of ['833.6','31.2%','8795.4','17.3%','121.7','10.2%','693.6','35.9%','18.4','27.7%'])
 assert.ok(expressBaseMaterial.blocks[0].text.includes(s),'快递文字材料需要完整：'+s);
assert.ok(expressBaseQuestion.analysis.formula.includes(String.raw`\frac{693}{121}`),'先写现期比693/121');
assert.ok(expressBaseQuestion.analysis.formula.includes(String.raw`\frac{35.9\%-10.2\%}{1+10.2\%}`),'给较低增速的同城分母补正');
assert.ok(expressBaseQuestion.analysis.quick.includes(String.raw`\frac{700}{121(1+23\%)}`)&&expressBaseQuestion.analysis.quick.includes(String.raw`\frac{700}{150}`),'分母补至约150后直接700/150');
assert.ok(expressBaseQuestion.analysis.quick.includes('4.6'),'结果约4.6倍');
assert.ok(!expressBaseQuestion.analysis.quick.includes(String.raw`\frac{693}{121}\times`),'不得把补正倍数误乘到整个现期比');
assert.ok(DA.explanationHtml(expressBaseQuestion).includes('data-da-tex'),'快递基期比公式应正常渲染');
const exactExpressBaseRatio=(693.6/(1+.359))/(121.7/(1+.102));
assert.ok(exactExpressBaseRatio>4.6&&exactExpressBaseRatio<4.65,'快递基期比约4.62，对应C选项4.6');
assert.equal(lesson06.questionIds.filter(x=>x==='data-2020-g-province-import-commodity-unit-price-decline'||x==='data-2019-express-nonlocal-vs-intracity-base-ratio').length,2,'两道题各关联第6课一次');
assert.equal(materials.length,31,'此前二十九份材料及两份新材料完整保留');
// Lesson 7 after-class exercise: telecom revenue change, direct component-increment strategy.
const telecomQid='data-2019-telecom-revenue-increase-under-1000';
const telecomMid='data-material-2019-telecom-fixed-mobile-revenue';
const telecomQuestion=questions.find(q=>q.id===telecomQid);
const telecomMaterial=materials.find(m=>m.id===telecomMid);
assert.ok(telecomQuestion&&telecomMaterial,'第7课电信业务增长量课后习题与完整材料已入库');
assert.equal(telecomQuestion.materialId,telecomMid);
assert.equal(telecomQuestion.type,'增长量');
assert.equal(telecomQuestion.category,'分式混合');
assert.equal(telecomQuestion.answer,'A');
assert.deepEqual(telecomQuestion.options,['增加了不到1000亿元','增加了1000亿元以上','减少了不到1000亿元','减少了1000亿元以上']);
assert.equal(telecomMaterial.blocks.length,1);
assert.equal(telecomMaterial.blocks[0].type,'paragraph');
for(const value of ['1.31万亿元','4161亿元','9.5%','2.6个百分点','8942亿元','减少2.9%'])assert.ok(telecomMaterial.blocks[0].text.includes(value),'原材料统计信息完整：'+value);
assert.ok(telecomQuestion.ask.includes('2019年电信业务收入比2018年'),'题干保留完整统计年份');
assert.ok(telecomQuestion.analysis.identify.includes('直接分别计算固定通信与移动通信业务的增长量'),'采用用户指定的更简便方法');
assert.ok(telecomQuestion.analysis.formula.includes(String.raw`\frac{4161}{11}`)&&telecomQuestion.analysis.formula.includes(String.raw`8942\times3\%`),'固定通信4161/11，移动通信8942乘3%');
assert.ok(telecomQuestion.analysis.quick.includes(String.raw`380-270`)&&telecomQuestion.analysis.quick.includes('110'),'380减270更正为110，不影响答案');
assert.ok(telecomQuestion.analysis.trap.includes('基期比')&&telecomQuestion.analysis.trap.includes('混合增长率'),'保留先算混合增速增加计算量的陷阱');
assert.ok(DA.explanationHtml(telecomQuestion).includes('data-da-tex'),'新增题目数学公式应渲染');
assert.ok(DA.materialHtml(telecomMaterial).includes('2.6个百分点'),'材料的比重变化需呈现');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'第7课三道课后习题按入库顺序关联且没有重复');
const fixedActualIncrease=4161*(.095/1.095);
const mobileActualIncrease=8942*(-.029/(1-.029));
assert.ok(fixedActualIncrease+mobileActualIncrease>90&&fixedActualIncrease+mobileActualIncrease<100,'独立精算总增量约94亿元，答案A');

// Lesson 7: two further after-class exercises, focusing on mixed-rate qualitative reasoning.
const postalQId='data-2017-a-province-telecom-postal-total-growth-range';
const foreignQId='data-2022-s-city-primary-secondary-fdi-growth-range';
const postalQ=questions.find(x=>x.id===postalQId);
const foreignQ=questions.find(x=>x.id===foreignQId);
const postalM=materials.find(x=>x.id==='data-material-2017-a-province-telecom-postal-business');
const foreignM=materials.find(x=>x.id==='data-material-2022-s-city-fdi-industry');
assert.ok(postalQ&&foreignQ&&postalM&&foreignM,'两道混合增速习题及完整统计资料均已入库');
assert.equal(postalQ.materialId,postalM.id);
assert.equal(foreignQ.materialId,foreignM.id);
assert.equal(postalQ.category,'分式混合');
assert.equal(foreignQ.category,'分式混合');
assert.equal(postalQ.type,'混合增长率');
assert.equal(foreignQ.type,'混合增长率');
assert.equal(postalQ.answer,'C');
assert.equal(foreignQ.answer,'D');
assert.deepEqual(postalQ.options,['低于25%','25%～50%之间','50%～75%之间','超过75%']);
assert.deepEqual(foreignQ.options,['增加了不到2%','增加了2%以上','减少了不到2%','减少了2%以上']);
assert.equal(postalM.blocks.length,1);
assert.equal(foreignM.blocks.length,1);
assert.equal(postalM.blocks[0].type,'paragraph');
assert.equal(foreignM.blocks[0].type,'paragraph');
for(const token of ['2017年','6065.71亿元','3575.86亿元','75.8%','2489.85亿元','32.0%'])
 assert.ok(postalM.blocks[0].text.includes(token),'邮电业务原材料应保留数据：'+token);
for(const token of ['2022年1—12月','239.6亿美元','0.4%','230.7亿美元','1%'])
 assert.ok(foreignM.blocks[0].text.includes(token),'S市外资原材料应保留数据：'+token);
assert.ok(postalQ.analysis.formula.includes('53.9'),'先算两部分增长率中点');
assert.ok(postalQ.analysis.quick.includes(String.raw`\frac{3575.86}{2489.85}`),'粗估两部分现期比');
assert.ok(postalQ.analysis.quick.includes(String.raw`\frac{75.8\%-32.0\%}{1+32.0\%}`),'用第六课给较低增速的邮政补正');
assert.ok(postalQ.analysis.quick.includes('3336<3576'),'邮政补正后略小于电信');
assert.ok(postalQ.analysis.quick.includes('选C'),'通过基期接近及整体偏向选C');
assert.ok(foreignQ.analysis.formula.includes(String.raw`r_{\text{一二产业}}<0.4\%<1\%`),'第一步先通过混合关系排除B');
assert.ok(foreignQ.analysis.formula.includes('239.6-230.7=8.9'),'第二步算另一部分现期量');
assert.ok(foreignQ.analysis.formula.includes(String.raw`\frac{230.7}{8.9}`),'先看两部分规模差距排除A');
assert.ok(foreignQ.analysis.quick.includes(String.raw`\frac{2.4\%}{0.6\%}=4`),'代入负2%的正确距离比为2.4%比0.6%');
assert.ok(foreignQ.analysis.quick.includes('20多倍'),'再看基期比明显大于4，选择D');
assert.ok(foreignQ.analysis.quick.includes('选择D'),'正确选项D');
assert.ok(DA.explanationHtml(postalQ).includes('data-da-tex'),'邮电业务题公式可渲染');
assert.ok(DA.explanationHtml(foreignQ).includes('data-da-tex'),'S市外资题公式可渲染');
assert.ok(DA.materialHtml(postalM).includes('2489.85'),'邮电原材料完整显示');
assert.ok(DA.materialHtml(foreignM).includes('230.7'),'外资原材料完整显示');
const exactPostalGrowth=6065.71/(3575.86/1.758+2489.85/1.32)-1;
const exactForeignGrowth=8.9/(239.6/1.004-230.7/1.01)-1;
assert.ok(exactPostalGrowth>.5&&exactPostalGrowth<.75,'邮电整体增速约54.7%，选C');
assert.ok(exactForeignGrowth<-.02,'第一二产业实际外资增速约-13%，选D');
assert.deepEqual(lesson07.questionIds,["data-2019-telecom-revenue-increase-under-1000","data-2017-a-province-telecom-postal-total-growth-range","data-2022-s-city-primary-secondary-fdi-growth-range"],'三道正式课后习题均关联到第7课');

console.log('Data analysis OK:',materials.length,'materials,',questions.length,'questions,',
  book.sections.reduce((sum,s)=>sum+s.topics.length,0),'knowledge topics; rendering fixture validated');
