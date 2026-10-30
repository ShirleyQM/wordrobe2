(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FootwearOcclusion=api;})(typeof window!=='undefined'?window:globalThis,function(){
 function project(rects,map){return (rects||[]).map(([x,y,w,h])=>{const p=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([x,y])=>map({x,y}));const xs=p.map(p=>p.x),ys=p.map(p=>p.y);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];}).filter(r=>r.every(Number.isFinite)&&r[2]>0&&r[3]>0);}
 return {project};
});
