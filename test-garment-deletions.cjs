const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'garment-delete-'));
 const write=(p,d)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(d));};
 const collection=path.join(root,'assets/materials/garments/collection.json'),fitting=path.join(root,'assets/materials/published/fittings.json');
 write(collection,{items:[{id:'tee-regular',name:'标准圆领 T 恤'},{id:'other',name:'其他衣服'}]});write(fitting,{draft:{'tee-regular':{position:[1,2],curves:['keep']}}});
 const originals=[collection,fitting].map(p=>fs.readFileSync(p));
 const store=require('./garment-deletions.cjs')(root),server=http.createServer((req,res)=>store.route(req,res,'/api/garment-deletions'));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 const change=(id,deleted,origin)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify({id,deleted})});
 try{
  assert.equal((await change('tee-regular',true)).status,200);assert.equal(store.deletedIds().has('tee-regular'),true);
  assert.equal(require('./garment-deletions.cjs')(root).deletedIds().has('tee-regular'),true,'deletion survives process reload');
  await change('tee-regular',true);assert.equal(store.deletedItems().length,1,'delete is idempotent');
  assert.equal((await change('unknown',true)).status,400);assert.equal((await change('other',true,'https://elsewhere.example')).status,403);
  await change('tee-regular',false);assert.equal(store.deletedIds().size,0,'undo restores the garment');
  for(const [i,p]of [collection,fitting].entries())assert.deepEqual(fs.readFileSync(p),originals[i],'art and user fittings are untouched');
  console.log('PASS: reversible persistent deletion, reload and undo, idempotency, unknown-item/origin checks, art and manual fits preserved.');
 }finally{await new Promise(r=>server.close(r));assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'garment-delete-'));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
