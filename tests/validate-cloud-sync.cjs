const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {merge,rebaseGuest}=require('../cloud-sync.js');
const base={practiceAttempts:3,practiceCorrect:2,review:false,note:'base'};
const local={...base,practiceAttempts:5,practiceCorrect:3};
const cloud={...base,practiceAttempts:4,practiceCorrect:3,review:true};
assert.deepEqual(merge(base,local,cloud),{
 practiceAttempts:6,practiceCorrect:4,review:true,note:'base'
},'Concurrent answers should retain both sides, unrelated review change survives');
assert.equal(merge(base,{...local,note:'mine'},{...cloud,note:'theirs'}),null,
 'Different note edits must not silently overwrite either side');
assert.equal(merge(null,local,cloud),null,'Unknown base is a manual conflict');
assert.equal(merge(base,{...local,practiceAttempts:0},cloud),null,'Reset counters require resolution');
assert.equal(merge(base,{...base,note:'updated'},base).note,'updated');
assert.equal(merge({}, {practiceAttempts:1,practiceCorrect:1}, {practiceAttempts:2,practiceCorrect:1}).practiceAttempts,3);
assert.deepEqual(rebaseGuest(
 {practiceAttempts:5,practiceCorrect:3,note:'old'},
 {practiceAttempts:7,practiceCorrect:4,note:'old'},
 {practiceAttempts:12,practiceCorrect:7,note:'new'}
),{practiceAttempts:14,practiceCorrect:8,note:'new'},
 'Guest answers must add only the new attempts, without replacing a newer cloud note');
assert.equal(rebaseGuest(
 {practiceAttempts:1,note:'old'},
 {practiceAttempts:2,note:'guest changed'},
 {practiceAttempts:5,note:'cloud changed'}
),null,'Concurrent guest and cloud note edits require recovery');
assert.equal(rebaseGuest(
 {practiceAttempts:1,practiceCorrect:1},
 {practiceAttempts:0,practiceCorrect:0},
 {practiceAttempts:3,practiceCorrect:2}
),null,'Guest resets must not be silently applied');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert.match(html,/cloud-sync\.js/);
assert.match(html,/autoRefreshToken:true/);
assert.match(html,/persistSession:true/);
assert.match(html,/function queueCloud/);
assert.match(html,/function refreshCloudAutomatically/);
assert.match(html,/KEY\+'_guest_pending'/);
assert.match(html,/ExamCloudSync\.merge/);
assert.doesNotMatch(html,/service_role.*(?:['"][A-Za-z0-9_-]{20,})/i);
console.log('Automatic cloud sync: conflict-safe merge, login persistence and lifecycle checks OK');
