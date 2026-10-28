const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(storage=new Map(),initial){
 const owned=new Set(['feature:tailor','tee','other']),calls={grants:0,persist:0,failGrant:false,failPersist:false},node={innerHTML:''};
 const state=initial||{equipped:{dress:'dress'},customGarments:[]},catalog=[{id:'tee',name:'酒红上衣',nameEn:'Burgundy Tee',slot:'top',image:'tee.png',capabilities:{recolor:true,print:true}},{id:'other',name:'另一件',nameEn:'Other',slot:'top',image:'other.png',capabilities:{recolor:true,print:true}}];
 const context={state,catalog,tab:'tailor',category:'top',location:{href:'http://localhost/'},URL,console,Uint8ClampedArray,Map,Set,Promise,Math,Date,JSON,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},CustomEvent:class{},
 document:{querySelector:()=>node,createElement:()=>{let color='original';return {getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(4)}),putImageData(i){color=i.data[0];}}),toDataURL:()=>String(color)};}},
 Image:class{set src(v){this.width=20;this.height=20;queueMicrotask(()=>this.onload());}},ImageData:class{constructor(data){this.data=data;}},
 UnderwearWardrobe:{image:i=>i.image},GarmentMaterial:{median:()=>0,pixels:({color})=>new Uint8ClampedArray([parseInt(color.slice(1,3),16),0,0,255])},GarmentSurface:{warp:d=>d,blend:d=>d},MaterialVisibility:{visible:()=>true},
 fetch:async()=>({ok:true,json:async()=>({items:[{id:'rose',name:'Rose',kind:'pattern',url:'rose.png'}]})}),esc:String,figure:()=>'',render(){},toast(){},
 persist(){calls.persist++;if(calls.failPersist)throw Error('storage full');storage.set('state',JSON.stringify(state));},
 PlayerEconomy:{owns:id=>owned.has(id),grantItems:async ids=>{calls.grants++;if(calls.failGrant)throw Error('wallet unavailable');for(const id of ids)owned.add(id);}},
 item:id=>catalog.find(i=>i.id===id)};
 context.window={dispatchEvent(){},I18n:{lang:()=> 'zh'}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/mobile/equipment.js','utf8'),context);context.MobileEquipment=context.window.MobileEquipment;vm.runInContext(fs.readFileSync('assets/mobile/tailor.js','utf8'),context);
 return {...context,api:context.window.MobileTailor,calls,owned,storage,context};
}
(async()=>{
 let h=harness(),t=h.api;t.select(h.catalog[0]);await t.setColor('#792e43');assert.equal(h.state.customGarments.length,0);assert.equal(h.calls.grants,0);assert.equal(t.image(h.catalog[0]),'121');
 assert.equal(t.canUndo(),true);await t.undo();assert.equal(t.dirty(),false);await t.setColor('#792e43');t.saveDraft();await t.setColor('#998877');t.restoreDraft('tee');assert.equal(t.color(),'#792e43');assert.equal(t.drafts()[0].recipe.color,'#792e43');assert.equal(h.state.customGarments.length,0);assert.equal(h.calls.grants,0);assert.ok(h.storage.get('wordrobe-tailor-drafts-v2'));
 const names=t.names();assert.match(names.name,/酒红上衣/);assert.equal(/[\u3400-\u9fff]/.test(names.nameEn),false);t.rename('酒红 · 不删颜色','My Rose');
 const id=t.names().id;await t.setColor('#802e43');assert.equal(t.names().id,id);assert.equal(t.names().nameEn,'My Rose');
 const restored=harness(h.storage);restored.api.select(restored.catalog[0]);assert.equal(restored.api.color(),'#802e43');assert.equal(restored.api.names().id,id);assert.equal(restored.api.names().name,'酒红 · 不删颜色');
 h.calls.failPersist=true;await assert.rejects(t.save(),/storage full/);assert.equal(h.state.customGarments.length,0);assert.equal(t.names().id,id);h.calls.failPersist=false;
 h.calls.failGrant=true;await assert.rejects(t.save(),/wallet unavailable/);assert.equal(h.state.customGarments.length,1);assert.equal(h.state.customGarments[0].id,id);h.calls.failGrant=false;
 const a=t.save(),b=t.save();assert.equal(a,b);await a;assert.equal(h.state.customGarments.length,1);assert.equal(h.state.customGarments[0].name,'酒红 · 不删颜色');assert.equal(h.state.customGarments[0].nameEn,'My Rose');assert.equal(h.state.equipped.top,id);assert.equal(h.state.equipped.dress,undefined);assert.equal(h.catalog[0].image,'tee.png');
 h.context.tab='tailor';t.select(h.catalog.find(i=>i.id===id));assert.equal(t.dirty(),false);await t.setColor('#992e43');t.resetDraft();assert.equal(t.color(),'#802e43');assert.equal(t.dirty(),false);assert.equal(h.state.customGarments[0].recipe.color,'#802e43');
 t.select(h.catalog[0]);const old=t.setColor('#112233');t.select(h.catalog[1]);await old;assert.equal(t.current().id,'other');assert.equal(t.image(h.catalog[1]),undefined);await t.setColor('#223344');assert.equal(t.image(h.catalog[1]),'34');
 h.owned.delete('feature:tailor');await assert.rejects(t.pattern('rose'),/解锁/);await assert.rejects(t.setColor('#333333'),/解锁/);h.owned.add('feature:tailor');h.owned.delete('other');await assert.rejects(t.pattern('rose'),/解锁/);h.owned.add('other');
 await t.pattern('rose');await t.layout({x:.4,y:0,scale:.3});assert.equal(t.recipe().layout.y,0);t.resetDraft();assert.equal(t.dirty(),false);assert.equal(t.recipe().pattern,undefined);
 delete h.catalog[1].nameEn;const fallback=t.names();assert.equal(/[\u3400-\u9fff]/.test(fallback.nameEn),false);assert.match(fallback.nameEn,/Top/);
 const race=harness();race.api.select(race.catalog[0]);const print=race.api.pattern('rose');race.api.select(race.catalog[1]);await print;assert.equal(race.api.recipe().pattern,undefined);
 const real=new Map([['word-atelier-wallet-v1','REAL WALLET'],['wardrobe-mobile-outfits-v1','REAL CLOTHES']]);class Storage{getItem(k){return real.get(k)||null;}setItem(k,v){real.set(k,String(v));}removeItem(k){real.delete(k);}}const localStorage=new Storage(),qa={window:{},Storage,localStorage,location:{hostname:'127.0.0.1'}};vm.runInNewContext(fs.readFileSync('assets/mobile/tailor-qa-bootstrap.js','utf8'),qa);localStorage.setItem('wardrobe-mobile-outfits-v1','QA ONLY');assert.equal(real.get('word-atelier-wallet-v1'),'REAL WALLET');assert.equal(real.get('wardrobe-mobile-outfits-v1'),'REAL CLOTHES');assert.equal(localStorage.getItem('wardrobe-mobile-outfits-v1'),'QA ONLY');assert.match(fs.readFileSync('assets/mobile/features.js','utf8'),/tailor:true/);
 const transparent=harness(),sides=[];transparent.catalog[0].back='transparent-back.png';transparent.catalog[0].materialManifest='material.json';transparent.context.FittedMaterial={async layers(i,side){sides.push(side);if(side==='back')throw Error('Back materials intentionally absent');return {};}};transparent.api.select(transparent.catalog[0]);await transparent.api.setColor('#792e43');assert.deepEqual(sides,['front']);assert.equal(transparent.api.image(transparent.catalog[0]),'121');
 console.log('PASS: Tailor preview-only edits, bilingual names, durable drafts, stable IDs, storage/wallet failure retry, duplicate save, original/variant independence, reset, async selection races, unlock enforcement, layout zero, transparent backs skip absent material layers.');
})().catch(e=>{console.error(e);process.exitCode=1;});
