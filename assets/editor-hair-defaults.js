'use strict';
// Read the same saved placement table as the mobile game. Loading is read-only.
(function(){let stamp;async function syncSavedHair(){try{const r=await fetch('/api/hair-defaults',{cache:'no-store'});if(!r.ok)return;const next=await r.json();if(!next.positionDefaults)return;const value=JSON.stringify(next);if(value===stamp)return;stamp=value;window.dispatchEvent(new CustomEvent('hair-defaults-synced',{detail:next}));}catch(e){console.warn('已保存发型位置暂未载入',e);}}syncSavedHair();window.addEventListener('focus',syncSavedHair);})();
