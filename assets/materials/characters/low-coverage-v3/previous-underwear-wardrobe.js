'use strict';
window.UnderwearWardrobe=(()=>{
 const tops={'matte-cotton-bra-v1':1,'lowcut-bandeau-v1':2,'lowcut-bikini-top-v1':3},bottoms={'matte-cotton-briefs-v1':1,'lowcut-bikini-bottom-v1':2};
 const known=id=>!!(tops[id]||bottoms[id]);
 function body(items=[]){const rows=Array.isArray(items)?items:Object.entries(items).map(([slot,id])=>({slot,id}));const t=rows.find(i=>i.slot==='bra'),b=rows.find(i=>i.slot==='briefs');return '/assets/materials/characters/body-clean-v2/body-'+(tops[t?.id]||0)+'-'+(bottoms[b?.id]||0)+'.png';}
 return {body,known};
})();
