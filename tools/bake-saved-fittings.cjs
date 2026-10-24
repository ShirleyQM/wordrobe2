const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {createCanvas,loadImage}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const M=require('../assets/atelier-preppy-v1/mesh.js'),C=require('../print-garment.js');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),local=url=>path.join(root,url.split('?')[0]),hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const paths=['assets/materials/garments/collection.json','assets/materials/published/fittings.json','assets/materials/sources/imported/catalog.json'];
const canvas=()=>createCanvas(939,1676);
async function main(){
 const initial=paths.map(p=>fs.readFileSync(path.join(root,p))),[collection,fits,imports]=initial.map(b=>JSON.parse(b));
 const unavailable=require('../regeneration-store.cjs')(root).unavailable();
 const targets=fits.items.filter(i=>!unavailable.has(i.id));
 const batch='assets/materials/saved-images/'+fits.revision,folder=path.join(root,batch);fs.mkdirSync(folder,{recursive:true});
 const report={revision:fits.revision,items:[],preservedDynamicSettings:true};
 for(const saved of targets){
  const item=collection.items.find(i=>i.id===saved.id);if(!item)throw Error(saved.id);
  const old=JSON.parse(JSON.stringify(item)),draft=fits.draft[item.id],prefix='/assets/materials/garments/'+item.id+'/saved/'+saved.revision+'-'+hash(fs.readFileSync(local(saved.front))).slice(0,12)+'/',dest=local(prefix);fs.mkdirSync(dest,{recursive:true});
  for(const side of ['front','back'])fs.copyFileSync(local(saved[side]),path.join(dest,side+'.png'));
  const display=canvas(),dc=display.getContext('2d');for(const side of ['back','front'])dc.drawImage(await loadImage(local(saved[side])),0,0);fs.writeFileSync(path.join(dest,'display.png'),display.toBuffer('image/png'));
  // Keep recolor production layers dynamic, but bake the user's geometric fit into each layer.
  if(item.materialManifest){
   if(!draft?.mesh||!draft?.contours)throw Error('Missing material fit '+item.id);
   const manifest=read(item.materialManifest),originalDir=path.dirname(local(item.materialManifest));
   const mesh=M.outlineWarp(draft.mesh,item.contours.map(C.parse),draft.contours,C),front=await loadImage(path.join(dest,'front.png'));
   const materialDir=path.join(dest,'material');fs.mkdirSync(materialDir,{recursive:true});
   for(const name of ['base-mask.png','trim-mask.png','shadow.png','highlight.png','lineart.png','texture.png']){
    const src=path.join(originalDir,name);if(!fs.existsSync(src))continue;const out=canvas(),ctx=out.getContext('2d');M.draw(ctx,await loadImage(src),mesh);ctx.globalCompositeOperation='destination-in';ctx.drawImage(front,0,0);fs.writeFileSync(path.join(materialDir,name),out.toBuffer('image/png'));
   }
   manifest.presets=path.posix.join(path.posix.dirname(item.materialManifest),manifest.presets);manifest.geometryBakedFrom=saved.revision;
   fs.writeFileSync(path.join(materialDir,'material.json'),JSON.stringify(manifest,null,2));item.materialManifest=prefix+'material/material.json';
  }
  Object.assign(item,{front:prefix+'front.png',back:prefix+'back.png',runtimeFront:prefix+'front.png',runtimeBack:prefix+'back.png',sourceImage:prefix+'display.png',sourceRevision:'saved-'+saved.revision+'-'+hash(fs.readFileSync(local(saved.front))).slice(0,12),sourceSha256:hash(fs.readFileSync(local(saved.front))),fitStatus:'baked',hideBodyFrom:saved.hideBodyFrom||0,bakedFittingRevision:saved.revision});
  if(item.image)item.image=item.front;
  delete item.openings;delete item.openingStatus;
  const row=imports.items.find(i=>i.id===item.id);if(row)Object.assign(row,{image:item.front,back:item.back,thumbnail:item.thumbnail,fitStatus:'baked',hideBodyFrom:item.hideBodyFrom});
  report.items.push({id:item.id,oldSource:old.front,savedFront:saved.front,savedBack:saved.back,front:item.front,back:item.back,sourceRevision:item.sourceRevision,dynamicMaterial:!!item.materialManifest});
 }
 // Registration is computed from the final PNG alpha; never apply the previous mesh twice.
 fs.writeFileSync(path.join(folder,'pending-collection.json'),JSON.stringify(collection));
 execFileSync('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[path.join(__dirname,'register-baked-fittings.py'),folder],{cwd:root,stdio:'inherit'});
 const registered=JSON.parse(fs.readFileSync(path.join(folder,'registered-collection.json')));
 for(const item of registered.items){if(!report.items.some(i=>i.id===item.id))continue;if(!M.valid(M.grid(item.bounds))||!item.contours.length||!item.contours.every(c=>C.valid(C.parse(c))))throw Error('Invalid registration '+item.id);}
 for(let i=0;i<paths.length;i++)if(!initial[i].equals(fs.readFileSync(path.join(root,paths[i]))))throw Error('衣橱正在保存，有新修改，请重试');
 const ids=new Set(report.items.map(i=>i.id));fits.items=fits.items.filter(i=>!ids.has(i.id));for(const id of ids)delete fits.draft[id];fits.draft.__updated=(fits.draft.__updated||[]).filter(id=>!ids.has(id));fits.revision++;fits.updatedAt=new Date().toISOString();
 // Single recoverable pre-bake snapshot; it is not a game asset or an editor source.
 for(let i=0;i<paths.length;i++)fs.writeFileSync(path.join(folder,['collection-before.json','fittings-before.json','imports-before.json'][i]),initial[i]);
 const outputs=[registered,fits,imports];for(let i=0;i<paths.length;i++){fs.writeFileSync(path.join(root,paths[i]+'.bake-tmp'),JSON.stringify(outputs[i],null,2));fs.renameSync(path.join(root,paths[i]+'.bake-tmp'),path.join(root,paths[i]));}
 report.baked=report.items.length;report.remainingFittings=fits.items.length;fs.writeFileSync(path.join(folder,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({baked:report.baked,remainingFittings:report.remainingFittings,report:batch+'/report.json'}));
}
main().catch(e=>{console.error(e);process.exit(1)});
