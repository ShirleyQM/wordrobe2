const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
(async()=>{
 const base='http://127.0.0.1:4173',full=await(await fetch(base+'/api/wardrobe')).json(),runtime=await(await fetch(base+'/api/wardrobe/runtime')).json();
 assert(full.groups.some(g=>g.draft));assert(runtime.groups.every(g=>!Object.hasOwn(g,'draft')));assert.deepEqual(runtime.groups.flatMap(g=>g.items),full.groups.flatMap(g=>g.items));
 const p=runtime.groups.flatMap(g=>g.items).find(i=>i.image)?.image;const first=await fetch(base+p),tag=first.headers.get('etag');assert(tag);const next=await fetch(base+p,{headers:{'If-None-Match':tag}});assert.equal(next.status,304);
 let writes=0;const box={set innerHTML(v){writes++;}},context={window:{}};vm.runInNewContext(fs.readFileSync('assets/figure-view.js','utf8'),context);context.window.FigureView.paint(box,'same');context.window.FigureView.paint(box,'same');context.window.FigureView.paint(box,'new');assert.equal(writes,2);
 console.log('PASS: runtime omits drafts, retains identical baked images; image cache returns 304; unchanged figure preserves DOM.');
})();
