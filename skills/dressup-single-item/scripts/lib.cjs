const fs=require('fs'),path=require('path'),crypto=require('crypto');
function dep(name){try{return require(name);}catch(e){if(process.env.DRESSUP_NODE_MODULES)return require(path.join(process.env.DRESSUP_NODE_MODULES,name));throw new Error('Set DRESSUP_NODE_MODULES to bundled runtime node_modules: '+name);}}
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function readBatch(file){file=path.resolve(file);return {config:JSON.parse(fs.readFileSync(file)),root:path.dirname(file),file};}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2));}
module.exports={fs,path,dep,hash,readBatch,write};
