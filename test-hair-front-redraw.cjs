const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const reveal=require('./assets/hair-face-reveal.js'),root='assets/materials/characters/hair-front-redraw-v4/';
async function main(){
 const manifest=JSON.parse(fs.readFileSync(root+'manifest.json'));assert.equal(manifest.items.length,16);
 const hashes=[];
 for(const item of manifest.items){
  const {data,info}=await sharp(root+item.mask).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,180);assert.equal(info.height,278);
  assert.equal(data[(220*180+90)*4+3],0,'Face opening must stay transparent');
  let opaque=0;for(let k=3;k<data.length;k+=4)opaque+=data[k]>245;assert(opaque>10000,'Hair interior must be filled');
  hashes.push(crypto.createHash('sha256').update(data).digest('hex'));
  const source=await sharp(root+`cells/${item.id}-source-ink.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<source.info.height;y++)for(let x=0;x<source.info.width;x++)if(x<3||y<3||x>=source.info.width-3||y>=source.info.height-3)assert(source.data[(y*source.info.width+x)*4+3]<=80,'Sheet cell clips hair');
 }
 assert.equal(new Set(hashes).size,16);for(const sheet of [1,2])assert.equal(manifest.items.filter(i=>i.sheet===`sheets/front-sheet-${sheet}.png`).length,8);
 const protectedFiles=JSON.parse(fs.readFileSync(root+'integration-report.json')).protectedHashes;for(const [file,hash] of Object.entries(protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file+' changed');
 assert.equal(reveal.alpha(438,178,255,.4),102);assert.equal(reveal.alpha(438,178,0,.4),0);assert.equal(reveal.alpha(438,178,255,0),0);assert.equal(reveal.alpha(438,178,255,2),191);assert.equal(reveal.alpha(470,120,255,.4),0);
 const width=939,height=1676,face=Buffer.alloc(width*height*4),hair=Buffer.alloc(face.length);const k=(178*width+438)*4;face.set([210,180,170,255],k);hair.set([90,60,40,255],k);
 const beforeFace=Buffer.from(face),beforeHair=Buffer.from(hair),out=reveal.pixels(face,hair,width,height,.4);assert.deepEqual(Array.from(out.slice(k,k+4)),[210,180,170,102]);assert(face.equals(beforeFace));assert(hair.equals(beforeHair),'Face effect must not mutate hair');
 let visible=0;for(let j=3;j<out.length;j+=4)visible+=out[j]>0;assert.equal(visible,1,'Only covered face pixels may be revealed');assert(reveal.pixels(face,hair,width,height,0).every(v=>v===0));
 const code=fs.readFileSync('assets/hair-studio.js','utf8').replace('return {mount,layer,faceLayer,','return {testSaved:saved,testChoices:choices,mount,layer,faceLayer,');
 const context={window:{HairFaceReveal:reveal},localStorage:{getItem:()=>JSON.stringify({front:'17',back:'99',eyeReveal:.4})},console};vm.runInNewContext(code,context);const studio=context.window.HairStudio;assert.equal(studio.testSaved.front,'17');assert.equal(studio.testSaved.back,'01');assert(studio.testChoices('front').length>=28);assert(studio.testChoices('back').length>=22);
 const app=fs.readFileSync('app.js','utf8');assert(app.indexOf("HairStudio?.layer('front')")<app.indexOf('HairStudio?.faceLayer?.()'));const html=fs.readFileSync('index.html','utf8');assert(html.indexOf('hair-face-reveal.js')<html.indexOf('hair-studio.js'));
 console.log('PASS: original cutouts and protected assets retained; original and additional front/back options; invalid IDs recover; face reveal does not mutate hair.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
