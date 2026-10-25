const fs=require('fs'),path=require('path');
const GROUPS={'preppy':'preppy-art-atelier-v1','prints':'word-atelier-prints-v1','imprints':'word-atelier-imprints-v1','fittings':'wardrobe-fittings-v1'};
module.exports=function(root){
 const versionAssets=require('./wardrobe-asset-versions.cjs')(root);
 const policy=require('./wardrobe-policy.cjs')(root);
 const regeneration=require('./regeneration-store.cjs')(root);
 const deletions=require('./garment-deletions.cjs')(root);
 const dir=path.join(root,'assets','materials','published');
 const read=group=>{try{return JSON.parse(fs.readFileSync(path.join(dir,group+'.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 return async function(req,res,pathname){
  if(!pathname.startsWith('/api/wardrobe'))return false;
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.method==='GET'&&(pathname==='/api/wardrobe'||pathname==='/api/wardrobe/runtime')){const groups=Object.keys(GROUPS).map(read).filter(Boolean);const libraryFile=path.join(root,'assets/materials/garments/collection.json');if(fs.existsSync(libraryFile))groups.unshift({group:'library',items:JSON.parse(fs.readFileSync(libraryFile,'utf8')).items.map(i=>({id:i.id,name:i.name,slot:i.slot,body:i.body,image:i.runtimeFront||i.front,back:i.runtimeBack||i.back,thumbnail:i.thumbnail,price:0,editor:'preppy',hideBodyFrom:i.hideBodyFrom||0,bodyOcclusionRects:i.bodyOcclusionRects||[],accessoryType:i.accessoryType,registrationProvided:i.registrationProvided,fitStatus:i.fitStatus,materialManifest:i.materialManifest,materialPresets:i.materialPresets,materialSourceFront:i.materialSurfaceFront||i.front}))});const materialFile=path.join(root,'assets/materials/sources/imported/catalog.json');if(fs.existsSync(materialFile))groups.push({group:'materials',items:JSON.parse(fs.readFileSync(materialFile,'utf8')).items.map(i=>({...i,thumbnail:groups.find(g=>g.group==='library')?.items.find(row=>row.id===i.id)?.thumbnail||i.thumbnail}))});const disabled=regeneration.unavailable();for(const group of groups)for(const item of group.items){const job=disabled.get(item.id);item.unavailable=!!job;item.regeneration=job?{id:job.id,status:job.status,threadId:job.threadId,error:job.error||null}:null;}const removed=deletions.deletedItems(),deleted=new Set(removed.map(i=>i.id));for(const group of groups)for(const item of group.items)item.deleted=deleted.has(item.id);if(removed.length)groups.push({group:'deletions',items:[],deletedItems:removed});policy.decorate(groups);versionAssets(groups);if(pathname.endsWith("/runtime")){for(const group of groups){delete group.draft;for(const item of group.items||[])require('./assets/asset-version.js').apply(item);}}reply(200,{groups});return true;}
  const group=pathname.split('/')[3];
  if(req.method!=='PUT'||!GROUPS[group]||pathname!=='/api/wardrobe/'+group){reply(404,{error:'Not found'});return true;}
  if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
  try{
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>24*1024*1024){reply(413,{error:'素材文件过大'});return true;}chunks.push(chunk);}
   const input=JSON.parse(Buffer.concat(chunks).toString()),previous=read(group);
   const itemChecks=group==='fittings'&&input.expectedDrafts&&Array.isArray(input.items)&&input.items.every(i=>Object.hasOwn(input.expectedDrafts,i.id));if(input.revision!==(previous?.revision||0)&&!itemChecks){reply(409,{error:'有更新的版本，请重新打开编辑面板后继续'});return true;}
   const baseIds=['tee-regular','tee-loose','tee-cropped','navy-shirt','suede-skirt','ankle-boots','coin-loafers'];
   let campusIds=[];if(['imprints','fittings'].includes(group)){const catalogFile=path.join(root,'assets/skirt-collection-v1/game-catalog.js');if(fs.existsSync(catalogFile))campusIds=[...fs.readFileSync(catalogFile,'utf8').matchAll(/"id":\s*"([a-z0-9-]+)"/g)].map(m=>m[1]);}
   let materialIds=[];const materialFile=path.join(root,'assets/materials/sources/imported/catalog.json');if(fs.existsSync(materialFile))materialIds=JSON.parse(fs.readFileSync(materialFile,'utf8')).items.map(i=>i.id);
   const allowed=['imprints','fittings'].includes(group)?[...baseIds,...campusIds,...materialIds]:group==='prints'?baseIds.slice(0,3):baseIds.slice(3);
   if(!input.draft||typeof input.draft!=='object'||!Array.isArray(input.items)||(!['imprints','fittings'].includes(group)&&input.items.length!==allowed.length)||input.items.length>allowed.length||new Set(input.items.map(i=>i.id)).size!==input.items.length)throw Error('素材数据不完整');
   if(itemChecks&&input.items.some(i=>!require('util').isDeepStrictEqual(input.expectedDrafts[i.id],previous?.draft?.[i.id]||null))){reply(409,{error:'这件衣服有更新的手调版本，请重新打开编辑面板后继续'});return true;}
   const revision=(previous?.revision||0)+1,files=[];
   const unavailable=regeneration.unavailable();
   const items=input.items.map(item=>{
    if(group==='fittings'&&item.sourceSha256){const registeredFile=path.join(root,'assets/materials/garments/collection.json');const registered=fs.existsSync(registeredFile)?JSON.parse(fs.readFileSync(registeredFile,'utf8')).items.find(i=>i.id===item.id):null;if(!registered||registered.sourceSha256!==item.sourceSha256)throw Error('这件衣服的编辑源有更新，请重新打开编辑面板');}
    if(deletions.deletedIds().has(item.id))throw Error('这件衣服已删除，请先撤销删除再保存');
    if(unavailable.has(item.id))throw Error('该衣服正在重新生成，旧调整已保留，暂不可保存');
    if(!allowed.includes(item.id)||!['top','bottom','shoes','dress','bra','briefs','socks','bag','jewelry','coat'].includes(item.slot)||typeof item.name!=='string')throw Error('未知单品');
    const out={id:item.id,name:item.name.slice(0,60),slot:item.slot,body:'open-arms-v2',price:0,editor:group,revision,hideBodyFrom:Math.max(0,Math.min(1676,Number(item.hideBodyFrom)||0))};
    if(group==='fittings'){out.body=item.body==='open-arms-v2'?'open-arms-v2':'campus';out.editor='preppy';out.fitStatus='edited';}
    if(group==='imprints'){out.kind='imprint';out.body=item.body==='open-arms-v2'?'open-arms-v2':'campus';}
    for(const side of ['front','back']){
     if(typeof item[side]!=='string'||!item[side].startsWith('data:image/png;base64,'))throw Error('需要透明 PNG 素材');
     const data=Buffer.from(item[side].slice(22),'base64');
     if(data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==939||data.readUInt32BE(20)!==1676)throw Error('素材画布必须为 939 × 1676');
     const name=group+'-'+item.id+'-'+revision+'-'+side+'.png';files.push([name,data]);out[side]='/assets/materials/published/'+name;
    }
    out.image=out.front;out.thumbnail=out.front;
    if(group==='fittings'&&item.frontHD!==undefined){
     if(typeof item.frontHD!=='string'||!item.frontHD.startsWith('data:image/png;base64,'))throw Error('高清素材需要透明 PNG');
     const data=Buffer.from(item.frontHD.slice(22),'base64');
     if(data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.readUInt32BE(16)!==3756||data.readUInt32BE(20)!==6704)throw Error('高清素材画布必须为 3756 × 6704');
     const name=group+'-'+item.id+'-'+revision+'-front-hd.png';files.push([name,data]);out.hdFront='/assets/materials/published/'+name;out.image=out.hdFront;out.hdCanvas=[3756,6704];
    }
    if(typeof item.thumbnail==='string'&&item.thumbnail.startsWith('data:image/png;base64,')){const data=Buffer.from(item.thumbnail.slice(22),'base64');if(data.length>1024*1024||data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('缩略图无效');const name=group+'-'+item.id+'-'+revision+'-thumb.png';files.push([name,data]);out.thumbnail='/assets/materials/published/'+name;}
    else if(group==='preppy')out.thumbnail='/assets/materials/garments/'+item.id+'/thumb.png';
    return out;
   });
   fs.mkdirSync(dir,{recursive:true});for(const [name,data]of files)fs.writeFileSync(path.join(dir,name),data);
   const publishedItems=['fittings','imprints'].includes(group)?[...(previous?.items||[]).filter(old=>!items.some(i=>i.id===old.id)),...items]:items;
   const draft=group==='fittings'?{...(previous?.draft||{}),...Object.fromEntries(input.items.map(i=>[i.id,input.draft[i.id]])),__updated:[...new Set([...(previous?.draft?.__updated||[]),...input.items.map(i=>i.id)])]}:input.draft;
   const record={group,key:GROUPS[group],revision,updatedAt:new Date().toISOString(),draft,items:publishedItems};
   fs.writeFileSync(path.join(dir,group+'.tmp'),JSON.stringify(record));fs.renameSync(path.join(dir,group+'.tmp'),path.join(dir,group+'.json'));
   reply(200,record);
  }catch(e){reply(400,{error:e.message});}
  return true;
 };
};

