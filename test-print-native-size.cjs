const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),PrintTransform=require('./print-transform.js');
assert.equal(fs.readFileSync('print-transform.js','utf8'),fs.readFileSync('assets/print-studio/transform.js','utf8'));
const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{value:'',checked:false,disabled:false,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},setPointerCapture(){},hasPointerCapture(){return false;},querySelector(){return {getAttribute(){return '-200 -100 1400 1100';}};}});return nodes.get(id);}
const context={URLSearchParams,location:{search:''},console,PrintTransform,MaterialPreview:require('./assets/garment-prints/material-preview.js'),document:{body:{addEventListener(){}},querySelector:node,createElement(){return {getContext(){return {};}};}},window:{addEventListener(){}}};vm.createContext(context);
const source=fs.readFileSync('assets/garment-prints/editor.js','utf8').replace(/\(async\(\)=>\{await (?:loadOriginalPaintings|loadPatterns)\(\);[\s\S]*$/,'');vm.runInContext(source,context);
const run=code=>vm.runInContext(code,context),snapshot=()=>JSON.parse(run('JSON.stringify(setting().box)'));
(async()=>{
run("catalog=[{id:'test-tee',name:'Test',slot:'top'}];active='test-tee';front=async()=>{bounds.set(active,{x:300,y:300,width:340,height:400});};images.set(patternURL('rose'),Promise.resolve({naturalWidth:1100,naturalHeight:900}));draw=()=>{};save=()=>{};point=e=>({x:e.clientX,y:e.clientY});");
const native=await run("defaultBox(current(),'rose')");assert.equal(native.width,1100);assert.equal(native.height,900);
run("model.items[active]={pattern:'rose',box:{x:50,y:100,width:1100,height:900}};controls();");assert.equal(node('#print-width').value,1100);assert.equal(node('#print-height').value,900);
run("setPrintDimension('width',1500)");assert.equal(snapshot().width,1500);assert.equal(snapshot().height,900);
run("setPrintDimension('height',230)");assert.equal(snapshot().width,1500);assert.equal(snapshot().height,230);
node('#keep-print-ratio').checked=true;run("setPrintDimension('width',3000)");assert.equal(snapshot().height,460);node('#keep-print-ratio').checked=false;
await node('#original-print-size').handlers.click();assert.equal(snapshot().width,1100);assert.equal(snapshot().height,900);
const stage=node('#print-stage');const down=handle=>stage.handlers.pointerdown({button:0,pointerId:1,clientX:0,clientY:0,target:{closest:()=>({dataset:{handle}})},preventDefault(){}});
const move=(x,y,shift=false)=>stage.handlers.pointermove({pointerId:1,clientX:x,clientY:y,shiftKey:shift,ctrlKey:false,preventDefault(){}});
down('se');move(200,0);assert.equal(snapshot().width,1300);assert.equal(snapshot().height,900,'normal drag must stretch independently');stage.handlers.pointerup({pointerId:1});
down('s');move(0,100);assert.equal(snapshot().width,1300);assert.equal(snapshot().height,1000,'edge drag must change only height');stage.handlers.pointerup({pointerId:1});
down('se');move(130,0,true);assert.ok(Math.abs(snapshot().width-1430)<1e-8);assert.ok(Math.abs(snapshot().height-1100)<1e-8,'Shift preserves ratio without clamping large source');stage.handlers.pointerup({pointerId:1});
const large={x:0,y:0,width:1800,height:1300},limits={minWidth:1,minHeight:1,maxWidth:Infinity,maxHeight:Infinity};assert.deepEqual(PrintTransform.scale(large,1,limits),large);assert.equal(PrintTransform.resize(large,'e',10,0,true,limits).height,1300);
assert.equal((run('frame(setting().box)').match(/data-handle=/g)||[]).length,8);
const html=fs.readFileSync('assets/garment-prints/index.html','utf8');for(const id of ['print-width','print-height','keep-print-ratio','original-print-size'])assert.ok(html.includes('id="'+id+'"'));
console.log('PASS: native 1100×900 placement, independent width/height, 8 real drag handles, Shift ratio, original-size restore, and no forced size caps.');
})().catch(e=>{console.error(e);process.exitCode=1;});
