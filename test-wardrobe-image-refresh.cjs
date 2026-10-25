const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium}=require(deps+'playwright'),sharp=require(deps+'sharp');
const P=__dirname,R=path.join(P,'assets/materials/sources/editor-runtime-investigation-v1');
const id='kg-mockneck-knit-v1',url='/assets/materials/garments/'+id+'/front.png';
const native=path.join(P,url),old=path.join(P,'assets/materials/sources/afternoon-pause-investigation-v1/before.png');
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
 fs.mkdirSync(R,{recursive:true});const fits=path.join(P,'assets/materials/published/fittings.json'),fitHash=sha(fs.readFileSync(fits));
 const expected=sha(await sharp(native).extractChannel(3).raw().toBuffer()),oldAlpha=sha(await sharp(old).extractChannel(3).raw().toBuffer());
 assert.notEqual(expected,oldAlpha);
 const browser=await chromium.launch({headless:true,channel:'msedge'});let released=false;
 try{const p=await browser.newPage({viewport:{width:1400,height:1100}});
  // Supply an old response/image in this isolated browser only. No wardrobe files change.
  await p.route('**/api/wardrobe/runtime',async route=>{
   const response=await route.fetch(),data=await response.json();
   if(!released)for(const group of data.groups)for(const item of group.items||[])if(item.id===id){item.image=url+'?av=old-test';item.assetVersions={...item.assetVersions,image:'old-test'};}
   await route.fulfill({response,json:data});
  });
  await p.route('**/assets/materials/garments/kg-mockneck-knit-v1/front.png*',async route=>{
   if(new URL(route.request().url()).searchParams.get('av')==='old-test')await route.fulfill({path:old,contentType:'image/png'});else await route.continue();
  });
  await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(id=>typeof catalog!=='undefined'&&catalog.some(i=>i.id===id),id);
  const name=await p.evaluate(id=>{state.equipped={top:id};state.split={};render();return catalog.find(i=>i.id===id).name;},id);
  async function decodedAlpha(){return p.evaluate(async name=>{
   const image=[...document.querySelectorAll('.campus-figure img')].find(i=>i.alt===name);await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const cx=canvas.getContext('2d');cx.drawImage(image,0,0);const rgba=cx.getImageData(0,0,canvas.width,canvas.height).data,alpha=new Uint8Array(canvas.width*canvas.height);
   for(let n=0;n<alpha.length;n++)alpha[n]=rgba[n*4+3];
   return {src:image.getAttribute('src'),sha:[...new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))].map(x=>x.toString(16).padStart(2,'0')).join('')};
  },name);}
  const before=await decodedAlpha();assert.equal(before.sha,oldAlpha,'old clipped paint must actually be visible first');
  released=true;await p.evaluate(()=>refreshLibrary());
  await p.waitForFunction(name=>{const i=[...document.querySelectorAll('.campus-figure img')].find(i=>i.alt===name);return i&&!i.src.includes('av=old-test')&&i.complete&&i.naturalWidth>0;},name);
  const after=await decodedAlpha();assert.equal(after.sha,expected,'decoded displayed alpha must equal restored paint without page reload');
  assert.notEqual(after.src,before.src);await p.locator('.campus-figure').screenshot({path:path.join(R,'main-restored.png')});
  // Also verify the real editor's versioned source resolves to exactly the same file bytes.
  const collection=await(await p.request.get('http://127.0.0.1:4173/assets/materials/garments/collection.json')).json();
  const item=collection.items.find(i=>i.id===id),asset=require('./assets/asset-version.js').url(item,'front');
  const body=await(await p.request.get('http://127.0.0.1:4173'+asset)).body();assert.equal(sha(body),sha(fs.readFileSync(native)));
  assert.equal(sha(fs.readFileSync(fits)),fitHash,'no fitting data changed by refresh fix');
  fs.writeFileSync(path.join(R,'browser-check.json'),JSON.stringify({pass:true,before,after,editorSource:asset,decodedRestoredAlpha:true,samePageNoReload:true,userFittingFileUnchanged:true},null,2));
  console.log('PASS: same open page replaces visibly clipped old sweater with exact restored alpha; editor source matches; no fit data modified.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
