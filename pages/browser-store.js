const BASE=new URL(self.registration.scope).pathname.replace(/\/$/,'');
const database=new Promise((resolve,reject)=>{const r=indexedDB.open('wordrobe-desktop-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('objects');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
class BrowserBucket{
 async get(key){const db=await database;return new Promise((resolve,reject)=>{const tx=db.transaction('objects'),q=tx.objectStore('objects').get(key);q.onsuccess=()=>{const v=q.result;resolve(v?{etag:v.etag,httpEtag:'"'+v.etag+'"',body:v.bytes,json:async()=>JSON.parse(new TextDecoder().decode(v.bytes))}:null);};q.onerror=()=>reject(q.error);});}
 async put(key,input,options={}){const bytes=typeof input==='string'?new TextEncoder().encode(input):new Uint8Array(input),etag=crypto.randomUUID(),db=await database;return new Promise((resolve,reject)=>{const tx=db.transaction('objects','readwrite'),s=tx.objectStore('objects'),q=s.get(key);let changed=false;q.onsuccess=()=>{const v=q.result,c=options.onlyIf;if(c?.etagMatches&&v?.etag!==c.etagMatches||c?.etagDoesNotMatch==='*'&&v)return;s.put({bytes,etag},key);changed=true;};tx.oncomplete=()=>resolve(changed?{etag}:null);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('浏览器保存失败'));});}
}
function reconcileRecord(key,value,fallback){
 if(key==='visibility'&&fallback?.items)return {...fallback,...value,items:{...fallback.items,...value.items}};
 if(!['preppy','prints','imprints','fittings'].includes(key)||!fallback?.items||value._seedRevision===fallback.revision)return value;
 const local=(value.items||[]).filter(i=>i.cloudEdited||String(i.image||i.front||'').startsWith('/assets/materials/published/cloud/'));
 const items=new Map(fallback.items.map(i=>[i.id,i])),draft={...(fallback.draft||{})};
 for(const i of local){items.set(i.id,i);if(value.draft?.[i.id])draft[i.id]=value.draft[i.id];}
 if(Array.isArray(fallback.draft?.__updated)||Array.isArray(value.draft?.__updated))draft.__updated=[...new Set([...(fallback.draft?.__updated||[]),...local.map(i=>i.id)])];
 return {...fallback,...value,items:[...items.values()],draft,revision:Math.max(value.revision||0,fallback.revision||0)+1,_seedRevision:fallback.revision};
}
const env={BUCKET:new BrowserBucket(),reconcile:reconcileRecord};
async function sourceAssetRoute(){return null;}
async function staticResponse(req){const u=new URL(req.url);u.pathname=BASE+u.pathname;return fetch(u);}
function rewrite(s,back=false){return back?s.split(BASE+'/assets/').join('/assets/').split(BASE+'/api/').join('/api/').split(BASE+'/outputs/').join('/outputs/'):s.replace(/"\/(assets|api|outputs)\//g,(_,d)=>'"'+BASE+'/'+d+'/');}
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{const original=event.request,u=new URL(original.url);if(u.origin!==location.origin||!u.pathname.startsWith(BASE+'/'))return;const p=decodeURIComponent(u.pathname.slice(BASE.length));
 if(MEDIA[p]){event.respondWith(fetch(new Request(new URL(BASE+'/'+MEDIA[p],u),original)));return;}
 if(!p.startsWith('/api/')&&!p.startsWith('/assets/materials/published/cloud/')&&!['/assets/materials/garments/collection.json','/assets/materials/published/hair-defaults.json'].includes(p))return;
 event.respondWith((async()=>{u.pathname=p;const headers=new Headers(original.headers);headers.set('origin',u.origin);const method=original.method,body=['GET','HEAD'].includes(method)?undefined:rewrite(await original.text(),true);const req=new Request(u,{method,headers,...body!==undefined?{body}:{}}),r=await apiWorker.fetch(req,env);if(r.headers.get('content-type')?.includes('application/json')){const h=new Headers(r.headers);h.delete('content-length');return new Response(rewrite(await r.text()),{status:r.status,headers:h});}return r;})());
});
