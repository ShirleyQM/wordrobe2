'use strict';

window.CharacterPortraits=(()=>{

 const key='wardrobe-portrait-v1',regeneratedRoot='/assets/materials/characters/face-regenerated-v7/';

 const regenerated=(id,name)=>({id,name,fullHead:true,neckless:true,assets:regeneratedRoot+id+'/',headImage:regeneratedRoot+id+'/head-canvas.png',thumbnail:regeneratedRoot+id+'/head-hd.png',body:regeneratedRoot+id+'/body-0-0.png'});

 const versions=[regenerated('unified-face','原始脸'),...[

  ['cool','清冷杏眼'],['gentle','柔和圆眼'],['poised','成熟长眼'],

  ['slender','素净小杏眼'],['soft-small','柔和细眼'],['sharp-small','清爽单眼皮']

 ].map(([id,name])=>regenerated(id,name))];

 const pureRoot='/assets/materials/characters/face-pure-v8/';

 versions.push(...[['pure-black','清纯·黑瞳'],['pure-brown','清纯·棕瞳']].map(([id,name])=>({id,name,fullHead:true,neckless:true,assets:pureRoot+id+'/',headImage:pureRoot+id+'/head-canvas.png',thumbnail:pureRoot+id+'/head-hd.png',body:pureRoot+id+'/body-0-0.png'})));

 const distinctRoot='/assets/materials/characters/face-distinct-v9/';
 versions.push(...[['puppy-soft-round','小狗眼·软圆脸'],['puppy-warm-heart','小狗眼·甜心脸'],['goddess-cool-defined','清冷女神·疏朗骨相']].map(([id,name])=>({id,name,fullHead:true,neckless:true,assets:distinctRoot+id+'/',headImage:distinctRoot+id+'/head-canvas.png',thumbnail:distinctRoot+id+'/head-hd.png',body:distinctRoot+id+'/body-0-0.png'})));
 const beautyRoot='/assets/materials/characters/face-beauty-v10/';
 versions.push(...[['beauty-puppy','温柔·水杏小狗眼'],['beauty-goddess','清冷·玉颜女神'],['beauty-radiant','明艳·桃花甜心']].map(([id,name])=>({id,name,fullHead:true,neckless:true,assets:beautyRoot+id+'/',headImage:beautyRoot+id+'/head-canvas.png',thumbnail:beautyRoot+id+'/head-hd.png',body:beautyRoot+id+'/body-0-0.png'})));
 const relaxedRoot='/assets/materials/characters/face-relaxed-v11/';
 versions.push({id:'relaxed-y2k',name:'Y2K·松弛小眼',fullHead:true,neckless:true,assets:relaxedRoot+'relaxed-y2k/',headImage:relaxedRoot+'relaxed-y2k/head-canvas.png',thumbnail:relaxedRoot+'relaxed-y2k/head-hd.png',body:relaxedRoot+'relaxed-y2k/body-0-0.png'});
 const realRoot='/assets/materials/characters/face-realistic-v3/';

 versions.push(...[['real-natural','写实·清秀圆颌'],['real-warm','写实·柔和雀斑'],['real-defined','写实·自然骨相']].map(([id,name])=>({id,name,fullHead:true,assets:realRoot+id+'/',thumbnail:realRoot+id+'/head-hd.png',body:realRoot+id+'/body-0-0.png'})));

 const variantRoot='/assets/materials/characters/face-realistic-v4/';

 versions.push(...[['real-cool-soft','清冷·淡颜'],['real-cool-sharp','清冷·英气'],['real-puppy-soft','狗狗眼·温柔'],['real-puppy-bright','狗狗眼·灵动']].map(([id,name])=>({id,name,fullHead:true,assets:variantRoot+id+'/',thumbnail:variantRoot+id+'/head-hd.png',body:variantRoot+id+'/body-0-0.png'})));

 const flatRoot='/assets/materials/characters/face-cool-flat-v5/';

 versions.push(...[['flat-cool-straight','原风·平眉'],['flat-cool-almond','原风·杏眼'],['flat-cool-defined','原风·英气'],['flat-cool-quiet','原风·淡漠']].map(([id,name])=>({id,name,fullHead:true,assets:flatRoot+id+'/',thumbnail:flatRoot+id+'/head-hd.png',body:flatRoot+id+'/body-0-0.png'})));

 let selected='cool';

 try{const saved=localStorage.getItem(key);if(versions.some(v=>v.id===saved))selected=saved;}catch(e){}

 try{if(!localStorage.getItem('wardrobe-default-face-cool-v1')){selected='cool';localStorage.setItem(key,selected);localStorage.setItem('wardrobe-default-face-cool-v1','1');}}catch(e){}

 const available=v=>!window.MATERIAL_PLAYER||window.MaterialVisibility?.visible('face:'+v.id);const current=()=>versions.find(v=>v.id===selected&&available(v))||versions.find(available)||versions[0];

 function refresh(){const input=document.getElementById('portrait-version');if(input)input.value=selected;if(typeof render==='function')render();}

 function select(id){if(!versions.some(v=>v.id===id))return false;selected=id;try{localStorage.setItem(key,id);}catch(e){}refresh();return true;}

 function mount(){const host=document.querySelector('.studio-top');if(!host||document.getElementById('portrait-version'))return;const label=document.createElement('label');label.textContent='换脸 ';label.style.cssText='display:flex;align-items:center;gap:5px';const input=document.createElement('select');input.id='portrait-version';input.setAttribute('aria-label','换脸');input.style.cssText='max-width:130px;padding:6px 9px;border:1px solid #cad9ed;border-radius:5px;background:#fff;color:inherit;font:inherit';input.innerHTML=versions.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');input.value=selected;input.addEventListener('change',()=>select(input.value));label.append(input);host.append(label);}

 window.addEventListener('storage',event=>{if(event.key!==key)return;selected=versions.some(v=>v.id===event.newValue)?event.newValue:'unified-face';refresh();});

 return {mount,select,selected:()=>current().id,versions,usesBuiltInUnder:()=>false,

  head:()=>'/assets/materials/characters/separated-body-v1/heads/'+current().id+'.png',

  baseBody:url=>{const m=url.match(/\/(clean-body-v4|separated-body-v1|underwear-body-display-v1|strapless-body-display-v1)\/(body-[01]-[01]\.png)/);return current().neckless&&m?(m[1].endsWith('body-display-v1')?'/assets/materials/characters/'+m[1]+'/body-support/'+m[2]+'?v=1':regeneratedRoot+'body-support/'+m[2]+'?v=neck-join-2'):url;},

  body:()=>current().body||'assets/materials/characters/low-coverage-v3/body-0-0.png',

  revealBody:()=>current().body||'assets/materials/characters/body-clean-v2/body-hairless.png',

  layer:(style='')=>`<img class="character-face" data-face="${current().id}" src="/assets/materials/characters/separated-body-v1/heads/${current().id}.png" alt="${current().name}" style="${style}" draggable="false">`};

})();

