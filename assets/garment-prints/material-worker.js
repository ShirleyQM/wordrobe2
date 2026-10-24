importScripts('material.js');
const sources=new Map();
self.onmessage=({data})=>{
 try{
  if(data.type==='prepare'){sources.delete(data.key);if(sources.size>8)sources.delete(sources.keys().next().value);sources.set(data.key,data.options);return;}
  if(data.type==='render'){const options=sources.get(data.key);if(!options)throw Error('预览素材已过期');sources.delete(data.key);sources.set(data.key,options);const pixels=GarmentMaterial.pixels({...options,...data.settings});self.postMessage({id:data.id,pixels},[pixels.buffer]);}
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
