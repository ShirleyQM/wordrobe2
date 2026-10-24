const fs=require('node:fs'),path=require('node:path');
const TAGS=['内片露出','袖子不贴','基础款'];
module.exports=function(root){
 const file=path.join(root,'assets/materials/published/garment-notes.json');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,items:{}};
 return async function(req,res,pathname){
  const basics=pathname==='/api/garment-basics';
  if(!basics&&!pathname.startsWith('/api/garment-notes/'))return false;
  const reply=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   if(basics){
    if(req.method==='GET'){reply(200,{items:Object.fromEntries(Object.entries(read().items).map(([id,n])=>[id,n.tags?.includes('基础款')===true]))});return true;}
    if(req.method!=='POST'){reply(405,{error:'不支持此操作'});return true;}
    if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4096)throw Error('请求过大');}
    const input=JSON.parse(raw),catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/garments/collection.json'),'utf8'));
    if(typeof input.basic!=='boolean'||!catalog.items.some(i=>i.id===input.id)){reply(400,{error:'衣服或标记无效'});return true;}
    // Read after the body arrives and change only this tag; preserve other notes.
    const data=read(),previous=data.items[input.id]||{itemId:input.id,revision:0,tags:[],text:''};
    const tags=new Set(previous.tags);if(input.basic)tags.add('基础款');else tags.delete('基础款');
    const record={...previous,tags:TAGS.filter(t=>tags.has(t)),revision:previous.revision+1,updatedAt:new Date().toISOString()};
    data.items[input.id]=record;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);
    reply(200,{id:input.id,basic:input.basic,note:record});return true;
   }
   const id=pathname.slice('/api/garment-notes/'.length);
   const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/garments/collection.json'),'utf8'));
   if(!/^[a-z0-9-]+$/.test(id)||!catalog.items.some(i=>i.id===id)){reply(404,{error:'未找到这件衣服'});return true;}
   if(req.method==='GET'){reply(200,read().items[id]||{itemId:id,revision:0,tags:[],text:''});return true;}
   if(req.method!=='PUT'){reply(405,{error:'不支持此操作'});return true;}
   if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16000){reply(413,{error:'备注过长'});return true;}chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!Array.isArray(input.tags)||input.tags.some(t=>!TAGS.includes(t))||typeof input.text!=='string'||input.text.length>2000){reply(400,{error:'备注格式不正确，文字最多 2000 字'});return true;}
   // Read after the request body arrives; merge only this garment's note.
   const data=read(),previous=data.items[id];
   if(input.revision!==(previous?.revision||0)){reply(409,{error:'备注已有更新，请关闭后重新打开；当前文字可先复制保留'});return true;}
   const record={itemId:id,revision:(previous?.revision||0)+1,tags:TAGS.filter(t=>input.tags.includes(t)),text:input.text.trim(),updatedAt:new Date().toISOString()};
   data.items[id]=record;fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);
   reply(200,record);
  }catch(e){reply(400,{error:e.message});}
  return true;
 };
};
