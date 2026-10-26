(function(root){'use strict';
 const copy=v=>JSON.parse(JSON.stringify(v));
 function preview(equipped,row,normalize,find){const next={...equipped};if(row.slot==='dress'){delete next.top;delete next.bottom;}if(['top','bottom'].includes(row.slot))delete next.dress;if(row.slot==='jewelry'){const keys=Object.keys(next).filter(k=>k.startsWith('jewelry:'));if(keys.length>=3)delete next[keys[keys.length-1]];next['jewelry:'+row.id]=row.id;}else next[row.slot]=row.id;return normalize(next,find);}
 function missing(look,owns,find){return [...new Set(Object.values(look.equipped||{}))].map(find).filter(i=>i&&!owns(i.id));}
 function owned(equipped,owns,find){return Object.fromEntries(Object.entries(equipped||{}).filter(([,id])=>owns(id)&&find(id)));}
 function goal(rows,balance,reward){const cost=rows.reduce((sum,i)=>sum+(Number(i.price)||20),0),remaining=Math.max(0,cost-balance);return {cost,remaining,lessons:Math.ceil(remaining/Math.max(1,reward))};}
 const api={copy,preview,missing,owned,goal};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LookLabCore=api;
})(typeof window==='undefined'?globalThis:window);
