const assert=require('assert/strict'),fs=require('fs'),R=require('./assets/economy-rules.js'),E=require('./assets/player-economy.js');
assert.equal(R.lessonReward,50);const items=JSON.parse(fs.readFileSync('assets/materials/garments/collection.json')).items;
for(const i of items){assert(R.price(i)>=40&&R.price(i)<=120);assert.equal(R.price(i),R.price(i));}
assert(R.price({id:'tee',slot:'top',name:'基础圆领T恤'})<=50);assert.equal(R.price({id:'gown',slot:'dress',name:'蕾丝珠绣鱼尾礼服'}),120);
const rows=['top','bottom','dress','shoes','bra','briefs'].flatMap(slot=>Array.from({length:4},(_,i)=>({id:slot+i,slot,price:120-i*20})));
let w=E.fresh({balance:33,owned:['old']});w=E.starter(w,rows);assert.equal(w.balance,33);assert(w.owned.includes('old'));for(const slot of ['top','bottom','dress','shoes','bra','briefs'])assert.deepEqual(w.starterGifts[slot],[slot+'3',slot+'2']);
assert.deepEqual(E.starter(w,[...rows,{id:'new-cheap-top',slot:'top',price:40}]),w);w=E.credit(w,'level-a',50);assert.equal(w.balance,83);assert.equal(E.credit(w,'level-a',50).balance,83);assert.equal(w.starterGifts.top.length,2);
let partial=E.starter(E.fresh(),[{id:'one',slot:'top',price:40}]);partial=E.starter(partial,[{id:'one',slot:'top',price:40},{id:'two',slot:'top',price:60},{id:'three',slot:'top',price:80}]);assert.equal(partial.starterGifts.top.length,2);
console.log('PASS: 40–120 design pricing, stable prices, complex gown 120, two starter gifts per slot, no repeated gifting, partial category refill, old ownership/balance preserved, 50-point reward idempotent.');
