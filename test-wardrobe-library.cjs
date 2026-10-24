const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),http=require('http');
const routeFactory=require('./wardrobe-store.cjs');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wardrobe-store-')),route=routeFactory(root);
 const server=http.createServer(async(req,res)=>{await route(req,res,new URL(req.url,'http://localhost').pathname);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 const front='data:image/png;base64,'+fs.readFileSync('assets/atelier-preppy-v1/items/navy-shirt/front.png').toString('base64');
 const draft={curves:{regular:[{type:'M',values:[423,305]}]},pattern:'rose'};
 const items=['regular','loose','cropped'].map(id=>({id:'tee-'+id,name:id,slot:'top',front,back:front}));
 const put=(body,origin)=>fetch(url+'/api/wardrobe/prints',{method:'PUT',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
 try{
  assert.deepEqual((await(await fetch(url+'/api/wardrobe')).json()).groups,[]);
  let response=await put({revision:0,draft,items});assert.equal(response.status,200);const first=await response.json();assert.equal(first.revision,1);assert.deepEqual(first.draft,draft);
  assert.ok(fs.existsSync(path.join(root,first.items[0].front)));
  response=await put({revision:0,draft:{pattern:'cat'},items});assert.equal(response.status,409,'an old tab must not overwrite a newer revision');
  response=await put({revision:1,draft,items},'http://untrusted.example');assert.equal(response.status,403);
  response=await put({revision:1,draft,items:[...items.slice(0,2),{...items[2],front:'data:image/png;base64,bad'}]});assert.equal(response.status,400);
  let saved=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/published/prints.json')));assert.equal(saved.revision,1,'failed saves leave the current version intact');
  response=await put({revision:1,draft:{...draft,pattern:'cat'},items});assert.equal(response.status,200);saved=await response.json();assert.equal(saved.revision,2);assert.equal(saved.draft.pattern,'cat');
  const reloadedRoute=routeFactory(root);let restored;
  await reloadedRoute({method:'GET'},{writeHead(){},end(text){restored=JSON.parse(text);}},'/api/wardrobe');
  assert.equal(restored.groups[0].revision,2,'a new server instance loads the saved revision');
  assert.ok(fs.existsSync(path.join(root,first.items[0].front)),'the prior version remains recoverable');
  const overlays=[{id:'tee-regular',name:'圆领 T 恤',slot:'top',front,back:front},{id:'suede-skirt',name:'麂皮短裙',slot:'bottom',front,back:front}];
  const printDraft={version:2,items:{'tee-regular':{pattern:'heart',box:{x:400,y:400,width:100,height:100}},'suede-skirt':{pattern:'butterfly',box:{x:400,y:700,width:90,height:90}}}};
  response=await fetch(url+'/api/wardrobe/imprints',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:0,draft:printDraft,items:overlays})});assert.equal(response.status,200);
  const imprintRecord=await response.json();assert.equal(imprintRecord.items.length,2);assert.ok(imprintRecord.items.every(i=>i.kind==='imprint'));assert.equal(imprintRecord.draft.items['tee-regular'].pattern,'heart');assert.equal(imprintRecord.draft.items['suede-skirt'].pattern,'butterfly');
  const unchangedBase=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/published/prints.json')));assert.deepEqual(unchangedBase,saved,'applying an imprint never overwrites any base T-shirt asset or settings');
  fs.mkdirSync(path.join(root,'assets/skirt-collection-v1'),{recursive:true});fs.copyFileSync('assets/skirt-collection-v1/game-catalog.js',path.join(root,'assets/skirt-collection-v1/game-catalog.js'));
  response=await fetch(url+'/api/wardrobe/fittings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:0,draft:{'dress-02':{contours:['saved-curve']}},items:[{id:'dress-02',name:'短袖衬衫裙',slot:'dress',body:'campus',front,back:front}]})});assert.equal(response.status,200);const fitted=await response.json();assert.equal(fitted.items[0].body,'campus');assert.equal(fitted.items[0].editor,'preppy');assert.ok(fitted.items[0].image.includes('fittings-dress-02'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'assets/materials/published/prints.json'))),saved,'fitting a legacy dress does not replace unrelated source groups');
  fs.mkdirSync(path.join(root,'assets/materials/sources/imported'),{recursive:true});fs.writeFileSync(path.join(root,'assets/materials/sources/imported/catalog.json'),JSON.stringify({items:[{id:'new-coat',name:'新外套',slot:'coat',body:'open-arms-v2'}]}));
  response=await fetch(url+'/api/wardrobe/fittings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:1,draft:{'dress-02':{contours:['saved-curve']},'new-coat':{}},items:[{id:'new-coat',name:'新外套',slot:'coat',body:'open-arms-v2',front,back:front}]})});assert.equal(response.status,200);const extended=await response.json();assert.equal(extended.items.length,2);assert.equal(extended.items.find(i=>i.id==='dress-02').image,fitted.items[0].image,'incremental saves preserve previously fitted garments');assert.equal(extended.items.find(i=>i.id==='new-coat').slot,'coat');
  console.log('PASS: durable wardrobe drafts and wearable PNGs, reload, revision conflicts, validation, origin isolation, prior-version recovery.');
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
