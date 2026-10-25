const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),base='http://127.0.0.1:4173',read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const system=read('assets/wardrobe-basics/体系清单.json'),notes=read('assets/materials/published/garment-notes.json').items,deleted=read('assets/materials/published/deleted-garments.json').items;
 await p.goto(base+'/materials.html?kind=basics');await p.locator('#materials article').first().waitFor();
 const expected=system.items.filter(i=>notes[i.id]?.tags?.includes('基础款')&&!deleted[i.id]?.deleted);
 assert.equal(await p.locator('#materials article').count(),expected.length);assert.equal(await p.locator('#basic-shelf option').count(),new Set(expected.map(i=>i.shelf)).size+1);
 await p.locator('[data-role="上衣"]').click();assert(await p.locator('[data-shape="01-上衣/04-Polo衫"]').isVisible());await p.locator('[data-shape="01-上衣/04-Polo衫"]').click();assert.equal(await p.locator('#materials article').count(),expected.filter(i=>i.shelf==='01-上衣/04-Polo衫').length);
 await p.locator('[data-role=""]').click();await p.locator('#basic-fit').selectOption('贴身');assert.equal(await p.locator('#materials article').count(),expected.filter(i=>i.fit==='贴身').length);await p.locator('#basic-fit').selectOption('');
 await p.route('**/api/wardrobe-visibility',async route=>{assert.equal(route.request().method(),'POST');const v=route.request().postDataJSON();await route.fulfill({json:{id:v.id,visible:v.visible}});});
 const toggle=p.locator('#materials [data-id]').first(),id=await toggle.getAttribute('data-id'),before=await toggle.getAttribute('aria-pressed');await toggle.click();await p.waitForFunction(({id,before})=>document.querySelector('[data-id="'+id+'"]')?.getAttribute('aria-pressed')!==before,{id,before});
 await p.locator('[data-kind="clothes"]').click();assert.notEqual(await p.locator('[data-id="'+id+'"]').getAttribute('aria-pressed'),before,'visibility shares state across tabs');
 const all=read('assets/wardrobe-organized/分类体系.json').items.filter(i=>i.inWardrobe&&!deleted[i.id]?.deleted);assert.equal(await p.locator('#materials article').count(),all.length);await p.locator('[data-role="鞋履"]').click();assert.equal(await p.locator('#materials article').count(),all.filter(i=>i.role==='鞋履').length);assert(await p.locator('.category-shapes button').count()>2);await p.locator('[data-role=""]').click();
 for(const [id,d]of Object.entries(deleted))if(d.deleted)assert.equal(await p.locator('[data-material-id="'+id+'"]').count(),0);
 await p.locator('[data-kind="front"]').click();assert(await p.locator('#materials article').count()>0);assert(await p.locator('#basic-tools').isHidden());
 await p.locator('[data-kind="basics"]').click();await p.screenshot({path:path.join(root,'materials-basic-system-preview.png')});await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile layout overflow');
 // A deletion made after the static export must disappear on refresh, too.
 const gone=expected[0].id;await p.route('**/api/garment-deletions',async route=>{const r=await route.fetch(),j=await r.json();j.items.push({id:gone,deleted:true});await route.fulfill({json:j});});await p.reload();await p.locator('#materials article').first().waitFor();assert.equal(await p.locator('[data-material-id="'+gone+'"]').count(),0);assert.deepEqual(errors,[]);
 const extra=all.find(i=>!notes[i.id]?.tags?.includes('基础款'));await p.route('**/api/garment-basics',async route=>{const r=await route.fetch(),j=await r.json();j.items[extra.id]=true;await route.fulfill({json:j});});await p.reload();await p.locator('[data-material-id="'+extra.id+'"]').waitFor();assert((await p.locator('[data-material-id="'+extra.id+'"]').innerText()).includes(extra.shelf.replace(/\d+-/g,'')),'new mark inherits existing shape category');assert.deepEqual(errors,[]);
 console.log(`PASS: ${all.length} classified clothes/accessories and ${expected.length} basics; expanded category/shape buttons, fit filters, shared visibility, other tabs, deletion refresh and mobile layout verified; all writes mocked`);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
