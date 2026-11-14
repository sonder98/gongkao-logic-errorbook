'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

// 只检测可以确定的辩护式模板。严格逻辑所需的“非A”“不推出”等仍然允许。
const bad=[
 {name:'先否定旧说法再转折',pattern:/(?:不是|并非|不在于)[^。；\n]{0,70}(?:而是|而在于)/u},
 {name:'对话或编辑记录泄漏到解析',pattern:/用户曾|用户误选|截图标|按题目给定答案|题库答案字段|按讨论中的|参考答案.{0,12}已核对|我觉得|我们之前/u},
 {name:'辩护式过程评论',pattern:/不能机械|不必|无需|不要把|不要将|切勿|特别避免/u}
];
const sources=[
 ['论证逻辑','questions.json'],
 ['形式逻辑','formal-questions.json'],
 ['资料分析','data-questions.json']
];
let checked=0;
for(const [moduleName,file] of sources){
 const questions=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 for(const q of questions){
  checked++;
  const fields=moduleName==='资料分析'
   ? Object.entries(q.analysis||{}).filter(([,value])=>typeof value==='string').concat(typeof q.rule==='string'?[['rule',q.rule]]:[])
   : ['structure','reason','trap','rule'].filter(field=>typeof q[field]==='string').map(field=>[field,q[field]]);
  assert.ok(fields.length>0,moduleName+'/'+q.id+'：缺少解析');
  for(const [field,text] of fields){
   for(const {name,pattern} of bad){
    assert.ok(!pattern.test(text),moduleName+'/'+q.id+'/'+field+'：'+name+'。请改写为直接推理。');
   }
  }
 }
}
assert.ok(checked>=100,'正向推理校验覆盖题目数异常');
console.log('Explanation style OK:',checked,'questions, 3 modules');
