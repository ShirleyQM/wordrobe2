(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PrintTransform=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function resize(box,handle,dx,dy,free){
  const horizontal=handle.includes('e')?1:handle.includes('w')?-1:0,vertical=handle.includes('s')?1:handle.includes('n')?-1:0;
  let width=clamp(box.width+dx*horizontal,22,650),height=clamp(box.height+dy*vertical,22,700);
  if(!free){let factor;if(horizontal&&vertical){const fx=width/box.width,fy=height/box.height;factor=Math.abs(fx-1)>=Math.abs(fy-1)?fx:fy;}else factor=horizontal?width/box.width:height/box.height;factor=clamp(factor,Math.max(22/box.width,22/box.height),Math.min(650/box.width,700/box.height));width=box.width*factor;height=box.height*factor;}
  const x=horizontal<0?box.x+box.width-width:horizontal>0?box.x:box.x+(box.width-width)/2;
  const y=vertical<0?box.y+box.height-height:vertical>0?box.y:box.y+(box.height-height)/2;
  return {x,y,width,height};
 }
 function scale(box,factor){factor=clamp(factor,Math.max(22/box.width,22/box.height),Math.min(650/box.width,700/box.height));const width=box.width*factor,height=box.height*factor;return {x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height};}
 function move(box,dx,dy){return {x:clamp(box.x+dx,220-box.width,720),y:clamp(box.y+dy,280-box.height,780),width:box.width,height:box.height};}
 return {resize,scale,move};
});
