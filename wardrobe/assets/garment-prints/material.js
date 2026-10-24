(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GarmentMaterial=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
 function rgb(value){if(!/^#[0-9a-f]{6}$/i.test(value||''))throw Error('颜色无效');return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));}
 function pixels({source,mask,shadow,highlight,lineart,texture,preset,color,strength=1,presetStrength=.12,lineOpacity=.48,reference=195}){
 const out=new Uint8ClampedArray(source.length),base=color?rgb(color):null,detailed=!!mask&&!!base;
 // Keep a little tonal room at both ends so white and black retain painted folds.
 const lightness=base?Math.max(...base)/255:0;
 const working=base?.map(v=>v*(1-7/255)+24*(1-lightness)**2);
 for(let i=0;i<source.length;i+=4){const alpha=source[i+3];out[i+3]=alpha;if(!alpha)continue;
 const luminance=(source[i]+source[i+1]+source[i+2])/3;
 for(let c=0;c<3;c++){let v;
 if(detailed&&mask[i+3]){v=working[c]*(1-(shadow?.[i+3]||0)/255);v=255-(255-v)*(1-(highlight?.[i+3]||0)/255);}
 else if(base&&!mask){const ratio=luminance/Math.max(1,reference);v=working[c]*Math.min(1,ratio);const paintedLight=Math.max(0,luminance-reference)/Math.max(24,255-reference);v=255-(255-v)*(1-paintedLight*.32);}
 else v=source[i+c];
 if(!mask||mask[i+3])v*=1+((texture?.[i]??128)-128)/128*.14*strength+((preset?.[i]??128)-128)/128*presetStrength*strength;
 if(detailed&&mask[i+3]&&lineart){let a=lineart[i+3]/255*lineOpacity;v=v*(1-a)+lineart[i+c]*a;}
 out[i+c]=clamp(v);
 }}return out;
 }
 function median(data){const hist=new Uint32Array(256);let total=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>128){hist[Math.round((data[i]+data[i+1]+data[i+2])/3)]++;total++;}let n=0;for(let i=0;i<256;i++){n+=hist[i];if(n>=total/2)return i;}return 195;}
 return {pixels,rgb,median};
});
