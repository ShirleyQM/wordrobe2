(function(root){
 'use strict';
 function url(item,field){
  const value=item?.[field],token=item?.assetVersions?.[field];
  if(!value||!token||!value.startsWith('assets/'))return value;
  const parsed=new URL(value,'http://wardrobe.local');
  parsed.searchParams.set('av',token);
  return parsed.pathname.slice(1)+parsed.search+parsed.hash;
 }
 function apply(item){for(const field of ['image','back','thumbnail','materialSourceFront'])if(item[field])item[field]=url(item,field);return item;}
 const api={url,apply};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.GarmentAssetVersions=api;
})(typeof window==='undefined'?globalThis:window);
