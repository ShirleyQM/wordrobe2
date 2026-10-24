const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source=fs.readFileSync('assets/character-portraits.js','utf8');
const assetPath=url=>url.split('?')[0].replace(/^\//,'');
function boot(storage){let renders=0;const events={};const ctx={window:{addEventListener:(name,fn)=>events[name]=fn},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},document:{getElementById:()=>null},render:()=>renders++};vm.runInNewContext(source,ctx);return {api:ctx.window.CharacterPortraits,events,renders:()=>renders};}
async function main(){
 const store={},first=boot(store);assert.equal(first.api.selected(),'unified-face');assert.equal(first.api.layer(),'');
 assert.equal(first.api.versions.length,18);
 for(const id of ['cool','gentle','poised','slender','soft-small','sharp-small']){assert(first.api.select(id));assert.equal(first.api.selected(),id);assert(first.api.layer().includes(`data-face="${id}"`));assert(first.api.revealBody().includes('/'+id+'/body-0-0.png'));assert.equal(boot(store).api.selected(),id);}
 assert.equal(first.api.select('missing'),false);assert.equal(first.api.selected(),'sharp-small');first.events.storage({key:'wardrobe-portrait-v1',newValue:'cool'});assert.equal(first.api.selected(),'cool');assert(first.renders()>0);assert.equal(boot({'wardrobe-portrait-v1':'invalid'}).api.selected(),'unified-face');
 for(const face of first.api.versions.filter(v=>v.image)){
  const overlay=await sharp(assetPath(face.image)).raw().toBuffer({resolveWithObject:true});assert.equal(overlay.info.width,939);assert.equal(overlay.info.height,1676);let active=0;
  for(let y=0;y<1676;y++)for(let x=0;x<939;x++){const a=overlay.data[(y*939+x)*4+3];if(a){active++;assert(x>=398&&x<546&&y>=135&&y<267,'Face patch includes body/neck');}}assert(active>10000);
  const head=await sharp(assetPath(face.thumbnail)).raw().toBuffer();for(let y=940;y<1100;y++)for(let x=0;x<1000;x++)assert.equal(head[(y*1000+x)*4+3],0,'HD head includes neck');
  for(const top of [0,1])for(const bottom of [0,1]){
   const file=`assets/materials/characters/low-coverage-v3/body-${top}-${bottom}.png`;
   const base=await sharp(file).raw().toBuffer();let changed=0;
   for(let y=135;y<267;y++)for(let x=398;x<546;x++){const k=(y*939+x)*4,a=overlay.data[k+3]/255;for(let c=0;c<3;c++){const out=Math.round(overlay.data[k+c]*a+base[k+c]*(1-a));changed+=out!==base[k+c];}}assert(changed>5000,'Face must change with every underwear base');
  }
 }
 for(const face of first.api.versions.filter(v=>v.fullHead)){
  assert(first.api.select(face.id));assert.equal(boot(store).api.selected(),face.id);assert.equal(first.api.layer(),'','New jaw must not overlay old pointed chin');
  assert.equal(first.api.revealBody(),face.body);
  const head=await sharp(assetPath(face.thumbnail)).ensureAlpha().raw().toBuffer();for(let y=1000;y<1100;y++)for(let x=0;x<1000;x++)assert.equal(head[(y*1000+x)*4+3],0,'Head includes neck below jaw');
  for(const top of [0,1])for(const bottom of [0,1]){
   const original=`/assets/materials/characters/low-coverage-v3/body-${top}-${bottom}.png`,mapped=first.api.baseBody(original);assert(mapped.includes('/'+face.id+'/body-'));
   const before=await sharp(assetPath(original)).ensureAlpha().raw().toBuffer(),after=await sharp(assetPath(mapped)).ensureAlpha().raw().toBuffer();
   assert(!before.subarray(80*939*4,282*939*4).equals(after.subarray(80*939*4,282*939*4)),'Face must change');
   assert(before.subarray(282*939*4).equals(after.subarray(282*939*4)),'Body/underwear below head changed');
   for(let y=0;y<282;y++){assert(before.subarray(y*939*4,(y*939+350)*4).equals(after.subarray(y*939*4,(y*939+350)*4)));assert(before.subarray((y*939+600)*4,(y+1)*939*4).equals(after.subarray((y*939+600)*4,(y+1)*939*4)));}
  }
 }
 first.api.select('gentle');const original='/assets/materials/characters/low-coverage-v3/body-1-1.png';assert.equal(first.api.baseBody(original),original,'Legacy faces retain original bodies');
 console.log('PASS: eighteen persistent face choices; six legacy overlays and eleven full-head faces; all four current underwear states; exact protected body pixels.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
