'use strict';
// Study never purchases or redirects to a purchase target.
goalHTML=()=>'';
function returnToWardrobe(){if(window.ToolRoute){ToolRoute.go('mobile');return;}let from=null;try{from=JSON.parse(sessionStorage.getItem('wordrobe-study-return-v1')||'null');}catch(e){}if(from&&history.length>1)history.back();else location.href='mobile.html';}
document.querySelector('header>a')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();returnToWardrobe();});
