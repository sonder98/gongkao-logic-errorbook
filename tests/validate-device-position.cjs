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
assert.equal(pc.remember('x','practice','test'),false,'Unknown module cannot be persisted');
assert.equal(pc.remember('data','x','test'),false,'Unknown view cannot be persisted');
desktop.setItem(KEY,'{corrupted JSON');
assert.equal(create({storage:desktop}).last(),null,'Corrupted local data falls back safely');
const blocked=create({storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
assert.equal(blocked.remember('formal','knowledge','formal-topic'),true,
 'Privacy settings denying storage must not break browsing');
console.log('Device position storage: independent browsers, per-module bookmarks, section offsets, invalid-state fallbacks OK');
