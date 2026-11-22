const assert=require('node:assert/strict');
const {create,KEY}=require('../device-position.js');
class MemoryStorage{
 constructor(){this.data=new Map()}
 getItem(k){return this.data.get(k)||null}
 setItem(k,v){this.data.set(k,String(v))}
}
const desktop=new MemoryStorage(),ipad=new MemoryStorage();
const pc=create({storage:desktop}),pad=create({storage:ipad});
assert.equal(pc.last(),null,'Brand-new browser has no bookmark');
assert.equal(pad.last(),null,'Another device is initially independent');
assert.equal(pc.remember('data','knowledge','data-topic-course-07-fraction-mix'),true);
assert.equal(pc.updateReading('data','data-topic-course-07-fraction-mix',
 {sectionId:'fraction-mix-flexible-recognition',offset:113}),true);
assert.deepEqual(pc.bookmark('data','knowledge').reading,
 {sectionId:'fraction-mix-flexible-recognition',offset:113});
assert.equal(pad.last(),null,'Desktop does not share iPad reading location');
assert.equal(pad.remember('argument','practice','argument-q47'),true);
pc.remember('argument','practice','argument-q12');
assert.deepEqual(pc.last(),{module:'argument',view:'practice',id:'argument-q12'});
assert.equal(pc.bookmark('data','knowledge').reading.sectionId,'fraction-mix-flexible-recognition');
pc.remember('data','knowledge','data-topic-course-07-fraction-mix');
assert.equal(pc.bookmark('data','knowledge').reading.offset,113,
 'Returning to same lesson preserves scroll anchor');
pc.remember('data','knowledge','data-topic-course-06-flatten-growth');
assert.equal(pc.bookmark('data','knowledge').reading,null,
 'Switching to another lesson must not reuse the preceding scroll anchor');
assert.equal(pc.updateReading('data','data-topic-course-07-fraction-mix',
 {sectionId:'old',offset:999}),false,'Stale asynchronous scroll must not overwrite new lesson');
assert.equal(create({storage:desktop}).last().id,'data-topic-course-06-flatten-growth',
 'Reload hydrates the saved last page');
assert.equal(create({storage:ipad}).bookmark('argument','practice').id,'argument-q47');

assert.deepEqual(pc.readingFor('data','data-topic-course-07-fraction-mix')?.reading,
 {sectionId:'fraction-mix-flexible-recognition',offset:113},
 'Leaving lesson 7 for lesson 6 retains lesson 7.4 bookmark');
pc.updateReading('data','data-topic-course-06-flatten-growth',{sectionId:'base-methods',offset:87});
pc.remember('data','knowledge','data-topic-course-07-fraction-mix');
assert.deepEqual(pc.bookmark('data','knowledge').reading,
 {sectionId:'fraction-mix-flexible-recognition',offset:113},
 'Returning to lesson 7 resumes its own reading position');
pc.remember('data','knowledge','data-topic-course-06-flatten-growth');
assert.equal(pc.bookmark('data','knowledge').reading.offset,87,
 'Returning to lesson 6 resumes its different independent position');
const reloaded=create({storage:desktop});
assert.equal(reloaded.readingFor('data','data-topic-course-07-fraction-mix').reading.offset,113,
 'Per-lesson bookmarks survive browser reload');
assert.equal(reloaded.readingFor('data','data-topic-course-06-flatten-growth').reading.offset,87);
const legacy=new MemoryStorage();
legacy.setItem(KEY,JSON.stringify({version:1,modules:{data:{
 knowledge:{id:'data-topic-course-07-fraction-mix',reading:
 {sectionId:'fraction-mix-flexible-recognition',offset:91}}}},
 last:{module:'data',view:'knowledge',id:'data-topic-course-07-fraction-mix'}}));
const migrated=create({storage:legacy});
assert.equal(migrated.readingFor('data','data-topic-course-07-fraction-mix').reading.offset,91,
 'Older device-local bookmark format migrates without deleting saved 7.4');

assert.equal(pc.remember('x','practice','test'),false,'Unknown module cannot be persisted');
assert.equal(pc.remember('data','x','test'),false,'Unknown view cannot be persisted');
desktop.setItem(KEY,'{corrupted JSON');
assert.equal(create({storage:desktop}).last(),null,'Corrupted local data falls back safely');
const blocked=create({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
assert.equal(blocked.remember('formal','knowledge','formal-topic'),true,
 'Privacy settings denying storage must not break browsing');
console.log('Device position storage: independent browsers, per-module bookmarks, section offsets, invalid-state fallbacks OK');
