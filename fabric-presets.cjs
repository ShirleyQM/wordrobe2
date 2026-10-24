const fs=require('fs'),path=require('path');
module.exports=function(root){
 const basic=[{id:'combed',name:'精梳棉'},{id:'slub',name:'竹节棉'},{id:'washed',name:'水洗棉'}];
 function list(){const p=path.join(root,'assets/materials/fabrics/universal/manifest.json');return [...basic,...(fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')).presets:[])];}
 function supported(item,effective=item){if(!['top','coat','bottom','dress','bra','briefs','socks','bag'].includes(item.slot))return false;const url=effective.image||effective.runtimeFront||effective.front;if(typeof url!=='string'||!url.startsWith('/assets/'))return false;try{const fd=fs.openSync(path.join(root,url),'r'),data=Buffer.alloc(24);try{fs.readSync(fd,data,0,24,0);}finally{fs.closeSync(fd);}return data.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&data.readUInt32BE(16)===939&&data.readUInt32BE(20)===1676;}catch{return false;}}
 return {list,supported};
};
