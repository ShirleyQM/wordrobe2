const {createHash}=require('node:crypto'),{gzipSync}=require('node:zlib');
// Cache transport encoding only. Every response is still built from current state.
module.exports=function(){let lastTag,lastGzip;return function(req,res,status,data){
 const body=JSON.stringify(data),headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 if(req.method==='GET'&&status===200){
  const tag='"'+createHash('sha256').update(body).digest('base64url')+'"';headers.ETag=tag;headers.Vary='Accept-Encoding';
  if(req.headers?.['if-none-match']===tag){res.writeHead(304,headers);res.end();return;}
  if(body.length>16384&&/\bgzip\b/.test(req.headers?.['accept-encoding']||'')){
   if(tag!==lastTag){lastTag=tag;lastGzip=gzipSync(body);}headers['Content-Encoding']='gzip';res.writeHead(status,headers);res.end(lastGzip);return;
  }
 }
 res.writeHead(status,headers);res.end(body);
};};
