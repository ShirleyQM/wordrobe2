/* Legacy compatibility API. Garment folds are painted in the art layers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PrintFabric=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function field(){return {dx:0,dy:0,shade:0};}
 function raster(hem){const w=480,h=520,warp=document.createElement('canvas'),shade=document.createElement('canvas');warp.width=shade.width=w;warp.height=shade.height=h;const wc=warp.getContext('2d'),sc=shade.getContext('2d'),wp=wc.createImageData(w,h),sp=sc.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=field(x+230,y+280,hem),i=(y*w+x)*4;wp.data[i]=Math.round(127.5+f.dx/18*255);wp.data[i+1]=Math.round(127.5+f.dy/18*255);wp.data[i+2]=128;wp.data[i+3]=255;const light=f.shade>0?255:23;sp.data[i]=light;sp.data[i+1]=f.shade>0?255:47;sp.data[i+2]=f.shade>0?255:78;sp.data[i+3]=Math.min(110,Math.abs(f.shade)*1100);}wc.putImageData(wp,0,0);sc.putImageData(sp,0,0);return {warp:warp.toDataURL(),shade:shade.toDataURL()};}
 return {field,raster};
});
