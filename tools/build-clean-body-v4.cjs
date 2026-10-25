const fs=require('fs'),sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const dir='assets/materials/characters/clean-body-v4',source='outputs/body-remaster-v4/strapless-preview.png',cutout='outputs/body-remaster-v4/headless-cutout.png';
 fs.mkdirSync(dir,{recursive:true});
 const {data,info}=await sharp(source).ensureAlpha().extend({bottom:1,background:'#00000000'}).raw().toBuffer({resolveWithObject:true});
 const mask=await sharp(cutout).ensureAlpha().extend({bottom:1,background:'#00000000'}).raw().toBuffer();
 const original=await sharp('assets/materials/characters/low-coverage-v3/body-0-0.png').ensureAlpha().raw().toBuffer();
 if(info.width!==939||info.height!==1676)throw Error('Unexpected registration');
 for(let y=0;y<1676;y++)for(let x=0;x<939;x++){
  const i=(y*939+x)*4;data[i+3]=y<268?0:Math.min(original[i+3],mask[i+3]);
  if(data[i+2]>data[i]+3)data[i+3]=0; // Only discard the reference's blue background; never invent skin pixels.
 }
 await sharp(data,{raw:info}).png().toFile(dir+'/body.png');
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)fs.copyFileSync(dir+'/body.png',`${dir}/body-${a}-${b}.png`);
 fs.writeFileSync(dir+'/manifest.json',JSON.stringify({source,cutout,canvas:[939,1676],paintedUnderwear:true,registration:'No rescaling, one transparent row padded; alpha constrained by the registered original and generated cutout. Saved garment and hair transforms untouched.'},null,2));
 if(fs.existsSync('assets/materials/characters/body-neck-extension-v1/generated.png')){
  const python='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
  require('child_process').execFileSync(python,['-X','utf8','tools/extend_body_neck.py'],{stdio:'inherit'});
 }
 console.log('Clean body exported; original sources and all fitting metadata unchanged.');
})().catch(e=>{console.error(e);process.exit(1);});
