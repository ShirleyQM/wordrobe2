const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),hairRoot=path.join(root,'assets/materials/characters/sclub-six-v1');
const body='assets/materials/characters/hair-original-clean-v3/game/body-hairless.png';
const harness=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#eeeae4;font:14px sans-serif}.sidebar{position:absolute;left:10px;top:10px}.wardrobe{display:flex;padding:20px;gap:20px}.figure-wrap{position:relative;width:440px;flex-shrink:0}.campus-figure{position:relative;width:440px;height:785px}.campus-figure img{position:absolute;width:100%;height:100%;left:0;top:0}#hair-panel{width:600px}button{cursor:pointer;padding:7px}.hair-grid{display:flex;flex-wrap:wrap;gap:5px}.hair-grid button{width:77px}.hair-grid img{height:70px;width:60px;object-fit:contain}.hair-grid span{font-size:10px;display:block}.hair-fit{display:flex}.hair-preview-tools{position:fixed;bottom:5px;left:5px;background:white;padding:10px;z-index:3}.hair-transform{position:absolute;border:1px solid #8a6342;pointer-events:none}.hair-transform button{position:absolute;right:0;bottom:0;pointer-events:auto}.hair-color{display:flex;gap:15px}[hidden]{display:none!important}</style><aside class="sidebar" style="z-index:10"><nav><button data-nav="wardrobe">衣服</button><button data-nav="study">学习</button></nav></aside><section class="wardrobe"><div class="figure-wrap"><div id="figure"></div></div></section><script>function figure(){return '<div class="campus-figure">'+(window.HairStudio?.layer('back')||'')+'<img src="${body}">'+(window.HairStudio?.layer('front')||'')+'</div>';}function openWorkspace(){}document.getElementById('figure').innerHTML=figure();</script><script src="/assets/hair-face-reveal.js"></script><script src="/assets/hair-studio.js"></script><script>HairStudio.mount();</script>`;

(async()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(hairRoot,'catalog.json')));
 for(const item of catalog)for(const side of ['front','back']){
  const {data,info}=await sharp(path.join(hairRoot,item[side])).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,939);assert.equal(info.height,1676);
  let min=255,max=0;
  for(let i=0;i<data.length;i+=4){assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);if(data[i+3]>245){min=Math.min(min,data[i]);max=Math.max(max,data[i]);}}
  assert(max-min>100,'Retain material tonal detail');
  if(side==='front')for(const x of [438,502])assert.equal(data[(178*939+x)*4+3],0,'Real transparent pupil openings');
  const prod=await sharp(path.join(hairRoot,'items',item.id,side+'-gray.png')).metadata();assert.equal(prod.width,720);assert.equal(prod.height,1112);
 }
 const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(harness);return;}const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.png')?'image/png':'text/plain');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:1100}});const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('console',m=>{if(m.type()==='error')failures.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('#hair-nav').click();
  for(let i=0;i<6;i++){
   await page.locator(`[data-sclub-style="${i}"]`).click();
   await page.waitForFunction(()=>document.querySelector('.hair-front')&&document.querySelector('.hair-back'));
   assert.equal(await page.locator('[data-hair-part="front"]').inputValue(),String(18+i));assert.equal(await page.locator('[data-hair-part="back"]').inputValue(),String(17+i));
   for(const color of ['#252b35','#79513b','#c9ad75','#c88caa']){
    const previous=await page.locator('.hair-front').getAttribute('src');await page.locator(`[data-sclub-color="${color}"]`).click();await page.waitForFunction(previous=>document.querySelector('.hair-front')?.src!==previous,previous);
    await page.waitForFunction(color=>{const state=JSON.parse(localStorage.getItem('wardrobe-hair-v1'));return state.color===color&&document.querySelector('.hair-front')?.src.startsWith('data:image/png');},color);
   }
  }
  await page.locator('[data-side="front"][data-fit="x"]').fill('13');await page.locator('[data-side="front"][data-fit="y"]').fill('7');await page.locator('.hair-position-primary').click();
  await page.reload();await page.locator('#hair-nav').click();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('wardrobe-hair-v1')));assert.equal(state.front,'23');assert.equal(state.back,'22');assert.equal(state.color,'#c88caa');assert.equal(state.frontFit.x,13);assert.equal(state.frontFit.y,7);
  await page.locator('[data-sclub-style="2"]').click();await page.locator('[data-sclub-color="#79513b"]').click();await page.waitForFunction(()=>document.querySelector('.hair-front')?.alt.includes('010724')&&document.querySelector('.hair-back')?.alt.includes('010724'));
  await page.waitForTimeout(300);await page.screenshot({path:path.join(hairRoot,'qa/runtime-browser.png'),fullPage:true});
  assert.deepEqual(failures,[]);console.log('PASS: six matched pairs, all four recolors, rendered layers, saved front/back selections and independent positions survive reload; no browser errors.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
