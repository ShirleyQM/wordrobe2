/* Clothing occludes the base/underlayer without distorting garment pixels. */
(function(root){'use strict';
 function geometry(worn){let cut=1676;const rects=[];for(const item of worn||[]){const n=Number(item.hideBodyFrom);if(Number.isFinite(n)&&n>0)cut=Math.min(cut,Math.max(0,Math.min(1676,n)));for(const r of item.bodyOcclusionRects||[]){if(!Array.isArray(r)||r.length!==4||!r.every(Number.isFinite))continue;const [x,y,w,h]=r;if(w>0&&h>0)rects.push([Math.max(0,x),Math.max(0,y),Math.min(939,w),Math.min(1676,h)]);}}return {cut,rects};}
 function style(worn){const {cut,rects}=geometry(worn);let css=`clip-path:inset(0 0 ${(1676-cut)/1676*100}% 0);`;if(rects.length){const holes=rects.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="black"/>`).join('');const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="939" height="1676" viewBox="0 0 939 1676"><defs><mask id="body-cut"><rect width="939" height="1676" fill="white"/>${holes}</mask></defs><rect width="939" height="1676" fill="white" mask="url(#body-cut)"/></svg>`;const u="url('data:image/svg+xml,"+encodeURIComponent(svg)+"')";css+=`mask-image:${u};-webkit-mask-image:${u};mask-size:100% 100%;-webkit-mask-size:100% 100%;mask-repeat:no-repeat;`;}return css;}

 // Soft contact shadows follow whichever garment covers the other.
 // Source-space units keep the effect identical at desktop and mobile scales.
 function waistShadow(worn,order){
  const bottomAbove=order==='bottom';
  const top=worn.find(i=>i.slot==='top'),bottom=worn.find(i=>i.slot==='bottom');
  if(!top||!bottom||worn.some(i=>i.slot==='dress'))return '';
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const a=esc(root.UnderwearWardrobe.image(bottomAbove?top:bottom)),b=esc(root.UnderwearWardrobe.image(bottomAbove?bottom:top));
  if(!a||!b)return '';
  return `<svg class="waist-contact-shadow" aria-hidden="true" viewBox="0 0 939 1676" style="position:absolute;inset:0;width:100%;height:100%;max-width:none;pointer-events:none;overflow:visible" xmlns="http://www.w3.org/2000/svg"><defs><mask id="waist-top-alpha" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="939" height="1676"><image href="${a}" width="939" height="1676"/></mask><filter id="waist-contact" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="3" result="soft"/><feOffset in="soft" dy="${bottomAbove?-4:4}" result="lift"/><feFlood flood-color="#302922" flood-opacity="0.18"/><feComposite in2="lift" operator="in"/><feComposite in2="SourceAlpha" operator="out"/></filter></defs><g mask="url(#waist-top-alpha)"><image href="${b}" width="939" height="1676" filter="url(#waist-contact)"/></g></svg>`;
 }
 // Containment is separate from ordinary alpha compositing. Only fitted inner
 // roles may be constrained: never shrink a skirt or an outer coat to the body.
 // ordered is the SAME back-to-front list used by the renderer, not slot labels.
 const covers={bra:['top','dress','coat'],briefs:['bottom','dress'],top:['coat']};
 function containment(item,ordered){
  const at=ordered.findIndex(row=>row.id===item.id);
  if(at<0)return [];
  return ordered.slice(at+1).filter(row=>(covers[item.slot]||[]).includes(row.slot));
 }
 function garmentStyle(item,ordered,bodyURL){
  if(!bodyURL||!containment(item,ordered).length)return '';
  // CSS masks consume alpha, NOT skin brightness. Keep the original HD image;
  // neckline/opening/lace visibility is still the outer layer's actual alpha.
  const url=String(bodyURL).replace(/['"\\\n\r<>]/g,c=>'%'+c.charCodeAt(0).toString(16));
  return `mask-image:url('${url}');-webkit-mask-image:url('${url}');mask-mode:alpha;mask-size:100% 100%;-webkit-mask-size:100% 100%;mask-position:0 0;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat;`;
 }
 const api={geometry,style,waistShadow,containment,garmentStyle};root.GarmentBodyOcclusion=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

