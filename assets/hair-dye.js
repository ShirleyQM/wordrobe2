(function(root){'use strict';
 const rgb=h=>h.slice(1).match(/../g).map(x=>parseInt(x,16));
 function apply(data,width,height,box,strokes,base){const out=new Uint8ClampedArray(data),b=rgb(base),lum=v=>v[0]*.2126+v[1]*.7152+v[2]*.0722,mid=lum(b),hi=lum(b.map((v,i)=>v*.5+[232,228,225][i]*.5)),mask=new Float32Array(width*height),colors=new Uint8ClampedArray(width*height*3);
 for(const stroke of strokes){const points=stroke.points,r=stroke.radius*box.w;if(!points.length||r<=0)continue;const pts=points.map(p=>[box.x+p[0]*box.w,box.y+p[1]*box.h]),x0=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[0]))-r)),x1=Math.min(width,Math.ceil(Math.max(...pts.map(p=>p[0]))+r)),y0=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1]))-r)),y1=Math.min(height,Math.ceil(Math.max(...pts.map(p=>p[1]))+r)),col=rgb(stroke.color);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const n=y*width+x;if(!data[n*4+3])continue;let d=Infinity;for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}if(d>=r)continue;const f=Math.min(1,(1-d/r)*2),alpha=f*f*(3-2*f)*stroke.opacity;if(stroke.erase){mask[n]*=1-alpha;continue;}const old=mask[n],combined=alpha+old*(1-alpha);for(let c=0;c<3;c++)colors[n*3+c]=(col[c]*alpha+colors[n*3+c]*old*(1-alpha))/combined;mask[n]=combined;}}
 for(let n=0;n<mask.length;n++){const alpha=mask[n];if(!alpha)continue;const k=n*4,l=lum(out.subarray(k,k+3)),low=l<mid,t=Math.max(0,Math.min(1,low?l/Math.max(1,mid):(l-mid)/Math.max(1,hi-mid)));for(let c=0;c<3;c++){const col=colors[n*3+c],a=low?col*.25+[3,4,7][c]:col,b=low?col:col*.5+[232,228,225][c]*.5;out[k+c]=Math.round(out[k+c]*(1-alpha)+(a*(1-t)+b*t)*alpha);}}
 return out;
 }
 const api={apply};root.HairDye=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
