(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FinishedGarmentCrop=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const profiles={
  regular:{hem:727,body:175,neck:[400,532,72],sleeves:[[297,470,354,481],[581,481,635,470]],sleeve:72},
  fitted:{hem:729,body:175,neck:[398,535,72],sleeves:[[292,469,352,482],[575,482,641,471]],sleeve:70},
  cropped:{hem:545,body:43,neck:[401,541,60],sleeves:[[298,465,355,477],[591,477,646,467]],sleeve:65},
  offshoulder:{hem:695,body:150,neck:[352,585,36],sleeves:[[294,473,354,483],[585,483,643,473]],sleeve:52},
  asymmetric:{hem:691,body:130,neck:[389,582,48],sleeves:[[304,449,361,459]],sleeve:64}
 };
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function kind(id){return /^cotton-tee-(regular|fitted|cropped|offshoulder|asymmetric)-v3$/.exec(id||'')?.[1]||null;}
 function enabled(id){return !!kind(id);}
 function normalize(s={}){return Object.fromEntries(['body','neck','sleeve'].map(k=>[k,clamp(Number(s[k])||0,0,100)]));}
 function changed(s){return Object.values(normalize(s)).some(Boolean);}
 // The finishing pass only removes coverage and shades the retained front cloth.
 // No rear surface, expanded alpha, displacement, or new garment fit is created.
 function pixels(source,w,h,id,settings={}){
  const p=profiles[kind(id)],s=normalize(settings),out=new Uint8ClampedArray(source);
  if(!p||!changed(s))return out;
  const top=new Int32Array(w).fill(-1);
  if(s.neck)for(let x=p.neck[0];x<=p.neck[1];x++)for(let y=200;y<500;y++)if(source[(y*w+x)*4+3]>160){top[x]=y;break;}
  for(let y=250;y<Math.min(h,p.hem+2);y++)for(let x=250;x<Math.min(w,690);x++){
   const i=(y*w+x)*4;if(!source[i+3])continue;let d=1e5,seam=0;
   if(s.body){const t=(x-469)/170,edge=p.hem-p.body*s.body/100-17*t*t;d=edge-y;seam=6;}
   if(s.neck&&x>=p.neck[0]&&x<=p.neck[1]&&top[x]>=0){const t=(x-p.neck[0])/(p.neck[1]-p.neck[0]),edge=top[x]+p.neck[2]*s.neck/100*Math.sin(Math.PI*t);const n=y-edge;if(n<d){d=n;seam=5;}}
   if(s.sleeve)for(const [ax,ay,bx,by]of p.sleeves){if(x<ax-12||x>bx+2||y>Math.max(ay,by)+4)continue;const t=(x-ax)/(bx-ax),u=clamp(t,0,1),amount=ax<469?1-u:u,edge=ay+(by-ay)*t+2.5*Math.sin(Math.PI*u)-p.sleeve*s.sleeve/100*amount;const n=edge-y;if(n<d){d=n;seam=4;}}
   const coverage=clamp(d+.5,0,1);out[i+3]=Math.min(source[i+3],Math.round(source[i+3]*coverage));if(!out[i+3])continue;
   if(d<12){const edgeShade=.075*Math.exp(-Math.max(0,d)/1.5),rolled=.025*Math.exp(-(((d-2.2)/1.1)**2)),stitch=.045*Math.exp(-(((d-seam)/.5)**2))*(.7+.3*Math.cos(x*2.2+y*.2)),light=.014*Math.exp(-(((d-3.3)/.8)**2));for(let c=0;c<3;c++)out[i+c]=clamp(Math.round(source[i+c]*(1-edgeShade-rolled-stitch)+(255-source[i+c])*light),0,255);}
  }
  return out;
 }
 function canvas(input,id,settings){if(!enabled(id)||!changed(settings))return input;const out=document.createElement('canvas');out.width=input.width;out.height=input.height;const ctx=out.getContext('2d'),data=input.getContext('2d').getImageData(0,0,out.width,out.height);data.data.set(pixels(data.data,out.width,out.height,id,settings));ctx.putImageData(data,0,0);return out;}
 return {enabled,normalize,changed,pixels,canvas,profiles};
});

