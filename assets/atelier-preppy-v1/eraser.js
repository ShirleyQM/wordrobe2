(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GarmentEraser=api;})(typeof window!=='undefined'?window:globalThis,function(){
 const copy=v=>JSON.parse(JSON.stringify(v));
 function valid(strokes){return Array.isArray(strokes)&&strokes.length<=4000&&strokes.every(s=>s&&['both','front','back'].includes(s.side)&&Array.isArray(s.points)&&s.points.length>0&&s.points.length<=20000&&s.points.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&p[0]>=-1000&&p[0]<=3000&&p[1]>=-1000&&p[1]<=3000&&p[2]>=.25&&p[2]<=500));}
 function clean(strokes){return valid(strokes)?copy(strokes):[];}
 function sample(mesh,M,p,diameter){const a=M.map(mesh,p,true),b=M.map(mesh,{x:p.x+diameter/2,y:p.y},true),c=M.map(mesh,{x:p.x,y:p.y+diameter/2},true),r=Math.max(.25,Math.min(500,(Math.hypot(b.x-a.x,b.y-a.y)+Math.hypot(c.x-a.x,c.y-a.y))/2)),point=[a.x,a.y,r];return valid([{side:'both',points:[point]}])?point:null;}
 function apply(ctx,strokes,side){if(!strokes?.length)return;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.globalAlpha=1;ctx.fillStyle=ctx.strokeStyle='#000';ctx.lineCap=ctx.lineJoin='round';for(const s of strokes){if(s.side!=='both'&&s.side!==side)continue;let previous;for(const p of s.points){if(previous){ctx.lineWidth=previous[2]+p[2];ctx.beginPath();ctx.moveTo(previous[0],previous[1]);ctx.lineTo(p[0],p[1]);ctx.stroke();}ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill();previous=p;}}ctx.restore();}
 return {valid,clean,sample,apply};
});
