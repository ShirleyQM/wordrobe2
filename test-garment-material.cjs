const assert=require('node:assert/strict'),M=require('./assets/garment-prints/material.js');
const source=Uint8Array.from([190,190,190,255,120,120,120,127,0,0,0,0]),mask=Uint8Array.from([255,255,255,255,255,255,255,127,255,255,255,0]),shadow=Uint8Array.from([0,0,0,0,0,0,0,100,0,0,0,0]);
const base={source,mask,shadow,color:'#4671a1'},a=M.pixels(base),b=M.pixels({...base,preset:Uint8Array.from([150,150,150,255,100,100,100,255,128,128,128,255]),strength:2,presetStrength:.25});
assert.deepEqual([a[3],a[7],a[11]],[255,127,0]);assert.deepEqual([b[3],b[7],b[11]],[255,127,0],'texture never changes silhouette');assert.ok(a[0]<a[1]&&a[1]<a[2],'chosen blue tint retained');assert.ok(a[4]<a[0],'painted shadow still darkens cloth');assert.ok(b[0]>a[0]&&b[4]<a[4],'fabric only modulates RGB');
assert.deepEqual(Array.from(M.pixels({source,color:null,strength:0})),Array.from(source),'texture reset keeps original pixels');assert.throws(()=>M.rgb('red'),/颜色无效/);console.log('PASS: material recolor keeps painted shadow, exact alpha and texture-only RGB changes; reset preserves source.');
for(const color of ['#ffffff','#000000','#4671a1']){
 const d=M.pixels({...base,color});assert.ok(d[0]>d[4],color+' retains dark fold against lit fabric');
 const fallback=M.pixels({source,color,reference:190});assert.ok(fallback[0]>fallback[4],color+' retains folds without separate layers');
 assert.deepEqual([d[3],d[7],d[11]],[255,127,0]);
}
console.log('PASS: white, black and blue preserve fold depth in layered and existing basic garments.');
const trimSource=Uint8Array.from([60,65,70,255,150,150,150,160]),trimMask=Uint8Array.from([0,0,0,0,255,255,255,255]);
const trim=M.pixels({source:trimSource,mask:trimMask,color:'#8c3020',texture:Uint8Array.from([255,255,255,255,150,150,150,255]),preset:Uint8Array.from([255,255,255,255,128,128,128,255])});
assert.deepEqual(Array.from(trim.slice(0,4)),Array.from(trimSource.slice(0,4)),'fixed sole/laces remain exact even when texture is selected');
assert.ok(trim[4]>trim[5]&&trim[5]>trim[6]);assert.equal(trim[7],160,'sheer sock alpha survives recolor');
