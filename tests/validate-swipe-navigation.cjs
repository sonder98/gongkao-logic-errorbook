const assert=require('node:assert/strict');
const {create}=require('../swipe-navigation.js');
const ids=['q1','q2','q3'];
let state={enabled:true,at:1,ids};
const visited=[];
const getState=()=>state;
const swipe=create({getState,onNavigate:id=>visited.push(id),isTouchDevice:()=>true,viewportWidth:()=>390});
const event=(x,y,dx=0,dy=0,options={})=>{
 const t={identifier:7,clientX:x,clientY:y};
 const after={identifier:7,clientX:x+dx,clientY:y+dy};
 return {start:{target:{closest:()=>options.blocked?{}:null},touches:[t]},
   move:{touches:[after]},end:{changedTouches:[after]}};
};
function gesture(x,y,dx,dy,opts){
 const e=event(x,y,dx,dy,opts);
 swipe.start(e.start);swipe.move(e.move);swipe.end(e.end);
}
gesture(210,360,-110,7);
assert.deepEqual(visited,['q3'],'Finger left navigates next');
gesture(200,350,105,-6);
assert.deepEqual(visited,['q3','q1'],'Finger right navigates previous');
gesture(200,400,25,180);
gesture(200,400,-80,160);
gesture(200,400,-45,6);
assert.equal(visited.length,2,'Vertical scroll or too-small horizontal drag must not navigate');
gesture(12,280,-150,0);
gesture(385,280,150,0);
assert.equal(visited.length,2,'System back/edge gestures must not navigate');
gesture(210,360,-120,0,{blocked:true});
assert.equal(visited.length,2,'Form controls, charts, tables and buttons are excluded');
state.enabled=false;gesture(180,350,-130,5);
assert.equal(visited.length,2,'Drawing mode or library drawer suppresses swipes');
state={enabled:true,at:0,ids};gesture(180,350,110,0);
assert.equal(visited.length,2,'No wrap before the first question');
state.at=2;gesture(180,350,-110,0);
assert.equal(visited.length,2,'No wrap after the last question');
state.at=1;
const twoFinger={target:{closest:()=>null},touches:[
 {identifier:7,clientX:200,clientY:100},{identifier:8,clientX:250,clientY:100}]};
swipe.start(twoFinger);swipe.end({changedTouches:[{identifier:7,clientX:70,clientY:105}]});
assert.equal(visited.length,2,'Pinch never navigates');
swipe.cancel();gesture(170,300,-98,4);
assert.equal(visited.length,3,'Next single-finger gesture works after pinch cancellation');
console.log('Mobile swipe navigation: directions, limits, scroll, exclusion, pinch & disabled mode OK');


// An answer option is a BUTTON but is also a valid horizontal swipe surface.
// Other controls remain ignored; a confirmed horizontal move cancels native
// synthetic clicks, while a small tap must never call preventDefault.
let clock=1000,prevented=0,dragged=0,cancelled=0;
const visits=[];
const choice={closest:selector=>
 selector.startsWith('#card .choices .choice')?{dataset:{answer:'A'}}:
 selector.includes('button')?{}:null};
const form={closest:selector=>selector.startsWith('#card .choices .choice')?null:
 selector.includes('button')?{}:null};
const improved=create({getState:()=>({enabled:true,at:1,ids}),
 onNavigate:(id,direction)=>visits.push({id,direction}),
 isTouchDevice:()=>true,viewportWidth:()=>1024,now:()=>clock,
 onDrag:()=>dragged++,onCancel:()=>cancelled++});
const send=(target,dx,dy,{duration=190,multi=false}={})=>{
 const first={identifier:7,clientX:360,clientY:380};
 const finish={identifier:7,clientX:360+dx,clientY:380+dy};
 improved.start({target,touches:multi?[first,{identifier:8,clientX:385,clientY:380}]:[first]});
 clock+=Math.round(duration/2);
 improved.move({touches:[finish],cancelable:true,preventDefault:()=>prevented++});
 clock+=Math.round(duration/2);
 improved.end({changedTouches:[finish]});
};
send(choice,-83,8);
assert.deepEqual(visits,[{id:'q3',direction:1}],'84px landscape iPad swipe from option navigates');
assert.ok(prevented>0&&dragged>0,'Horizontal option drag produces feedback and suppresses click');
const stopped=visits.length;
const countBeforeTap=prevented;
send(choice,-10,3);
assert.equal(visits.length,stopped,'Short finger movement is still a tap, not navigation');
assert.equal(prevented,countBeforeTap,'Tap leaves native button click intact');
send(form,-132,0);
assert.equal(visits.length,stopped,'Other buttons are not swipe surfaces');
send(choice,-85,90);
assert.equal(visits.length,stopped,'Diagonal/vertical reading must not navigate');
send(choice,-92,2,{duration:1950});
assert.equal(visits.length,stopped+1,'Slow but deliberate iPad drag has no arbitrary 1.4s timeout');
assert.ok(cancelled>0,'Cancelled gestures reset the visual position');
const flick=create({getState:()=>({enabled:true,at:1,ids}),onNavigate:id=>visits.push({id}),
 isTouchDevice:()=>true,viewportWidth:()=>1024,now:()=>clock});
const firstF={identifier:7,clientX:360,clientY:380};
const lastF={identifier:7,clientX:312,clientY:381};
flick.start({target:choice,touches:[firstF]});clock+=110;
flick.move({touches:[lastF],cancelable:true,preventDefault(){}});
flick.end({changedTouches:[lastF]});
assert.equal(visits.at(-1).id,'q3','A fast intentional 48px flick works on iPad');
console.log('Answer-option swipe hit testing, 84px tablet threshold, tap safety, drag and fast flick OK');
