const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('./assets/atelier-preppy-v1/mesh.js');
const mesh=M.grid([250,280,440,430],4,5);assert.ok(M.valid(mesh));
const moved=M.move(mesh,16,-15,6,true);assert.ok(moved);assert.equal(moved.points[16].x,mesh.points[16].x-15);assert.equal(moved.points[18].x,mesh.points[18].x+15);assert.equal(mesh.points[16].x,360,'history snapshot must not mutate');
const p={x:385,y:590},d=M.map(moved,p),restored=M.map(moved,d,true);assert.ok(Math.hypot(restored.x-p.x,restored.y-p.y)<1e-7,'source/destination coordinates must be invertible');
assert.equal(M.move(mesh,16,1000,0),null,'folded-over mesh triangles must be rejected');
const matrix=M.matrix([{x:0,y:0},{x:1,y:0},{x:0,y:1}],[{x:4,y:5},{x:6,y:5},{x:4,y:8}]);assert.deepEqual(matrix,[2,0,0,3,4,5]);
const dir='assets/atelier-preppy-v1',data=JSON.parse(fs.readFileSync(path.join(dir,'collection.json'),'utf8'));
assert.deepEqual(data.canvas,[939,1676]);
for(const item of data.items){for(const file of ['front.png','back.png','lineart-front.png','lineart-back.png','item.json','qa.json'])assert.ok(fs.existsSync(path.join(dir,'items',item.id,file)));assert.ok(item.contours.length>0);const qa=JSON.parse(fs.readFileSync(path.join(dir,'items',item.id,'qa.json'),'utf8'));assert.ok(qa.technical_pass,item.id);}
if(process.argv.includes('--complete')){assert.equal(data.items.length,4);for(const i of data.items){const qa=JSON.parse(fs.readFileSync(path.join(dir,'items',i.id,'qa.json'),'utf8'));assert.ok(qa.visual_reviewed&&qa.wearable_validated,i.id);}}
console.log('PASS: symmetric raster mesh, invertible texture coordinates, no triangle inversion, immutable undo data, registered asset manifests.');
