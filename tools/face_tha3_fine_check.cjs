const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
 await page.goto('http://127.0.0.1:4188/outputs/face-tha3/fine-v1/index.html');
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('已生成'));
 for(const name of ['neutral','blink-half','blink-closed','gaze-left','gaze-right','brows-up','smile','mouth-a','mouth-i','mouth-u','mouth-e','mouth-o']){
  await page.click(`button[data-pose="${name}"]`);await page.waitForFunction(n=>window.FineTrial?.pose===n,name);
  if(name==='neutral')assert.equal(await page.evaluate(()=>{const a=document.querySelector('#original').getContext('2d').getImageData(0,0,670,790).data,b=document.querySelector('#fine').getContext('2d').getImageData(0,0,670,790).data;return a.some((v,i)=>v!==b[i])}),false,'neutral canvas must retain original pixels');
 }
 await page.click('button[data-pose="mouth-a"]');await page.waitForFunction(()=>window.FineTrial?.pose==='mouth-a');
 await page.screenshot({path:'outputs/face-tha3/fine-v1/browser-desktop.png',fullPage:true});
 await page.click('button[data-pose="demo"]');await page.waitForFunction(()=>{const i=document.querySelector('#animation');return i.complete&&i.naturalWidth===1080});
 const seen=new Set();for(let j=0;j<12;j++){seen.add(crypto.createHash('sha256').update(await page.locator('#animation').screenshot()).digest('hex'));await page.waitForTimeout(200)}assert(seen.size>1,'comparison animation must move');
 await page.setViewportSize({width:390,height:844});await page.click('button[data-pose="blink-closed"]');await page.waitForFunction(()=>window.FineTrial?.pose==='blink-closed');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile overflow');await page.screenshot({path:'outputs/face-tha3/fine-v1/browser-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 fs.writeFileSync('outputs/face-tha3/fine-v1/browser-check.json',JSON.stringify({browser:'Chrome',poses:12,neutralCanvasExact:true,synchronizedAnimationMoves:true,mobileOverflow:false,errors,failed},null,2));await browser.close();console.log('PASS: 12 poses, exact original neutral, moving comparison and mobile layout.');
})().catch(e=>{console.error(e);process.exit(1)});
