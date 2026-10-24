const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/wardrobe-organized'),report=JSON.parse(fs.readFileSync(path.join(dir,'清点结果.json'),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(new Set(report.items.map(i=>i.id)).size,report.items.length);
assert.equal(report.summary.missingCurrentImages.length,0);
for(const i of report.items){
 for(const p of [i.image,i.thumbnail,i.folder+'/来源与线稿.json',i.folder+'/当前前片.png'])assert(fs.existsSync(path.join(dir,p)),i.id+' '+p);
 assert.equal(hash(path.join(dir,i.folder,'当前前片.png')),i.sourceFrontSha256,'current art unchanged '+i.id);
 for(const l of i.linearts)assert.equal(hash(path.join(dir,l.file)),l.sha256,'lineart copy unchanged '+i.id);
 if(i.lineartStatus==='未找到线稿')assert.equal(i.linearts.length,0);
 if(i.lineartStatus==='仅材质线条层')assert(i.linearts.every(l=>l.kind==='材质线条层'));
}
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let marked=null;
  await page.route('**/api/garment-basics',async route=>{if(route.request().method()==='POST'){marked=route.request().postDataJSON();return route.fulfill({json:{id:marked.id,basic:marked.basic}});}return route.continue();});
  await page.route('**/api/wardrobe',async route=>{const response=await route.fetch();if(!marked)return route.fulfill({response});const data=await response.json();for(const g of data.groups)for(const i of g.items)if(i.id===marked.id)i.basicTemplate=marked.basic;return route.fulfill({json:data});});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-basic-id]').first().waitFor();
  const toggle=page.locator('[data-basic-id]').first(),id=await toggle.getAttribute('data-basic-id'),before=await toggle.getAttribute('aria-pressed'),shown=await page.locator('[data-show-id="'+id+'"]').textContent();
  await toggle.click();await page.waitForFunction(({id,before})=>document.querySelector('[data-basic-id="'+id+'"]')?.getAttribute('aria-pressed')!==before,{id,before});
  assert.equal(await page.locator('[data-show-id="'+id+'"]').textContent(),shown,'basic selection leaves visibility alone');
  await page.locator('#basic-only').check();assert(await page.locator('[data-basic-id][aria-pressed="false"]').count()===0);
  await page.locator('#basic-only').uncheck();
  await page.screenshot({path:path.join(root,'wardrobe-basic-button-preview.png'),fullPage:false});
  await page.goto('http://127.0.0.1:4173/assets/wardrobe-organized/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('#grid article').first().waitFor();
  await page.locator('#category').selectOption('04-连衣裙');assert.equal(await page.locator('#grid article').count(),report.items.filter(i=>i.category==='04-连衣裙'&&!i.deleted).length);
  await page.locator('#category').selectOption('');await page.locator('#lineart').selectOption('独立原始线稿');assert.equal(await page.locator('#grid article').count(),report.items.filter(i=>i.lineartStatus==='独立原始线稿'&&!i.deleted).length);
  await page.locator('#show-lines').check();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#grid article img')).slice(0,5).every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:path.join(root,'wardrobe-lineart-library-preview.png'),fullPage:false});
  assert.deepEqual(errors,[],'UI runtime errors');
  console.log('PASS: '+report.items.length+' categorized items, copies and lineart hashes; main basic toggle/filter and visibility independence; gallery category/lineart filters. Browser writes were mocked; user notes untouched.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
