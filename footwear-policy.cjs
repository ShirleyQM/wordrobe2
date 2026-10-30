const fs=require('fs'),path=require('path'),M=require('./assets/atelier-preppy-v1/mesh.js'),C=require('./assets/print-studio/garment.js'),F=require('./assets/footwear-occlusion.js');
module.exports=root=>{
 const file=path.join(root,'assets/materials/footwear-config.json');
 function context(groups){const config=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).items:{};let draft=groups.find(g=>g.group==='fittings')?.draft;if(!draft)try{draft=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/published/fittings.json'),'utf8')).draft;}catch{}return {config,draft:draft||{}};}
 function apply(item,base,state){const rule=state.config[item.id];if(!rule||item.slot!=='shoes')return;item.footwearConfig=rule;item.footwearMode=rule.mode;item.toeReveal=rule.toeReveal;
  if(['open-toe','full-foot'].includes(rule.mode)){item.hideBodyFrom=0;item.bodyOcclusionRects=[];return;}
  if(!rule.sourceRects?.length)return;
  let mesh;const s=state.draft[item.id];
  try{if(s&&base?.contours){const shapes=base.contours.map(C.parse);if(s.shoeParts?.length===2){const mid=base.bounds[0]+base.bounds[2]/2;mesh={parts:s.shoeParts.map((part,side)=>{const ids=shapes.map((_,i)=>i).filter(i=>{const pts=C.points(shapes[i]);return Number(pts.reduce((n,p)=>n+p.x,0)/pts.length>=mid)===side;});return M.outlineWarp(part,ids.map(i=>shapes[i]),ids.map(i=>s.contours[i]),C);})};}else if(M.valid(s.mesh))mesh=M.outlineWarp(s.mesh,shapes,s.contours,C);}}catch{}
  const rects=mesh?F.project(rule.sourceRects,p=>M.map(mesh,p)):rule.sourceRects;
  // Existing body occlusion from other garments is composed by the renderer.
  item.bodyOcclusionRects=[...(item.bodyOcclusionRects||[]),...rects];
 }
 return {context,apply};
};

