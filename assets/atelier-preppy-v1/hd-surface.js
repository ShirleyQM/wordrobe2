(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HDGarmentSurface=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function scaledMesh(mesh,scale){if(mesh.parts)return {parts:mesh.parts.map(p=>scaledMesh(p,scale))};return {...mesh,points:mesh.points.map(p=>({sx:p.sx*scale,sy:p.sy*scale,x:p.x*scale,y:p.y*scale}))};}
 function render(image,mesh,strokes,side,M,E,make,scale=4){
  if(!image||image.width!==939*scale||image.height!==1676*scale)throw Error('HD garment source canvas mismatch');
  let source=image;
  if(strokes?.length){source=make(939*scale,1676*scale);const ctx=source.getContext('2d');ctx.drawImage(image,0,0);ctx.scale(scale,scale);E.apply(ctx,strokes,side);}
  const out=make(939*scale,1676*scale);M.draw(out.getContext('2d'),source,scaledMesh(mesh,scale));return out;
 }
 return {scaledMesh,render};
});
