const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const q=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const legacy=["2008-yumi","2022-dingcan","fruit","2025-fish","medical","2024-hebei-diet-cognition","2025-guangdong-sanzhiyifu-adhd-intervention","unknown-peach-bagging-small-fruit"];
assert.ok(Array.isArray(q)&&q.length>=legacy.length,'历史题目不得减少');
assert.deepEqual(q.slice(0,legacy.length).map(x=>x.id),legacy,'历史题目ID及顺序不可更改');
assert.equal(new Set(q.map(x=>x.id)).size,q.length,'题目ID不可重复');
const required=['id','year','exam','title','category','type','difficulty','stem','ask','answer','structure','reason','trap','image'];
for(const item of q){
 for(const key of required)assert.equal(typeof item[key],'string',item.id+': '+key+' 字段不合法');
 if(Object.hasOwn(item,'rule'))assert.equal(typeof item.rule,'string',item.id+': optional rule must be a string');
 assert.ok(Array.isArray(item.options)&&item.options.length>=2&&item.options.length<=5,item.id+' 选项数量异常');
 assert.ok(item.options.every(opt=>typeof opt==='string'&&opt.trim()),item.id+' 选项不完整');
 assert.ok('ABCDE'.slice(0,item.options.length).includes(item.answer),item.id+' 正确答案无效');
 assert.ok(item.image===''||item.image==='legacy:'+item.id,item.id+' 图片字段不符合规则');
 if(Object.hasOwn(item,'important'))assert.equal(typeof item.important,'boolean',item.id+' 重点标记须为布尔值');
}
const archive=path.join(root,'legacy/questions-with-original-images-20261028.html');
assert.ok(fs.existsSync(archive),'原图历史文件不存在');
const content=fs.readFileSync(archive,'utf8');
const match=content.match(/const QUESTIONS=(\[[\s\S]*?\]);/);
assert.ok(match,'原图归档缺少历史QUESTIONS');
const oldQuestions=JSON.parse(match[1]);
for(const item of q.filter(x=>x.image)){
 const old=oldQuestions.find(x=>x.id===item.id);
 assert.ok(old && old.image.startsWith('data:image/'),item.id+' 历史原图缺失');
}
const newArgumentBatch=[["unknown-hospital-three-day-registration-initial-followup","A"],["unknown-atlas-moth-colorful-wings-mating-attraction","A"]];
for(const [id,answer] of newArgumentBatch){
 const item=q.find(x=>x.id===id);
 assert.ok(item&&item.answer===answer,'new argument logic problem missing or incorrect: '+id);
 assert.equal(item.category,'由因推果');
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
assert.equal(q.find(x=>x.id==='unknown-atlas-moth-colorful-wings-mating-attraction').important,true,'moth reasoning must be marked important');
const gorilla=q.find(x=>x.id==='unknown-hmpv-gorilla-human-to-animal-transmission');
assert.ok(gorilla&&gorilla.answer==='C'&&gorilla.category==='由果推因','HMPV gorilla exercise incomplete');
assert.equal(gorilla.options.length,4);
assert.equal(gorilla.image,'');
const tiktaalik=q.find(x=>x.id==='unknown-tiktaalik-fish-lungs-terrestrial-advantage');
assert.ok(tiktaalik&&tiktaalik.answer==='A'&&tiktaalik.category==='由果推因','Tiktaalik explanation-strengthening question missing or incorrect');
assert.equal(tiktaalik.type,'解释型加强');
assert.equal(tiktaalik.options.length,4);
assert.equal(tiktaalik.image,'');
for(const [id,answer,category] of [["unknown-cockroach-extermination-allergens-endotoxin-apartment","B","相关性推因果"],["unknown-first-exercise-muscle-response-sex-long-term-adaptation","A","相关性推因果"]]) {
 const item=q.find(x=>x.id===id);
 assert.ok(item&&item.answer===answer&&item.category===category,'missing new argument problem: '+id);
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
assert.ok(q.filter(item=>typeof item.rule==='string'&&item.rule.trim()).length<q.length/2,'do not write new rules for every argument question');
assert.ok(!Object.hasOwn(q.find(item=>item.id==='unknown-cloud-flight-recorder-reliability'),'rule'),'question-specific argument analysis should stay in explanation');
assert.ok(Object.hasOwn(q.find(item=>item.id==='unknown-first-exercise-muscle-response-sex-long-term-adaptation'),'rule'),'representative transferable principle retained');
for(const [id,answer,category] of [
 ['unknown-j-city-theatre-monthly-share-ticket-audience','B','原因解释'],
 ['unknown-drug-price-reduction-policies-common-drug-inflation','B','原因解释'],
 ['unknown-xvirus-high-proof-baijiu-prevention-weak-effect','B','由因推果']
]){
 const item=q.find(x=>x.id===id);
 assert.ok(item && item.answer===answer && item.category===category,'missing argument problem '+id);
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
 assert.ok(!Object.hasOwn(item,'rule'),'do not invent a per-question transferable rule: '+id);
}
const muscleComparison=q.find(x=>x.id==='unknown-first-exercise-muscle-response-sex-long-term-adaptation');
assert.equal(muscleComparison.answer,'A');
assert.ok(muscleComparison.trap.includes('高度白酒预防X病毒题') && muscleComparison.reason.includes('整体评价'),'muscle comparison explanation must remain');
for(const [id,answer] of [['unknown-gout-high-purine-diet-necessary-condition','D'],['unknown-salty-pickles-hypertension-other-causes','B']]){
 const item=q.find(x=>x.id===id);
 assert.ok(item&&item.answer===answer&&item.category==='由因推果','new argument exercise missing: '+id);
 assert.equal(item.options.length,4);assert.equal(item.image,'');
 assert.ok(!Object.hasOwn(item,'rule'),'do not invent per-question rule: '+id);
}
assert.ok(q.find(x=>x.id==='unknown-gout-high-purine-diet-necessary-condition').reason.includes('A且非B'));
assert.ok(q.find(x=>x.id==='unknown-salty-pickles-hypertension-other-causes').trap.includes('误选D'));
assert.equal(q.length,59,'argument catalog count');
const formal=JSON.parse(fs.readFileSync(path.join(root,'formal-questions.json'),'utf8'));
assert.ok(Array.isArray(formal),'形式逻辑题库应是数组');
const allIds=new Set(q.map(item=>item.id));
for(const item of formal){
 assert.ok(item.id.startsWith('formal-')&&!allIds.has(item.id),'形式逻辑 ID 必须独立且唯一');
 allIds.add(item.id);
 for(const key of required)assert.equal(typeof item[key],'string',item.id+': '+key+' 字段不合法');
 if(Object.hasOwn(item,'rule'))assert.equal(typeof item.rule,'string',item.id+': optional rule must be a string');
 assert.ok(Array.isArray(item.options)&&item.options.length>=2&&item.options.length<=5);
 assert.ok(item.options.every(opt=>typeof opt==='string'&&opt.trim()));
 assert.ok('ABCDE'.slice(0,item.options.length).includes(item.answer));
 assert.equal(item.image,'','形式逻辑新题不保留原图');
}
for(const [id,answer] of [
 ['formal-2013-jilin-not-all-people-like-you','B'],
 ['formal-2015-fujian-disaster-unless-disagreement','A']
]){
 const found=formal.find(item=>item.id===id);
 assert.ok(found&&found.answer===answer,'新入库形式逻辑答案不正确：'+id);
 assert.equal(found.options.length,4);
 assert.equal(found.important,true);
}
assert.match(formal.find(item=>item.id==='formal-2015-fujian-disaster-unless-disagreement').trap,/D.*可.*推出/);
const recentlyAdded = [
 ['formal-unknown-recruitment-four-positions','B'],
 ['formal-unknown-investment-five-fields','C'],
 ['formal-unknown-graduates-seven-paths','C'],
 ['formal-unknown-secondment-choose-chen','D'],
 ['formal-2022-sichuan-excellent-team','A'],
 ['formal-2019-jiangsu-project-pair-impossible','D']
];
for(const [id,answer] of recentlyAdded){
 const item=formal.find(q=>q.id===id);
 assert.ok(item&&item.answer===answer,'missing or invalid contradiction problem '+id);
 assert.equal(item.category,'矛盾推理');
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
const collectionBatch=[["formal-unknown-party-charter-quantified-converse","C"],["formal-unknown-multilingual-employees","B"],["formal-unknown-phd-statistics-men","B"],["formal-unknown-car-over-600k-scrap","D"],["formal-unknown-textile-dormitory-premise","D"],["formal-2020-beijing-sprint-longrun-premise","D"],["formal-2023-shanghai-film-indian-nonscifi","A"]];
for(const [id,answer] of collectionBatch){
 const item=formal.find(q=>q.id===id);
 assert.ok(item&&item.answer===answer,'missing or incorrect collection reasoning question: '+id);
 assert.equal(item.category,'翻译推理');
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
const truthBatch=[["formal-unknown-candy-four-children-two-true","A"],["formal-2019-jiangxi-speech-first-one-true","C"],["formal-unknown-four-classmates-accountant-true","D"],["formal-unknown-academic-committee-single-adopted-opinion","D"],["formal-unknown-singing-ranking-one-true","A"]];
for(const [id,answer] of truthBatch){
 const item=formal.find(q=>q.id===id);
 assert.ok(item&&item.answer===answer,'missing or invalid truth reasoning question '+id);
 assert.equal(item.category,'真假推理');
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
const comprehensiveBatch=[["formal-unknown-seven-villages-choose-four","A"],["formal-unknown-five-skiers-four-events","D"],["formal-unknown-four-roads-paired-survey","A"],["formal-unknown-weekly-movies-cover-days","A"],["formal-unknown-professors-provinces-subjects","C"],["formal-unknown-roommates-provinces-universities","D"],["formal-unknown-four-streets-income-rank","A"],["formal-unknown-five-students-age-major-groups","D"]];
for(const [id,answer] of comprehensiveBatch){
 const item=formal.find(q=>q.id===id);
 assert.ok(item&&item.answer===answer,'missing or incorrect comprehensive question: '+id);
 assert.equal(item.category,'综合推理');
 assert.equal(item.options.length,4);
 assert.equal(item.image,'');
}
const spiritual=formal.find(x=>x.id==='formal-unknown-spiritual-production-consumption-necessity');
assert.ok(spiritual&&spiritual.answer==='A'&&spiritual.category==='翻译推理','missing necessary-condition translation question');
assert.equal(spiritual.options.length,4);
assert.equal(spiritual.image,'');
const roommates=formal.find(x=>x.id==='formal-unknown-four-roommates-graduation-choices-disjoint-options');
assert.ok(roommates&&roommates.answer==='B'&&roommates.category==='综合推理','missing graduation roommate impossibility question');
assert.equal(roommates.options.length,4);
assert.equal(roommates.image,'');
assert.ok(roommates.reason.includes('无交集'),'roommate case must teach disjoint feasible options');
assert.ok(formal.filter(item=>typeof item.rule==='string'&&item.rule.trim()).length<formal.length/2,'do not write new rules for every formal question');
assert.ok(!Object.hasOwn(formal.find(item=>item.id==='formal-2015-fujian-disaster-unless-disagreement'),'rule'),'duplicate translation method should not be forced on each example');
assert.ok(Object.hasOwn(formal.find(item=>item.id==='formal-unknown-weekly-movies-cover-days'),'rule'),'representative capacity principle retained');
assert.equal(formal.length,30,'formal catalog count');
const fujian=formal.find(q=>q.id==='formal-2015-fujian-disaster-unless-disagreement');
assert.match(fujian.trap,/D.*可.*推出/);
console.log('题库校验通过：论证'+q.length+'道、形式'+formal.length+'道，历史ID保留，历史原图可用');
