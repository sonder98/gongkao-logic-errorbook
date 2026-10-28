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
console.log('题库校验通过：'+q.length+'道，历史ID保留，历史原图可用');
