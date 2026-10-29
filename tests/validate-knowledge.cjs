const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const book=JSON.parse(fs.readFileSync(path.join(root,'knowledge.json'),'utf8'));
const questions=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const qids=new Set(questions.map(q=>q.id));
const ids=new Set();
assert.ok(Array.isArray(book.sections)&&book.sections.length>=3);
for(const section of book.sections){
 assert.ok(section.id&&section.chapter&&section.title);
 assert.ok(Array.isArray(section.topics)&&section.topics.length,'empty section '+section.id);
 for(const item of section.topics){
  assert.equal(typeof item.id,'string');
  assert.ok(!ids.has(item.id),'duplicate topic '+item.id);
  ids.add(item.id);
  assert.ok(item.title&&item.summary,'missing text '+item.id);
  for(const id of item.questionIds||[])assert.ok(qids.has(id),'unknown question '+id);
 }
}
const published=JSON.stringify(book);
for(const banned of ['用户确认','用户要求','下次对话','AGENTS.md','Supabase','ChatGPT'])assert.ok(!published.includes(banned),'non-reader-facing content: '+banned);
console.log('Knowledge OK:',ids.size,'topics in',book.sections.length,'sections; all question references valid');
