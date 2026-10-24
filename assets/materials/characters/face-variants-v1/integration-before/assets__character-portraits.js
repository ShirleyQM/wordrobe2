'use strict';
window.CharacterPortraits=(()=>{
 const key='wardrobe-portrait-v1',root='assets/materials/characters/bun-forward-v2/';
 const versions=[{id:'unified-face',name:'统一人物',image:'assets/materials/characters/underwear-integrated-v1/body-0-0.png'}];
 let selected='unified-face';
 function mount(){if(versions.length===1||document.getElementById('portrait-version'))return;const select=document.createElement('select');select.id='portrait-version';select.setAttribute('aria-label','立绘版本');select.style.cssText='max-width:190px;padding:6px 9px;border:1px solid #cad9ed;border-radius:5px;background:#fff;color:inherit;font:inherit';select.innerHTML=versions.map(v=>`<option value="${v.id}">${v.name}</option>`).join('');select.value=selected;document.querySelector('.studio-top').append(select);select.addEventListener('change',()=>{selected=select.value;try{localStorage.setItem(key,selected);}catch(e){}window.HairStudio?.useBase?.();if(typeof render==='function')render();for(const id of ['preppy-editor','prints-editor'])document.getElementById(id)?.contentWindow?.postMessage({type:'wardrobe-portrait-changed'},location.origin);});}
 return {mount,usesBuiltInUnder:()=>false,body:()=>versions.find(v=>v.id===selected).image,versions};
})();
