const assert=require('assert/strict'),fs=require('fs'),O=require('./assets/atelier-preppy-v1/openings.js');
const catalog=JSON.parse(fs.readFileSync('assets/materials/garments/collection.json','utf8'));
assert.equal(catalog.items.length,new Set(catalog.items.map(i=>i.id)).size);
const imported=JSON.parse(fs.readFileSync('assets/materials/sources/art-results/merge.json','utf8'));assert.equal(imported.openingItems.length,28);for(const id of imported.openingItems){const item=catalog.items.find(i=>i.id===id);assert.ok(item&&(item.openings||item.wearable_validated&&item.front.includes('/regenerated/')),id);}
for(const item of catalog.items.filter(i=>i.openings)){assert.ok(O.valid(item.openings),item.id);for(const k of ['runtimeFront','runtimeBack'])assert.ok(fs.existsSync('.'+item[k]));}
const under=catalog.items.filter(i=>i.assetKind==='torso-replacement');assert.equal(under.length,3);assert.ok(under.every(i=>i.containsHair===false&&i.slot==='bra'));
for(let alpha=0;alpha<=255;alpha++)for(const coverage of [0,1,64,127,128,254,255]){const source=new Uint8ClampedArray([40,90,150,alpha]),mask=new Uint8ClampedArray([0,0,0,coverage]),parts=O.split(source,mask);assert.equal(parts.front[3]+parts.back[3],alpha);assert.equal(parts.front[0],source[0]);assert.equal(parts.back[2],source[2]);}
assert.ok(O.valid([]));assert.ok(!O.valid([{rise:301,points:[[0,0],[1,1],[2,2]]}]));assert.ok(!O.valid([{rise:5,points:[[0,0],[NaN,1],[2,2]]}]));
console.log('PASS: one catalog, all original opening items or their approved regenerated versions, 3 hairless torso replacements, exact alpha partition and opening validation.');
