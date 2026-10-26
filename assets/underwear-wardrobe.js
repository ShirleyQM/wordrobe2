'use strict';

// Catalog images already resolve saved fittings and asset versions; legacy cutouts are fallback only.

window.UnderwearWardrobe=(()=>{const images={"campus-bra":"/assets/materials/characters/low-coverage-v3/campus-bra-front.png","campus-briefs":"/assets/materials/characters/low-coverage-v3/campus-briefs-front.png","underlayer-straight":"/assets/materials/characters/low-coverage-v3/underlayer-straight-front.png","underlayer-plunge":"/assets/materials/characters/low-coverage-v3/underlayer-plunge-front.png","underlayer-seamless":"/assets/materials/characters/low-coverage-v3/underlayer-seamless-front.png","lowcut-bandeau-v1":"/assets/materials/characters/low-coverage-v3/lowcut-bandeau-v1-front.png","lowcut-bikini-top-v1":"/assets/materials/characters/low-coverage-v3/lowcut-bikini-top-v1-front.png","lowcut-bikini-bottom-v1":"/assets/materials/characters/low-coverage-v3/lowcut-bikini-bottom-v1-front.png","matte-cotton-bra-v1":"/assets/materials/characters/low-coverage-v3/matte-cotton-bra-v1-front.png","matte-cotton-briefs-v1":"/assets/materials/characters/low-coverage-v3/matte-cotton-briefs-v1-front.png"};const known=id=>!!images[id]||id==='separate-v1-ivory-triangle'||id==='separate-v1-ivory-briefs';
const presentationRoot='/assets/materials/characters/strapless-body-display-v1/';
const defaultOrder=['bra','briefs','socks','shoes','bottom','top','dress','coat','jewelry','bag'];
function straplessContext(rows,order=defaultOrder){
 const dress=rows.find(i=>i.id==='dress2-caramel-crochet'&&i.slot==='dress');
 if(!dress)return false;
 const bra=rows.find(i=>i.slot==='bra');
 return !bra||order.indexOf('dress')>order.indexOf('bra');
}
function presentation(rows,order=defaultOrder){
 if(!straplessContext(rows,order))return rows;
 const variants={'lowcut-bikini-top-v1':'green-front.png','separate-v1-ivory-triangle':'ivory-front.png'};
 return rows.map(i=>variants[i.id]?{...i,presentationImage:presentationRoot+variants[i.id]+'?v=1',printOverlay:null}:i);
}
function body(items=[],order=defaultOrder){
 const rows=Array.isArray(items)?items:Object.entries(items).map(([slot,id])=>({slot,id}));
 const repaired=rows.some(i=>i.slot==='bra'&&['lowcut-bikini-top-v1','separate-v1-ivory-triangle'].includes(i.id));
 const family=straplessContext(rows,order)?'strapless-body-display-v1':repaired?'underwear-body-display-v1':'clean-body-v4';
 return '/assets/materials/characters/'+family+'/body-'+(rows.some(i=>i.slot==='bra')?1:0)+'-'+(rows.some(i=>i.slot==='briefs')?1:0)+'.png';
}
return {body,known,presentation,straplessContext,image:item=>item.presentationImage||item.image||item.front||images[item.id]};})();
