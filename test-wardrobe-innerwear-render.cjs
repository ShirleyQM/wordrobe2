const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const ctx={window:{addEventListener(){}},requestAnimationFrame(){},fetch:()=>Promise.resolve({}),localStorage:{getItem:()=>JSON.stringify({enabled:true,front:'03',back:'02'}),setItem(){}}};
vm.runInNewContext(fs.readFileSync('assets/hair-studio.js','utf8'),ctx);
vm.runInNewContext(fs.readFileSync('assets/underwear-wardrobe.js','utf8'),ctx);
const under=ctx.window.UnderwearWardrobe,hair=ctx.window.HairStudio,style='clip-path:inset(0 0 6% 0);';
assert.equal(hair.underStyle(style),style,'hair replacement must not crop the shoulder fabric at 19.1%');
assert.equal(hair.underStyle(''),'','bare garment should retain its full upper alpha');
assert.equal(under.image({id:'lowcut-bikini-top-v1',image:'/assets/latest-fit.png?av=new'}),'/assets/latest-fit.png?av=new','known underwear must use its current fitted and versioned image');
assert.match(under.image({id:'lowcut-bikini-top-v1'}),/low-coverage-v3/,'legacy image remains a fallback when no current art is provided');
const main=fs.readFileSync('app.js','utf8').match(/^function liveFigure\(\).*$/m)[0],mobile=fs.readFileSync('assets/mobile/app.js','utf8').match(/^function figure\(\).*$/m)[0];
function render(code,id,tailored){
 const i={id,slot:'bra',body:'open-arms-v2',name:'Test Bra',showInGame:true,image:'/assets/latest-fit.png?av=current',back:'/assets/transparent.png',printOverlay:'/assets/print.png'},hs={underStyle:hair.underStyle,layer:()=>'',faceLayer:()=>'',backDetailLayer:()=>''},mt={image:()=>tailored,back:()=>null,has:()=>!!tailored},w={HairStudio:hs,UnderwearWardrobe:under,GarmentBodyOcclusion:{style:()=>style,waistShadow:()=>''},MobileTailor:mt};
 const c={window:w,UnderwearWardrobe:under,HairStudio:hs,GarmentBodyOcclusion:w.GarmentBodyOcclusion,MobileEquipment:{normalize:e=>e,style:()=>''},state:{equipped:{bra:id}},itemById:()=>i,item:()=>i,clothingSlots:()=>['bra','briefs'],CURATION_MODE:true,innerPreview:true,esc:x=>String(x||'')};
 vm.runInNewContext(code+';html='+(/liveFigure/.test(code)?'liveFigure':'figure')+'();',c);return c.html;
}
for(const id of ['everyday-sport-bra','lowcut-bikini-top-v1'])for(const code of [main,mobile]){
 const html=render(code,id);assert.ok(html.includes('/assets/latest-fit.png?av=current'));assert.ok(!html.includes('19.1%'),'real renderer must retain curved shoulder tips');assert.ok(!html.includes('/low-coverage-v3/lowcut-bikini-top-v1-front.png'),'stale built-in underwear must not override fitted art');assert.ok(html.includes(style),'body and applicable garment clipping must remain intact');
}
for(const id of ['everyday-sport-bra','lowcut-bikini-top-v1']){const html=render(mobile,id,'data:image/png;base64,tailored');assert.ok(html.includes('data:image/png;base64,tailored'),'mobile custom bra must display the saved or tailor-preview result');assert.ok(!html.includes('/assets/print.png'),'baked custom print must not be drawn twice');}
console.log('PASS: desktop/mobile keep shoulder arcs with hair enabled; current fitted underwear wins; mobile tailor output and print composition agree.');
