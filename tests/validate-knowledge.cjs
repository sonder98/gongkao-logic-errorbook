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
const formalBook=JSON.parse(fs.readFileSync(path.join(root,'formal-knowledge.json'),'utf8'));
const formalQuestions=JSON.parse(fs.readFileSync(path.join(root,'formal-questions.json'),'utf8'));
assert.ok(Array.isArray(formalBook.sections),'formal knowledge sections must be an array');
const formalIds=new Set(formalQuestions.map(q=>q.id));
assert.deepEqual(formalBook.sections.map(section=>section.title),["一、翻译推理","二、矛盾推理","三、真假推理","四、综合推理"]);
const quantifiers=formalBook.sections[0].topics.find(topic=>topic.id==='formal-translation-quantifiers');
assert.ok(quantifiers,'missing collection inference topic');
assert.ok(quantifiers.title.includes('五类集合推理模型'));
assert.ok(quantifiers.patterns.length===5,'exactly five collection inference models');
const collectionQuestionIds=["formal-unknown-party-charter-quantified-converse","formal-unknown-multilingual-employees","formal-unknown-phd-statistics-men","formal-unknown-car-over-600k-scrap","formal-unknown-textile-dormitory-premise","formal-2020-beijing-sprint-longrun-premise","formal-2023-shanghai-film-indian-nonscifi"];
for(const id of collectionQuestionIds)assert.ok(quantifiers.questionIds.includes(id),'collection question not linked: '+id);
assert.equal(new Set(quantifiers.questionIds).size,quantifiers.questionIds.length,'duplicate collection topic question IDs');
assert.ok(!formalBook.sections.some(section=>section.id==='formal-set'),'collection inference must be inside translation');
const contradiction=formalBook.sections.find(s=>s.id==='formal-contradiction')?.topics.find(t=>t.id==='formal-contradiction-two-patterns');
assert.ok(contradiction,'missing contradiction inference rules');
const expectedContradictions=[
 'formal-unknown-recruitment-four-positions',
 'formal-unknown-investment-five-fields',
 'formal-unknown-graduates-seven-paths',
 'formal-unknown-secondment-choose-chen',
 'formal-2022-sichuan-excellent-team',
 'formal-2019-jiangsu-project-pair-impossible'
];
assert.deepEqual(contradiction.questionIds,expectedContradictions);
assert.ok(contradiction.patterns.some(x=>x.includes('最短链')),'missing exam strategy');
assert.ok(contradiction.patterns.some(x=>x.includes('不可能')),'missing impossibility strategy');
for(const topicId of ['formal-translation-basics','formal-translation-quantifiers','formal-translation-modality','formal-translation-nested-negation']){
 const topic=formalBook.sections[0].topics.find(t=>t.id===topicId);
 assert.ok(topic,'missing translation topic: '+topicId);
 for(const qid of ['formal-2013-jilin-not-all-people-like-you','formal-2015-fujian-disaster-unless-disagreement']){
  assert.ok(topic.questionIds.includes(qid),'missing link '+topicId+' -> '+qid);
 }
}
for(const section of formalBook.sections){
 assert.ok(section.id&&section.chapter&&section.title&&Array.isArray(section.topics));
 for(const topic of section.topics){
  assert.ok(topic.id.startsWith('formal-')&&topic.title&&topic.summary);
  assert.ok(!ids.has(topic.id),'knowledge ID conflict: '+topic.id);
  ids.add(topic.id);
  for(const id of topic.questionIds||[])assert.ok(formalIds.has(id),'formal knowledge cross-module reference: '+id);
 }
}
console.log('Knowledge OK:',ids.size,'topics in',book.sections.length+formalBook.sections.length,'sections; all question references valid');
