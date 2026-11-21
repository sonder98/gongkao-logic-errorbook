/* Safe three-way reconciliation of question progress.
 * Uses last confirmed cloud snapshot as the common ancestor. Never guess at a
 * merge when that snapshot is missing or a counter has been reset. */
(function(root){
 'use strict';
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
 function normalize(record,key){
  if(key==='review'||key==='wrong')return !!record?.[key];
  if(key==='note'||key==='analysisOverride')return record?.[key]||'';
  return record?.[key];
 }
 function merge(base,local,remote){
  if(!base||typeof base!=='object'||!local||!remote)return null;
  const merged={...remote}, counters=new Set(['practiceAttempts','practiceCorrect']);
  const keys=new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)]);
  keys.delete('_syncConflict');
  for(const key of keys){
   if(counters.has(key))continue;
   const b=normalize(base,key),l=normalize(local,key),r=normalize(remote,key);
   const lc=!eq(l,b),rc=!eq(r,b);
   if(lc&&rc&&!eq(l,r))return null;
   if(lc){
    if(Object.prototype.hasOwnProperty.call(local,key))merged[key]=local[key];
    else delete merged[key];
   }
  }
  const ba=count(base.practiceAttempts),bc=count(base.practiceCorrect);
  const la=count(local.practiceAttempts),lc=count(local.practiceCorrect);
  const ra=count(remote.practiceAttempts),rc=count(remote.practiceCorrect);
  if(la<ba||ra<ba||lc<bc||rc<bc||lc>la||rc>ra)return null;
  // Both devices can independently complete a question; sum only their new
  // attempts and correct answers above the same confirmed baseline.
  const attempts=ra+(la-ba),correct=rc+(lc-bc);
  if(correct>attempts||!Number.isSafeInteger(attempts)||!Number.isSafeInteger(correct))return null;
  if(attempts||'practiceAttempts' in base||'practiceAttempts' in local||'practiceAttempts' in remote){
   merged.practiceAttempts=attempts;
   merged.practiceCorrect=correct;
  }
  return merged;
 }
 root.ExamCloudSync={merge,eq};
 if(typeof module==='object'&&module.exports)module.exports=root.ExamCloudSync;
})(typeof window==='undefined'?globalThis:window);
