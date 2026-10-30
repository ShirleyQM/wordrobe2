const fs=require('node:fs'),path=require('node:path');
module.exports=root=>{
 const prefix='/api/saved-looks',dir=path.join(root,'assets/materials/published/saved-looks'),file=path.join(dir,'collection.json');
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,items:{}};
 const write=data=>{fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);};
 const summary=({outfit,...row})=>({...row,pieces:outfit.pieces||[],pieceCount:Object.keys(outfit.equipped||{}).length});
 const png=(value,w,h)=>{if(typeof value!=='string'||!value.startsWith('data:image/png;base64,'))throw Error('需要 PNG 预览');const data=Buffer.from(value.slice(22),'base64');if(data.length>10*1024*1024||data.length<33||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==w||data.readUInt32BE(20)!==h)throw Error('预览画布不正确');return data;};
 return async(req,res,pathname)=>{
  if(pathname!==prefix&&!pathname.startsWith(prefix+'/'))return false;
  const reply=(n,data)=>{res.writeHead(n,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
   const id=pathname.slice(prefix.length+1);
   if(pathname!==prefix&&!/^[a-f0-9-]{36}$/.test(id)){reply(404,{error:'未找到这套收藏'});return true;}
   if(req.method==='GET'){
    const data=read();if(pathname===prefix)reply(200,{items:Object.values(data.items).filter(i=>!i.deleted).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(summary)});
    else if(data.items[id]&&!data.items[id].deleted)reply(200,data.items[id]);else reply(404,{error:'未找到这套收藏'});return true;
   }
   if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
   if(!['POST','PUT'].includes(req.method)){reply(405,{error:'不支持此操作'});return true;}
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16*1024*1024){reply(413,{error:'收藏内容过大'});return true;}chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(req.method==='POST'&&pathname===prefix){
    if(!/^[a-f0-9-]{36}$/.test(input.id||''))throw Error('收藏编号无效');
    const data=read();if(data.items[input.id]){reply(200,data.items[input.id]);return true;}
    if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80)throw Error('名称需为 1–80 字');
    const outfit=input.outfit;if(!outfit||Array.isArray(outfit)||typeof outfit!=='object'||!outfit.equipped||typeof outfit.equipped!=='object'||Array.isArray(outfit.equipped)||Object.keys(outfit.equipped).length>40||Object.values(outfit.equipped).some(v=>typeof v!=='string'||!/^[a-z0-9-]+$/.test(v))||JSON.stringify(outfit).length>1000000)throw Error('搭配资料不正确');
    const image=png(input.preview,939,1676),thumb=png(input.thumbnail,235,419);
    const stamp=new Date().toISOString(),record={id:input.id,name:input.name.trim(),note:'',cardCandidate:false,revision:1,createdAt:stamp,updatedAt:stamp,outfit,preview:'/assets/materials/published/saved-looks/'+input.id+'.png',thumbnail:'/assets/materials/published/saved-looks/'+input.id+'-thumb.png'};
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,input.id+'.png'),image);fs.writeFileSync(path.join(dir,input.id+'-thumb.png'),thumb);data.items[input.id]=record;write(data);reply(200,record);return true;
   }
   if(req.method!=='PUT'||!id){reply(405,{error:'不支持此操作'});return true;}
   const data=read(),old=data.items[id];if(!old||old.deleted){reply(404,{error:'未找到这套收藏'});return true;}
   if(input.revision!==old.revision){reply(409,{error:'其他页面已修改这套收藏，请重新打开后再保存',current:summary(old)});return true;}
   const allowed=['name','note','cardCandidate','deleted'];if(Object.keys(input).some(k=>k!=='revision'&&!allowed.includes(k)))throw Error('只能修改名称、备注和收藏标记');
   if('name'in input&&(typeof input.name!=='string'||!input.name.trim()||input.name.length>80))throw Error('名称需为 1–80 字');
   if('note'in input&&(typeof input.note!=='string'||input.note.length>4000))throw Error('备注最多 4000 字');
   for(const flag of ['cardCandidate','deleted'])if(flag in input&&typeof input[flag]!=='boolean')throw Error('标记格式错误');
   const next={...old,...input,name:input.name?.trim()||old.name,revision:old.revision+1,updatedAt:new Date().toISOString()};data.items[id]=next;write(data);reply(200,summary(next));
  }catch(e){reply(400,{error:e.message});}
  return true;
 };
};
