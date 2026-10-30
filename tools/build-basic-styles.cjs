/* Extract structure contracts and exact current alpha; never decolor paintings into line art. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const canvasModule=process.env.WORDROBE_NODE_MODULES?path.join(process.env.WORDROBE_NODE_MODULES,'@napi-rs/canvas'):'@napi-rs/canvas';
const {createCanvas,loadImage}=require(canvasModule);
const specs=require('./basic-style-specs.cjs'),root=path.resolve(__dirname,'..'),out=path.join(root,'assets/garment-styles');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2));
const local=url=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(url,'http://local').pathname));if(!p.startsWith(root+path.sep))throw Error('Outside project');return p;};
async function build(){
 const base=process.env.TEST_BASE||'http://127.0.0.1:4173',response=await fetch(base+'/api/wardrobe/runtime');if(!response.ok)throw Error('Current wardrobe unavailable');
 const {groups}=await response.json(),notes=read('assets/materials/published/garment-notes.json').items,deleted=read('assets/materials/published/deleted-garments.json').items,system=read('assets/wardrobe-organized/分类体系.json'),fittings=read('assets/materials/published/fittings.json'),map=new Map();
 for(const g of groups.filter(g=>!['prints','imprints'].includes(g.group)).sort((a,b)=>({library:1,fittings:2}[a.group]||0)-({library:1,fittings:2}[b.group]||0)))for(const row of g.items||[])map.set(row.id,{...map.get(row.id),...row});
 const selected=[...map.values()].filter(i=>notes[i.id]?.tags?.includes('基础款')&&!deleted[i.id]?.deleted&&!i.deleted),items=[];
 const productionFile=path.join(out,'production.json'),production=fs.existsSync(productionFile)?JSON.parse(fs.readFileSync(productionFile,'utf8')):{items:{}};
 // Validate completeness before writing anything; never silently classify a new mark by its color name.
 for(const i of selected)if(!specs[i.id])throw Error('Add an explicit structure contract for '+i.id);
 fs.mkdirSync(out,{recursive:true});
 for(const i of selected){
  const [name,neckline,hem,construction]=specs[i.id],tax=system.items.find(t=>t.id===i.id);if(!tax)throw Error('Missing taxonomy '+i.id);
  const dir=path.join(out,i.id);fs.mkdirSync(dir,{recursive:true});const sourcePath=local(i.image),bytes=fs.readFileSync(sourcePath),image=await loadImage(bytes);if(image.width!==939||image.height!==1676)throw Error('Unexpected canvas '+i.id);
  const canvas=createCanvas(939,1676),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const original=ctx.getImageData(0,0,939,1676),pixels=ctx.createImageData(939,1676);let x0=939,y0=1676,x1=0,y1=0;
  for(let p=0;p<original.data.length;p+=4){const a=original.data[p+3];pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=255;pixels.data[p+3]=a;if(a){const x=p/4%939,y=Math.floor(p/4/939);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
  ctx.putImageData(pixels,0,0);fs.writeFileSync(path.join(dir,'coverage.png'),canvas.toBuffer('image/png'));
  for(let p=0;p<pixels.data.length;p+=4){pixels.data[p]=191;pixels.data[p+1]=183;pixels.data[p+2]=172;}ctx.putImageData(pixels,0,0);fs.writeFileSync(path.join(dir,'silhouette.png'),canvas.toBuffer('image/png'));
  const thumb=createCanvas(360,360),tc=thumb.getContext('2d'),w=x1-x0+1,h=y1-y0+1,scale=Math.min(328/w,328/h);tc.drawImage(canvas,x0,y0,w,h,(360-w*scale)/2,(360-h*scale)/2,w*scale,h*scale);fs.writeFileSync(path.join(dir,'thumbnail.png'),thumb.toBuffer('image/png'));
  const back=createCanvas(939,1676);fs.writeFileSync(path.join(dir,'back.png'),back.toBuffer('image/png'));
  const fit=fittings.draft?.[i.id]||null,geometry={coordinateSpace:'current-worn-939x1676',alreadyFitted:true,doNotApplyFitAgain:true,savedFit:fit,bodyOcclusionRects:i.bodyOcclusionRects||[],hideBodyFrom:i.hideBodyFrom??null};write(path.join(dir,'geometry.json'),geometry);
  const item={id:i.id,styleId:'style:'+i.id,name,sourceName:i.name,slot:i.slot,shelf:tax.shelf,fit:tax.fit,sleeve:tax.sleeve,neckline,hem,construction,canvas:[939,1676],bounds:[x0,y0,w,h],
   source:{image:i.image,assetVersion:i.assetVersions?.image||null,sha256:sha(bytes),fitSha256:sha(JSON.stringify(fit)),noteRevision:notes[i.id].revision},
   assets:{coverage:'/assets/garment-styles/'+i.id+'/coverage.png',silhouette:'/assets/garment-styles/'+i.id+'/silhouette.png',thumbnail:'/assets/garment-styles/'+i.id+'/thumbnail.png',back:'/assets/garment-styles/'+i.id+'/back.png',geometry:'/assets/garment-styles/'+i.id+'/geometry.json'},
   appearance:{independent:['配色','条纹/格纹/印花','针法/织纹/面料','表面刺绣/珠绣'],originalFabricReference:tax.fabric},
   retainedUserFlags:notes[i.id].tags.filter(t=>t!=='基础款'),retainedUserNote:notes[i.id].text||'',
   status:{structure:'extracted',silhouette:'exact-current-alpha',cleanSurface:'not-created',wearReview:'required'},
   production:{innerPieces:false,backTransparent:true,lockCurrentSilhouette:true,sourceIsAppearanceReferenceOnly:true,coverageIsNotOpaqueFabricMask:true,canRetextureOriginalDirectly:false,requiredLayers:['base-mask.png','trim-mask.png','shadow.png','highlight.png','lineart.png','texture.png','material.json'],rules:['轮廓底板没有内部线稿，不能冒充去纹样完成的净版','彩稿上的条纹、格纹、字样、旧印花需重画干净；禁止去色或模糊冒充','真实薄纱/蕾丝换实布或挖洞会改变 alpha，另建候选蒙版并验收，不能自动填洞','源图和当前拟合已归位；不得再套一次网格','领口、袖口、开襟不恢复内片；正式 back 全透明','腋下、袖内侧、袖口、两侧在全身与 100% 局部验收；原标记问题需复查']} };
  const made=production.items?.[i.id];
  if(made?.runtimeValidated===true&&made.sourceSha256===item.source.sha256){
   item.status.cleanSurface='approved';item.status.wearReview='passed';
   item.materialVariants=(made.variants||[]).filter(v=>{const live=map.get(v.id);return live&&!deleted[v.id]?.deleted&&live.capabilities?.recolor&&sha(fs.readFileSync(local(live.image)))===v.sha256;}).map(v=>({...v,thumbnail:map.get(v.id).thumbnail,tailorURL:'/assets/garment-prints/index.html?item='+encodeURIComponent(v.id)}));
   item.production.cleanSurfaceRecord=made.record;item.production.materialManifest=i.materialManifest;
  }
  write(path.join(dir,'style.json'),item);items.push(item);
 }
 items.sort((a,b)=>a.shelf.localeCompare(b.shelf)||a.name.localeCompare(b.name));
 const manifest={version:1,builtAt:new Date().toISOString(),count:items.length,selection:'live-user-basic-marks-minus-deletions',contract:'shape / material / pattern / placement are independent',items};write(path.join(out,'manifest.json'),manifest);console.log('Extracted '+items.length+' structure contracts and current-fit alpha silhouettes; no original art or fits changed.');
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});module.exports={build};
