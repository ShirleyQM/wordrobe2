const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),O=require('./assets/garment-body-occlusion.js');
for(const file of ['app.js','assets/mobile/app.js']){
 const code=fs.readFileSync(file,'utf8'),func=code.match(/function clothingSlots\(\)\{[^\n]+/)[0];
 for(const clothingOrder of ['top','bottom']){const ctx={state:{clothingOrder}};vm.runInNewContext(func,ctx);const slots=ctx.clothingSlots();assert.ok(slots.indexOf('socks')<slots.indexOf('shoes'));assert.ok(slots.indexOf('shoes')<slots.indexOf('bottom'));}
 assert.match(code,/UnderwearWardrobe.image\(i\),i.name,slot==='socks'\?/,'sock foot uses same occlusion as body');
}
assert.equal(O.geometry([{slot:'shoes',hideBodyFrom:1490}]).cut,1490);assert.equal(O.geometry([]).cut,1676,'removing shoes restores feet');assert.match(O.style([{hideBodyFrom:1600}]),/4\.5346/);console.log('PASS: desktop/mobile pants cover shoes, socks below shoes, foot cut restores on unequip.');
