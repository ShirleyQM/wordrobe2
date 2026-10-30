'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),{URL}=require('node:url'),{setTimeout,clearTimeout}=require('node:timers');
async function run(source,lookSource){
 const module={exports:{}};vm.runInNewContext(source,{module,globalThis:{}});
 const C=module.exports;assert.equal(C.catalog.length,4);assert.equal(C.normalize('old'), 'silver-studio');assert.equal(C.normalize(undefined),'silver-studio');
 for(const scene of C.catalog)assert.equal(C.normalize(scene.id),scene.id);
 assert.deepEqual(Array.from(C.cover(100,200,100,100)),[0,50,100,100,0,0,100,100]);assert.throws(()=>C.cover(0,200,100,100));
 const stage={dataset:{},style:{setProperty(){}},children:[],prepend(n){this.children.unshift(n)},append(n){this.children.push(n)}};
 function element(tag){return {tagName:tag,hidden:false,textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},focus(){},append(){}};}
 const body={append(){}},document={body,currentScript:{src:'https://example.test/assets/mobile/stage-scenes.js'},querySelector:s=>s==='.mobile-app .stage'?stage:null,createElement:element};
 let checkpoints=0,saves=0;const failures=new Set(['gallery-evening']);class Image{constructor(){this.naturalWidth=941;this.naturalHeight=1672;}set src(v){this._src=v;Promise.resolve().then(()=>failures.has(v.split('/').pop().replace('.png',''))?this.onerror?.():this.onload?.());}get src(){return this._src;}}
 const sandbox={document,state:{equipped:{top:'owned-top'},looks:[],sceneId:'legacy'},persist(){saves++},LookLab:{checkpoint(){checkpoints++}},I18n:{lang:()=> 'zh'},Image,URL,setTimeout,clearTimeout,console};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const S=sandbox.StageScenes;assert.equal(S.current(),'silver-studio');await S.select('midnight-runway');assert.equal(S.current(),'midnight-runway');assert.equal(checkpoints,1);assert.equal(sandbox.state.equipped.top,'owned-top');
 await S.restore(undefined);assert.equal(S.current(),'silver-studio');assert.equal(checkpoints,1);
 const night=S.select('midnight-runway'),rain=S.select('rain-street');await Promise.all([night,rain]);assert.ok(stage.children[0].src.endsWith('rain-street.png'));
 const operations=[],ctx={fillRect(...args){operations.push(['fill',...args])},drawImage(...args){operations.push(['image',...args])}};await S.paint(ctx,180,322,'silver-studio');assert.equal(operations[0][0],'fill');assert.equal(operations[1][0],'image');assert.ok(operations[1][1].src.endsWith('silver-studio.png'));
 operations.length=0;await S.select('gallery-evening');await S.paint(ctx,180,322,'gallery-evening');assert.equal(operations.length,1);assert.equal(operations[0][0],'fill');assert.ok(stage.children.at(-1).textContent.includes('背景暂不可用'));assert.ok(saves>=4);
 if(lookSource){assert.ok(lookSource.includes("sceneId:window.StageScenes?.current()"));assert.ok(lookSource.includes('StageScenes?.restore(value.sceneId)'));assert.ok(lookSource.includes('image=thumbnail(look.sceneId)'));assert.ok(lookSource.includes('StageScenes.paint(ctx,180,322,sceneId)'));assert.ok(lookSource.includes('image.catch(()=>thumbnail(look.sceneId))'));}
 console.log('PASS: four scenes, saved selection, old-look fallback, undo checkpoint, unchanged clothing, racing selections, cover crop, scene thumbnail and failed-image fallback.');
}
module.exports=run;
if(require.main===module){const fs=require('node:fs');run(fs.readFileSync('assets/mobile/stage-scenes.js','utf8'),fs.readFileSync('assets/mobile/look-lab.js','utf8')).catch(e=>{console.error(e);process.exitCode=1});}
