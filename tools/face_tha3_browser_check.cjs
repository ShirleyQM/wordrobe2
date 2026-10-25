const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const dir='outputs/face-tha3';
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
 await page.goto('http://127.0.0.1:4188/face-tha3-preview.html');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('已运行'));
 for(const v of ['standard_float','separable_float']){
  await page.selectOption('#variant',v);
  await page.waitForFunction(v=>document.querySelector('#report').href.includes(v),v);
  for(const pose of ['neutral','blink-half','blink-closed','gaze-left','gaze-right','brows-up','smile','mouth-a','mouth-i','mouth-u','mouth-e','mouth-o','full-neutral','full-blink-closed']){
   await page.click(`button[data-pose="${pose}"]`);
   await page.waitForFunction(()=>{const i=document.querySelector('#result');return i.complete&&i.naturalWidth===512});
  }
  await page.click('button[data-pose="demo"]');
  await page.waitForFunction(()=>{const i=document.querySelector('#demo');return i.complete&&i.naturalWidth===320});
  // Canvas drawImage reads the first frame of animated images; inspect the browser's actual rendered pixels.
  const seen=new Set();for(let j=0;j<16;j++){seen.add(require('crypto').createHash('sha256').update(await page.locator('#demo').screenshot()).digest('hex'));await page.waitForTimeout(180)}const moving=seen.size;
  assert(moving>1,'Animated WebP must actually animate');
  await page.screenshot({path:`${dir}/${v}/browser-preview.png`,fullPage:true});
 }
 await page.selectOption('#variant','standard_float');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:dir+'/browser-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 fs.writeFileSync(dir+'/browser-check.json',JSON.stringify({browser:'Chrome',variants:2,staticPoseSelections:28,animatedWebp:true,mobileOverflow:false,errors,failed},null,2));
 await browser.close();console.log('PASS: both THA3 variants, 28 pose selections, animated WebP and mobile preview.');
})().catch(e=>{console.error(e);process.exit(1)});
