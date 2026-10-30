'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
async function run(src){
 const kitModule={exports:{}};vm.runInNewContext(src.kit,{module:kitModule});const kit=kitModule.exports;assert.equal(kit.ids.length,6);assert.equal(kit.outfitIds.length,4);
 const economyModule={exports:{}};vm.runInNewContext(src.economy,{module:economyModule,require:p=>{assert.equal(p,'./starter-kit.js');return kit}});const E=economyModule.exports;
 const slots=['top','bottom','shoes','jewelry','top','bottom'],rows=kit.ids.map((id,i)=>({id,slot:slots[i],price:80,capabilities:{recolor:i===4}})).concat([{id:'basic-bra',slot:'bra',price:40},{id:'basic-briefs',slot:'briefs',price:40},{id:'random-coat',slot:'coat',price:40}]);
 let w=E.starter(E.fresh({balance:100}),rows);assert.equal(w.balance,100);assert.equal(w.owned.length,8);assert.ok(!w.owned.includes('random-coat'));assert.equal(Object.values(w.starterGifts).flat().filter(id=>rows.find(r=>r.id===id)?.capabilities?.recolor).length,1);
 assert.equal(E.starter(w,rows).owned.length,8);const old=E.starter(E.fresh({owned:['old-piece'],balance:75,starterGifts:{coat:['old-piece']}}),rows);assert.ok(old.owned.includes('old-piece'));assert.equal(old.balance,75);
 const rewardsModule={exports:{}};vm.runInNewContext(src.rewards,{module:rewardsModule});const rewards=rewardsModule.exports;w=E.fresh({balance:100});let fail=false;
 const api={grant:async(id,n)=>{w=E.credit(w,id,n)},grantItems:async ids=>{if(fail){fail=false;throw Error('interrupted')}w.owned=[...new Set([...w.owned,...ids])]}};
 await rewards.settleAwards({best:[3]},api);assert.equal(w.balance,100);await rewards.settleAwards({best:[4]},api);assert.equal(w.balance,150);await rewards.settleAwards({best:[6]},api);assert.equal(w.balance,150);
 fail=true;await assert.rejects(rewards.settleAwards({best:[6,4]},api));assert.equal(w.balance,200);await rewards.settleAwards({best:[6,4]},api);assert.equal(w.balance,200);assert.ok(w.owned.includes('fashion-card:S04-F01'));
 await rewards.settleAwards({best:[6,6,6,6,6,6]},api);assert.equal(w.balance,400);assert.equal(w.owned.length,3);await rewards.settleAwards({best:[6,6,6,6,6,6]},api);assert.equal(w.balance,400);
 const badgeModule={exports:{}};vm.runInNewContext(src.badges,{module:badgeModule});assert.ok(badgeModule.exports.dye({capabilities:{recolor:true}}).includes('可染色'));for(const row of [{},{capabilities:{}},{capabilities:{recolor:false}},{capabilities:{recolor:'true'}}])assert.equal(badgeModule.exports.dye(row),'');
 const cardData=JSON.parse(src.cards);assert.equal(cardData.cards.length,12);for(const id of ['S04-F01','S04-F02','S04-F03']){const c=cardData.cards.find(c=>c.id===id);assert.equal(c.art.layout,'single');assert.ok(c.lessonId.startsWith('y2k-l'));}
 assert.ok(src.mobile.includes('WordrobeStarter.outfitIds||WordrobeStarter.ids'));assert.ok(src.app.includes('await window.Y2KRewards?.settle(state)'));assert.ok(!src.app.includes("KEY='fashion-atlas-y2k-complete-v1'"));
 for(const key of ['app','entry','preset','mobile','flow','library'])new vm.Script(src[key]);
 console.log('PASS: curated starter/underwear only, previous ownership preserved, no duplicate credits, interrupted reward recovery, three shared cards, truthful dye badges and script syntax.');
}
module.exports=run;
if(require.main===module){const fs=require('node:fs'),r=p=>fs.readFileSync(p,'utf8');run({kit:r('assets/starter-kit.js'),economy:r('assets/player-economy.js'),rewards:r('assets/learning/y2k/runtime-rewards.js'),badges:r('assets/mobile/capability-badges.js'),cards:r('assets/cards/catalog.json'),mobile:r('assets/mobile/app.js'),app:r('assets/learning/y2k/app.js'),entry:r('assets/learning/y2k-entry.js'),preset:r('assets/mobile/starter-refresh.js'),flow:r('assets/mobile/player-flow.js'),library:r('assets/cards/library.js')}).catch(e=>{console.error(e);process.exitCode=1});}
