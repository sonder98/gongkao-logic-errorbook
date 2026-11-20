/* Exam repeated practice: answer feedback lives only in the current visit.
   Aggregate accuracy is recorded from this version forward; legacy "attempts"
   and the last selected answer are deliberately ignored. */
(function(root){
 'use strict';
 let current=null;
 const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
 const totals=record=>{
  const attempts=count(record?.practiceAttempts);
  const correct=Math.min(attempts,count(record?.practiceCorrect));
  return {attempts,correct,rate:attempts?Math.round(correct/attempts*100):null};
 };
 const newVisit=id=>({id,selected:'',submitted:false,revealed:false,expanded:false,correct:false});
 function view(id){
  if(!current||current.id!==id)current=newVisit(id);
  return current;
 }
 function leave(){current=null}
 function restart(id){current=newVisit(id);return current}
 function select(id,answer){
  const visit=view(id);
  if(!visit.submitted)visit.selected=answer;
  return visit;
 }
 function toggleAnalysis(id){
  const visit=view(id);
  visit.expanded=!visit.expanded;
  if(visit.expanded&&!visit.submitted)visit.revealed=true;
  return visit;
 }
 function submit(id,answer,record){
  const visit=view(id);
  if(!visit.selected||visit.submitted)return {accepted:false,counted:false};
  visit.submitted=true;
  visit.correct=visit.selected===answer;
  visit.expanded=true;
  // An answer revealed before submission cannot count toward blind-practice accuracy.
  const counted=!visit.revealed;
  if(counted){
   const old=totals(record);
   record.practiceAttempts=old.attempts+1;
   record.practiceCorrect=old.correct+(visit.correct?1:0);
  }
  return {accepted:true,counted,correct:visit.correct};
 }
 function cleanLegacy(record){
  const copy={...(record||{})};
  for(const key of ['selected','submitted','revealed','attempts'])delete copy[key];
  return copy;
 }
 const api={view,leave,restart,select,toggleAnalysis,submit,totals,cleanLegacy};
 root.ExamPractice=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
