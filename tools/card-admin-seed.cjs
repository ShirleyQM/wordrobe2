/* Append new backend stock without replacing existing fits or player visibility. */
module.exports=function(seed,items){
 const append=(list,rows)=>{const ids=new Set(list.map(i=>i.id));for(const i of rows)if(!ids.has(i.id))list.push(i);};
 for(const name of ['library','materials']){let group=seed.groups.find(g=>g.group===name);if(!group){group={group:name,items:[]};seed.groups.push(group);}append(group.items,items);}
 if(seed.catalog?.items)append(seed.catalog.items,items);
 if(seed.materials?.items)append(seed.materials.items,items.map(i=>({...i,kind:'clothes',visible:false})));
 return seed;
};
