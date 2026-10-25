const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root='outputs/bra-body-capsule-v1/cloth-only',generated='C:/Users/Administrator/.codex/generated_images/01a15a36-fffd-7d52-9f5c-1384fcf76434/';
const rows=[
 ['jersey-softcup','细罗纹软杯','Ribbed Soft Cup','exec-13f6c94e-f435-4774-84d5-b1a553905960.png'],
 ['scallop-triangle','花枝刺绣三角杯','Petal Embroidery','exec-9c587aa9-129d-4be6-89fd-c4794da34141.png'],
 ['satin-triangle','缎面蝴蝶结','Satin Ribbon','exec-235510b1-01a6-4beb-8f4b-ea285133a2ee.png']
];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 const result=[];
 for(const [id,name,nameEn,source] of rows){
  const dir=path.join(root,id);fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(generated+source,dir+'/original.png');
  const meta=await sharp(dir+'/original.png').metadata();
  if(meta.width!==939||![1675,1676].includes(meta.height))throw Error('Unexpected canvas');
  let pipe=sharp(dir+'/original.png').ensureAlpha();if(meta.height===1675)pipe=pipe.extend({bottom:1,background:'#00000000'});
  const {data,info}=await pipe.raw().toBuffer({resolveWithObject:true});let removed=0;
  // Remove only low-opacity fringe and neon cutout specks, never repaint fabric or expand clothing.
  for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];if(data[i+3]&&(data[i+3]<12||Math.max(r,g,b)-Math.min(r,g,b)>110)){data[i+3]=0;removed++;}}
  await sharp(data,{raw:info}).png().toFile(dir+'/front.png');
  await sharp({create:{width:939,height:1676,channels:4,background:'#00000000'}}).png().toFile(dir+'/back.png');
  const alpha=await sharp(dir+'/front.png').extractChannel('alpha').raw().toBuffer();
  let x0=939,y0=1676,x1=0,y1=0;for(let y=0;y<1676;y++)for(let x=0;x<939;x++)if(alpha[y*939+x]>12){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const bounds=[x0,y0,x1-x0+1,y1-y0+1];
  await sharp(dir+'/front.png').extractChannel('alpha').png().toFile(dir+'/garment-alpha.png');
  for(const [label,color]of [['light','#f4f0ec'],['dark','#34313b']]){const composed=await sharp({create:{width:939,height:1676,channels:4,background:color}}).composite([{input:dir+'/front.png'}]).png().toBuffer();await sharp(composed).extract({left:330,top:280,width:280,height:280}).png().toFile(dir+'/detail-'+label+'.png');}
  await sharp(dir+'/front.png').trim().resize({width:600,height:600,fit:'contain',background:'#00000000'}).png().toFile(dir+'/display.png');
  const record={id,name,nameEn,slot:'bra',canvas:[939,1676],bounds,front:'front.png',back:'back.png',source,sourceSha256:hash(dir+'/original.png'),frontSha256:hash(dir+'/front.png'),removedCutoutFringePixels:removed,registration:{scale:1,translate:[0,0],paddedBottom:1676-meta.height},status:'cloth-only-candidate',bodyPatch:'not-generated: output safety filter blocked body edit',online:false,capabilities:{recolor:false,print:false},notes:'Three separate illustrations. No body pixels. No rear pieces. Existing wardrobe IDs and user fitting data unchanged. Colored artwork is not advertised as original lineart or recolor-ready layers.'};
  fs.writeFileSync(dir+'/candidate.json',JSON.stringify(record,null,2));result.push(record);
 }
 fs.writeFileSync(root+'/candidates.json',JSON.stringify({items:result,bodyIntegration:'pending',notPublished:true},null,2));console.log(JSON.stringify(result.map(i=>({id:i.id,bounds:i.bounds,removed:i.removedCutoutFringePixels}))));
})();
