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
for(const id of ["unknown-hospital-three-day-registration-initial-followup","unknown-atlas-moth-colorful-wings-mating-attraction"]){
 for(const topicId of ["cause-overview","build-remove-link","match-target"]){
  const topic=book.sections.flatMap(s=>s.topics).find(t=>t.id===topicId);
  assert.ok(topic?.questionIds.includes(id),'new argument problem not linked: '+id+' '+topicId);
 }
}
const causeOverview=book.sections.flatMap(s=>s.topics).find(t=>t.id==='cause-overview');
assert.ok(causeOverview.pitfalls.some(s=>s.includes('仍可削弱')&&s.includes('一律无效')),'must keep direction-vs-other-cause caveat');
for(const topicId of ['effect-overview','alternative-causes','match-target']){
 const topic=book.sections.flatMap(s=>s.topics).find(t=>t.id===topicId);
 assert.ok(topic?.questionIds.includes('unknown-hmpv-gorilla-human-to-animal-transmission'),'HMPV question must link to '+topicId);
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
const truthSection=formalBook.sections.find(s=>s.id==='formal-truth');
assert.deepEqual(truthSection.topics.map(t=>t.id),['formal-truth-contradictions','formal-truth-linked']);
const newTruthQuestions=["formal-unknown-candy-four-children-two-true","formal-2019-jiangxi-speech-first-one-true","formal-unknown-four-classmates-accountant-true","formal-unknown-academic-committee-single-adopted-opinion","formal-unknown-singing-ranking-one-true"];
assert.deepEqual([...new Set(truthSection.topics.flatMap(t=>t.questionIds))].sort(),newTruthQuestions.slice().sort(),'truth questions all linked');
assert.ok(truthSection.topics[0].patterns.some(s=>s.includes('集合对角线')));
assert.ok(truthSection.topics[1].patterns.some(s=>s.includes('不能同假')));
assert.equal(formalQuestions.filter(q=>q.category==='真假推理').length,5);
assert.equal(formalQuestions.filter(q=>q.category==='综合推理').length,8);
const comprehensiveSection=formalBook.sections.find(s=>s.id==='formal-comprehensive');
assert.deepEqual(comprehensiveSection.topics.map(t=>t.id),["formal-comprehensive-overview","formal-comprehensive-selection","formal-comprehensive-matching","formal-comprehensive-order","formal-comprehensive-grouping"]);
const comprehensiveIds=["formal-unknown-seven-villages-choose-four","formal-unknown-five-skiers-four-events","formal-unknown-four-roads-paired-survey","formal-unknown-weekly-movies-cover-days","formal-unknown-professors-provinces-subjects","formal-unknown-roommates-provinces-universities","formal-unknown-four-streets-income-rank","formal-unknown-five-students-age-major-groups"];
assert.deepEqual([...new Set(comprehensiveSection.topics.flatMap(t=>t.questionIds))].sort(),comprehensiveIds.slice().sort());
assert.equal(comprehensiveSection.topics[0].questionIds.length,8);
assert.equal(comprehensiveSection.topics[4].questionIds.length,4);
assert.ok(comprehensiveSection.topics[4].patterns.some(s=>s.includes('恰好覆盖')));
assert.ok(comprehensiveSection.topics[2].patterns.some(s=>s.includes('两张')),'一一对应应保留两张排除矩阵方法');
assert.ok(comprehensiveSection.topics[0].summary.includes('宫格推理'));
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
