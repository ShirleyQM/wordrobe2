/* Static desktop release. Original image bytes stay unchanged; edits live in IndexedDB. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'outputs/github-pages'),base=process.env.PAGES_BASE===undefined?'/wordrobe2':process.env.PAGES_BASE;
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(out,p)),{recursive:true});fs.writeFileSync(path.join(out,p),v);};
const prefix=s=>s.replace(/(["'`(=])\/(assets|api|outputs)\//g,(_,q,d)=>q+base+'/'+d+'/');
function walk(dir,rel=''){for(const r of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=path.posix.join(dir,r.name),target=path.posix.join(rel,r.name);if(r.isDirectory()){if(!/^(?:archive|snapshots|node_modules)$/.test(r.name))walk(p,target);}else if(/\.(?:html|js|css|json|svg|txt)$/.test(r.name))write(target,prefix(read(p)));else if(/\.(?:png|webp|jpg|jpeg|woff2?|ttf|gif|mp4)$/.test(r.name)){const bytes=fs.readFileSync(path.join(root,p)),hash=crypto.createHash('sha256').update(bytes).digest('hex'),dest='_media/'+hash+path.extname(p);if(!fs.existsSync(path.join(out,dest)))write(dest,bytes);media['/'+target]=dest;}}}
const media={};walk('assets','assets');
for(const name of fs.readdirSync(root))if(/\.(?:js|css|html|json)$/.test(name)&&!/^package/.test(name)&&!/^asset-upload/.test(name))write(name==='index.html'?'editor.html':name,prefix(read(name)));
if(fs.existsSync(path.join(root,'outputs/face-tha3/input.png'))){const b=fs.readFileSync(path.join(root,'outputs/face-tha3/input.png')),dest='_media/'+crypto.createHash('sha256').update(b).digest('hex')+'.png';write(dest,b);media['/outputs/face-tha3/input.png']=dest;}
const support=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
let worker=support('pages/worker-api.mjs').replace(/^import .*;\r?\n/gm,'').replace('export default {async fetch','const apiWorker={async fetch');
const seed=support('pages/seed.mjs').replace(/^export default\s+/,'const seed=');
const runtime=support('pages/browser-store.js');
write('wardrobe-sw.js',seed+'\nconst MEDIA='+JSON.stringify(media)+';\n'+worker+'\n'+runtime);
function launcher(target){return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>词秀 · 衣橱</title><style>body{background:#F8F6F3;color:#464148;font:16px sans-serif;display:grid;place-content:center;min-height:90vh}p{max-width:26em;line-height:1.8}</style><p id="status">正在打开衣橱…</p><script>(async()=>{try{if(!('serviceWorker'in navigator))throw Error('请通过 HTTPS 或本机 localhost 打开');await navigator.serviceWorker.register('./wardrobe-sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));location.replace(${JSON.stringify('./'+target)}+location.search+location.hash);}catch(e){document.getElementById('status').textContent=e.message;}})();</script></html>`;}
for(const page of ['mobile.html','learn.html']){write('_app/'+page,prefix(read(page)).replace('<head>','<head><base href="../">'));write(page,launcher('_app/'+page));}
write('index.html',launcher(process.env.PAGES_START==='mobile'?'_app/mobile.html':'editor.html'));
write('.nojekyll','');console.log(JSON.stringify({output:out,mediaPaths:Object.keys(media).length,originalBytesUnchanged:true,saveLocation:'This browser, IndexedDB'}));
