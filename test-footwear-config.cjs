const assert=require('assert/strict'),fs=require('fs'),M=require('./assets/atelier-preppy-v1/mesh.js'),F=require('./assets/footwear-occlusion.js'),P=require('./footwear-policy.cjs')(process.cwd());
const rects=[[330,1605,139,71],[470,1605,140,71]],mesh=M.grid([250,1450,450,226],4,4),moved=M.transform(mesh,10,-20);
assert.deepEqual(F.project(rects,p=>M.map(moved,p)).map(r=>r.map(n=>Math.round(n*1e6)/1e6)),[[340,1585,139,71],[480,1585,140,71]]);
const state={config:{open:{mode:'open-toe',sourceRects:[]},square:{mode:'closed-toe',sourceRects:rects},boot:{mode:'boot',sourceRects:[]}},draft:{}};
const open={id:'open',slot:'shoes',hideBodyFrom:1500,bodyOcclusionRects:rects};P.apply(open,null,state);assert.equal(open.hideBodyFrom,0);assert.deepEqual(open.bodyOcclusionRects,[]);
const square={id:'square',slot:'shoes',hideBodyFrom:0};P.apply(square,null,state);assert.deepEqual(square.bodyOcclusionRects,rects);
const boot={id:'boot',slot:'shoes',hideBodyFrom:1300};P.apply(boot,null,state);assert.equal(boot.hideBodyFrom,1300);
state.config.full={mode:'full-foot',sourceRects:rects,toeReveal:{extension:10,startY:1600}};
const full={id:'full',slot:'shoes',hideBodyFrom:1500,bodyOcclusionRects:rects};P.apply(full,null,state);
assert.equal(full.hideBodyFrom,0);assert.deepEqual(full.bodyOcclusionRects,[]);
assert.equal(require('./assets/garment-body-occlusion.js').toeLayer(full,'body.png'),'','full foot must not crop or stretch a toe overlay');
const config=JSON.parse(fs.readFileSync('assets/materials/footwear-config.json','utf8'));assert.ok(Object.values(config.items).every(i=>i.legReplacement.enabled===false));
assert.deepEqual(require('./assets/garment-body-occlusion.js').geometry([]),{cut:1676,rects:[]});
console.log('PASS: toe masks track transforms; open toes restore feet; boot legacy cuts preserved; no unfinished replacement enabled.');

