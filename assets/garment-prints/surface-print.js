(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GarmentSurface=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const maps=new Map(),BODY_WIDTH=939,BODY_HEIGHT=1676;
 const bell=(v,c,r)=>Math.exp(-.5*((v-c)/r)**2);
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 // One field in the fixed character's coordinates, shared by every garment.
 // The source motif and its saved position/size remain editable and unchanged.
 function field(x,y){
  if(x<=280||x>=660||y<=300||y>=865)return {dx:0,dy:0};
  const edge=smooth((x-280)/45)*smooth((660-x)/45)*smooth((y-300)/45)*smooth((865-y)/65);
  const left=bell(x,411,46)*bell(y,430,57),right=bell(x,529,46)*bell(y,430,57);
  const torso=bell(y,490,145),q=Math.max(-1,Math.min(1,(x-470)/170));
  const cylinder=170*(Math.sin(q)/Math.sin(1)-q)*torso;
  const waist=bell(y,610,75),hips=bell(y,765,65);
  return {dx:edge*(cylinder+.075*((x-411)*left+(x-529)*right)-(x-470)*.035*waist+(x-470)*.025*hips),dy:edge*(-12*(left+right)+3.5*bell(y,495,24)*(bell(x,411,65)+bell(x,529,65)))};
 }
 function inverseMap(width,height,strength){
  const key=[width,height,strength].join(':');if(maps.has(key))return maps.get(key);
  const sx=width/BODY_WIDTH,sy=height/BODY_HEIGHT,x0=Math.max(0,Math.floor(280*sx)),x1=Math.min(width,Math.ceil(660*sx)),y0=Math.max(0,Math.floor(300*sy)),y1=Math.min(height,Math.ceil(865*sy));
  const coords=new Float32Array((x1-x0)*(y1-y0)*2);let k=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const dx=x/sx,dy=y/sy;let u=dx,v=dy;
   // Inverse sampling avoids holes between displaced source pixels.
   for(let n=0;n<5;n++){const d=field(u,v);u=dx-strength*d.dx;v=dy-strength*d.dy;}
   coords[k++]=u*sx;coords[k++]=v*sy;
  }
  const map={x0,x1,y0,y1,coords};if(maps.size>=2)maps.delete(maps.keys().next().value);maps.set(key,map);return map;
 }
 function warp(p,width,height,{strength=1}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||p.length!==width*height*4)throw Error('印花曲面尺寸无效');
  strength=Number.isFinite(strength)?Math.max(0,Math.min(1.5,strength)):1;
  const out=new Uint8ClampedArray(p);if(!strength)return out;
  const {x0,x1,y0,y1,coords}=inverseMap(width,height,strength);let n=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const u=Math.max(0,Math.min(width-1,coords[n++])),v=Math.max(0,Math.min(height-1,coords[n++])),ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
   const jx=Math.min(width-1,ix+1),jy=Math.min(height-1,iy+1),a=(iy*width+ix)*4,b=(iy*width+jx)*4,c=(jy*width+ix)*4,d=(jy*width+jx)*4;
   const wa=(1-fx)*(1-fy),wb=fx*(1-fy),wc=(1-fx)*fy,wd=fx*fy;
   const aa=p[a+3]*wa,ab=p[b+3]*wb,ac=p[c+3]*wc,ad=p[d+3]*wd,alpha=aa+ab+ac+ad,k=(y*width+x)*4;
   out[k+3]=alpha;
   // Premultiplied-alpha interpolation preserves colored transparent edges.
   for(let color=0;color<3;color++)out[k+color]=alpha>.001?(p[a+color]*aa+p[b+color]*ab+p[c+color]*ac+p[d+color]*ad)/alpha:0;
  }
  return out;
 }
 function blend(p,{shadow,highlight,texture,ink,strength=1}){const out=new Uint8ClampedArray(p);for(let k=0;k<out.length;k+=4){if(!out[k+3])continue;const s=shadow[k+3]/255,h=highlight[k+3]/255*.7,t=1+(texture[k]-128)/128*.14*strength,line=ink[k+3]/255*.48;for(let j=0;j<3;j++){let v=p[k+j]*(1-s);v=255-(255-v)*(1-h);v*=t;out[k+j]=Math.max(0,Math.min(255,v*(1-line)+ink[k+j]*line));}out[k+3]*=.95;}return out;}
 return {version:3,field,warp,blend};
});
