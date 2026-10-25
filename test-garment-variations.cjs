const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'garment-variations-')),published=path.join(root,'assets/materials/published');
 fs.mkdirSync(path.join(root,'assets/materials/garments'),{recursive:true});fs.mkdirSync(published,{recursive:true});
 fs.writeFileSync(path.join(root,'assets/materials/garments/collection.json'),JSON.stringify({items:[{id:'coat-a'},{id:'coat-b'}]}));
 const oldNotes=JSON.stringify({items:{'coat-a':{tags:['基础款'],text:'保留原备注'}}});fs.writeFileSync(path.join(published,'garment-notes.json'),oldNotes);
 const route=require('./garment-variations.cjs')(root),server=http.createServer((req,res)=>route(req,res,new URL(req.url,'http://local').pathname));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/api/garment-variations';
 const put=(id,body,headers={})=>fetch(base+'/'+id,{method:'PUT',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 try{
  assert.deepEqual((await(await fetch(base)).json()).items,{});
  assert.equal((await put('coat-a',{revision:0,text:'改麂皮，加流苏，2款',pending:true})).status,200);
  assert.equal((await put('coat-b',{revision:0,text:'先留备注',pending:false})).status,200);
  const saved=(await(await fetch(base)).json()).items;assert.equal(saved['coat-a'].pending,true);assert.equal(saved['coat-a'].revision,1);assert.equal(saved['coat-b'].pending,false);
  const conflicts=await Promise.all([put('coat-a',{revision:1,text:'版本甲',pending:true}),put('coat-a',{revision:1,text:'版本乙',pending:true})]);assert.deepEqual(conflicts.map(r=>r.status).sort(),[200,409]);
  const conflict=await put('coat-a',{revision:0,text:'旧页面',pending:true});assert.equal(conflict.status,409);assert.equal((await conflict.json()).current.revision,2);
  assert.equal((await put('coat-b',{revision:1,text:'',pending:true})).status,400);
  assert.equal((await put('coat-b',{revision:1,text:'x'.repeat(4001),pending:false})).status,400);
  assert.equal((await put('coat-b',{revision:1,text:'跨站',pending:true},{Origin:'https://example.com'})).status,403);
  fs.writeFileSync(path.join(published,'deleted-garments.json'),JSON.stringify({items:{'coat-a':{deleted:true}}}));
  assert(!('coat-a' in (await(await fetch(base)).json()).items));assert.equal((await put('coat-a',{revision:2,text:'已删除',pending:true})).status,404);
  assert.equal(fs.readFileSync(path.join(published,'garment-notes.json'),'utf8'),oldNotes);
  console.log('PASS: persisted independent variation notes, concurrent revisions, request validation, deletion exclusion and original notes retained.');
 }finally{await new Promise(r=>server.close(r));assert(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'garment-variations-'));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
