const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('./assets/garment-body-occlusion.js');
const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {chromium}=require(deps+'playwright'),sharp=require(deps+'sharp');
const out=path.resolve('artifacts/clothing-layer-containment');fs.mkdirSync(out,{recursive:true});
const bra={id:'qa-bra',slot:'bra'},top={id:'qa-top',slot:'top'},coat={id:'qa-coat',slot:'coat'},briefs={id:'qa-briefs',slot:'briefs'},bottom={id:'qa-bottom',slot:'bottom'},dress={id:'qa-dress',slot:'dress'};
for(const [inner,outer]of [[bra,top],[bra,dress],[bra,coat],[briefs,bottom],[briefs,dress],[top,coat]]){
 assert.equal(M.containment(inner,[inner,outer]).length,1);
 assert.equal(M.containment(inner,[outer,inner]).length,0,'outer garment below inner must not constrain it');
}
assert.equal(M.garmentStyle(bra,[bra],'/body.png'),'');
assert.equal(M.garmentStyle(bottom,[bottom,coat],'/body.png'),'','preserve full skirt volume');
assert.equal(M.garmentStyle(coat,[coat,top],'/body.png'),'','do not shrink a reversed loose coat');
assert.equal(M.garmentStyle(bra,[bra,bottom],'/body.png'),'','unrelated anatomical domain');
assert.match(M.garmentStyle(bra,[bra,top],'/body.png?av=2'),/mask-mode:alpha/);
assert.ok(!M.garmentStyle(bra,[bra,top],'/body.png').includes('"'),'desktop style attribute remains intact');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const p=await browser.newPage({viewport:{width:1100,height:1800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // Pixel tests run the real desktop AND mobile render functions, including the
 // previously separate custom-bra branch, then let Chromium composite the CSS.
 for(const file of ['app.js','assets/mobile/app.js']){
  await p.goto('about:blank');await p.addScriptTag({path:path.resolve('assets/garment-body-occlusion.js')});
  const source=fs.readFileSync(file,'utf8'),name=file==='app.js'?'liveFigure':'figure',code=source.match(new RegExp('^function '+name+'\\(\\).*$', 'm'))[0];
  for(const pair of [['bra','top'],['briefs','bottom'],['top','coat']])for(const reversed of [false,true]){
   const html=await p.evaluate(({code,name,reversed,pair})=>{
    const image=(rects)=>{const c=document.createElement('canvas');c.width=939;c.height=1676;const x=c.getContext('2d');for(const [color,a,b,w,h]of rects){x.fillStyle=color;x.fillRect(a,b,w,h);}return c.toDataURL();};
    const body=image([['#eeeeee',300,200,300,1000]]),red=image([['#ff0000',250,300,400,200]]),blue=image([['#0000ff',280,420,170,200],['#0000ff80',450,420,170,200]]);
    const rows=[{id:'bra',slot:pair[0],body:'open-arms-v2',name:'bra',image:red,showInGame:true},{id:'top',slot:pair[1],name:'top',image:blue,showInGame:true}],order=reversed?[pair[1],pair[0]]:[pair[0],pair[1]];
    const w={UnderwearWardrobe:{body:()=>body,image:i=>i.image,known:()=>false},CharacterPortraits:{baseBody:()=>body,layer:()=>''},HairStudio:{layer:()=>'',underStyle:s=>s,faceLayer:()=>'',backDetailLayer:()=>''},GarmentBodyOcclusion:window.GarmentBodyOcclusion};
    return Function('window','UnderwearWardrobe','HairStudio','GarmentBodyOcclusion','MobileEquipment','state','itemById','item','clothingSlots','CURATION_MODE','innerPreview','esc',code+';return '+name+'();')(w,w.UnderwearWardrobe,w.HairStudio,w.GarmentBodyOcclusion,{normalize:e=>e,style:()=>''},{equipped:{bra:'bra',top:'top'}},id=>rows.find(i=>i.id===id),id=>rows.find(i=>i.id===id),()=>order,true,false,s=>String(s||'').replaceAll('"','&quot;'));
   },{code,name,reversed,pair});
   await p.setContent('<div id="figure"></div><style>body{margin:0;background:white}.campus-figure{position:relative;width:939px;height:1676px}.campus-figure img{position:absolute;width:100%;height:100%;inset:0}</style>'+html);
   await p.evaluate(()=>{document.querySelector('#figure').append(document.querySelector('.campus-figure'));});
   await p.locator('img').evaluateAll(rows=>Promise.all(rows.map(i=>i.decode())));
   const png=await p.locator('.campus-figure').screenshot(),data=await sharp(png).removeAlpha().raw().toBuffer(),pixel=(x,y)=>[...data.subarray((y*939+x)*3,(y*939+x)*3+3)];
   assert.deepEqual(pixel(270,350),reversed?[255,0,0]:[255,255,255],'outside-body fringe follows actual order');
   assert.deepEqual(pixel(400,350),[255,0,0],'low neckline must retain underwear INSIDE body');
   assert.deepEqual(pixel(400,450),reversed?[255,0,0]:[0,0,255],'opaque outer cloth is drawn above');
   assert.deepEqual(pixel(500,450),reversed?[255,0,0]:[127,0,128],'sheer outer cloth retains normal alpha blending');
   fs.writeFileSync(path.join(out,name+'-'+pair.join('-')+(reversed?'-reversed':'-normal')+'.png'),png);
   if(file!=='app.js'&&!reversed&&pair[0]==='bra'){
    const thumbSource=fs.readFileSync('assets/mobile/look-lab.js','utf8'),at=thumbSource.indexOf(' async function thumbnail()'),end=thumbSource.indexOf('\n function ',at+1),code=thumbSource.slice(at,end);
    const dataURL=await p.evaluate(code=>Function('t',code+';return thumbnail();')(s=>s),code),buf=Buffer.from(dataURL.split(',')[1],'base64'),raw=await sharp(buf).removeAlpha().raw().toBuffer(),atPixel=(51*180+51)*3;
    assert.ok(raw[atPixel+1]>180,'saved thumbnail must not restore red outside-body fringe');fs.writeFileSync(path.join(out,'saved-thumbnail.webp'),buf);
   }

  }
 }
 // Actual inventory, original URLs and 4x native image remain unchanged.
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof catalog!=='undefined'&&catalog.some(i=>i.id==='fresh-square-cami-v1'));
 const chosen=await p.evaluate(()=>{
  const available=slot=>catalog.filter(i=>i.slot===slot&&!i.unavailable&&!i.deleted&&i.showInGame);
  const bra=catalog.find(i=>i.id==='fresh-square-cami-v1'),top=available('top').find(i=>/waltz/i.test(i.name))||available('top')[0],coat=available('coat')[0];
  state.equipped={bra:bra.id,top:top.id,coat:coat.id};state.split={};render();return {bra,top,coat};
 });
 await p.locator('.campus-figure img').evaluateAll(rows=>Promise.all(rows.map(i=>i.decode().catch(()=>{}))));
 const actual=await p.evaluate(({bra,top,coat})=>[bra,top,coat].map(row=>{const el=[...document.querySelectorAll('.campus-figure img')].find(i=>i.alt===row.name);return {id:row.id,src:el?.getAttribute('src'),size:[el?.naturalWidth,el?.naturalHeight],mask:el&&getComputedStyle(el).maskImage};}),chosen);
 assert.ok(actual[0].mask!=='none'&&actual[1].mask!=='none');assert.equal(actual[2].mask,'none');assert.deepEqual(actual[0].size,[3756,6704]);
 await p.locator('.campus-figure').screenshot({path:path.join(out,'inventory-tryon.png')});
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof catalog!=='undefined');
 // Mobile's live layer rail and saved outfit use the same actual slot order.
 await p.setViewportSize({width:430,height:932});await p.goto('http://127.0.0.1:4173/mobile.html',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof catalog!=='undefined'&&catalog.some(i=>i.id==='fresh-square-cami-v1'));
 await p.waitForFunction(()=>typeof firstLoad!=='undefined'&&!firstLoad);await p.evaluate(async ({bra,top})=>{await PlayerEconomy.grantItems([bra.id,top.id]);},chosen);
 const mobile=await p.evaluate(({bra,top})=>{state.equipped={bra:bra.id,top:top.id};state.layerOrder=['top','bra'];window.MobilePreview?.clear();render();const imgs=[...document.querySelectorAll('#figure .campus-figure img')],a=imgs.find(i=>i.alt===item(bra.id).name),b=imgs.find(i=>i.alt===item(top.id).name);const result={braIndex:imgs.indexOf(a),topIndex:imgs.indexOf(b),mask:getComputedStyle(a).maskImage};state.layerOrder=['bra','top'];render();result.normalMask=getComputedStyle([...document.querySelectorAll('#figure .campus-figure img')].find(i=>i.alt===item(bra.id).name)).maskImage;persist();return result;},chosen);
 assert.ok(mobile.braIndex>mobile.topIndex);assert.equal(mobile.mask,'none');assert.notEqual(mobile.normalMask,'none');await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>typeof catalog!=='undefined'&&catalog.some(i=>i.id==='fresh-square-cami-v1'));
 await p.waitForFunction(()=>typeof firstLoad!=='undefined'&&!firstLoad);const restoredMask=await p.evaluate(id=>{const row=item(id),el=[...document.querySelectorAll('#figure .campus-figure img')].find(i=>i.alt===row.name);return el&&getComputedStyle(el).maskImage;},chosen.bra.id);assert.ok(restoredMask&&restoredMask!=='none');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({pass:true,actual,mobile,errors},null,2));console.log('PASS: pair policy, reverse order, desktop/mobile pixel tests, low neckline, inventory try-on, native 4x preservation.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
