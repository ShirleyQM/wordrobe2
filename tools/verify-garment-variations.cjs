const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  const records={};
  await p.route('**/api/garment-variations**',async route=>{
   const req=route.request(),id=req.url().split('/').pop();
   if(req.method()==='GET')return route.fulfill({json:{items:records}});
   const input=req.postDataJSON(),prev=records[id];
   if(input.revision!==(prev?.revision||0))return route.fulfill({status:409,json:{error:'其他页面已更新，草稿已保留',current:prev}});
   records[id]={...input,itemId:id,revision:input.revision+1,updatedAt:new Date().toISOString()};return route.fulfill({json:records[id]});
  });
  await p.goto('http://127.0.0.1:4173/materials.html?kind=basics');
  await p.waitForFunction(()=>document.querySelectorAll('.variation-editor textarea:not(:disabled)').length>0);
  const id=await p.locator('[data-material-id]').first().getAttribute('data-material-id'),panel=()=>p.locator('[data-variation-id="'+id+'"]');
  const note='保留短款轮廓；去掉牛仔纹；换咖色麂皮，加流苏，做 2 款。';
  await panel().locator('textarea').fill(note);
  await p.locator('[data-kind=clothes]').click();assert.equal(await panel().locator('textarea').inputValue(),note,'draft survives tab changes');
  await p.reload();await panel().locator('textarea:not(:disabled)').waitFor();assert.equal(await panel().locator('textarea').inputValue(),note,'draft survives reload');
  await panel().locator('[data-variation-save]').click();await p.waitForFunction(id=>!JSON.parse(localStorage.getItem('garment-variation-drafts-v1')||'{}')[id],id);
  assert.equal(records[id].text,note);assert.equal(records[id].pending,true);
  await p.reload();await panel().locator('textarea:not(:disabled)').waitFor();assert.equal(await panel().locator('textarea').inputValue(),note,'saved note reloads');
  await p.locator('#variation-pending-only').check();assert.equal(await p.locator('#materials article').count(),1);
  const download=Promise.all([p.waitForEvent('download'),p.locator('#variation-export').click()]);const [file]=await download;
  const fs=require('node:fs'),exported=JSON.parse(fs.readFileSync(await file.path(),'utf8'));assert.equal(exported.count,1);assert.equal(exported.items[0].request,note);assert.equal(exported.items[0].id,id);
  await panel().locator('textarea').fill('草稿修改');records[id]={...records[id],text:'另一页新备注',revision:2};
  await panel().locator('[data-variation-save]').click();await panel().locator('.variation-conflict').waitFor();assert.equal(await panel().locator('textarea').inputValue(),'草稿修改');assert((await panel().locator('.variation-conflict').innerText()).includes('另一页新备注'));
  await panel().locator('textarea').fill(note+' 合并另一页意见');await panel().locator('[data-variation-confirm]').click();await p.waitForFunction(id=>!JSON.parse(localStorage.getItem('garment-variation-drafts-v1')||'{}')[id],id);assert.equal(records[id].revision,3);
  await panel().locator('[data-variation-pending]').uncheck();await panel().locator('[data-variation-save]').click();await p.waitForFunction(()=>document.querySelectorAll('#materials article').length===0);assert.equal(records[id].pending,false);
  await p.locator('#variation-pending-only').uncheck();await p.locator('[data-kind=basics]').click();
  await p.screenshot({path:path.resolve(__dirname,'../materials-variation-notes-preview.png')});
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.locator('[data-kind=front]').click();assert(await p.locator('#variation-tools').isHidden());assert.equal(await p.locator('.variation-editor').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: per-garment notes, draft recovery, saved reload, queue filtering/export, conflict merge, remove from queue, mobile layout; writes mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
