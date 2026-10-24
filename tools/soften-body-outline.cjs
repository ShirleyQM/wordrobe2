// Local contour cleanup. Geometry and alpha are deliberately unchanged.
module.exports=function softenBodyOutline(pixels,width=939){
 const source=Buffer.from(pixels);let changed=0;
 for(let y=245;y<375;y++)for(let x=275;x<665;x++){
  const k=(y*width+x)*4,r=source[k],g=source[k+1],b=source[k+2];
  if(!source[k+3]||r*.2126+g*.7152+b*.0722>125)continue;
  // Only the external neck/shoulder edge, never interior skin or garment detail.
  let edge=false;
  for(let dy=-4;dy<=4&&!edge;dy++)for(let dx=-4;dx<=4;dx++)if(source[((y+dy)*width+x+dx)*4+3]<32){edge=true;break;}
  if(!edge)continue;
  let best=null,dist=Infinity;
  for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){
   const q=((y+dy)*width+x+dx)*4,rr=source[q],gg=source[q+1],bb=source[q+2],d=dx*dx+dy*dy;
   if(source[q+3]>245&&rr>170&&rr>gg*1.06&&gg>bb*1.03&&d<dist){best=[rr,gg,bb];dist=d;}
  }
  if(!best)continue;
  for(let c=0;c<3;c++)pixels[k+c]=Math.round(best[c]*.87);
  changed++;
 }
 return changed;
};
