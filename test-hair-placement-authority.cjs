const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const published=JSON.parse(fs.readFileSync('assets/materials/published/hair-defaults.json')),value={...published,enabled:true,front:'18',back:'17',frontFit:{x:300,y:400,scale:3,sx:2,sy:2},backFit:{x:300,y:400,scale:3,sx:2,sy:2},pieces:{front:['18'],back:['17']},color:'#79513b'};
const ctx={window:{MATERIAL_PLAYER:true,MaterialVisibility:{visible:()=>true},HAIR_STORAGE_KEY:'test-hair-authority',addEventListener(){}},localStorage:{getItem:key=>key==='test-hair-authority'?JSON.stringify(value):null,setItem(){}},Image:class{},requestAnimationFrame(){},console};
vm.runInNewContext(fs.readFileSync('assets/hair-studio.js','utf8').replace('mount,layer,faceLayer,','saved,cache,lastLayers,pieceFit,choices,mount,layer,faceLayer,'),ctx);
const h=ctx.window.HairStudio;
for(const side of ['front','back'])for(let n=1;n<=h.choices(side).length;n++){const id=String(n).padStart(2,'0'),fit=published.positionDefaults[side][id];if(fit)for(const key of ['x','y','scale','sx','sy'])assert.equal(h.pieceFit(side,id)[key],fit[key]??1,side+id+key);}
const stamp=()=>JSON.stringify(['back','17',h.saved.color,h.pieceFit('back','17')]);h.cache.set(stamp(),'previous-location.png');assert(h.layer('back').includes('previous-location.png'));
h.saved.positionDefaults.back['17']={...h.saved.positionDefaults.back['17'],x:91};h.cache.clear();assert(!h.layer('back').includes('previous-location.png'),'A stale image must not stand in for newly saved coordinates');h.cache.set(stamp(),'current-location.png');assert(h.layer('back').includes('current-location.png'));
assert(!fs.readFileSync('assets/hair-studio.js','utf8').includes(' publishDefaults();\n const lastLayers'));
console.log('PASS: every saved hair transform preserved exactly; mobile active drafts cannot override saved transforms; cached images cannot survive a transform change under the wrong position metadata; editor loading does not publish.');

