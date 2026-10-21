const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip'};
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){res.writeHead(400);res.end();return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const allowedAsset=file.startsWith(path.join(root,'assets')+path.sep)&&['.png','.html','.json','.js','.txt','.css','.zip'].includes(path.extname(file));
  if(!file.startsWith(root+path.sep)||!allowedAsset&&!['index.html','mobile.html','style.css','app.js','gre-data.js','print.html','print.css','print.js'].includes(path.basename(file))){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(data);});
});
const port=Number(process.env.PORT)||4173;
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
