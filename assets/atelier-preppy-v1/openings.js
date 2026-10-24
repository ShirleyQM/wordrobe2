(function(root){
 'use strict';
 function valid(rows){return Array.isArray(rows)&&rows.length<=12&&rows.every(o=>Number.isFinite(o.rise)&&o.rise>=0&&o.rise<=300&&o.points?.length===3&&o.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<4000))&&(o.frontPoints===undefined||Array.isArray(o.frontPoints)&&o.frontPoints.length<=8&&o.frontPoints.every(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<4000))));}
 function path(op){if(op.kind==='shoe')return shoePath(op);if(op.kind==='ellipse')return ellipsePath(op);const [a,c,b]=op.points,top=Math.min(a[1],b[1])-op.rise;return `M${a[0]} ${top} L${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]} L${b[0]} ${top} Z`;}

 function ellipsePath(op){
  const [a,c,b]=op.points,m=[(a[0]+b[0])/2,(a[1]+b[1])/2],rx=Math.hypot(b[0]-a[0],b[1]-a[1])/2||.01;
  const u=[(b[0]-a[0])/(2*rx),(b[1]-a[1])/(2*rx)],v=[-u[1],u[0]],ry=Math.max(.01,((c[0]-m[0])*v[0]+(c[1]-m[1])*v[1])/2),up=op.rise/2,k=.5522847498;
  const at=(x,y)=>`${m[0]+x*u[0]+y*v[0]} ${m[1]+x*u[1]+y*v[1]}`;
  return `M${at(-rx,0)} C${at(-rx,-up*k)} ${at(-rx*k,-up)} ${at(0,-up)} C${at(rx*k,-up)} ${at(rx,-up*k)} ${at(rx,0)} C${at(rx,ry*k)} ${at(rx*k,ry)} ${at(0,ry)} C${at(-rx*k,ry)} ${at(-rx,ry*k)} ${at(-rx,0)} Z`;
 }

 function shoePath(op){
  const [a,c,b]=op.points,m=[(a[0]+b[0])/2,(a[1]+b[1])/2],rx=Math.hypot(b[0]-a[0],b[1]-a[1])/2||.01;
  const u=[(b[0]-a[0])/(2*rx),(b[1]-a[1])/(2*rx)],v=[-u[1],u[0]],up=op.rise/2,k=.5522847498;
  const at=(x,y)=>`${m[0]+x*u[0]+y*v[0]} ${m[1]+x*u[1]+y*v[1]}`;
  const rear=`M${a[0]} ${a[1]} C${at(-rx,-up*k)} ${at(-rx*k,-up)} ${at(0,-up)} C${at(rx*k,-up)} ${at(rx,-up*k)} ${b[0]} ${b[1]}`;
  if(op.frontMode==='flat')return rear+` L${a[0]} ${a[1]} Z`;
  if(op.frontMode==='custom'&&op.frontPoints?.length)return rear+op.frontPoints.slice().reverse().map(p=>` L${p[0]} ${p[1]}`).join('')+` L${a[0]} ${a[1]} Z`;
  return rear+` Q${c[0]} ${c[1]} ${a[0]} ${a[1]} Z`;
 }
 function split(source,coverage){const front=new Uint8ClampedArray(source),back=new Uint8ClampedArray(source);for(let i=3;i<source.length;i+=4){back[i]=Math.round(source[i]*coverage[i]/255);front[i]=source[i]-back[i];}return {front,back};}
 const api={valid,path,split};if(typeof module==='object'&&module.exports)module.exports=api;else root.GarmentOpenings=api;
})(typeof window==='undefined'?globalThis:window);
