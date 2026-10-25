/* Explicit existing-ID material repair. Never called by art generation or auto-import. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=function repair(root,requestFile){
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
 const request=read(requestFile),batch=path.dirname(path.resolve(requestFile));if(request.kind!=='protected-existing-material-repair'||!Array.isArray(request.items)||!request.items.length)throw Error('Invalid repair request');
 const cp=path.join(root,'assets/materials/garments/collection.json'),fp=path.join(root,'assets/materials/published/fittings.json'),ip=path.join(root,'assets/materials/sources/imported/catalog.json');
 const stateBytes=new Map([cp,fp,ip].map(p=>[p,fs.readFileSync(p)])),catalog=JSON.parse(stateBytes.get(cp)),fittings=JSON.parse(stateBytes.get(fp)),imported=JSON.parse(stateBytes.get(ip));
 const files=['front.png','back.png','canonical-front.png','front-hd.png','thumb.png','base-mask.png','shadow.png','highlight.png','texture.png','lineart.png','original-precolor-lineart.png','material.json','qa.json'];
 const jobs=request.items.map(row=>{const dir=path.resolve(batch,row.directory),snapshot=read(path.join(dir,'snapshot.json')),qa=read(path.join(dir,'result/qa.json')),item=catalog.items.find(i=>i.id===snapshot.id),fit=fittings.items.find(i=>i.id===snapshot.id);
  if(!dir.startsWith(batch+path.sep)||!item||!same(item,snapshot.item)||!same(fit,snapshot.fitting)||!same(fittings.draft[snapshot.id],snapshot.draft))throw Error('Same garment changed since snapshot: '+snapshot.id);
  if(hash(path.join(root,(fit?.front||item.runtimeFront||item.front).split('?')[0].replace(/^\//,'')))!==snapshot.sourceHash)throw Error('Source bytes changed: '+snapshot.id);
  if(qa.technicalPass!==true||qa.visual_reviewed!==true||qa.wearable_validated!==true||!qa.notes||qa.frontSha256!==hash(path.join(dir,'result/front.png')))throw Error('Unaccepted or stale art: '+snapshot.id);
  for(const name of files)if(!fs.existsSync(path.join(dir,'result',name)))throw Error('Missing '+snapshot.id+' '+name);
  const prefix='/assets/materials/garments/'+item.id+'/material-repairs/'+request.batch+'/',target=path.join(root,prefix.replace(/^\//,''));if(fs.existsSync(target))throw Error('Repair destination exists: '+target);
  return {dir,snapshot,item,fit,prefix,target};
 });
 const patches=read(path.join(batch,'integration/patch-record.json'));for(const p of patches)if(hash(path.join(root,p.path))!==p.sha256)throw Error('Code changed since patch preparation: '+p.path);
 const additionRecord=path.join(batch,'integration/addition-record.json'),additions=fs.existsSync(additionRecord)?read(additionRecord):[{path:'assets/garment-prints/finished-crop.js',sha256:null}];for(const p of additions){const dest=path.join(root,p.path);if(p.sha256===null?fs.existsSync(dest):!fs.existsSync(dest)||hash(dest)!==p.sha256)throw Error('Added module changed: '+p.path);}
 const backup=path.join(root,'assets/materials/sources/material-repairs',request.batch,new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(backup,{recursive:true});
 const touched=[cp,fp,ip,...patches.map(p=>path.join(root,p.path)),...additions.filter(p=>p.sha256!==null).map(p=>path.join(root,p.path))];
 const backupFiles=touched.map(p=>{const relative=path.relative(root,p),to=path.join(backup,relative);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(p,to);if(stateBytes.has(p)&&!fs.readFileSync(to).equals(stateBytes.get(p)))throw Error('Concurrent wardrobe write before lock: '+p);return {path:p,backup:to,sha256:hash(to)};});
 const lock=path.join(root,'assets/materials/regeneration/material-repair.lock');fs.mkdirSync(path.dirname(lock),{recursive:true});const fd=fs.openSync(lock,'wx');
 try{
  // Recheck after acquiring the write lock; unrelated wardrobe additions survive.
  for(const f of backupFiles)if(hash(f.path)!==f.sha256)throw Error('Concurrent write: '+f.path);
  for(const j of jobs){fs.mkdirSync(j.target,{recursive:true});for(const name of files)fs.copyFileSync(path.join(j.dir,'result',name),path.join(j.target,name));const p=j.prefix;
   Object.assign(j.item,{front:p+(j.fit?'canonical-front.png':'front.png'),back:p+'back.png',runtimeFront:p+'front.png',runtimeBack:p+'back.png',image:p+'front.png',thumbnail:p+'thumb.png',sourceImage:p+'front.png',sourceSha256:hash(path.join(j.target,j.fit?'canonical-front.png':'front.png')),materialManifest:p+'material.json',materialSurfaceFront:p+'front.png',materialSourceFront:p+'front.png',hdFront:p+'front-hd.png',hdCanvas:[1878,3352],backTechnicalPlaceholder:true,layerMode:'front-only',recolor_ready:true,materialRepairRevision:request.batch});
   if(j.fit)Object.assign(j.fit,{front:p+'front.png',image:p+'front.png',back:p+'back.png',thumbnail:p+'thumb.png'});
   const row=imported.items.find(i=>i.id===j.item.id);if(row)Object.assign(row,{image:p+'front.png',back:p+'back.png',thumbnail:p+'thumb.png',materialManifest:p+'material.json',materialSourceFront:p+'front.png'});
   // Bounds, contours, sourceRevision, mesh, erasures, imprints and notes are retained.
  }
  const write=(p,v)=>{fs.writeFileSync(p+'.repair-tmp',JSON.stringify(v,null,2));fs.renameSync(p+'.repair-tmp',p);};fittings.revision++;fittings.updatedAt=new Date().toISOString();
  for(const p of [...patches,...additions]){const dest=path.join(root,p.path);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(batch,'integration',p.path),dest);}
  write(cp,catalog);write(fp,fittings);write(ip,imported);
  const receipt={batch:request.batch,backup,ids:jobs.map(j=>j.item.id),preserved:['id','name','slot','bounds','contours','sourceRevision','mesh','erasures','imprints','notes'],runtimeValidated:false,createdAt:new Date().toISOString()};write(path.join(backup,'receipt.json'),receipt);return receipt;
 }catch(e){for(const f of backupFiles)fs.copyFileSync(f.backup,f.path);for(const p of additions.filter(p=>p.sha256===null)){const dest=path.join(root,p.path);if(fs.existsSync(dest))fs.unlinkSync(dest);}throw e;}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
};
if(require.main===module){try{console.log(JSON.stringify(module.exports(process.argv[2],process.argv[3]),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
