const fs=require('node:fs'),path=require('node:path');
module.exports=root=>{
 const base='/api/garment-variations',file=path.join(root,'assets/materials/published/garment-variations.json');
 const read=p=>fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{items:{}};
 return async(req,res,pathname)=>{
  if(pathname!==base&&!pathname.startsWith(base+'/'))return false;
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const catalog=read(path.join(root,'assets/materials/garments/collection.json')),deleted=read(path.join(root,'assets/materials/published/deleted-garments.json'));
   const active=new Set(catalog.items.filter(i=>!deleted.items[i.id]?.deleted).map(i=>i.id)),data=read(file);
   if(pathname===base){if(req.method!=='GET')reply(405,{error:'不支持此操作'});else reply(200,{version:1,items:Object.fromEntries(Object.entries(data.items).filter(([id])=>active.has(id)))});return true;}
   const id=pathname.slice(base.length+1);
   if(!active.has(id)){reply(404,{error:'衣服不存在或已删除'});return true;}
   if(req.method!=='PUT'){reply(405,{error:'不支持此操作'});return true;}
   if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>24000){reply(413,{error:'备注过长'});return true;}chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(typeof input.text!=='string'||input.text.length>4000||typeof input.pending!=='boolean'||!Number.isSafeInteger(input.revision)||input.revision<0){reply(400,{error:'备注最多 4000 字，请检查格式'});return true;}
   // Re-read after awaiting the body: concurrent requests must compare the latest revision.
   const current=read(file),previous=current.items[id];
   if(read(path.join(root,'assets/materials/published/deleted-garments.json')).items[id]?.deleted){reply(404,{error:'这件衣服已删除'});return true;}
   if(input.revision!==(previous?.revision||0)){reply(409,{error:'其他页面已更新此备注，当前草稿已保留。请先刷新对照后再保存。',current:previous});return true;}
   if(input.pending&&!input.text.trim()){reply(400,{error:'先写下变化需求，再加入待处理'});return true;}
   const record={itemId:id,text:input.text.trim(),pending:input.pending,revision:input.revision+1,updatedAt:new Date().toISOString()};
   current.version=1;current.items[id]=record;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(current,null,2));fs.renameSync(file+'.tmp',file);reply(200,record);
  }catch(e){reply(400,{error:e.message});}
  return true;
 };
};
