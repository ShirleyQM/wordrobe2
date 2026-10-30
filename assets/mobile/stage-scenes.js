(function(root){'use strict';
 const catalog=[
 {id:'silver-studio',zh:'银蓝摄影棚',en:'Silver Studio',color:'#d5dde5'},
 {id:'midnight-runway',zh:'午夜秀场',en:'Midnight Runway',color:'#44434d'},
 {id:'rain-street',zh:'雨后街拍',en:'After-Rain Street',color:'#a9b4bd'},
 {id:'gallery-evening',zh:'艺术开幕夜',en:'Gallery Evening',color:'#c6b7b0'}];
 const normalize=id=>catalog.some(s=>s.id===id)?id:catalog[0].id;
 function cover(iw,ih,w,h){if(![iw,ih,w,h].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid scene dimensions');const scale=Math.max(w/iw,h/ih),sw=w/scale,sh=h/scale;return [(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,w,h];}
 const api={catalog,normalize,cover};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StageSceneCore=api;
})(typeof window==='undefined'?globalThis:window);
(function(){'use strict';
 if(typeof window==='undefined'||!window.document)return;
 const stage=document.querySelector('.mobile-app .stage');if(!stage)return;
 const C=window.StageSceneCore,base=new URL('stage-backgrounds/',document.currentScript.src),loads=new Map();
 const text=(zh,en)=>window.I18n?.lang?.()==='en'?en:zh;
 const label=s=>text(s.zh,s.en),url=id=>new URL(C.normalize(id)+'.png',base).href;
 let request=0;
 const backdrop=document.createElement('img');backdrop.className='stage-scene-image';backdrop.alt='';backdrop.setAttribute('aria-hidden','true');backdrop.draggable=false;backdrop.hidden=true;stage.prepend(backdrop);
 const button=document.createElement('button');button.id='stage-scene-switch';button.type='button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');stage.append(button);
 const status=document.createElement('span');status.className='stage-scene-status';status.setAttribute('role','status');stage.append(status);
 function load(id){id=C.normalize(id);if(!loads.has(id)){const p=new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>{img.onload=img.onerror=null;reject(Error('Scene timeout'));},8000);img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(Error('Scene unavailable'));};img.src=url(id);});loads.set(id,p);p.catch(()=>{if(loads.get(id)===p)loads.delete(id);});}return loads.get(id);}
 function nameButton(){button.textContent=text('场景','Scene');button.title=text('选择换装背景','Choose a backdrop');button.setAttribute('aria-label',button.title+' · '+label(C.catalog.find(s=>s.id===current())));}
 function current(){return C.normalize(state.sceneId);}
 function apply(){const id=current(),ticket=++request;stage.dataset.scene=id;stage.style.setProperty('--stage-scene-color',C.catalog.find(s=>s.id===id).color);backdrop.hidden=true;nameButton();status.textContent='';return load(id).then(img=>{if(ticket!==request)return;backdrop.src=img.src;backdrop.hidden=false;}).catch(()=>{if(ticket!==request)return;status.textContent=text('背景暂不可用，可重新选择','Backdrop unavailable. Please choose again.');});}
 function select(id,{history=true,save=true}={}){id=C.normalize(id);if(history&&id!==current())window.LookLab?.checkpoint();state.sceneId=id;let unsaved=false;if(save){try{persist();}catch(e){unsaved=true;}}const painting=apply();if(unsaved)painting.then(()=>{if(current()===id)status.textContent=text('背景仅在本次页面中保留','Backdrop kept for this session only.');});return painting;}
 const dialog=document.createElement('dialog');dialog.id='stage-scene-dialog';document.body.append(dialog);
 function open(){dialog.innerHTML='<div class="scene-sheet-head"><h2>'+text('选择拍摄场景','Choose a backdrop')+'</h2><button type="button" data-scene-close aria-label="'+text('关闭','Close')+'">×</button></div><div class="scene-choices">'+C.catalog.map(s=>'<button type="button" data-scene-choice="'+s.id+'" aria-pressed="'+(s.id===current())+'"><img src="'+url(s.id)+'" alt="" loading="lazy" width="941" height="1672"><span>'+label(s)+'</span></button>').join('')+'</div>';dialog.querySelector('[data-scene-close]').onclick=()=>dialog.close();dialog.querySelectorAll('[data-scene-choice]').forEach(b=>b.onclick=()=>{select(b.dataset.sceneChoice);dialog.close();});dialog.showModal();button.setAttribute('aria-expanded','true');dialog.querySelector('[aria-pressed=true]')?.focus();}
 button.onclick=open;dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');button.focus({preventScroll:true});});
 async function paint(ctx,w,h,id){const scene=C.catalog.find(s=>s.id===C.normalize(id));ctx.fillStyle=scene.color;ctx.fillRect(0,0,w,h);try{const img=await load(scene.id);ctx.drawImage(img,...C.cover(img.naturalWidth,img.naturalHeight,w,h));}catch(e){/* The same neutral scene colour remains available offline. */}}
 window.StageScenes={current,select,restore:id=>select(id,{history:false}),paint,catalog:C.catalog};
 state.sceneId=current();apply();try{persist();}catch(e){}
})();