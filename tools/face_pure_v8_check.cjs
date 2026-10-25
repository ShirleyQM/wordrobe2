const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/index.html');
 await page.waitForFunction(()=>window.CharacterPortraits&&document.querySelector('.character-face'));
 const result=[];
 for(const id of ['pure-black','pure-brown']){
  await page.evaluate(id=>window.CharacterPortraits.select(id),id);
  await page.waitForFunction(id=>{const im=document.querySelector('.character-face');return im?.dataset.face===id&&im.complete&&im.naturalWidth===939},id);
  const image=page.locator('.character-face').first(),box=await image.boundingBox();
  assert(box,'Face not rendered');
  const clip={x:box.x+350/939*box.width,y:box.y+70/1676*box.height,width:250/939*box.width,height:255/1676*box.height};
  await page.screenshot({path:`outputs/face-pure-v8/game-${id}.png`,clip});result.push({id,width:box.width,height:box.height});
 }
 fs.writeFileSync('outputs/face-pure-v8/browser-check.json',JSON.stringify({faces:result,errors,scope:'Actual main game character face layer and neck join'},null,2));
 const gallery='face-pure-v8';
 if(fs.existsSync(`assets/materials/characters/${gallery}/index.html`)){
  await page.goto(`http://127.0.0.1:4173/assets/materials/characters/${gallery}/index.html`);
  await page.waitForFunction(w=>document.querySelectorAll('article img').length===2&&[...document.querySelectorAll('article img')].every(im=>im.complete&&im.naturalWidth===w),350);
  await page.screenshot({path:`outputs/${gallery}/gallery-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`outputs/${gallery}/gallery-mobile.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: 2 pure-style face layers load in the actual game.');
})().catch(e=>{console.error(e);process.exit(1)});
