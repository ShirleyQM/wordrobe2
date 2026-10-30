const fs=require('fs'),path=require('path');
module.exports=root=>async(req,res,p)=>{
 if(p!=='/api/footwear-config')return false;
 const file=path.join(root,'assets/materials/footwear-config.json');
 const reply=(n,v)=>{res.writeHead(n,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(v));};
 if(req.method==='GET'){reply(200,JSON.parse(fs.readFileSync(file,'utf8')));return true;}
 if(req.method!=='POST'){reply(405,{error:'不支持此操作'});return true;}
 if(req.headers.origin&&req.headers.origin!=='http://'+req.headers.host){reply(403,{error:'Origin rejected'});return true;}
 try{let s='';for await(const chunk of req){s+=chunk;if(s.length>4096)throw Error('配置过大');}const v=JSON.parse(s),doc=JSON.parse(fs.readFileSync(file,'utf8')),rule=doc.items[v.id];if(!rule)throw Error('未找到鞋子');if(!['open-toe','full-foot','closed-toe','boot'].includes(v.mode))throw Error('鞋型无效');const extension=Number(v.extension);if(!Number.isFinite(extension)||extension<0||extension>16)throw Error('脚趾延伸范围为0–16');const startY=v.startY===undefined?(rule.toeReveal?.startY||1638):Number(v.startY);if(!Number.isFinite(startY)||startY<1556||startY>1668)throw Error('后缘露出高度范围为8–120');rule.mode=v.mode;rule.toeReveal={...rule.toeReveal,extension,startY};if(!['open-toe','full-foot'].includes(v.mode)&&!rule.sourceRects.length)rule.sourceRects=[[330,1605,139,71],[470,1605,140,71]];fs.writeFileSync(file+'.tmp',JSON.stringify(doc,null,2));fs.renameSync(file+'.tmp',file);reply(200,{id:v.id,rule});}catch(e){reply(400,{error:e.message});}return true;
};
