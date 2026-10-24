const fs=require('fs'),path=require('path'),crypto=require('crypto');
module.exports=function(root){
 const relative='assets/materials',read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
 const write=(p,data)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2));fs.renameSync(file+'.tmp',file);};
 const catalogPath=relative+'/garments/collection.json',importsPath=relative+'/sources/imported/catalog.json',recordPath=relative+'/published/printed-garments.json';
 function png(url,w=939,h=1676){if(typeof url!=='string'||!url.startsWith('data:image/png;base64,'))throw Error('需要 PNG');const b=Buffer.from(url.slice(22),'base64');if(b.length<33||b.length>12*1024*1024||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||b.readUInt32BE(16)!==w||b.readUInt32BE(20)!==h)throw Error('图片画布无效');return b;}
 function save(input){
  if(!/^[a-f0-9-]{36}$/.test(input.requestId||''))throw Error('保存编号无效');
  const records=fs.existsSync(path.join(root,recordPath))?read(recordPath):{version:1,items:[]};const prior=records.items.find(i=>i.requestId===input.requestId);if(prior)return prior;
  const collection=read(catalogPath),base=collection.items.find(i=>i.id===input.baseId);if(!base)throw Error('原衣服不存在'); const policy=require('./wardrobe-policy.cjs')(root);
  if(require('./regeneration-store.cjs')(root).unavailable().has(base.id))throw Error('原衣服正在重新生成，暂不可保存');
  let effective={image:base.runtimeFront||base.front,back:base.runtimeBack||base.back};let fitted;const preppyPath=relative+'/published/preppy.json';if(fs.existsSync(path.join(root,preppyPath))){const preppy=read(preppyPath),row=preppy.items.find(i=>i.id===base.id);if(row){effective={image:row.image||row.front,back:row.back};fitted=preppy.draft[base.id];}}
  const fpath=relative+'/published/fittings.json';if(fs.existsSync(path.join(root,fpath))){const f=read(fpath);fitted=f.draft[base.id]||fitted;const row=f.items.find(i=>i.id===base.id);if(row)effective={image:row.image||row.front,back:row.back};}
  if(input.sourceImage!==effective.image||input.sourceBack!==effective.back)throw Error('衣服有更新，请刷新预览后再保存');
  const material=input.material||{},hasPattern=input.patternId!=null,caps=policy.capabilities(base,effective),fabrics=require('./fabric-presets.cjs')(root).list();if(hasPattern&&!caps.print)throw Error('这件衣服暂不支持印花');if(material.color&&!caps.recolor)throw Error('这件衣服暂不支持改色');if(material.fabric&&!caps.fabric)throw Error('这件衣服暂不支持布料纹理');
  if(material.color!=null&&!/^#[0-9a-f]{6}$/i.test(material.color))throw Error('颜色无效');
  if(material.fabric!=null&&!fabrics.some(p=>p.id===material.fabric))throw Error('布料无效');
  if(material.textureStrength!=null&&(!Number.isFinite(material.textureStrength)||material.textureStrength<0||material.textureStrength>200))throw Error('布纹强度无效');
  if(!hasPattern&&!material.color&&!material.fabric)throw Error('请选择颜色、布料或图案');
  const classic={rose:'花枝',butterfly:'蝴蝶',cat:'小猫',heart:'心形',leaf:'橡树叶',acorn:'橡果',pumpkin:'南瓜','strawberry-cake':'草莓蛋糕','blueberry-cake':'蓝莓蛋糕'};let patternName=classic[input.patternId];
  if(!patternName&&input.patternId?.startsWith('lettering-')){const file=relative+'/patterns/lettering/manifest.json',rows=fs.existsSync(path.join(root,file))?read(file):[],row=rows.find(i=>'lettering-'+i.id===input.patternId&&i.alpha);if(!row)throw Error('图案不存在');patternName=row.text;}
  if(hasPattern&&!patternName){const motifs=read(relative+'/patterns/motifs/manifest.json'),row=motifs.find(i=>'motif-'+i.id===input.patternId);if(!row)throw Error('图案不存在');const names={botanical:'花草','red-retro':'复古红','valentine-collection':'心动','romantic-mix':'浪漫','cake-shop':'甜点','forest-doodle':'森林手绘',summer:'夏日','woodland-watercolor':'水彩森林','rose-garden':'玫瑰','pink-doodle':'粉色手绘'};patternName=(names[row.category]||'图案')+' '+row.id.slice(1);}
  if(hasPattern&&(!input.box||!['x','y','width','height'].every(k=>Number.isFinite(input.box[k]))||input.box.width<=0||input.box.height<=0))throw Error('印花位置无效');
  const front=png(input.front),back=png(input.back),thumb=png(input.thumbnail,340,340),M=require('./assets/atelier-preppy-v1/mesh.js'),C=require('./print-garment.js');
  const bounds=input.bounds;if(!Array.isArray(bounds)||bounds.length!==4||!M.valid(M.grid(bounds)))throw Error('衣服范围无效');
  let contours=base.contours;if(fitted?.contours?.every(C.valid)&&M.valid(fitted.mesh))contours=fitted.contours.map(shape=>C.path(shape.map(segment=>{const result=structuredClone(segment);for(let k=0;k<result.values.length;k+=2){const p=M.map(fitted.mesh,{x:result.values[k],y:result.values[k+1]});result.values[k]=p.x;result.values[k+1]=p.y;}return result;})));
  const sequence=records.items.filter(i=>i.baseId===base.id&&i.patternId===input.patternId).length+1,number=String(sequence).padStart(3,'0'),id='printed-'+crypto.randomUUID(),clean=require('vm').runInNewContext(fs.readFileSync(path.join(root,'assets/garment-names.js'),'utf8')+';GarmentNames.clean');
  const name=(hasPattern?patternName+'印花':material.fabric?(fabrics.find(p=>p.id===material.fabric)?.name||'布料'):'改色')+'＋'+clean(base.name)+'＋'+number,prefix='/assets/materials/garments/'+id+'/',folder=path.join(root,relative,'garments',id);fs.mkdirSync(folder,{recursive:true});
  for(const [file,data]of [['front.png',front],['back.png',back],['thumb.png',thumb]])fs.writeFileSync(path.join(folder,file),data);
  const item={id,name,slot:base.slot,body:base.body,front:prefix+'front.png',back:prefix+'back.png',thumbnail:prefix+'thumb.png',bounds,contours,defaultVisible:true,hideBodyFrom:base.hideBodyFrom||0,bodyOcclusionRects:base.bodyOcclusionRects||[],recommendedUnderlayer:base.recommendedUnderlayer,sourceSha256:crypto.createHash('sha256').update(front).digest('hex'),sourceRevision:id,fitStatus:'edited',printedFrom:base.id,printPattern:hasPattern?{id:input.patternId,name:patternName,box:input.box}:null,materialAppearance:{color:material.color||null,fabric:material.fabric||null,textureStrength:material.textureStrength??100},createdAt:new Date().toISOString()};
  collection.items.push(item);const imported=read(importsPath);imported.items.push({id,name,slot:item.slot,body:item.body,image:item.front,back:item.back,thumbnail:item.thumbnail,hideBodyFrom:item.hideBodyFrom,bodyOcclusionRects:item.bodyOcclusionRects,recommendedUnderlayer:item.recommendedUnderlayer,price:0,editor:'preppy',fitStatus:'edited',sourceCollection:'printed-garments'});
  const result={id,name,baseId:base.id,patternId:input.patternId,sequence,requestId:input.requestId,createdAt:item.createdAt};records.items.push(result);
  write(catalogPath,collection);write(importsPath,imported);write(recordPath,records);
  const indexPath=relative+'/catalog.json';if(fs.existsSync(path.join(root,indexPath))){const index=read(indexPath);index.garments.count=collection.items.length;write(indexPath,index);}
  return result;
 }
 async function route(req,res,pathname){if(pathname!=='/api/printed-garments')return false;const reply=(s,b)=>{res.writeHead(s,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(b));};if(req.method!=='POST'){reply(405,{error:'Method not allowed'});return true;}if(req.headers.origin!==`http://${req.headers.host}`){reply(403,{error:'Origin rejected'});return true;}try{let size=0,parts=[];for await(const part of req){size+=part.length;if(size>30*1024*1024)throw Error('文件过大');parts.push(part);}reply(201,save(JSON.parse(Buffer.concat(parts).toString())));}catch(e){reply(400,{error:e.message});}return true;}
 return {save,route};
};


