'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
async function run(src){
 const original=JSON.parse(src.cards),catalog=JSON.parse(src.series),originalCopy=JSON.stringify(original);
 const values=new Map([['wordrobe-fashion-cards-v1',JSON.stringify({'C01-A':{at:'2026-01-01'}})],['wardrobe-mobile-outfits-v1',JSON.stringify({equipped:{top:'player-original'}})],['wordrobe-y2k-course-v1',JSON.stringify({best:[6,4,0,0,0,0]})]]);
 const savedOutfit=values.get('wardrobe-mobile-outfits-v1'),savedProgress=values.get('wordrobe-y2k-course-v1');
 let purchases=0,grants=0;
 const win={I18n:{lang:()=> 'zh'},PlayerEconomy:{owns:id=>id==='fashion-card:S04-F01',grantItems:async ids=>{grants++;assert.equal(ids.length,0);},purchaseBundle:async()=>{purchases++;}},addEventListener(){},removeEventListener(){},fetch:async()=>({ok:true,json:async()=>catalog})};
 const context={window:win,globalThis:win,module:{exports:{}},console,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},fetch:async()=>({ok:true,json:async()=>original})};
 vm.runInNewContext(src.registry,context);const F=win.FashionSeries;F.setData(catalog);
 assert.equal(catalog.series.length,30);assert.equal(catalog.cards.length,90);assert.equal(catalog.pieces.length,122);
 assert.equal(new Set(catalog.cards.map(c=>c.id)).size,90);assert.equal(new Set(catalog.pieces.map(p=>p.id)).size,122);
 assert.equal(catalog.series.filter(s=>s.lessonReady).length,1);assert.equal(catalog.series.filter(s=>s.outfitArtReady).length,10);
 for(const s of catalog.series){assert.equal(s.cardIds.length,3);assert.ok(s.cardIds.every(id=>F.card(id)?.seriesId===s.id));}
 for(const c of catalog.cards){assert.ok(c.id.startsWith(c.seriesId+'-F'));assert.ok(c.titleZh);assert.ok(c.pieceIds.every(id=>F.piece(id)?.cardIds.includes(c.id)));}
 assert.equal(F.orderedSeries()[0].id,'S04');assert.ok(F.orderedSeries().slice(0,10).every(s=>s.outfitArtReady));assert.ok(F.orderedSeries().slice(10).every(s=>!s.outfitArtReady));
 assert.deepEqual([1,2,3,4,5,6].map(n=>F.forLesson('y2k-l'+n).id),['S04-F01','S04-F01','S04-F02','S04-F02','S04-F03','S04-F03']);
 assert.equal(F.forLesson('journey-01'),null);
 assert.ok(F.forGarment('ivory-wide-trousers').some(c=>c.id==='S03-F02'));assert.ok(F.forGarment('ivory-wide-trousers').some(c=>c.id==='S28-F02'));
 assert.equal(F.forGarment('runtime-existing',{sourceCard:'S07-F01'})[0].id,'S07-F01');assert.equal(F.forGarment('unknown',{sourceCard:'untrusted-label'}).length,0);
 assert.equal(F.piece('frequency-lowrise-flares').nameZh,'低腰双片牛仔喇叭裤');
 assert.equal(F.card('S26-F03').titleZh,'陶土风帆');
 const allowed=new Set(['tennis-white-toe','city-navy-canvas-toe','city-black-sneaker-toe']);
 for(const c of catalog.cards.filter(c=>c.seriesId==='S03')){const shoes=F.piecesForCard(c.id).filter(p=>p.slot==='shoes');assert.equal(shoes.length,1);assert.ok(allowed.has(shoes[0].id));}
 vm.runInNewContext(src.names,context);assert.equal(win.GarmentNames.display({id:'frequency-lowrise-flares',name:'旧名称'}),'低腰双片牛仔喇叭裤');assert.equal(win.GarmentNames.display({id:'frequency-lowrise-flares',customName:true,name:'玩家自己的名字',nameEn:'My own name'}),'玩家自己的名字');
 vm.runInNewContext(src.library,context);const merged=await win.CardLibrary.load();
 assert.equal(merged.cards.filter(c=>!c.legacy).length,90);assert.equal(merged.cards.filter(c=>c.legacy).length,9);
 for(const c of original.cards)assert.ok(merged.cards.some(row=>row.id===c.id));
 assert.equal(win.CardLibrary.owned(merged.cards.find(c=>c.id==='C01-A')),true);assert.equal(win.CardLibrary.owned(merged.cards.find(c=>c.id==='S04-F01')),true);
 assert.equal(grants,0);await assert.rejects(win.CardLibrary.redeem('S01-F01'));assert.equal(purchases,0);
 assert.equal(values.get('wardrobe-mobile-outfits-v1'),savedOutfit);assert.equal(values.get('wordrobe-y2k-course-v1'),savedProgress);assert.equal(JSON.stringify(original),originalCopy);
 console.log('PASS: stable 30-series/90-card/122-piece links, finished-first order, sneaker-only Blokette, truthful unreleased clothes, existing card ownership, outfit/progress and custom names preserved.');
}
module.exports=run;
if(require.main===module){const fs=require('node:fs'),r=p=>fs.readFileSync(p,'utf8');run({registry:r('assets/fashion-series/library.js'),series:r('assets/fashion-series/catalog.json'),cards:r('assets/cards/catalog.json'),library:r('assets/cards/library.js'),names:r('assets/garment-names.js')}).catch(e=>{console.error(e);process.exitCode=1;});}
