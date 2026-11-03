const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const q=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const legacy=["2008-yumi","2022-dingcan","fruit","2025-fish","medical","2024-hebei-diet-cognition","2025-guangdong-sanzhiyifu-adhd-intervention","unknown-peach-bagging-small-fruit"];
assert.ok(Array.isArray(q)&&q.length>=legacy.length,'历史题目不得减少');
assert.deepEqual(q.slice(0,legacy.length).map(x=>x.id),legacy,'历史题目ID及顺序不可更改');
assert.equal(new Set(q.map(x=>x.id)).size,q.length,'题目ID不可重复');
const required=['id','year','exam','title','category','type','difficulty','stem','ask','answer','structure','reason','trap','rule','image'];
for(const item of q){
 for(const key of required)assert.equal(typeof item[key],'string',item.id+': '+key+' 字段不合法');
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
const formal=JSON.parse(fs.readFileSync(path.join(root,'formal-questions.json'),'utf8'));
assert.ok(Array.isArray(formal),'形式逻辑题库应是数组');
const allIds=new Set(q.map(item=>item.id));
for(const item of formal){
 assert.ok(item.id.startsWith('formal-')&&!allIds.has(item.id),'形式逻辑 ID 必须独立且唯一');
 allIds.add(item.id);
 for(const key of required)assert.equal(typeof item[key],'string',item.id+': '+key+' 字段不合法');
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
assert.equal(formal.length,8,'formal catalog count');
const fujian=formal.find(q=>q.id==='formal-2015-fujian-disaster-unless-disagreement');
assert.match(fujian.trap,/D.*可.*推出/);
console.log('题库校验通过：论证'+q.length+'道、形式'+formal.length+'道，历史ID保留，历史原图可用');
