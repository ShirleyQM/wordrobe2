const fs=require('fs'),path=require('path');let stamp='',data={items:{}};
module.exports=root=>{const p=path.join(root,'assets/cards/garment-links.json');if(!fs.existsSync(p))return data;const s=fs.statSync(p),next=p+':'+s.mtimeMs;if(stamp!==next){data=JSON.parse(fs.readFileSync(p,'utf8'));stamp=next;}return data;};
