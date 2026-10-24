const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),asset='assets/materials/characters/hair-inspiration-v1',folder=path.join(root,asset);
const body='assets/materials/characters/underwear-integrated-v1/body-0-0.png';
const oldHarness=fs.readFileSync(path.join(__dirname,'verify_sclub_hair.cjs'),'utf8').match(/const harness=`([\s\S]*?)`;/)[1];
const harness=oldHarness.replace('${body}',body);

(async()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(folder,'catalog.json')));
 assert.equal(catalog.length,6);
 for(const item of catalog){
  assert.equal(item.back,null);
  const {data,info}=await sharp(path.join(folder,item.front)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,939);assert.equal(info.height,1676);
  let lo=255,hi=0;
  for(let k=0;k<data.length;k+=4){assert.equal(data[k],data[k+1]);assert.equal(data[k],data[k+2]);if(data[k+3]>245){lo=Math.min(lo,data[k]);hi=Math.max(hi,data[k]);}}
  assert(hi-lo>100);for(const x of [438,502])assert(data[(178*939+x)*4+3]===0,'Eyes visible through real face opening; only a fine wisp may overlap');
  for(const kind of ['gray','lineart']){const part=await sharp(path.join(folder,'items',item.id,`front-${kind}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(part.info.width,720);assert.equal(part.info.height,1112);for(let y=0;y<1112;y++)for(let x=0;x<720;x++)if(x<12||x>707||y<12||y>1099)assert.equal(part.data[(y*720+x)*4+3],0,'Transparent production margins');}
 }
 const server=http.createServer((req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(harness);return;}const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.png')?'image/png':'text/plain');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1280,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('hair-inspiration-v1'))errors.push(r.url());});
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.locator('#hair-nav').click();
  for(let i=0;i<6;i++){
   await page.locator(`[data-inspiration-style="${i}"]`).click();await page.waitForFunction(expected=>document.querySelectorAll('.hair-front').length===1&&document.querySelectorAll('.hair-back').length===expected,i===5?1:0);
   const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('wardrobe-hair-v1')));assert.deepEqual(state.pieces.front,[catalog[i].frontId]);assert.deepEqual(state.pieces.back,i===5?['25']:[]);assert.equal(state.back,i===5?'25':'none');
   for(const color of ['#252b35','#79513b','#c9ad75','#c88caa']){
    const before=await page.locator('.hair-front').getAttribute('src');await page.locator(`[data-hair-color="${color}"]`).click();await page.waitForFunction(src=>document.querySelector('.hair-front')?.src!==src,before);assert.equal(await page.locator('.hair-back').count(),i===5?1:0);
   }
  }
  await page.locator('[data-side="front"][data-fit="x"]').fill('11');await page.locator('[data-side="front"][data-fit="y"]').fill('5');await page.locator('.hair-position-primary').click();await page.reload();await page.locator('#hair-nav').click();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('wardrobe-hair-v1')));assert.equal(restored.front,catalog[5].frontId);assert.equal(restored.back,'25');assert.equal(restored.color,'#c88caa');assert.equal(restored.frontFit.x,11);assert.equal(restored.frontFit.y,5);assert.deepEqual(restored.pieces.back,['25']);assert.equal(restored.backFit.scale,.9);
  await page.locator('[data-inspiration-style="3"]').click();await page.locator('[data-hair-color="#79513b"]').click();await page.waitForFunction(()=>document.querySelector('.hair-front')?.alt.includes('双团软髻'));await page.waitForTimeout(250);await page.screenshot({path:path.join(folder,'qa/runtime-browser.png'),fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: six original styles and independent wispy fringe; 24 runtime recolors; visible pupils and clear margins; foreground presets, existing rear pairing, positions and colors survive reload.');
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
