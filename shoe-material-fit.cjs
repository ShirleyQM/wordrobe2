// Read-only registration of existing shoe material layers to a saved user fit.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const M=require('./assets/atelier-preppy-v1/mesh.js'),C=require('./print-garment.js');
module.exports=function(root){let stamp='',saved={};const file=path.join(root,'assets/materials/published/fittings.json');
 function read(){try{const s=fs.statSync(file),next=s.size+':'+s.mtimeMs;if(next!==stamp){saved=JSON.parse(fs.readFileSync(file,'utf8'));stamp=next;}return saved;}catch{return {};}}
 const pathname=u=>{try{return decodeURIComponent(new URL(u,'http://local').pathname);}catch{return '';}};
 function registration(item,effective){try{
  if(item.slot!=='shoes'||!item.materialManifest||!Array.isArray(item.bounds)||!Array.isArray(item.contours))return null;
  const f=read(),row=f.items?.find(i=>i.id===item.id),d=f.draft?.[item.id];
  if(!row||!d||pathname(row.image||row.front)!==pathname(effective.image||effective.runtimeFront||effective.front))return null;
  if(item.sourceRevision!==d.sourceRevision||d.openings?.length||!Array.isArray(d.contours)||d.contours.length!==item.contours.length||!d.contours.every(C.valid))return null;
  const parts=M.split(M.grid(item.bounds,4,4),item.bounds[0]+item.bounds[2]/2);
  if(!Array.isArray(d.shoeParts)||d.shoeParts.length!==2||!d.shoeParts.every((p,n)=>M.valid(p)&&p.cols===parts[n].cols&&p.rows===parts[n].rows&&p.points.every((v,j)=>Math.abs(v.sx-parts[n].points[j].sx)<.01&&Math.abs(v.sy-parts[n].points[j].sy)<.01)))return null;
  const value={bounds:item.bounds,contours:item.contours,draft:{shoeParts:d.shoeParts,contours:d.contours,erasures:d.erasures||[]},sourceImage:row.image||row.front};
  const version=crypto.createHash('sha256').update(JSON.stringify([item.sourceSha256,item.materialManifest,value])).digest('hex').slice(0,24);
  return {...value,version,url:'/api/shoe-material-fit?id='+encodeURIComponent(item.id)+'&v='+version};
 }catch{return null;}}
 return {registration};
};
