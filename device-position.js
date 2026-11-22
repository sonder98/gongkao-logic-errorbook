/* Exam · device-local reading position.
 * Intentionally separate from account progress and Supabase. A browser/PWA
 * installation has its own preferences and never overwrites another device.
 */
(function(root){
 'use strict';
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
  try{
   const raw=JSON.parse(storage?.getItem(key)||'null');
   if(raw&&raw.version===1&&raw.modules&&typeof raw.modules==='object'){
    for(const module of MODULES){
     const part=raw.modules[module];
     if(!part||typeof part!=='object')continue;
     for(const view of VIEWS){
      const item=part[view];
      if(!valid(module,view,item?.id))continue;
      (data.modules[module]??={})[view]={
       id:item.id,
       reading:view==='knowledge'?cleanReading(item.reading):null
      };
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
  function bookmark(module,view){
   const part=data.modules[module]?.[view];
   return part?{id:part.id,reading:part.reading?{...part.reading}:null}:null;
  }
  function last(){return data.last?{...data.last}:null}
  function remember(module,view,id,reading){
   if(!valid(module,view,id))return false;
   const previous=data.modules[module]?.[view];
   const selectedReading=view==='knowledge'?
    reading===undefined&&previous?.id===id?previous.reading:cleanReading(reading):null;
   (data.modules[module]??={})[view]={id,reading:selectedReading};
   data.last={module,view,id};
   persist();
   return true;
  }
  function updateReading(module,id,reading){
   if(!valid(module,'knowledge',id)||data.modules[module]?.knowledge?.id!==id)return false;
   const previous=data.modules[module].knowledge.reading;
   const next=cleanReading(reading);
   if(previous?.sectionId===next?.sectionId&&previous?.offset===next?.offset)return true;
   data.modules[module].knowledge.reading=next;
   persist();
   return true;
  }
  return {bookmark,last,remember,updateReading};
 }
 const api={create,KEY};
 root.ExamDevicePosition=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
