'use strict';
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
 const view=button.dataset.view,compare=view==='compare';
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));
 const stage=document.querySelector('#stage');stage.classList.toggle('compare',compare);stage.classList.toggle('detail',view==='campus-details.png');
 document.querySelector('#primary').src=compare?'base-no-bangs.png':view;
 document.querySelector('#controls').hidden=!compare;
}));
document.querySelector('#opacity').addEventListener('input',event=>document.querySelector('#comparison').style.opacity=Number(event.target.value)/100);
