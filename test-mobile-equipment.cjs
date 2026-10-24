const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/mobile/equipment.js','utf8'),ctx);const M=ctx.window.MobileEquipment;
const rows=[{id:'shirt',slot:'top'},{id:'skirt',slot:'bottom'},{id:'dress',slot:'dress'},{id:'coat',slot:'coat'},...[1,2,3,4].map(n=>({id:'a'+n,slot:'jewelry'}))],find=id=>rows.find(i=>i.id===id);
let worn={top:'shirt',bottom:'skirt',coat:'coat'};
worn=M.toggle(worn,find('dress'),find).equipped;assert.equal(worn.dress,'dress');assert(!worn.top&&!worn.bottom);assert.equal(worn.coat,'coat');
worn=M.toggle(worn,find('shirt'),find).equipped;assert(!worn.dress);assert.equal(worn.top,'shirt');
for(let n=1;n<=3;n++)worn=M.toggle(worn,find('a'+n),find).equipped;
const refused=M.toggle(worn,find('a4'),find);assert(refused.limited);assert.equal(Object.values(refused.equipped).filter(id=>id.startsWith('a')).length,3);
worn=M.toggle(worn,find('a2'),find).equipped;assert(!Object.values(worn).includes('a2'));assert(!M.toggle(worn,find('a4'),find).limited);
const legacy=M.normalize({top:'shirt',dress:'dress','jewelry:cap':'a1','jewelry:old':'a2','jewelry:x':'a3','jewelry:y':'a4'},find);assert(!legacy.top);assert.equal(Object.keys(legacy).length,4);assert.equal(legacy['jewelry:a1'],'a1');
const state={accessoryFits:{a1:{x:5,y:-3,scale:1.25}}};assert(M.style(find('a1'),state).includes('translate(5%,-3%) scale(1.25)'));assert.equal(M.style(find('shirt'),state),'');assert.equal(M.fit(find('a2'),state).scale,1);
console.log('PASS: dress/separates exclusive, 3 accessories, legacy migration, independent saved fits, clothing unchanged.');
// A wallet event can render before the async catalog is ready: never erase saved equipment.
const app=fs.readFileSync('assets/mobile/app.js','utf8');const previous={top:'shirt',bra:'existing-underwear'};
const boot={state:{equipped:{...previous}},item:()=>undefined,MobileEquipment:M,HairStudio:{layer:()=>'',backDetailLayer:()=>'',faceLayer:()=>''},UnderwearWardrobe:{body:()=>'',known:()=>false},GarmentBodyOcclusion:{style:()=>''},clothingSlots:()=>[],esc:s=>s,window:{}};
vm.createContext(boot);vm.runInContext(app.slice(app.indexOf('function figure()'),app.indexOf('function render()')),boot);boot.figure();assert.deepEqual(boot.state.equipped,previous);console.log('PASS: startup rendering before catalog load preserves saved outfit.');
