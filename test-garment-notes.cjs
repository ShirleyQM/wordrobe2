const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'garment-notes-'));
 fs.mkdirSync(path.join(root,'assets/materials/garments'),{recursive:true});
 fs.writeFileSync(path.join(root,'assets/materials/garments/collection.json'),JSON.stringify({items:[{id:'tee-a'},{id:'tee-b'}]}));
 const route=require('./garment-notes.cjs')(root),server=http.createServer((req,res)=>route(req,res,new URL(req.url,'http://local').pathname));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/api/garment-notes/';
 const put=(id,body)=>fetch(base+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await(await fetch(base+'tee-a')).json()).revision,0);
  let response=await put('tee-a',{revision:0,tags:['内片露出','基础款'],text:'袖口再调一点'});assert.equal(response.status,200);
  await put('tee-b',{revision:0,tags:['袖子不贴'],text:''});
  const a=await(await fetch(base+'tee-a')).json();assert.deepEqual(a.tags,['内片露出','基础款']);assert.equal(a.text,'袖口再调一点');
  assert.equal((await put('tee-a',{revision:0,tags:[],text:'旧页面'})).status,409,'stale notes cannot overwrite new notes');
  assert.equal((await put('tee-a',{revision:1,tags:['无效选项'],text:''})).status,400);
  assert.equal((await fetch(base+'unknown')).status,404);
  const basics=base.replace(/garment-notes\/$/,'garment-basics');
  const mark=(id,basic,headers={})=>fetch(basics,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({id,basic})});
  assert.equal((await(await fetch(basics)).json()).items['tee-a'],true,'existing note tags power basic buttons');
  assert.equal((await mark('tee-a',false)).status,200);
  const changed=await(await fetch(base+'tee-a')).json();assert.deepEqual(changed.tags,['内片露出']);assert.equal(changed.text,'袖口再调一点');assert.equal(changed.revision,2);
  assert.equal((await put('tee-a',{revision:1,tags:[],text:'old note dialog'})).status,409,'basic changes protect against stale note dialogs');
  assert.equal((await mark('tee-a',true)).status,200);
  assert.equal((await mark('tee-b',true)).status,200);
  assert.deepEqual((await(await fetch(base+'tee-b')).json()).tags,['袖子不贴','基础款']);
  assert.equal((await mark('unknown',true)).status,400);assert.equal((await mark('tee-a','true')).status,400);
  assert.equal((await mark('tee-a',false,{Origin:'https://example.com'})).status,403);
  const reload=require('./wardrobe-policy.cjs')(root),decorated=[{group:'library',items:[{id:'tee-a'},{id:'tee-b'}]},{group:'fittings',items:[{id:'tee-a'}]}];reload.decorate(decorated);
  assert.equal(decorated[0].items[0].basicTemplate,true);assert.equal(decorated[1].items[0].basicTemplate,true,'all versions use same mark');assert.equal(decorated[0].items[0].showInGame,false,'basic mark does not publish clothes');
  const saved=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/published/garment-notes.json')));assert.equal(Object.keys(saved.items).length,2);
  assert.equal(saved.items['tee-b'].tags[0],'袖子不贴');
  console.log('PASS: garment-specific notes persist, tags and text round-trip, other notes survive, stale writes rejected.');
 }finally{await new Promise(r=>server.close(r));assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+'garment-notes-'));fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
