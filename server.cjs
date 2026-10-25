const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const learningRoute=require('./learning-route.cjs')(root);
const hairDefaultsRoute=require('./hair-defaults-route.cjs')(root);
const wardrobeRoute=require('./wardrobe-store.cjs')(root);
const regenerationRoute=require('./regeneration-route.cjs')(root);
const printedRoute=require('./printed-garments.cjs')(root).route;
const notesRoute=require('./garment-notes.cjs')(root);
const variationsRoute=require('./garment-variations.cjs')(root);
const artDeliverySync=require('./art-delivery-sync.cjs')(root);
const garmentDeletions=require('./garment-deletions.cjs')(root);
const wardrobePolicy=require('./wardrobe-policy.cjs')(root);
const {canonicalURL}=require('./asset-paths.cjs');
const versionGarmentAssets=require('./wardrobe-asset-versions.cjs')(root);
const types = {'.woff2':'font/woff2','.ttf':'font/ttf','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.zip':'application/zip'};
const server=http.createServer(async(req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){res.writeHead(400);res.end();return;}
  if(await learningRoute(req,res,pathname))return;
  if(await hairDefaultsRoute(req,res,pathname))return;
  if(pathname==='/api/wardrobe'||pathname==='/assets/materials/garments/collection.json')await artDeliverySync.sync();
  if(await wardrobePolicy.route(req,res,pathname))return;
  if(await garmentDeletions.route(req,res,pathname))return;
  if(pathname==='/assets/materials/garments/collection.json'){const collection=JSON.parse(fs.readFileSync(path.join(root,'assets/materials/garments/collection.json'),'utf8')),deleted=garmentDeletions.deletedIds();collection.items=collection.items.filter(i=>!deleted.has(i.id)&&wardrobePolicy.visible(i.id));wardrobePolicy.decorate([{group:'library',items:collection.items}]);versionGarmentAssets([{items:collection.items}]);res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(collection));return;}
  if(await notesRoute(req,res,pathname))return;
  if(await variationsRoute(req,res,pathname))return;
  if(await printedRoute(req,res,pathname))return;
  if(await regenerationRoute(req,res,pathname))return;
  if(await wardrobeRoute(req,res,pathname))return;
  pathname=canonicalURL(root,pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const allowedAsset=file.startsWith(path.join(root,'assets')+path.sep)&&['.png','.html','.json','.js','.txt','.css','.zip','.woff2','.ttf'].includes(path.extname(file));
  if(!file.startsWith(root+path.sep)||!allowedAsset&&!['index.html','mobile.html','materials.html','learn.html','style.css','app.js','gre-data.js','print.html','print.css','print.js'].includes(path.basename(file))){res.writeHead(404);res.end('Not found');return;}
  let stat;try{stat=fs.statSync(file);}catch(e){res.writeHead(404);res.end('Not found');return;}
  const etag='"'+stat.size.toString(16)+'-'+Math.trunc(stat.mtimeMs).toString(16)+'"';
  if(req.headers['if-none-match']===etag){res.writeHead(304,{'ETag':etag,'Cache-Control':'private, max-age=0, must-revalidate'});res.end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'private, max-age=0, must-revalidate','ETag':etag});res.end(data);});
});
const port=Number(process.env.PORT)||4173;
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));
artDeliverySync.sync();setInterval(()=>artDeliverySync.sync(),15000).unref();
