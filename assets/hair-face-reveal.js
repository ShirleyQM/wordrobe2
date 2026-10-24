(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HairFaceReveal=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function feather(x,y,cx,cy,rx,ry){const r=Math.hypot((x-cx)/rx,(y-cy)/ry),t=clamp((1-r)/.4,0,1);return t*t*(3-2*t);}
 function alpha(x,y,hairAlpha,amount){const mask=Math.max(feather(x,y,438,178,33,24),feather(x,y,502,178,33,24));return Math.round(clamp(amount,0,.75)*mask*hairAlpha);}
 function pixels(face,hair,width,height,amount){if(face.length!==hair.length||face.length!==width*height*4)throw Error('Face reveal canvas mismatch');const out=new Uint8ClampedArray(face.length);
 for(let y=154;y<Math.min(height,203);y++)for(let x=405;x<Math.min(width,536);x++){const k=(y*width+x)*4,a=Math.round(alpha(x,y,hair[k+3],amount)*face[k+3]/255);if(a){out[k]=face[k];out[k+1]=face[k+1];out[k+2]=face[k+2];out[k+3]=a;}}
 return out;}
 function region(face,hair,width,height,offsetX,offsetY,amount){if(face.length!==hair.length||face.length!==width*height*4)throw Error('Face reveal region mismatch');const out=new Uint8ClampedArray(face.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const k=(y*width+x)*4,a=Math.round(alpha(x+offsetX,y+offsetY,hair[k+3],amount)*face[k+3]/255);if(a){out[k]=face[k];out[k+1]=face[k+1];out[k+2]=face[k+2];out[k+3]=a;}}return out;}
 return {alpha,pixels,region};
});
