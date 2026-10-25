/* Precomputed THA3 standard poses; no inference runs in the player's browser. */
'use strict';
window.FaceMotion=(()=>{
 const root='/assets/materials/characters/face-motion-cool-v1/',pose={gaze:0,blink:0,smile:0,brow:0,mouth:'neutral'},images={};
 let manifest,ready=false,enabled=true,nextBlink=performance.now()+1800,blinkAt=-1e6,last=0,manual=null,speaking=false,speechAt=0,revealKey='',coverage=null;
 try{enabled=localStorage.getItem('wardrobe-face-motion')!=='off';}catch(e){}
 const full=document.createElement('canvas');full.width=939;full.height=1676;const ctx=full.getContext('2d');
 const head=document.createElement('canvas');head.width=1000;head.height=1100;const hx=head.getContext('2d');
 const image=url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(url));im.src=url;});
 const active=()=>ready&&enabled&&window.CharacterPortraits?.selected()==='cool';
 function patch(group,name){if(name==='neutral')return;const g=manifest.groups[group],i=g.states.indexOf(name);if(i<0)return;const b=g.box;hx.drawImage(images[group+'Tiles'][i],b[0],b[1],b[2]-b[0],b[3]-b[1]);}
 function draw(now){
  if(!ready)return;
  if(!manual){if(now>nextBlink){blinkAt=now;nextBlink=now+2800+Math.random()*2600;}const t=now-blinkAt;pose.blink=t<80?t/80:t<125?1:t<250?1-(t-125)/125:0;}
  const p=manual||pose;hx.clearRect(0,0,1000,1100);hx.drawImage(images.original,0,0);
  patch('eyes',p.blink>.05?'blink-'+Math.max(1,Math.min(7,Math.round(p.blink*7))):p.gaze?'gaze-'+Math.max(-4,Math.min(4,Math.round(p.gaze))):'neutral');
  patch('brows',p.brow?'raise-'+Math.max(1,Math.min(4,Math.round(p.brow*4))):'neutral');
  let mouth=p.mouth||'neutral';if(speaking){const t=(now-speechAt)/1000;mouth=['aaa','iii','uuu','eee','ooo'][Math.floor(t*7)%5]+'-'+(1+Math.floor((Math.sin(t*19)+1)*1.49));}
  patch('mouth',mouth!=='neutral'?mouth:p.smile?'smile-'+Math.max(1,Math.min(3,Math.round(p.smile*3))):'neutral');
  ctx.clearRect(0,0,939,1676);ctx.drawImage(head,350,30,250,275);full.dataset.pose=JSON.stringify({...p,mouth});
 }
 function sync(){
  const on=active();
  const host=document.querySelector('.studio-top')||document.querySelector('.header-actions');
  if(ready&&host){let button=document.getElementById('face-motion-toggle');if(!button){button=document.createElement('button');button.id='face-motion-toggle';button.type='button';button.onclick=()=>setEnabled(!enabled);host.append(button);}const label=enabled?'动态：开':'动态：关';if(button.textContent!==label)button.textContent=label;if(button.getAttribute('aria-pressed')!==String(enabled))button.setAttribute('aria-pressed',String(enabled));}
  for(const im of document.querySelectorAll('img.character-face')){
   let c=im.nextElementSibling;if(!c?.classList.contains('face-motion-layer')){if(!on||im.dataset.face!=='cool')continue;c=document.createElement('canvas');c.className='face-motion-layer';c.width=939;c.height=1676;c.setAttribute('aria-label','动态脸部');c.style.cssText=im.style.cssText+';position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';im.after(c);}
   const hidden=!(on&&im.dataset.face==='cool');if(c.hidden!==hidden)c.hidden=hidden;const visibility=hidden?'':'hidden';if(im.style.visibility!==visibility)im.style.visibility=visibility;if(!c.hidden){const x=c.getContext('2d');x.clearRect(0,0,939,1676);x.drawImage(full,0,0);c.dataset.pose=full.dataset.pose;}
  }
  for(const c of document.querySelectorAll('.face-motion-reveal')){
   const x=c.getContext('2d');x.clearRect(0,0,939,1676);if(!on)continue;
   const reveal=window.HairStudio?.motionReveal?.();if(!reveal?.urls.length)continue;const key=JSON.stringify(reveal.urls);
   if(key!==revealKey){revealKey=key;coverage=null;Promise.all(reveal.urls.map(image)).then(ims=>{if(key!==revealKey)return;const h=document.createElement('canvas');h.width=939;h.height=1676;const y=h.getContext('2d',{willReadFrequently:true});for(const im of ims)y.drawImage(im,0,0,939,1676);coverage=y.getImageData(405,154,131,49).data;}).catch(console.error);}
   if(coverage){const f=ctx.getImageData(405,154,131,49).data,a=x.createImageData(131,49);a.data.set(HairFaceReveal.region(f,coverage,131,49,405,154,reveal.amount));x.putImageData(a,405,154);}
  }
 }
 function tick(now){requestAnimationFrame(tick);if(document.hidden||now-last<62)return;last=now;draw(now);sync();}
 function setEnabled(value){enabled=!!value;try{localStorage.setItem('wardrobe-face-motion',enabled?'on':'off');}catch(e){}manual=null;draw(performance.now());sync();if(typeof render==='function')render();}
 function setPose(value){manual=value?{...pose,blink:0,gaze:0,smile:0,brow:0,mouth:'neutral',...value}:null;draw(performance.now());sync();}
 function speak(text){if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)return false;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;u.onstart=()=>{speaking=true;speechAt=performance.now();};u.onend=u.onerror=()=>{speaking=false;};speechSynthesis.speak(u);return true;}
 document.addEventListener('pointermove',e=>{pose.gaze=Math.abs(e.clientX/innerWidth-.5)<.08?0:Math.round((e.clientX/innerWidth-.5)*8);},{passive:true});
 document.addEventListener('visibilitychange',()=>{nextBlink=performance.now()+1000;});
 Promise.all([fetch(root+'manifest.json').then(r=>{if(!r.ok)throw Error('Missing face motion manifest');return r.json();}),image(root+'original.png'),...['eyes','brows','mouth'].map(g=>image(root+g+'.png?v=full-resolution-2'))]).then(([m,original,eyes,brows,mouth])=>{manifest=m;Object.assign(images,{original,eyes,brows,mouth});for(const [name,g]of Object.entries(m.groups)){const [w,h]=g.tile;images[name+'Tiles']=g.states.map((_,i)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(images[name],i%g.columns*w,Math.floor(i/g.columns)*h,w,h,0,0,w,h);return c;});}ready=true;draw(performance.now());sync();if(typeof render==='function')render();document.dispatchEvent(new Event('face-motion-ready'));}).catch(e=>console.warn('Face motion falls back to original face',e));
 requestAnimationFrame(tick);
 return {active,setEnabled,setPose,speak,canvas:()=>full,headCanvas:()=>head,status:()=>({ready,enabled,faceId:'cool',speaking}),stopSpeech(){if(window.speechSynthesis)speechSynthesis.cancel();speaking=false;}};
})();
