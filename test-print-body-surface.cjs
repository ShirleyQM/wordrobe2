const assert=require('node:assert/strict'),S=require('./assets/garment-prints/surface-print.js');
const W=939,H=1676,source=new Uint8ClampedArray(W*H*4);
for(let y=360;y<540;y++)for(let x=340;x<600;x++){const k=(y*W+x)*4;source.set([240,45,85,255],k);}
const original=source.slice(),start=performance.now(),out=S.warp(source,W,H),firstMs=performance.now()-start;
assert.deepEqual(source,original,'Source pixels are never baked or overwritten');
assert.deepEqual(S.warp(source,W,H,{strength:0}),source,'Zero strength is an exact bypass');
let changed=0,softEdges=0;
for(let k=0;k<out.length;k+=4){if(out[k+3]!==source[k+3])changed++;if(out[k+3]>0){assert.equal(out[k],240);assert.equal(out[k+1],45);assert.equal(out[k+2],85);if(out[k+3]<255)softEdges++;}}
assert(changed>500,'The image geometry must actually change');assert(softEdges>100,'Keep antialiasing at displaced edges');
const boundary=S.field(280,430);assert.deepEqual(boundary,{dx:0,dy:0});assert.deepEqual(S.field(470,1000),{dx:0,dy:0});
assert(S.field(411,430).dy<-10,'Chest crown bends a horizontal line');
assert(Math.abs(S.field(411,430).dy-S.field(470,430).dy)>1,'A line must curve across the torso');
for(let y=301;y<865;y+=9)for(let x=281;x<660;x+=9){const p=S.field(x,y),a=S.field(x+.1,y),b=S.field(x,y+.1),det=(1+(a.dx-p.dx)/.1)*(1+(b.dy-p.dy)/.1)-(b.dx-p.dx)/.1*(a.dy-p.dy)/.1;assert(det>.5,'No flipped or collapsed surface cells');}
const warm=performance.now();S.warp(source,W,H);const cachedMs=performance.now()-warm;
const fs=require('node:fs'),editor=fs.readFileSync('assets/garment-prints/editor.js','utf8');
assert(editor.indexOf('GarmentSurface.warp')<editor.indexOf("ctx.globalCompositeOperation='destination-in'",editor.indexOf('async function rawOverlay')),'Warp before clipping to the actual garment');
assert(editor.includes('ctx.drawImage(await overlay(item,settings),0,0)'),'Saved clothes use the same projection as previews');
const mobile=fs.readFileSync('assets/mobile/tailor.js','utf8');
assert(mobile.indexOf('GarmentSurface.warp')<mobile.indexOf("pc.globalCompositeOperation='destination-in'"),'Mobile uses the shared curved projection before alpha clipping');
assert(mobile.includes('GarmentSurface.blend'),'Mobile print retains material shading and texture');
console.log(`PASS: real curved geometry, stable topology, premultiplied-alpha edges, immutable source; cached warp ${cachedMs.toFixed(1)} ms (first ${firstMs.toFixed(1)} ms).`);
