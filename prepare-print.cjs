const fs=require('fs');
const path=require('path');
const target=path.join(__dirname,'assets','print-studio');
fs.mkdirSync(target,{recursive:true});
const html=fs.readFileSync(path.join(__dirname,'print.html'),'utf8')
 .replace('<head>','<head><base href="../../">')
 .replace('<link rel="stylesheet" href="print.css">','<style>'+fs.readFileSync(path.join(__dirname,'print.css'),'utf8')+'</style>')
 .replace('<script src="print.js"></script>','<script src="assets/print-studio/app.js"></script>');
fs.writeFileSync(path.join(target,'index.html'),html);
fs.copyFileSync(path.join(__dirname,'print.js'),path.join(target,'app.js'));
fs.copyFileSync(path.join(__dirname,'print-transform.js'),path.join(target,'transform.js'));
fs.copyFileSync(path.join(__dirname,'print-garment.js'),path.join(target,'garment.js'));
fs.copyFileSync(path.join(__dirname,'print-fabric.js'),path.join(target,'fabric.js'));
console.log('Prepared assets/print-studio/index.html');
