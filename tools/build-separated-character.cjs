// Split existing registered art; never rescale, repaint skin, or change fitted garments.
const fs=require('fs'),vm=require('vm'),path=require('path');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='assets/materials/characters/separated-body-v1';
const file=url=>url.replace(/^\//,'').split('?')[0];
async function rgba(url){return sharp(file(url)).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
(async()=>{
 fs.mkdirSync(out+'/heads',{recursive:true});
 const ctx={window:{addEventListener(){}},localStorage:{getItem:()=>null}};
 vm.runInNewContext(fs.readFileSync('assets/character-portraits.js','utf8'),ctx);
 const versions=ctx.window.CharacterPortraits.versions;
 const necklessManifest='assets/materials/characters/face-regenerated-v7/manifest.json';
 const neckless=fs.existsSync(necklessManifest)?JSON.parse(fs.readFileSync(necklessManifest,'utf8')):{};
 const manifest={canvas:[939,1676],source:'low-coverage-v3',bodyCutY:268,heads:{}};
 for(let top=0;top<2;top++)for(let bottom=0;bottom<2;bottom++){
  if(neckless.integratedFaceIds?.length&&neckless.necklessBodySupport){
   fs.copyFileSync(`${neckless.necklessBodySupport}/body-${top}-${bottom}.png`,`${out}/body-${top}-${bottom}.png`);
   continue;
  }
  const source=`assets/materials/characters/low-coverage-v3/body-${top}-${bottom}.png`,r=await rgba(source);
  if(r.info.width!==939||r.info.height!==1676)throw Error('Canvas changed: '+source);
  for(let y=0;y<268;y++)for(let x=0;x<939;x++)r.data[(y*939+x)*4+3]=0;
  await sharp(r.data,{raw:r.info}).png().toFile(`${out}/body-${top}-${bottom}.png`);
 }
 for(const v of versions){
  if(v.headImage){
   const target=`${out}/heads/${v.id}.png`;
   fs.copyFileSync(file(v.headImage),target);
   manifest.heads[v.id]={source:v.headImage,overlay:null,image:target,neckless:!!v.neckless,completeGeneratedHeadAndNeck:!v.neckless};
   continue;
  }
  const source=v.body||'assets/materials/characters/low-coverage-v3/body-0-0.png';
  let pipe=sharp(file(source));
  if(!v.fullHead&&v.image)pipe=pipe.composite([{input:file(v.image)}]);
  const r=await pipe.ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=268;y<1676;y++)for(let x=0;x<939;x++){
   const i=(y*939+x)*4+3;r.data[i]=y>=286?0:Math.round(r.data[i]*(286-y)/18);
  }
  const target=`${out}/heads/${v.id}.png`;
  await sharp(r.data,{raw:r.info}).png().toFile(target);
  manifest.heads[v.id]={source,overlay:!v.fullHead?v.image:null,image:target};
 }
 fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2));
 // Keep the corrected lower-jaw masks when rebuilding these registered heads.
 const maskScript=path.resolve('tools/face_chin_mask.py');
 if(fs.existsSync(maskScript)){
  const python=process.env.FACE_MASK_PYTHON||'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
  const masked=require('child_process').spawnSync(python,['-X','utf8',maskScript,'--game-only'],{encoding:'utf8'});
  if(masked.status!==0)throw Error('Jaw mask cleanup failed: '+masked.stderr);
 }
 console.log(`Separated 4 bodies and ${versions.length} heads; original files unchanged.`);
})().catch(e=>{console.error(e);process.exit(1);});
