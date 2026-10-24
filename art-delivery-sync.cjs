const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
module.exports=function(root){
 const config=JSON.parse(fs.readFileSync(path.join(root,'art-delivery-config.json'),'utf8'));
 let running=null,lastRun=0,lastStamp='',lastResult={added:[],errors:[]};
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const atomic=(p,data)=>{fs.writeFileSync(p+'.sync-tmp',JSON.stringify(data,null,2));fs.renameSync(p+'.sync-tmp',p);};
 function discover(){const found=[];for(const relative of config.roots){const folder=path.resolve(root,relative);if(!fs.existsSync(folder))continue;for(const child of fs.readdirSync(folder,{withFileTypes:true})){if(!child.isDirectory())continue;for(const name of ['delivery.json','manifest.json']){const file=path.join(folder,child.name,name);if(fs.existsSync(file))found.push(file);}}}return found.sort();}
 async function sync(force=false){
  if(running)return running;if(!force&&Date.now()-lastRun<5000)return lastResult;
  lastRun=Date.now();const files=discover(),stamp=files.map(p=>p+':'+fs.statSync(p).mtimeMs).join('|');
  if(!force&&stamp===lastStamp)return lastResult;
  running=(async()=>{
   const result=await new Promise((resolve,reject)=>{const child=spawn(config.python,[path.join(root,'tools/prepare-art-deliveries.py'),JSON.stringify(files)],{cwd:root,windowsHide:true});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>{try{if(code)throw Error(err||'素材校验失败');resolve(JSON.parse(out));}catch(e){reject(e);}});});
   // Commit without awaits: no asynchronous wardrobe saves can interleave with these merges.
   const base=path.join(root,'assets/materials'),file=path.join(base,'garments/collection.json'),importFile=path.join(base,'sources/imported/catalog.json');
   const collection=read(file),imports=read(importFile),known=new Set(collection.items.map(i=>i.id)),imported=new Set(imports.items.map(i=>i.id)),added=[];
   for(const item of result.items){if(known.has(item.id))continue;collection.items.push(item);known.add(item.id);added.push(item.id);if(!imported.has(item.id)){imports.items.push({id:item.id,name:item.name,slot:item.slot,body:item.body,image:item.front,back:item.back,thumbnail:item.thumbnail,price:0,editor:'preppy',sourceCollection:item.sourceCollection,hideBodyFrom:item.hideBodyFrom||0,bodyOcclusionRects:item.bodyOcclusionRects||[],accessoryType:item.accessoryType,registrationProvided:item.registrationProvided});imported.add(item.id);}}
   if(added.length){atomic(file,collection);atomic(importFile,imports);const indexFile=path.join(base,'catalog.json'),index=read(indexFile);index.garments.count=collection.items.length;atomic(indexFile,index);}
   lastResult={added,errors:result.errors,total:collection.items.length};
   fs.mkdirSync(path.join(base,'sources/deliveries'),{recursive:true});atomic(path.join(base,'sources/deliveries/sync-status.json'),{...lastResult,checkedAt:new Date().toISOString()});
   // Retry incomplete packages as their image files arrive, even if the manifest has not changed.
   if(!result.errors.length)lastStamp=stamp;
   if(added.length)console.log('Art deliveries imported: '+added.join(', '));return lastResult;
  })().catch(e=>{console.warn('Art delivery sync: '+e.message);return {added:[],errors:[{error:e.message}]};}).finally(()=>running=null);
  return running;
 }
 return {sync};
};
