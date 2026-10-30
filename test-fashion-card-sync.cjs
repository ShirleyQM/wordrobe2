const assert=require('assert'),fs=require('fs'),vm=require('vm');
const catalog=require('./assets/fashion-series/catalog.json'),local=require('./assets/materials/garments/collection.json').items;
const storage=new Map(),granted=[];
const context={console,URLSearchParams,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},I18n:{lang:()=> 'en'},PlayerEconomy:{owns:()=>false,grantItems:async ids=>granted.push(...ids),purchaseBundle:async()=>{throw Error('Unpriced cards must not become free purchases');}},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(url.split('?')[0],'utf8'))})};context.window=context;context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/fashion-series/library.js','utf8'),context);vm.runInContext(fs.readFileSync('assets/cards/library.js','utf8'),context);
(async()=>{const data=await context.CardLibrary.load();assert.equal(catalog.cards.length,90);assert.equal(catalog.pieces.length,122);assert.equal(data.cards.filter(c=>!c.legacy).length,90);assert.equal(new Set(data.cards.map(c=>c.id)).size,data.cards.length);
for(const c of catalog.cards){assert(fs.existsSync('.'+c.art.url));for(const g of c.garments)assert(local.some(i=>i.id===g.id));assert.equal(new Set(c.garments.map(g=>g.id)).size,c.garments.length);}
assert.deepEqual(Array.from(context.CardLibrary.forGarment('colour-orbit-geometric-dress'),c=>c.id),['S04-F01']);assert.equal(context.FashionSeries.piece('colour-orbit-geometric-dress').nameZh,'轨道静默 · 立领几何短裙');
await context.CardLibrary.claimLesson('y2k-l2');assert(granted.includes('colour-orbit-geometric-dress'));assert(!granted.some(id=>catalog.pieces.some(p=>p.id===id&&!p.runtimeId)));
await assert.rejects(()=>context.CardLibrary.redeem('S11-F01'));
const fitting=require('./assets/materials/published/fittings.json');for(const id of ['colour-orbit-geometric-dress','colour-echo-asymmetric-dress'])assert(fitting.items.find(i=>i.id===id).revision>=3082,'preserve original fitting or a newer user save');
console.log('PASS: canonical and legacy cards, real local IDs, shared bindings, lesson rewards, unpriced redemption protection, and existing Y2K fitting revisions.');})();
