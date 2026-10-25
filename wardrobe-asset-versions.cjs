const fs=require('fs'),path=require('path');

// Response metadata only: never rewrite catalogs, fitting drafts or stored URLs.
module.exports=function(root){
 const base=path.resolve(root)+path.sep;
 return function decorate(groups){
  const versions=new Map();
  function version(url){
   if(typeof url!=='string'||!url.startsWith('/assets/'))return null;
   try{
    const pathname=decodeURIComponent(new URL(url,'http://wardrobe.local').pathname),file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(base))return null;
    if(!versions.has(file)){
     const stat=fs.statSync(file,{bigint:true});
     versions.set(file,stat.isFile()?`${stat.size.toString(36)}-${stat.mtimeNs.toString(36)}-${stat.ctimeNs.toString(36)}`:null);
    }
    return versions.get(file);
   }catch{return null;}
  }
  for(const group of groups)for(const item of group.items||[]){
   const values={};
   for(const field of ['image','front','back','thumbnail','materialSourceFront']){
    const token=version(item[field]);if(token)values[field]=token;
   }
   if(Object.keys(values).length)item.assetVersions=values;
  }
  return groups;
 };
};
