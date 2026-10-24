const fs=require('fs'),path=require('path'),assert=require('assert');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),material=require('../assets/garment-prints/material.js'),policy=require('../wardrobe-policy.cjs')(root);
const home=path.join(root,'assets/materials/sources/socks-clean-v1');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
(async()=>{
const specs=read(path.join(home,'specs.json')),catalog=read(path.join(root,'assets/materials/garments/collection.json')).items;
for(const s of specs){
 const item=catalog.find(i=>i.id===s.id);assert(item,'missing catalog '+s.id);
 const dir=path.dirname(path.join(root,item.materialManifest.replace(/^\//,''))),layers={};
 for(const [key,file] of Object.entries({source:'front',mask:'base-mask',shadow:'shadow',highlight:'highlight',lineart:'lineart',texture:'texture'}))layers[key]=await sharp(path.join(dir,file+'.png')).ensureAlpha().raw().toBuffer();
 assert(policy.capabilities(item).recolor,'recolor unavailable '+s.id);
 assert.strictEqual(item.offlineWearableValidated,false);
 for(const color of ['#ffffff','#161820','#b98995']){
  const out=material.pixels({...layers,color});let count=0;
  for(let i=0;i<out.length;i+=4){assert.strictEqual(out[i+3],layers.source[i+3]);if(out[i+3])count++;}
  assert(count>1000);
 }
 for(let i=3;i<layers.lineart.length;i+=4)assert.strictEqual(layers.lineart[i],0);
 assert(layers.shadow.some((v,i)=>i%4===3&&v>12),'form shading missing '+s.id);
 if(s.alpha<255)assert(layers.source.some((v,i)=>i%4===3&&v===s.alpha));
 console.log(s.id+': catalog/recolor/alpha/form-shading PASS');
}
})().catch(e=>{console.error(e);process.exitCode=1;});
