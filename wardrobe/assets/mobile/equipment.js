'use strict';
window.MobileEquipment=(()=>{
 const anchors=new Map();
 function normalize(equipped,find){const result={},seen=new Set();let count=0;for(const [key,id]of Object.entries(equipped||{})){const row=find(id);if(!row||seen.has(id))continue;seen.add(id);if(row.slot==='jewelry'){if(count++<3)result['jewelry:'+id]=id;}else result[row.slot]=id;}if(result.dress){delete result.top;delete result.bottom;}return result;}
 function toggle(equipped,row,find){const next=normalize(equipped,find),key=row.slot==='jewelry'?'jewelry:'+row.id:row.slot;if(next[key]===row.id){delete next[key];return {equipped:next};}if(row.slot==='jewelry'&&Object.keys(next).filter(k=>k.startsWith('jewelry:')).length>=3)return {equipped:next,limited:true};if(row.slot==='dress'){delete next.top;delete next.bottom;}if(['top','bottom'].includes(row.slot))delete next.dress;next[key]=row.id;return {equipped:next};}
 function fit(row,state){const f=state.accessoryFits?.[row.id]||{};return {x:Math.max(-30,Math.min(30,Number(f.x)||0)),y:Math.max(-30,Math.min(30,Number(f.y)||0)),scale:Math.max(.3,Math.min(2,Number(f.scale)||1))};}
 function style(row,state){if(row.slot!=='jewelry')return '';const f=fit(row,state),a=anchors.get(row.id)||state.accessoryAnchors?.[row.id]||{x:50,y:20};return `;transform-origin:${a.x}% ${a.y}%;transform:translate(${f.x}%,${f.y}%) scale(${f.scale});`;}
 return {normalize,toggle,fit,style,anchors};
})();
