const assert = require('node:assert/strict');
const {resize, scale, move} = require('./print-transform.js');
const box = {x:400,y:380,width:100,height:200};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
// Ordinary corner dragging keeps the print's ratio and its opposite corner.
let result=resize(box,'se',20,0,false);
assert.deepEqual(result,{x:400,y:380,width:120,height:240});
// Ctrl dragging changes each dimension independently.
assert.deepEqual(resize(box,'se',20,0,true),{x:400,y:380,width:120,height:200});
result=resize(box,'nw',-30,-10,true);
near(result.x+result.width,500);near(result.y+result.height,580);
assert.equal(result.width,130);assert.equal(result.height,210);
result=resize(box,'n',0,-30,true);
assert.equal(result.width,100);assert.equal(result.height,230);
near(result.y+result.height,580);
// Dragging through the anchor never flips the print or gives negative dimensions.
for(const free of [true,false]){
 result=resize(box,'se',-1000,-1000,free);
 assert.ok(result.width>=22&&result.height>=22);
 result=resize(box,'se',10000,10000,free);
 assert.ok(result.width<=650&&result.height<=700);
}
result=scale(box,1.5);
near(result.x+result.width/2,450);near(result.y+result.height/2,480);
near(result.width/result.height,box.width/box.height);
assert.deepEqual(move(box,25,-15),{x:425,y:365,width:100,height:200});
console.log('Print transforms: aspect ratio, Ctrl stretch, anchors, bounds, center scaling and movement passed.');
