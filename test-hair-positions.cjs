const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('assets/hair-studio.js','utf8').replace('return {mount,layer,faceLayer,','return {state:saved,selectPart,commitPositions,mount,layer,faceLayer,');
let stored=JSON.stringify({front:'03',back:'02',frontFit:{x:12,y:17,scale:1.31},backFit:{x:-3,y:4,scale:1.1},color:'#79513b'});
function load(){const ctx={requestAnimationFrame(){},window:{addEventListener(){}},fetch:()=>Promise.resolve({}),localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v}};vm.runInNewContext(code,ctx);return ctx.window.HairStudio;}
let h=load();assert.equal(h.state.frontFit.x,12);assert.equal(h.state.backFit.y,4);
h.state.frontFit={x:23,y:19,scale:1.4};h.commitPositions();h.selectPart('front','04');assert.equal(h.state.frontFit.x,0);h.selectPart('front','03');assert.equal(h.state.frontFit.x,23);assert.equal(h.state.backFit.x,-3);
h.state.frontFit.x=77;h.selectPart('front','03');assert.equal(h.state.frontFit.x,77);h.selectPart('front','04');h.selectPart('front','03');assert.equal(h.state.frontFit.x,23);
h=load();assert.equal(h.state.frontFit.x,23);assert.equal(h.state.frontFit.scale,1.4);assert.equal(h.state.color,'#79513b');assert.equal(h.state.backFit.scale,1.1);
console.log('PASS: legacy positions preserved; front/back defaults save independently, restore after switching/reload, and draft edits do not replace saved defaults.');

h.state.frontFit={x:400,y:-220,scale:1.4,sx:.8,sy:1.3};h.commitPositions();h=load();assert.equal(h.state.frontFit.x,400);assert.equal(h.state.frontFit.y,-220);assert.equal(h.state.frontFit.sx,.8);assert.equal(h.state.frontFit.sy,1.3);console.log('PASS: expanded movement and independent width/height persist.');
h.selectPart('front','none');h.commitPositions();h=load();assert.equal(h.state.front,'none');assert.equal(h.layer('front'),'');assert.equal(h.faceLayer(),'');h.selectPart('back','none');h.commitPositions();h=load();assert.equal(h.state.back,'none');assert.equal(h.layer('back'),'');h.selectPart('front','03');assert.equal(h.state.frontFit.x,400);assert.equal(h.state.back,'none');console.log('PASS: front/back can independently be empty, persist after reload and retain saved positions.');
