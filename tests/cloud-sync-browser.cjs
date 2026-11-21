// Deterministic browser integration checks against a mocked Supabase API.
// No real credentials or Supabase tables are touched.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const questions=require('../questions.json');
const id=questions[0].id,answer=questions[0].answer;
const account={id:'00000000-0000-4000-8000-000000000001',email:'exam@example.test'};
const url=process.env.TEST_URL||'http://127.0.0.1:8000/';
const watchdog=setTimeout(()=>{console.error('Cloud browser regression timed out after 110s');process.exit(1)},110000);
async function test(startSignedIn,initialRows,injectConflict){
 const store=new Map(Object.entries(initialRows).map(([key,value])=>[key,structuredClone(value)]));
 let conflictOnNext=injectConflict,requests=0;
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.exposeFunction('__cloudRequest',async command=>{
  requests++;
  if(command.type==='list')return [...store].map(([question_id,r])=>({question_id,...structuredClone(r)}));
  if(command.type==='read')return store.get(command.id)||null;
  if(command.type==='save'){
   let existing=store.get(command.id);
   if(conflictOnNext){
    conflictOnNext=false;
    assert.ok(existing,'Expected an existing record for the two-device conflict');
    existing.version++;
    existing.data.practiceAttempts++;
    existing.data.practiceCorrect++;
   }
   if(existing&&command.expected!==existing.version)
    return [{question_id:command.id,...structuredClone(existing),conflict:true}];
   const row={data:structuredClone(command.data),version:(existing?.version||0)+1,updated_at:new Date().toISOString()};
   store.set(command.id,row);
   return [{question_id:command.id,...structuredClone(row),conflict:false}];
  }
  throw Error('Unknown fake cloud request '+command.type);
 });
 await context.addInitScript(({account,startSignedIn})=>{
  let signedIn=startSignedIn,listener=null;
  const user=account;
  window.__fakeSupabase={createClient:()=>({
   auth:{
    getSession:async()=>({data:{session:signedIn?{user}:null},error:null}),
    onAuthStateChange:callback=>{listener=callback;return {data:{subscription:{unsubscribe(){}}}}},
    signInWithPassword:async()=>{
     signedIn=true;
     if(listener)listener('SIGNED_IN',{user});
     return {data:{user},error:null};
    },
    signUp:async()=>({data:{session:null},error:null}),
    signOut:async()=>{signedIn=false;if(listener)listener('SIGNED_OUT',null);return {error:null}}
   },
   from:()=>({
    select:()=>({eq:async()=>({data:await window.__cloudRequest({type:'list'}),error:null})})
   }),
   rpc:async(_name,params)=>({data:await window.__cloudRequest({type:'save',id:params.p_question_id,
     expected:params.p_expected_version,data:params.p_data}),error:null})
  })};
 },{account,startSignedIn});
 const page=await context.newPage();
 page.setDefaultTimeout(10000);
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({
  status:200,contentType:'application/javascript',body:'window.supabase=window.__fakeSupabase;'
 }));
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  const member=page.locator('#memberAuth');
  if(startSignedIn)await member.waitFor({state:'visible'});
  else await page.locator('#guestAuth').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelectorAll('.choice').length>0,null,{timeout:12000});
 }catch(error){
  console.error('Cloud browser boot snapshot',await page.evaluate(()=>({
   status:document.querySelector('#authStatus')?.textContent,
   hasFake:!!window.__fakeSupabase,
   hasSupabase:!!window.supabase,
   usesFake:window.supabase===window.__fakeSupabase,
   questions:document.querySelectorAll('.choice').length
  })).catch(()=>null),'page errors',errors);
  await browser.close();
  throw error;
 }
 return {store,browser,context,page,errors,requests:()=>requests};
}
(async()=>{
 const original={data:{practiceAttempts:2,practiceCorrect:1,wrong:true,review:false,note:''},
  version:1,updated_at:new Date().toISOString()};
 console.log('Cloud browser: start signed-in / conflict test');
 const first=await test(true,{[id]:original},true);
 try{
  await first.page.waitForFunction(({id})=>{
   const key='gongkao_logic_errorbook_v1_user_00000000-0000-4000-8000-000000000001';
   return JSON.parse(localStorage.getItem(key)||'{}')[id]?.practiceAttempts===2;
  },{id},{timeout:12000});
  await first.page.locator('.choice[data-answer="'+answer+'"]').click();
  await first.page.locator('#submit').click();
  await first.page.waitForFunction(async({id})=>{
   const row=await window.__cloudRequest({type:'read',id});
   return row?.version===3&&row.data.practiceAttempts===4&&row.data.practiceCorrect===3;
  },{id},{timeout:12000});
  const current=first.store.get(id);
  assert.equal(current.data.practiceAttempts,4,'Same-question attempts from both devices must accumulate');
  current.version++;
  current.data.note='云端另一个设备刚保存的笔记';
  await first.page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await first.page.waitForFunction(({id})=>{
   const key='gongkao_logic_errorbook_v1_user_00000000-0000-4000-8000-000000000001';
   return JSON.parse(localStorage.getItem(key)||'{}')[id]?.note==='云端另一个设备刚保存的笔记';
  },{id},{timeout:12000});
  assert.deepEqual(first.errors,[],'No browser runtime errors during automatic sync');
 }finally{await first.browser.close()}
 console.log('Cloud browser: start guest / login recovery test');
 const second=await test(false,{[id]:{
  data:{practiceAttempts:4,practiceCorrect:3,review:false,wrong:false,note:''},
  version:2,updated_at:new Date().toISOString()
 }},false);
 try{
  await second.page.locator('.choice[data-answer="'+answer+'"]').click();
  await second.page.locator('#submit').click();
  await second.page.locator('#authEmail').fill('exam@example.test');
  await second.page.locator('#authPassword').fill('test-password-only');
  await second.page.locator('#loginBtn').click();
  await second.page.waitForFunction(async({id})=>{
   const row=await window.__cloudRequest({type:'read',id});
   return row?.data.practiceAttempts===5&&row.data.practiceCorrect===4;
  },{id},{timeout:12000});
  assert.deepEqual(second.errors,[],'No browser runtime errors during guest-to-account recovery');
 }finally{await second.browser.close()}
 clearTimeout(watchdog);
 console.log('Browser cloud sync: session restore, version conflicts, remote refresh, guest recovery OK');
})().catch(e=>{clearTimeout(watchdog);console.error(e);process.exitCode=1});
