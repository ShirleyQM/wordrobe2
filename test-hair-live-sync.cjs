const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
async function run(offline){
 const events={},store=new Map(),timers=[],intervals=[];let requests=0,notifications=0;
 let published={positionDefaults:{front:{'01':{x:1,y:2,scale:1}},back:{'01':{x:3,y:4,scale:1}}}};
 const window={ToolData:offline?{}:undefined,addEventListener:(n,f)=>events[n]=f,dispatchEvent(){notifications++;}};
 const ctx={window,document:{hidden:false,addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},CustomEvent:class{constructor(type,data){Object.assign(this,{type},data);}},fetch:async()=>{requests++;const snapshot=JSON.parse(JSON.stringify(published));return{ok:true,json:async()=>snapshot};},console,setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout(){},setInterval:f=>intervals.push(f)};
 vm.runInNewContext(fs.readFileSync('assets/mobile/hair-defaults.js','utf8'),ctx);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));await flush();
 assert.equal(JSON.parse(store.get('wardrobe-mobile-hair-v1')).positionDefaults.back['01'].x,3);
 published.positionDefaults.back['01']={x:73,y:94,scale:.8,sx:.9,sy:1.1};
 events.storage({key:'wardrobe-hair-published-revision-v1'});timers.pop()();await flush();
 assert.deepEqual(JSON.parse(store.get('wardrobe-mobile-hair-v1')).positionDefaults.back['01'],published.positionDefaults.back['01']);
 assert.equal(intervals.length,offline?0:1);assert.equal(requests,2);
 const before=notifications,player=JSON.parse(store.get('wardrobe-mobile-hair-v1'));player.frontFit={...player.frontFit,sx:1,sy:1};store.set('wardrobe-mobile-hair-v1',JSON.stringify(player));
 for(let n=0;n<5;n++){events.focus();await flush();}
 assert.equal(notifications,before,'unchanged server defaults must not invalidate tint caches after fit normalization');
}
(async()=>{await run(false);await run(true);console.log('PASS: saved editor positions refetch published data instead of restoring stale fits; offline releases do not poll.');})();
