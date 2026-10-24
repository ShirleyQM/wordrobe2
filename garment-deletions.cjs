const fs=require('node:fs'),path=require('node:path');
module.exports=function(root){
 const file=path.join(root,'assets/materials/published/deleted-garments.json');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,items:{}};
 const deletedItems=()=>Object.values(read().items).filter(i=>i.deleted).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
 const deletedIds=()=>new Set(deletedItems().map(i=>i.id));
 async function route(req,res,pathname){
  if(pathname!=='/api/garment-deletions')return false;
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.method==='GET'){reply(200,{items:deletedItems()});return true;}
  if(req.method!=='POST'){reply(405,{error:'不支持此操作'});return true;}
  if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
  try{
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4096)throw Error('请求过大');chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/garments/collection.json'),'utf8'));
   const item=catalog.items.find(i=>i.id===input.id);if(!item||typeof input.deleted!=='boolean')throw Error('请选择一件衣服');
   const data=read(),previous=data.items[item.id];
   data.items[item.id]={id:item.id,name:item.name,deleted:input.deleted,deletedAt:input.deleted?(previous?.deleted?previous.deletedAt:new Date().toISOString()):previous?.deletedAt||null,updatedAt:new Date().toISOString()};
   fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);
   reply(200,{item:data.items[item.id],items:deletedItems()});
  }catch(e){reply(400,{error:e.message});}
  return true;
 }
 return {route,deletedItems,deletedIds};
};
