const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const groups=[{group:'library',items:[{id:'shirt',image:'baked.png',back:'baked-back.png',thumbnail:'baked-thumb.png'}]},{group:'preppy',items:[{id:'shirt',image:'obsolete.png'}]},{group:'materials',items:[{id:'shirt',image:'old-import.png'}]}];
const source=fs.readFileSync('app.js','utf8'),start=source.indexOf('function applyLibrary('),end=source.indexOf('applyLibrary(window.');
const ctx=vm.createContext({catalog:[],cleanName:n=>n});vm.runInContext(source.slice(start,end),ctx);ctx.applyLibrary(groups);
assert.equal(ctx.catalog[0].image,'baked.png','baked canonical PNG supersedes legacy editor/import outputs');
ctx.applyLibrary([...groups,{group:'fittings',items:[{id:'shirt',image:'new-adjustment.png'}]}]);assert.equal(ctx.catalog[0].image,'new-adjustment.png','new intentional adjustments still take precedence');
const editor=fs.readFileSync('assets/garment-prints/editor.js','utf8');const match=editor.slice(editor.indexOf('function makeCatalog()'),editor.indexOf('async function front('));
const ec=vm.createContext({copy:x=>JSON.parse(JSON.stringify(x)),CAMPUS_CATALOG:[],WardrobeLibrary:{groups},GarmentNames:{clean:n=>n}});vm.runInContext(match,ec);assert.equal(ec.makeCatalog()[0].image,'baked.png','dynamic print/recolor editor also starts from baked image');
console.log('PASS: baked images win over legacy sources in game and dynamic editor, while new adjustments can still override.');
