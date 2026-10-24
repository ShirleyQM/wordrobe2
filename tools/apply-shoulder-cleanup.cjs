const fs=require('fs'),sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'),clean=require('./soften-body-outline.cjs');
(async()=>{
 const files=['assets/materials/characters/head-cutout-v2/body-hairless.png'];
 for(let t=0;t<4;t++)for(let b=0;b<3;b++)files.push(`assets/materials/characters/underwear-integrated-v1/body-${t}-${b}.png`);
 const backup='outputs/shoulder-cleanup/original';fs.mkdirSync(backup,{recursive:true});
 for(const file of files){const saved=backup+'/'+file.split('/').slice(-2).join('-');if(!fs.existsSync(saved))fs.copyFileSync(file,saved);const {data,info}=await sharp(saved).ensureAlpha().raw().toBuffer({resolveWithObject:true});const original=Buffer.from(data),count=clean(data,info.width);for(let k=0;k<data.length;k+=4){if(data[k+3]!==original[k+3])throw Error('alpha changed');const y=Math.floor(k/4/info.width);if((y<245||y>=375)&&!data.subarray(k,k+4).equals(original.subarray(k,k+4)))throw Error('outside region changed');}await sharp(data,{raw:info}).png().toFile(file);console.log(file,count);}
 await sharp(files[0]).extract({left:275,top:235,width:390,height:150}).resize({width:780}).flatten({background:'#edf2fa'}).png().toFile('outputs/shoulder-cleanup/after.png');
})();
