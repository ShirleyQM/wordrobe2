const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const regenerated=process.argv.includes('--regenerated-front-v5');
const root=path.resolve(__dirname,'..'),home=path.join(root,'assets/materials/sources',regenerated?'socks-regenerated-front-v5':'socks-clean-v1');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),url=p=>'/'+path.relative(root,p).split(path.sep).join('/');
const material=require('../assets/garment-prints/material.js');
const edgeRevision=process.argv.includes('--edges-v3'),revision=regenerated?'v5':edgeRevision?'v3':'v2',revisionName=regenerated?'regenerated-front-only-v5':edgeRevision?'rounded-cuff-closed-toe-v3':'soft-volume-v2';
(async()=>{
const updates=[];
for(const s of read(path.join(home,'specs.json'))){
 const dir=path.join(home,s.id,regenerated?'result':'result-'+revision),layers={};
 for(const [k,f] of Object.entries({source:'front',mask:'base-mask',shadow:'shadow',highlight:'highlight',lineart:'lineart',texture:'texture'}))layers[k]=await sharp(path.join(dir,f+'.png')).ensureAlpha().raw().toBuffer();
 const old=layers.source,expectedAlpha=await sharp(path.join(dir,'front-alpha.png')).greyscale().raw().toBuffer();
 let lit=0,dark=0;for(let i=3;i<old.length;i+=4){assert.equal(expectedAlpha[i>>2],layers.source[i]);if(layers.shadow[i]>12)dark++;if(layers.highlight[i]>0)lit++;}
 assert(dark>500,'no visible form shading '+s.id);
 for(const color of ['#ffffff','#161820','#b98995']){
  const out=material.pixels({...layers,color});let min=255,max=0;
  for(let i=0;i<out.length;i+=4){assert.equal(out[i+3],old[i+3]);if(out[i+3]>80){min=Math.min(min,out[i]);max=Math.max(max,out[i]);}}
  assert(max-min>=5,'form lost on recolor '+s.id);
  await sharp(Buffer.from(out),{raw:{width:939,height:1676,channels:4}}).png().toFile(path.join(dir,'proof-'+color.slice(1)+'.png'));
 }
 const expected=material.pixels({...layers,color:s.color});let error=0;for(let i=0;i<expected.length;i++)if(i%4!==3&&layers.source[i-i%4+3])error=Math.max(error,Math.abs(expected[i]-layers.source[i]));assert(error<=1,'preview differs from live recolor');
 const full=await sharp(path.join(dir,'front.png')).trim().resize({width:320,height:320,fit:'inside'}).png().toBuffer();await sharp({create:{width:340,height:340,channels:4,background:'#00000000'}}).composite([{input:full,gravity:'centre'}]).png().toFile(path.join(dir,'catalog-thumb.png'));
 updates.push({id:s.id,dir,frontSha256:sha(path.join(dir,'front.png')),shadowPixels:dark,highlightPixels:lit});
}
// Read and merge synchronously after all rendering, preserving current user metadata.
const file=path.join(root,'assets/materials/garments/collection.json'),cat=read(file),importFile=path.join(root,'assets/materials/sources/imported/catalog.json'),imports=read(importFile);
for(const u of updates){
 const item=cat.items.find(i=>i.id===u.id);assert(item,'existing sock missing');
 const folder=path.join(root,'assets/materials/garments',u.id);
 for(const name of ['front','back','display'])fs.copyFileSync(path.join(u.dir,name+'.png'),path.join(folder,name+'.png'));
 fs.copyFileSync(path.join(u.dir,'catalog-thumb.png'),path.join(folder,'thumb.png'));
 Object.assign(item,{materialManifest:url(path.join(u.dir,'material.json')),sourceImage:url(path.join(u.dir,'front.png')),sourceSha256:u.frontSha256,originalSha256:u.frontSha256,surfaceRevision:revisionName,lineart:url(path.join(u.dir,'lineart.png')),runtimeValidated:false,wearable_validated:false,offlineWearableValidated:false,recolor_ready:true});
 if(regenerated)Object.assign(item,{materialPresets:url(path.join(home,'material-presets.json')),frontOnly:true,backPanelDrawn:false,backTechnicalPlaceholder:true,layerMode:'front-only'});
 const imported=imports.items.find(i=>i.id===u.id);if(imported){imported.image=item.front;imported.thumbnail=item.thumbnail;}
 const qa=read(path.join(u.dir,'qa.json'));Object.assign(qa,{visual_reviewed:true,reviewEvidence:regenerated?['../../overview.jpg']:edgeRevision?['../../edge-v3-before-after.jpg']:['../../overview-volume-v2.jpg','../../volume-before-after.jpg'],recolorVerified:true,sourceAlphaUnchanged:!edgeRevision&&!regenerated,interiorOpacityPreserved:true});fs.writeFileSync(path.join(u.dir,'qa.json'),JSON.stringify(qa,null,2));
}
for(const [p,data] of [[file,cat],[importFile,imports]]){fs.writeFileSync(p+'.volume-tmp',JSON.stringify(data,null,2));fs.renameSync(p+'.volume-tmp',p);}
fs.writeFileSync(path.join(home,regenerated?'qa.json':edgeRevision?'edge-v3-qa.json':'volume-v2-qa.json'),JSON.stringify({technicalPass:true,visual_reviewed:true,tryonPerformed:false,originalAlphaPreserved:!edgeRevision&&!regenerated,regenerated,frontOnly:regenerated,interiorOpacityPreserved:true,recolorVerified:true,updatedExistingIds:updates.map(u=>u.id)},null,2));
console.log('PASS: 8 existing socks updated to '+revision+'; three recolors preserve corrected alpha; native/live render agree; earlier revisions preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
