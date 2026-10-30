const assert=require('assert/strict'),o=require('./assets/garment-body-occlusion.js');
assert.equal(o.toeLayer({footwearMode:'closed-toe',toeReveal:{extension:5}},'body.png'),'');
assert.match(o.toeLayer({footwearMode:'open-toe',toeReveal:{extension:5}},'body.png'),/height="43"/);
const high=o.toeGeometry({toeReveal:{extension:5,startY:1580}}),low=o.toeGeometry({toeReveal:{extension:5,startY:1648}});
assert.equal(high.bottom,low.bottom,'rear adjustment must retain front endpoint');
assert.equal(high.y+high.h,1676,'retain full original toe front');
assert.equal(low.y+low.h,1676,'retain full original toe front');
assert.match(o.toeLayer({footwearMode:'open-toe',toeReveal:{extension:0,startY:1648}},'body.png'),/y="1648"/,'rear adjustment also works without stretching toes');
(async()=>{const r=await fetch('http://127.0.0.1:4173/api/footwear-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'colour-white-front-sandals',mode:'open-toe',extension:17})});assert.equal(r.status,400);const rules=await(await fetch('http://127.0.0.1:4173/api/footwear-config')).json();assert.equal(rules.items['colour-white-front-sandals'].toeReveal.extension,4);console.log('PASS: toe preview, closed-toe isolation and config validation.');})().catch(e=>{console.error(e);process.exitCode=1;});
