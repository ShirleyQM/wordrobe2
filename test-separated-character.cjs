const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const ctx={document:{getElementById:()=>null},window:{addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}}};
 for(const script of ['assets/underwear-wardrobe.js','assets/character-portraits.js'])vm.runInNewContext(fs.readFileSync(script,'utf8'),ctx);
 const portrait=ctx.window.CharacterPortraits,under=ctx.window.UnderwearWardrobe;
 for(let a=0;a<2;a++)for(let b=0;b<2;b++){
  const worn=[...(a?[{slot:'bra'}]:[]),...(b?[{slot:'briefs'}]:[])];
  const url=under.body(worn),master=await sharp('assets/materials/characters/clean-body-v4/body.png').ensureAlpha().raw().toBuffer();
  const {data,info}=await sharp(url.slice(1)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,939);assert.equal(info.height,1676);
  assert(url.includes('/clean-body-v4/'),'Never restore patched old skin');
  assert.deepEqual(data,master,'All garment states use the confirmed clean base with its painted underwear');
  for(let i=3;i<939*268*4;i+=4)assert.equal(data[i],0,'No baked face remains');
  for(const face of portrait.versions){portrait.select(face.id);assert.equal(portrait.baseBody(url),url);assert(portrait.layer().includes(`/heads/${face.id}.png`));assert(fs.existsSync(`assets/materials/characters/separated-body-v1/heads/${face.id}.png`));}
 }
 assert(fs.readFileSync('assets/garment-prints/index.html','utf8').includes('assets/character-portraits.js'));
 assert(fs.readFileSync('assets/garment-prints/editor.js','utf8').includes("CharacterPortraits.head()"));
 console.log('4 clean body states × 18 separate faces verified; Tailor loads the same portrait layer.');
})().catch(e=>{console.error(e);process.exit(1);});
