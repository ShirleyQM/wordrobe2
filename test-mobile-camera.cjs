const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const writes=[],frames=[],pending=new Map();let painted={offsetWidth:280,offsetHeight:500};
const stage={clientWidth:480,clientHeight:520,style:{setProperty:(k,v)=>writes.push([k,String(v)])}};
const noop=()=>{},host={addEventListener:noop,innerHTML:''};
const nodes={'.stage':stage,'#view-controls':host,'#hair-colors':host};
const context={window:{addEventListener:noop},document:{querySelector:s=>s==='.campus-figure'?painted:nodes[s]},localStorage:{getItem:()=>null},tab:'hair',category:'top',mobileView:'face',lastContext:'hair:face',panX:0,panY:0,console,Map,JSON,Math,
 I18n:{lang:()=> 'zh'},HairStudio:{consumer:{get:()=>({color:'#123456',dye:{}})}},MobileTailor:{current:()=>context.selected,focusBounds:i=>new Promise(resolve=>pending.set(i.id,resolve))},applyPan:noop,render:noop,preferredRegion:()=>context.tab==='hair'?'face':'top',
 requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame:noop};
context.$=s=>context.document.querySelector(s);vm.createContext(context);
const controls=fs.readFileSync('assets/mobile/controls.js','utf8');vm.runInContext(controls.slice(controls.indexOf('function focusRegion('),controls.indexOf('function renderHair(')),context);
vm.runInContext(fs.readFileSync('assets/mobile/edit-session.js','utf8'),context);context.window.MobileEditUI=context.window.MobileEditUI;
const ui=context.window.MobileEditUI;
(async()=>{
 context.focusRegion('face');const settled=writes.slice();assert(settled.some(([key])=>key==='--figure-zoom'));assert.equal(writes.filter(([key])=>key==='--figure-zoom').length,1,'One camera owner, no legacy preset before focus');
 const original=JSON.stringify(settled);for(let n=0;n<30;n++){painted={offsetWidth:280,offsetHeight:500};context.focusRegion('face');ui.focus();}assert.equal(JSON.stringify(writes),original,'Palette/hairstyle rerenders with the same geometry never touch zoom or shift');
 stage.clientHeight=350;painted.offsetHeight=330;context.focusRegion('face');assert.equal(writes.filter(([key])=>key==='--figure-zoom').length,2,'Drawer resize causes one refit');
 context.mobileView='full';context.focusRegion('face');assert.deepEqual(writes.slice(-2),[['--figure-zoom','1'],['--figure-shift','0%']]);const fullCount=writes.length;ui.focus();assert.equal(writes.length,fullCount,'Full body stays full');
 context.tab='tailor';context.selected={id:'a',image:'a.png'};context.focusRegion('top',true);context.selected={id:'b',image:'b.png'};context.focusRegion('top',true);const count=writes.length;
 pending.get('a')({x:.2,y:.2,w:.6,h:.2});await Promise.resolve();assert.equal(writes.length,count,'Old garment bounds cannot move the current camera');
 painted={offsetWidth:200,offsetHeight:330};pending.get('b')({x:.25,y:.3,w:.5,h:.25});await Promise.resolve();assert.equal(writes.length,count+2,'Current request fits the live rebuilt figure');
 const after=writes.length;context.focusRegion('top');assert.equal(writes.length,after,'Tailor rerenders preserve current camera');
 context.selected={id:'c',image:'c.png'};context.focusRegion('top',true);context.tab='hair';context.focusRegion('face',true);const hairCount=writes.length;pending.get('c')({x:0,y:0,w:1,h:1});await Promise.resolve();assert.equal(writes.length,hairCount,'Tailor-to-hair switch invalidates old async bounds immediately');
 context.tab='tailor';context.selected={id:'d',image:'d.png'};context.focusRegion('top',true);context.mobileView='full';context.focusRegion('top');const keepFull=writes.length;pending.get('d')({x:.2,y:.3,w:.4,h:.3});await Promise.resolve();assert.equal(writes.length,keepFull,'Pending focus cannot override explicit full-body choice');
 console.log('PASS: one camera owner, 30 stable recolor/hairstyle rerenders, drawer refit, full-body choice, async garment race, live figure replacement and cross-tab invalidation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
