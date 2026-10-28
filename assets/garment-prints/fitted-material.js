(function(root){'use strict';
 const cache=new Map(),json=new Map(),W=939,H=1676,names=[['mask','base-mask.png'],['shadow','shadow.png'],['highlight','highlight.png'],['lineart','lineart.png'],['texture','texture.png']];
 const canvas=()=>Object.assign(document.createElement('canvas'),{width:W,height:H});
 function get(url){if(!json.has(url)){if(json.size>24)json.clear();json.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('鞋子版型或材质有更新，请刷新后重试');return r.json();}).catch(e=>{json.delete(url);throw e;}));}return json.get(url);}
 async function layers(item,side,raster){
  if(!item.materialManifest)return {};
  const key=JSON.stringify([item.materialManifest,item.materialFitURL,item.image,side]);if(cache.has(key))return cache.get(key);
  if(cache.size>=3)cache.delete(cache.keys().next().value);
  const result=(async()=>{const manifest=await get(item.materialManifest);if(side==='back'&&!manifest.backLayers)return {};
   const rows=await Promise.all(names.map(async([key,name])=>[key,await raster(new URL((side==='back'?'back-':'')+name,new URL(item.materialManifest,location.href)).href)]));
   if(!item.materialFitURL)return Object.fromEntries(rows);
   const fit=await get(item.materialFitURL),M=root.AtelierMesh,C=root.PrintGarment,E=root.GarmentEraser;if(!M||!C||!E)throw Error('鞋子换色组件未载入');
   const mesh={parts:fit.draft.shoeParts.map((part,side)=>{const indices=fit.contours.map((_,i)=>i).filter(i=>{const points=C.points(C.parse(fit.contours[i]));return Number(points.reduce((s,p)=>s+p.x,0)/points.length>=fit.bounds[0]+fit.bounds[2]/2)===side;});return M.outlineWarp(part,indices.map(i=>C.parse(fit.contours[i])),indices.map(i=>fit.draft.contours[i]),C);})};
   const out={};for(const [name,pixels]of rows){const source=canvas(),ctx=source.getContext('2d');ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels),W,H),0,0);E.apply(ctx,fit.draft.erasures,side);const projected=canvas(),pc=projected.getContext('2d');M.draw(pc,source,mesh);out[name]=pc.getImageData(0,0,W,H).data;}return out;
  })().catch(e=>{cache.delete(key);throw e;});cache.set(key,result);return result;
 }
 root.FittedMaterial={layers};
})(typeof window==='undefined'?globalThis:window);
