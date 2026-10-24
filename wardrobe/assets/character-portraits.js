'use strict';
window.CharacterPortraits=(()=>{
 const key='wardrobe-portrait-v1',root='assets/materials/characters/face-variants-v1/';
 const versions=[{id:'unified-face',name:'原始脸',thumbnail:root+'original-head-neckless.png'},...[
  ['cool','清冷杏眼'],['gentle','柔和圆眼'],['poised','成熟长眼'],
  ['slender','素净小杏眼'],['soft-small','柔和细眼'],['sharp-small','清爽单眼皮']
 ].map(([id,name])=>{const assets=['poised','slender','soft-small','sharp-small'].includes(id)?'assets/materials/characters/face-variants-v2/':root,revision=['slender','soft-small','sharp-small'].includes(id)?'?rev=natural-eyes-2':'';return {id,name,image:assets+id+'/face-overlay.png'+revision,thumbnail:assets+id+'/head-hd.png'+revision,body:assets+id+'/body-0-0.png'+revision};})];
 const realRoot='assets/materials/characters/face-realistic-v3/';
 versions.push(...[['real-natural','写实·清秀圆颌'],['real-warm','写实·柔和雀斑'],['real-defined','写实·自然骨相']].map(([id,name])=>({id,name,fullHead:true,assets:realRoot+id+'/',thumbnail:realRoot+id+'/head-hd.png',body:realRoot+id+'/body-0-0.png'})));
 const variantRoot='assets/materials/characters/face-realistic-v4/';
 versions.push(...[['real-cool-soft','清冷·淡颜'],['real-cool-sharp','清冷·英气'],['real-puppy-soft','狗狗眼·温柔'],['real-puppy-bright','狗狗眼·灵动']].map(([id,name])=>({id,name,fullHead:true,assets:variantRoot+id+'/',thumbnail:variantRoot+id+'/head-hd.png',body:variantRoot+id+'/body-0-0.png'})));
 const flatRoot='assets/materials/characters/face-cool-flat-v5/';
 versions.push(...[['flat-cool-straight','原风·平眉'],['flat-cool-almond','原风·杏眼'],['flat-cool-defined','原风·英气'],['flat-cool-quiet','原风·淡漠']].map(([id,name])=>({id,name,fullHead:true,assets:flatRoot+id+'/',thumbnail:flatRoot+id+'/head-hd.png',body:flatRoot+id+'/body-0-0.png'})));
 let selected='unified-face';
 try{const saved=localStorage.getItem(key);if(versions.some(v=>v.id===saved))selected=saved;}catch(e){}
 const available=v=>!window.MATERIAL_PLAYER||window.MaterialVisibility?.visible('face:'+v.id);const current=()=>versions.find(v=>v.id===selected&&available(v))||versions.find(available)||versions[0];
 function refresh(){const input=document.getElementById('portrait-version');if(input)input.value=selected;if(typeof render==='function')render();}
 function select(id){if(!versions.some(v=>v.id===id))return false;selected=id;try{localStorage.setItem(key,id);}catch(e){}refresh();return true;}
 function mount(){const host=document.querySelector('.studio-top');if(!host||document.getElementById('portrait-version'))return;const label=document.createElement('label');label.textContent='换脸 ';label.style.cssText='display:flex;align-items:center;gap:5px';const input=document.createElement('select');input.id='portrait-version';input.setAttribute('aria-label','换脸');input.style.cssText='max-width:130px;padding:6px 9px;border:1px solid #cad9ed;border-radius:5px;background:#fff;color:inherit;font:inherit';input.innerHTML=versions.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');input.value=selected;input.addEventListener('change',()=>select(input.value));label.append(input);host.append(label);}
 window.addEventListener('storage',event=>{if(event.key!==key)return;selected=versions.some(v=>v.id===event.newValue)?event.newValue:'unified-face';refresh();});
 return {mount,select,selected:()=>current().id,versions,usesBuiltInUnder:()=>false,
  baseBody:url=>{const file=url.split('?')[0].split('/').pop();return current().fullHead&&/^body-[01]-[01]\.png$/.test(file)?current().assets+file:url;},
  body:()=>current().body||'assets/materials/characters/low-coverage-v3/body-0-0.png',
  revealBody:()=>current().body||'assets/materials/characters/body-clean-v2/body-hairless.png',
  layer:(style='')=>!current().fullHead&&current().image?`<img class="character-face" data-face="${selected}" src="${current().image}" alt="${current().name}" style="${style}" draggable="false">`:''};
})();
