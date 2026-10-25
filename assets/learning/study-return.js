'use strict';
// Keep the learning goal visible. Returning never purchases or equips an item.
function returnToWardrobe(){if(window.ToolRoute){ToolRoute.go('mobile');return;}let from=null;try{from=JSON.parse(sessionStorage.getItem('wordrobe-study-return-v1')||'null');}catch(e){}if(from&&history.length>1)history.back();else location.href='mobile.html';}
document.querySelector('header>a')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();returnToWardrobe();});
