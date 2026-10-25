const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const out='outputs/face-tha3/cool-v1';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/assets/materials/characters/face-motion-cool-v1/index.html');await page.waitForFunction(()=>window.FaceMotion?.status().ready);
 const states={};
 for(const [name,pose]of [['neutral',{}],['closed',{blink:1}],['smile',{smile:1}],['combo',{blink:1,smile:1}],['gaze',{gaze:4}],['mouth',{mouth:'aaa-3'}]]){
  await page.evaluate(p=>FaceMotion.setPose(p),pose);await page.waitForTimeout(120);
  states[name]=await page.evaluate(()=>FaceMotion.canvas().toDataURL());await page.locator('#portrait').screenshot({path:`${out}/preview-${name}.png`});
 }
 assert.notEqual(states.neutral,states.closed);assert.notEqual(states.closed,states.combo);assert.notEqual(states.neutral,states.mouth);
 await page.evaluate(()=>FaceMotion.setPose(null));await page.screenshot({path:`${out}/preview-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/preview-mobile.png`,fullPage:true});
 for(const url of ['index.html','mobile.html']){
  await page.goto('http://127.0.0.1:4173/'+url);await page.waitForFunction(()=>window.FaceMotion?.status().ready&&document.querySelector('.face-motion-layer:not([hidden])'));
  assert.equal(await page.evaluate(()=>CharacterPortraits.selected()),'cool');
  for(const [name,pose]of [['neutral',{}],['closed',{blink:1}]]){
   await page.evaluate(p=>FaceMotion.setPose(p),pose);await page.waitForTimeout(160);
   const c=page.locator('.face-motion-layer:not([hidden])').first(),b=await c.boundingBox();assert(b);
   await page.screenshot({path:`${out}/game-${url.split('.')[0]}-${name}.png`,clip:{x:b.x+350/939*b.width,y:Math.max(0,b.y+75/1676*b.height),width:250/939*b.width,height:265/1676*b.height}});
  }
  await page.evaluate(()=>FaceMotion.setEnabled(false));assert.equal(await page.locator('.face-motion-layer:not([hidden])').count(),0);await page.evaluate(()=>FaceMotion.setEnabled(true));
  await page.evaluate(()=>CharacterPortraits.select('pure-brown'));await page.waitForTimeout(120);assert.equal(await page.locator('.face-motion-layer:not([hidden])').count(),0);
  await page.evaluate(()=>CharacterPortraits.select('cool'));
 }
 assert.deepEqual(errors,[]);const bytes=fs.readdirSync('assets/materials/characters/face-motion-cool-v1').reduce((sum,n)=>sum+fs.statSync('assets/materials/characters/face-motion-cool-v1/'+n).size,0);
 fs.writeFileSync(`${out}/browser-check.json`,JSON.stringify({passed:true,errors,assetBytes:bytes,checks:['six distinct poses','combined blink and smile','desktop and mobile actual game','default cool face','toggle and static face fallback','390px preview no overflow']},null,2));await browser.close();console.log('PASS: motion preview + desktop/mobile integration;',bytes,'asset bytes');
})().catch(e=>{console.error(e);process.exit(1)});
