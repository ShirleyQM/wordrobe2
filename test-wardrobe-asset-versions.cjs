const assert=require('assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const decorateFactory=require('./wardrobe-asset-versions.cjs'),client=require('./assets/asset-version.js');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'wardrobe-assets-'));
try{
 const home=path.join(root,'assets');fs.mkdirSync(home);
 const file=path.join(home,'front.png');fs.writeFileSync(file,'old-paint');
 const groups=()=>[{items:[{id:'test',image:'/assets/front.png',front:'/assets/front.png',back:'/assets/front.png',thumbnail:'/assets/front.png'}]}];
 const decorate=decorateFactory(root),first=decorate(groups())[0].items[0];
 const firstUrl=client.url(first,'image');assert.match(firstUrl,/\?av=/);
 assert.equal(first.image,'/assets/front.png','response metadata leaves stored path intact');
 const stamp=first.assetVersions.image;
 assert.equal(decorate(groups())[0].items[0].assetVersions.image,stamp,'unchanged files keep URLs stable');
 fs.writeFileSync(file,'new-paint');const future=new Date(Date.now()+3000);fs.utimesSync(file,future,future);
 const second=decorate(groups())[0].items[0];assert.notEqual(second.assetVersions.image,stamp,'same URL and byte count still changes version');
 const nextUrl=client.url(second,'image');assert.notEqual(nextUrl,firstUrl);
 const imageOnly=second.front;client.apply(second);assert.equal(second.front,imageOnly,'editing source path remains intact');
 assert.equal(second.image,nextUrl);client.apply(second);assert.equal(second.image,nextUrl,'applying version twice is stable');
 assert.equal(new URL(second.image,'http://local').searchParams.getAll('av').length,1);
 assert.equal(client.url({image:'data:image/png;base64,eA==',assetVersions:{image:'x'}},'image'),'data:image/png;base64,eA==');
 const absent=decorate([{items:[{image:'/assets/missing.png'}]}])[0].items[0];assert.equal(client.url(absent,'image'),absent.image);
 assert.ok(!decorate([{items:[{image:'/assets/../../outside.png'}]}])[0].items[0].assetVersions);
 console.log('PASS: in-place replacement changes URLs, unchanged files remain stable, native paths and data URLs preserved, URL updates idempotent.');
}finally{
 // Only the explicitly created temporary fixture is removed.
 fs.rmSync(root,{recursive:true,force:true});
}
