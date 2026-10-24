const assert=require('assert/strict'),M=require('./assets/atelier-preppy-v1/mesh.js');
const source=M.grid([200,300,400,500],4,5),before=JSON.stringify(source);
const moved=M.transform(source,21,-17);
assert.deepEqual(M.center(moved),{x:421,y:533});
const rotated=M.transform(moved,0,0,Math.PI/3),restored=M.transform(rotated,0,0,-Math.PI/3);
for(let i=0;i<moved.points.length;i++)assert.ok(Math.hypot(restored.points[i].x-moved.points[i].x,restored.points[i].y-moved.points[i].y)<1e-9);
assert.ok(M.valid(rotated));
const enlarged=M.scale(rotated,1.2),shrunk=M.scale(enlarged,1/1.2),pivot=M.center(rotated);
assert.ok(Math.hypot(M.center(enlarged).x-pivot.x,M.center(enlarged).y-pivot.y)<1e-9);
for(let i=0;i<rotated.points.length;i++){assert.ok(Math.hypot(shrunk.points[i].x-rotated.points[i].x,shrunk.points[i].y-rotated.points[i].y)<1e-9);assert.equal(enlarged.points[i].sx,source.points[i].sx);assert.equal(enlarged.points[i].sy,source.points[i].sy);}
assert.equal(M.scale(source,0),null);assert.equal(M.scale(source,-1),null);assert.equal(M.scale(source,NaN),null);assert.equal(M.scale(source,100),null);
const anchor={x:source.points[0].x,y:source.points[0].y},cornerScaled=M.scale(source,1.1,anchor);
assert.deepEqual(cornerScaled.points[0],source.points[0],'opposite corner remains fixed during corner scaling');
assert.equal(cornerScaled.points.at(-1).x,anchor.x+(source.points.at(-1).x-anchor.x)*1.1);
const multi=M.moveSelected(source,[6,7],8,12,false);
for(const i of [6,7]){assert.equal(multi.points[i].x,source.points[i].x+8);assert.equal(multi.points[i].y,source.points[i].y+12);}
assert.deepEqual(multi.points[8],source.points[8]);
const symmetric=M.moveSelected(source,[6],8,12,true);
assert.equal(symmetric.points[8].x,source.points[8].x-8);
assert.equal(symmetric.points[8].y,source.points[8].y+12);
assert.equal(M.moveSelected(source,[6],2000,0),null);
assert.equal(JSON.stringify(source),before,'editing must preserve the undo snapshot and immutable source coordinates');
for(const p of rotated.points){const q=M.map(rotated,M.map(rotated,{x:p.sx,y:p.sy}),true);assert.ok(Math.hypot(q.x-p.sx,q.y-p.sy)<1e-7);}
console.log('PASS: move, rotation, selected grid points, symmetry, inverse mapping, invalid deformation and undo snapshots.');
const free=M.scaleXY(source,1.3,.8,anchor);
assert.ok(M.valid(free));assert.deepEqual(free.points[0],source.points[0],'free scaling keeps the opposite corner fixed');
for(let i=0;i<source.points.length;i++){assert.equal(free.points[i].x,anchor.x+(source.points[i].x-anchor.x)*1.3);assert.equal(free.points[i].y,anchor.y+(source.points[i].y-anchor.y)*.8);assert.equal(free.points[i].sx,source.points[i].sx);assert.equal(free.points[i].sy,source.points[i].sy);}
const freeRestored=M.scaleXY(free,1/1.3,1/.8,anchor);for(let i=0;i<source.points.length;i++)assert.ok(Math.hypot(freeRestored.points[i].x-source.points[i].x,freeRestored.points[i].y-source.points[i].y)<1e-8);
assert.equal(JSON.stringify(source),before,'free scaling leaves the source and undo snapshot untouched');
for(const [fx,fy]of [[0,1],[1,-1],[NaN,1],[1,Infinity],[100,100]])assert.equal(M.scaleXY(source,fx,fy),null,'reject flipped, collapsed or invalid scales');
console.log('PASS: independent width/height scaling, fixed pivot, inverse scaling, source preservation and invalid-scale rejection.');
