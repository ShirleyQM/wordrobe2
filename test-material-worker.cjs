const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const material=require('./assets/garment-prints/material.js');
let reply;const scope={self:{postMessage:r=>reply=r},importScripts:()=>{},GarmentMaterial:material};
vm.createContext(scope);vm.runInContext(fs.readFileSync('assets/garment-prints/material-worker.js','utf8'),scope);
const send=data=>scope.self.onmessage({data});
const source=new Uint8ClampedArray([100,95,90,255,180,175,170,255,225,220,215,255,0,0,0,0]);
const options={source,reference:material.median(source)};
send({type:'prepare',key:'active',options});
for(let i=0;i<30;i++){
 send({type:'render',key:'active',id:i,settings:{color:'#4671a1'}});
 assert.deepEqual(reply.pixels,material.pixels({...options,color:'#4671a1'}));
 send({type:'prepare',key:'other'+i,options});
}
send({type:'render',key:'missing',id:99,settings:{color:'#ffffff'}});assert.match(reply.error,/过期/);
send({type:'render',key:'active',id:100,settings:{color:'#ffffff'}});assert.equal(reply.error,undefined);assert.equal(reply.pixels[15],0);
console.log('PASS: cached worker matches export pixels, retains active garment across cache churn, preserves alpha and recovers after errors.');
