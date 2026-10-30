(function(root){
 function clean(name){return String(name||'').replace(/炭灰|烟粉|灰紫|米白|象牙白|奶油色|奶油|海军蓝|焦糖棕|藏蓝|酒红|深棕|黑色|白色|奶白|蓝白|雾蓝|月白|深蓝|灰蓝|蓝灰|浅蓝|雾绿|静蓝|燕麦/g,'').replace('白衬衫','衬衫').replace('银链蓝吊坠','银链吊坠').replace(/\s*·\s*/g,' · ').trim();}
 function display(row){
  const en=root.I18n?.lang()==='en';
  if(row.customName)return en?row.nameEn||row.name:row.name;
  const piece=root.FashionSeries?.piece(row.id);
  if(piece)return en?piece.nameEn:piece.nameZh;
  if(root.FashionSeries?.forGarment(row.id,row).length)return en?row.nameEn||row.name:row.name;
  return en?row.nameEn||clean(row.name):clean(row.name);
 }
 root.GarmentNames={clean,display};
})(typeof window==='undefined'?globalThis:window);
