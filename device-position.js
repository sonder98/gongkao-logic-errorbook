/* Exam · device-local reading position.
 * Intentionally separate from account progress and Supabase. A browser/PWA
 * installation has its own preferences and never overwrites another device.
 * Each knowledge lesson owns its scroll anchor, even after visiting another.
 */
(function(root){
 'use strict';
 // Keep the existing key/schema so previously saved devices retain their
 // latest lesson and its reading position without a disruptive migration.
 const KEY='exam_device_reading_position_v1';
 const MODULES=['argument','formal','data'];
 const VIEWS=['knowledge','practice'];
 const valid=(module,view,id)=>MODULES.includes(module)&&VIEWS.includes(view)&&
  typeof id==='string'&&id.length>0&&id.length<=256;
 const cleanReading=reading=>{
  if(!reading||typeof reading!=='object')return null;
  const sectionId=typeof reading.sectionId==='string'&&reading.sectionId.length<=256?
   reading.sectionId:null;
  const raw=Number(reading.offset);
  return {sectionId,offset:Number.isFinite(raw)?Math.min(100000,Math.max(0,Math.round(raw))):0};
 };
 function create({storage=root.localStorage,key=KEY}={}){
  let data={version:1,last:null,modules:{}};
  const getPart=module=>data.modules[module]??=( {readings:Object.create(null)} );
  try{
   const raw=JSON.parse(storage?.getItem(key)||'null');
   if(raw&&raw.version===1&&raw.modules&&typeof raw.modules==='object'){
    for(const module of MODULES){
     const part=raw.modules[module];
     if(!part||typeof part!=='object')continue;
     const item=getPart(module);
     // Each lesson has an independent reading bookmark. The older format
     // stored one reading on the active knowledge tab, so import it too.
     if(part.readings&&typeof part.readings==='object'&&!Array.isArray(part.readings)){
      for(const [id,reading] of Object.entries(part.readings).slice(0,500)){
       if(!valid(module,'knowledge',id))continue;
       const clean=cleanReading(reading);
       if(clean)item.readings[id]=clean;
      }
     }
     for(const view of VIEWS){
      const old=part[view];
      if(!valid(module,view,old?.id))continue;
      const reading=view==='knowledge'?
       (item.readings[old.id]||cleanReading(old.reading)):null;
      item[view]={id:old.id,reading};
      if(view==='knowledge'&&reading)item.readings[old.id]=reading;
     }
    }
    if(valid(raw.last?.module,raw.last?.view,raw.last?.id)&&
       data.modules[raw.last.module]?.[raw.last.view]?.id===raw.last.id){
     data.last={module:raw.last.module,view:raw.last.view,id:raw.last.id};
    }
   }
  }catch(_){/* Private browsing, storage denial, or obsolete/corrupt data. */}
  function persist(){
   try{storage?.setItem(key,JSON.stringify(data))}catch(_){/* Browsing remains usable. */}
  }
  function readingFor(module,id){
   if(!valid(module,'knowledge',id))return null;
   const reading=data.modules[module]?.readings?.[id]||null;
   return reading?{id,reading:{...reading}}:null;
  }
  function bookmark(module,view){
   const part=data.modules[module]?.[view];
   if(!part)return null;
   const reading=view==='knowledge'?
    data.modules[module].readings?.[part.id]||part.reading:null;
   return {id:part.id,reading:reading?{...reading}:null};
  }
  function last(){return data.last?{...data.last}:null}
  function remember(module,view,id,reading){
   if(!valid(module,view,id))return false;
   const part=getPart(module);
   const selectedReading=view==='knowledge'?
    reading===undefined?(part.readings[id]||null):cleanReading(reading):null;
   if(view==='knowledge'){
    if(selectedReading)part.readings[id]=selectedReading;
    else if(reading!==undefined)delete part.readings[id];
   }
   part[view]={id,reading:selectedReading};
   data.last={module,view,id};
   persist();
   return true;
  }
  function updateReading(module,id,reading){
   if(!valid(module,'knowledge',id)||data.modules[module]?.knowledge?.id!==id)return false;
   const part=data.modules[module],previous=part.readings[id]||null;
   const next=cleanReading(reading);
   if(previous?.sectionId===next?.sectionId&&previous?.offset===next?.offset)return true;
   if(next)part.readings[id]=next;
   else delete part.readings[id];
   part.knowledge.reading=next;
   persist();
   return true;
  }
  return {bookmark,last,remember,updateReading,readingFor};
 }
 const api={create,KEY};
 root.ExamDevicePosition=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
