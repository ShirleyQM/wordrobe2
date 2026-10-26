/* A local, dependency-free interaction prototype. Art is editable SVG: fills first, ink above. */
'use strict';
const $ = s => document.querySelector(s);
const ART_MODE=window.ART_MODE===true;
const CURATION_MODE=!new URLSearchParams(location.search).has('play');
if(!CURATION_MODE)document.querySelector('.brand').href='/?play=1';
if(CURATION_MODE){const previewLink=document.createElement('a');previewLink.href='/mobile.html';previewLink.target='_blank';previewLink.className='curation-preview';previewLink.textContent='手机换装 ↗';document.querySelector('header').append(previewLink);}
const cleanName=name=>window.GarmentNames?window.GarmentNames.clean(name):name;
if(CURATION_MODE){const links=document.createElement('div');links.className='curation-library-tools';links.innerHTML='<a class="curation-preview" href="/assets/wardrobe-organized/index.html" target="_blank">分类素材目录 ↗</a><label><input id="basic-only" type="checkbox">只看基础款</label>';document.querySelector('.wardrobe-heading').after(links);document.getElementById('basic-only').addEventListener('change',()=>render());}
const categories = [["top","上装"],["coat","外套"],["bottom","下装"],["dress","连衣裙"],["socks","袜子"],["shoes","鞋履"],["jewelry","配饰"],["bag","包"],["bra","内衣"],["briefs","内裤"]];
const legacyCatalog = [
 {id:'t1',slot:'top',name:'柔光短袖针织',color:'#c9dcf4',detail:'#829fc4',price:0,shape:'knit'},
 {id:'t2',slot:'top',name:'燕麦开领衬衫',color:'#f0ece0',detail:'#c0b4a1',price:20,shape:'shirt'},
 {id:'t3',slot:'top',name:'雾绿细肩背心',color:'#8e9a82',detail:'#566549',price:10,shape:'cami'},
 {id:'t4',slot:'top',name:'落日棕针织',color:'#a97d65',detail:'#765a48',price:20,shape:'knit'},
 {id:'t5',slot:'top',name:'月白开领衬衫',color:'#d8dcd8',detail:'#929f98',price:20,shape:'shirt'},
 {id:'t6',slot:'top',name:'墨色细肩背心',color:'#474b45',detail:'#aba590',price:10,shape:'cami'},
 {id:'b1',slot:'bottom',name:'垂感阔腿长裤',color:'#597493',detail:'#354f70',price:0,shape:'trousers'},
 {id:'b2',slot:'bottom',name:'奶油 A 字长裙',color:'#dfd3b9',detail:'#b7a487',price:20,shape:'skirt'},
 {id:'b3',slot:'bottom',name:'雾蓝直筒牛仔',color:'#84949e',detail:'#5a6b74',price:20,shape:'trousers'},
 {id:'d1',slot:'dress',name:'林间细带长裙',color:'#818c73',detail:'#59644c',price:30,shape:'dress'},
 {id:'d2',slot:'dress',name:'玫瑰缎面长裙',color:'#bf9990',detail:'#8e6c65',price:30,shape:'dress'},
 {id:'u1',slot:'bra',name:'基础棉质内衣',color:'#cfb6a7',detail:'#a68879',price:0,shape:'bra'},
 {id:'u2',slot:'bra',name:'雾绿舒适内衣',color:'#97a18a',detail:'#68765e',price:10,shape:'bra'},
 {id:'v1',slot:'briefs',name:'基础高腰内裤',color:'#cfb6a7',detail:'#a68879',price:0,shape:'briefs'},
 {id:'v2',slot:'briefs',name:'雾绿高腰内裤',color:'#97a18a',detail:'#68765e',price:10,shape:'briefs'},
 {id:'c1',slot:'coat',name:'麦田短开衫',color:'#c5b398',detail:'#96816a',price:20,shape:'coat'},
 {id:'c2',slot:'coat',name:'深灰短开衫',color:'#666a65',detail:'#3f4840',price:20,shape:'coat'},
 {id:'s1',slot:'shoes',name:'日常芭蕾平底鞋',color:'#575443',detail:'#b3a48a',price:0,shape:'shoes'},
 {id:'s2',slot:'shoes',name:'酒红芭蕾平底鞋',color:'#865754',detail:'#c09b88',price:10,shape:'shoes'},
 {id:'j1',slot:'jewelry',name:'微光珍珠耳饰',color:'#ede5cd',detail:'#ad9361',price:10,shape:'earrings'},
 {id:'j2',slot:'jewelry',name:'柔金小圈耳饰',color:'#b79d6e',detail:'#8e774c',price:10,shape:'hoops'}
];
const liveItems=[['navy-shirt','top','深蓝格纹衬衫'],['suede-skirt','bottom','腰带麂皮短裙'],['ankle-boots','shoes','复古短靴'],['coin-loafers','shoes','金币乐福鞋']].map(([id,slot,name])=>({id,slot,name,body:'open-arms-v2',editor:'preppy',price:0,color:'#526f98',detail:'#263b59',image:'assets/atelier-preppy-v1/items/'+id+'/front.png',back:'assets/atelier-preppy-v1/items/'+id+'/back.png',thumbnail:'assets/atelier-preppy-v1/items/'+id+'/thumb.png',hideBodyFrom:id==='ankle-boots'?1500:id==='coin-loafers'?1600:0}));
const catalog = [...liveItems,...CAMPUS_CATALOG];
function applyLibrary(groups){for(const group of groups.filter(g=>!['imprints','prints'].includes(g.group)).sort((a,b)=>({library:1,fittings:2}[a.group]||0)-({library:1,fittings:2}[b.group]||0)))for(const item of group.items){const found=catalog.find(i=>i.id===item.id);if(found)Object.assign(found,item);else catalog.unshift({...item,color:'#526f98',detail:'#263b59'});}for(const item of catalog){item.name=cleanName(item.name);item.printOverlay=null;}}
applyLibrary(window.WardrobeLibrary?.groups||[]);
const characters = [{name:"沈知微",skin:"#f2d7ca",hair:"#394c5c"}];
const words = GRE_SAMPLE;
const GROUP_SIZE=10, QUIZ_SIZE=5, CHECKPOINT_SIZE=30;
const initial = () => ({version:1,points:0,owned:catalog.filter(x=>ART_MODE||x.price===0).map(x=>x.id),character:0,looks:[],colors:{},equipped:{bra:'campus-bra',briefs:'campus-briefs',top:'campus-top',bottom:'long-01',socks:'campus-socks',shoes:'campus-shoes'},split:{top:'campus-top',bottom:'long-01'},characters:{},completed:0,learnedCount:0,passedGates:0,learningVersion:2,vocabulary:"gre-sample-v1",studied:[],wish:'short-02'});
let state=initial(),storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem('word-atelier-demo-v1'));if(saved&&saved.version===1){state=Object.assign(initial(),saved);if(saved.learningVersion!==2){state.learnedCount=Math.min((saved.completed||0)*5,10);state.passedGates=0;state.learningVersion=2;}if(saved.vocabulary!=="gre-sample-v1"){state.previousLearning={completed:state.completed,learnedCount:state.learnedCount,passedGates:state.passedGates};state.completed=0;state.learnedCount=0;state.passedGates=0;state.vocabulary="gre-sample-v1";}}}catch(e){storageAvailable=false;}
// Preserve learning and points; migrate only the visual wardrobe schema.
if(state.artVersion!==3){
 const mapping={t1:'campus-top',t2:'campus-top',t3:'campus-top',t4:'campus-top',t5:'campus-top',t6:'campus-top',b1:'long-01',b2:'long-01',b3:'short-02',d1:'dress-01',d2:'dress-02',u1:'campus-bra',u2:'campus-bra',v1:'campus-briefs',v2:'campus-briefs',s1:'campus-shoes',s2:'campus-shoes',j1:'campus-earrings',j2:'campus-earrings'};
 state.previousArtWardrobe={owned:state.owned,equipped:state.equipped,characters:state.characters,looks:state.looks};
 const convert=e=>Object.fromEntries(Object.entries(e||{}).map(([slot,id])=>[slot,mapping[id]||id]).filter(([slot,id])=>catalog.some(i=>i.id===id&&i.slot===slot)));
 state.owned=[...new Set([...state.owned.map(id=>mapping[id]||id).filter(id=>catalog.some(i=>i.id===id)),...catalog.filter(i=>ART_MODE||i.price===0).map(i=>i.id)])];
 state.equipped={bra:'campus-bra',briefs:'campus-briefs',top:'campus-top',bottom:'long-01',socks:'campus-socks',shoes:'campus-shoes',...convert(state.equipped)};
 if(state.equipped.dress){delete state.equipped.top;delete state.equipped.bottom;}
 state.split={top:'campus-top',bottom:'long-01'};state.looks=state.looks.map(l=>({...l,character:0,equipped:convert(l.equipped),split:{top:'campus-top',bottom:'long-01'}}));
 state.character=0;state.characters={};state.wish='short-02';state.artVersion=3;try{localStorage.setItem('word-atelier-demo-v1',JSON.stringify(state));}catch(e){}
}
state.owned=[...new Set([...state.owned,...catalog.filter(i=>ART_MODE||i.price===0).map(i=>i.id)])];
try{if(localStorage.getItem('wardrobe-underlayer-default-v2')!=='plunge'){state.equipped.bra='underlayer-plunge';localStorage.setItem('wardrobe-underlayer-v1','underlayer-plunge');localStorage.setItem('wardrobe-underlayer-default-v2','plunge');localStorage.setItem('word-atelier-demo-v1',JSON.stringify(state));}}catch(e){}
let category=state.equipped.dress?'dress':'top',selected=state.equipped.dress||state.equipped.top||'t1',lineOnly=false,innerPreview=false,toastTimer,lesson=null,pendingItem=null;
const itemById=id=>catalog.find(x=>x.id===id);
function persist(){try{localStorage.setItem('word-atelier-demo-v1',JSON.stringify(state));}catch(e){storageAvailable=false;}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
function colors(item){return state.colors[item.id]||{main:item.color,detail:item.detail};}
const paths={
 knit:['M117 132 L103 140 L88 172 L108 184 L119 165 L116 225 Q151 233 184 225 L181 165 L193 184 L213 173 L197 140 L183 132 Q150 150 117 132Z','M120 136 Q150 154 180 136 M119 217 Q150 225 181 217 M102 169 L112 175 M190 175 L201 169'],
 shirt:['M118 130 L103 140 L88 190 L107 197 L121 165 L117 230 L185 230 L180 165 L193 197 L212 190 L198 140 L180 130 L151 144Z','M118 130 L137 157 L151 144 L164 157 L180 130 M151 147 L151 228 M145 175h3 M145 194h3 M145 213h3'],
 cami:['M123 133 L131 133 L134 157 Q151 168 168 157 L171 133 L179 133 L181 227 Q151 234 120 227Z','M134 157 Q151 174 168 157 M124 219 Q151 225 177 219'],
 trousers:['M119 222 Q151 231 182 222 L190 287 L181 429 L153 429 L148 292 L142 429 L113 429 L110 287Z','M119 232 Q151 241 183 232 M148 239 L148 288 M128 246 Q117 257 114 268 M172 245 Q182 255 186 267 M127 283 L125 415 M169 283 L167 414'],
 skirt:['M119 224 Q151 232 183 224 L211 382 Q151 402 91 382Z','M119 234 Q151 242 184 234 M132 250 L119 383 M168 250 L183 383 M150 251 L151 389'],
 dress:['M124 133 L131 133 L134 154 Q151 169 169 154 L172 133 L179 133 L181 216 L211 391 Q153 413 92 391 L120 216Z','M134 154 Q151 175 169 154 M121 219 Q151 227 180 219 M136 240 L122 391 M168 240 L186 392 M150 247 L151 399'],
 bra:['M123 140 L129 140 L132 158 Q143 150 151 163 Q162 150 172 158 L175 140 L181 140 L182 187 Q164 197 151 185 Q138 197 120 187Z','M124 161 Q124 188 150 179 Q176 190 178 161 M151 163 L151 185'],
 briefs:['M118 225 Q151 233 184 225 L179 248 L164 270 L139 270 L122 249Z','M120 233 Q151 242 182 233 M123 246 Q139 245 143 269 M178 246 Q165 245 160 269'],
 coat:['M117 129 L101 141 L84 227 L108 232 L122 172 L113 232 L141 241 L143 156 L151 145 L158 156 L162 241 L191 232 L180 172 L194 232 L217 227 L199 141 L181 129 L168 137 L151 145 L135 137Z','M117 132 L133 162 L143 156 M181 132 L169 162 L158 156 M90 217 L109 222 M195 222 L214 217 M119 216 L136 219 M167 219 L185 216'],
 shoes:['M112 422 L139 422 L142 443 Q140 451 129 451 L101 451 Q96 446 102 440Z M156 422 L182 422 L194 440 Q200 448 191 451 L165 451 Q155 448 155 440Z','M112 425 Q126 438 139 425 M157 425 Q169 438 182 425 M105 444 L136 444 M163 444 L190 444'],
 earrings:['M124 91 A4 4 0 1 0 124 99 A4 4 0 1 0 124 91 M179 91 A4 4 0 1 0 179 99 A4 4 0 1 0 179 91','M124 85 L124 91 M179 85 L179 91'],
 hoops:['M123 88 A6 9 0 1 0 124 88 M179 88 A6 9 0 1 0 180 88','']
};
function garment(item,sketch=false){const c=colors(item),p=paths[item.shape];return `<g data-item="${item.id}" stroke-linejoin="round" stroke-linecap="round"><g data-layer="fill" stroke="none"><path data-region="main" d="${p[0]}" fill="${sketch?'#f4f8ff':c.main}"/></g><g data-layer="ink" fill="none" stroke="#575449" stroke-width="1.15"><path d="${p[0]}"/><path data-region="detail" d="${p[1]}" stroke="${sketch?'#777467':c.detail}" stroke-width="1.4"/></g></g>`;}
function thumb(item){if(item.thumbnail)return `<img class="art-thumb" src="${item.thumbnail}" loading="lazy" decoding="async" alt="${item.name}">`;const boxes={top:'73 118 155 125',bra:'103 125 95 80',briefs:'105 216 95 62',bottom:item.shape==='skirt'?'75 215 150 195':'90 215 120 225',dress:'72 124 159 290',coat:'70 118 160 140',shoes:'85 411 125 51',jewelry:'109 79 87 32'};return `<svg viewBox="${boxes[item.slot]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${garment(item)}</svg>`;}
function legacyFigure(){const c=characters[state.character],e=state.equipped;let layers='';(innerPreview?['bra','briefs']:['bra','briefs','bottom','top','dress','coat']).forEach(slot=>{if(e[slot])layers+=garment(itemById(e[slot]),lineOnly);});const ink='#635a4b';return `<svg viewBox="0 0 300 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name} 的换装占位人物"><ellipse cx="150" cy="456" rx="65" ry="8" fill="#bdcfe8" opacity=".55"/><g stroke="${ink}" stroke-width="1.05" stroke-linejoin="round"><path d="M124 56 Q116 25 149 23 Q181 19 184 56 L190 154 Q167 171 150 150 Q131 170 111 151Z" fill="${c.hair}"/><path d="M139 107 L139 127 L120 133 Q107 141 104 159 L86 232 L83 280 Q84 293 90 291 L97 278 L99 242 L119 187 L119 223 L112 274 L116 344 L115 423 L111 438 L139 438 L145 350 L151 286 L157 350 L157 438 L184 438 L181 422 L187 345 L189 277 L182 224 L181 184 L200 242 L203 277 L211 291 Q217 293 216 282 L214 234 L197 159 Q194 141 180 133 L163 127 L163 107Z" fill="${lineOnly?'#f4f8ff':c.skin}"/><path d="M140 117 Q151 126 163 116 M143 130 Q151 136 160 130 M91 260 L91 282 M208 260 L209 282" fill="none" opacity=".5"/>${layers}${e.shoes?garment(itemById(e.shoes),lineOnly):''}<ellipse cx="151" cy="77" rx="29" ry="39" fill="${lineOnly?'#f4f8ff':c.skin}"/><path d="M122 76 Q111 35 140 30 Q180 21 181 67 L180 111 L173 116 L174 67 Q144 72 134 49 Q134 70 122 78Z" fill="${c.hair}"/><path d="M131 81 Q137 78 142 81 M159 81 Q165 78 170 81" fill="none" stroke-width="1.7"/><path d="M136 82v2 M164 82v2 M151 85 L148 94 L152 94 M144 102 Q151 106 158 102" fill="none"/><path d="M130 92l9 1 M162 93l8-1" fill="none" stroke="#bd8d7d" opacity=".55"/>${e.jewelry?garment(itemById(e.jewelry),lineOnly):''}</g><g stroke="#b7ac97" stroke-width=".5" opacity=".38"><path d="M77 132h-12m6-6v12 M226 423h12m-6-6v12"/></g></svg>`;}
function figure(){return liveFigure();}
function gateDue(){return Math.floor(state.learnedCount/CHECKPOINT_SIZE)>state.passedGates;}
function paintItemList(html){
 const host=$('#items');if(host.__itemsMarkup===html)return;
 const template=document.createElement('template');template.innerHTML=html;
 const existing=new Map(Array.from(host.children).map(node=>[node.querySelector('[data-item-id]')?.dataset.itemId,node]));
 const keep=new Set();let cursor=host.firstElementChild;
 for(const fresh of Array.from(template.content.children)){
  const id=fresh.querySelector('[data-item-id]')?.dataset.itemId;let node=id?existing.get(id):null;
  if(!node||node.__itemMarkup!==fresh.outerHTML){const markup=fresh.outerHTML;if(node){if(node===cursor)cursor=node.nextElementSibling;node.replaceWith(fresh);}node=fresh;node.__itemMarkup=markup;}
  if(node!==cursor)host.insertBefore(node,cursor);keep.add(node);cursor=node.nextElementSibling;
 }
 for(const node of Array.from(host.children))if(!keep.has(node))node.remove();host.__itemsMarkup=html;
}
function render(){
 window.HairStudio?.mount();window.CharacterPortraits?.mount();
 if(!itemById(selected)||itemById(selected)?.deleted)selected=catalog.find(i=>!i.deleted&&i.slot===category)?.id||catalog.find(i=>!i.deleted)?.id||selected;
 if(ART_MODE)state.owned=[...new Set([...state.owned,...catalog.map(i=>i.id)])];
 $('#balance').textContent=state.points;if(ART_MODE){$('.balance').hidden=true;$('.wish-card').hidden=true;$('.wardrobe-heading label').hidden=true;$('.mobile-dock').hidden=true;document.querySelectorAll('[data-nav="study"],#help').forEach(b=>b.hidden=true);}$('#collection-count').textContent=catalog.filter(i=>!i.deleted&&state.owned.includes(i.id)).length+' / '+catalog.filter(i=>!i.deleted).length;window.FigureView?FigureView.paint($('#figure'),figure()):$('#figure').innerHTML=figure();renderClothingOrder();$('#character-name').textContent='温柔';
 $('#delete-garment').disabled=!itemById(selected)||!!itemById(selected)?.deleted;$('#restore-garment').hidden=!(window.WardrobeLibrary?.groups.find(g=>g.group==='deletions')?.deletedItems?.length);
 $('#line-toggle').textContent=lineOnly?'填色':'线稿';$('#inner-toggle').textContent=innerPreview?'外搭':'内搭';
 $('#characters').hidden=true;$('#line-toggle').hidden=true;$('.color-editor').hidden=true;$('#characters').innerHTML=characters.map((c,i)=>`<button class="avatar ${i===state.character?'active':''}" data-character="${i}" aria-label="选择${c.name}" aria-pressed="${i===state.character}"><svg viewBox="0 0 40 40"><rect width="40" height="40" fill="#d6e3f5"/><path d="M8 40V21Q6 3 20 4Q36 2 33 22V40" fill="${c.hair}"/><ellipse cx="20" cy="23" rx="10" ry="13" fill="${c.skin}"/><path d="M9 20Q10 5 23 8L32 19Q22 20 16 12Z" fill="${c.hair}"/></svg></button>`).join('');
 $('#categories').innerHTML=categories.map(c=>`<button class="${category===c[0]?'active':''}" data-category="${c[0]}" aria-pressed="${category===c[0]}">${c[1]}</button>`).join('');
 const list=catalog.filter(x=>!x.deleted&&(CURATION_MODE||x.showInGame===true)&&x.slot===category&&(!$('#owned-only').checked||state.owned.includes(x.id))&&(!$('#basic-only')?.checked||x.basicTemplate===true));
 paintItemList(list.length?list.map(item=>{const owned=state.owned.includes(item.id),equipped=state.equipped[equipmentKey(item)]===item.id;return `<article class="item ${equipped?'equipped':''}"><button class="select-garment" data-item-id="${item.id}" ${item.unavailable?'disabled':''} aria-label="试穿${item.name}"><div class="item-picture">${thumb(item)}</div>${item.unavailable?'<span class="item-state">重做中</span>':equipped?'<span class="item-state">已穿戴</span>':''}<div class="item-info"><strong>${item.name}</strong></div></button><span class="material-capability" title="${item.capabilities?.recolor?'可改色':'原色服装，暂不支持改色'}" aria-label="${item.capabilities?.recolor?'可改色':'不可改色'}">${item.capabilities?.recolor?'◐':'○'}</span>${CURATION_MODE?'<button class="basic-garment '+(item.basicTemplate?'marked':'')+'" data-basic-id="'+item.id+'" aria-pressed="'+!!item.basicTemplate+'" title="按这件轮廓制作 diversity" aria-label="'+(item.basicTemplate?'取消基础款':'标为基础款')+item.name+'">'+(item.basicTemplate?'★ 基础款':'☆ 基础款')+'</button><button class="show-garment '+(item.showInGame?'shown':'')+'" data-show-id="'+item.id+'" aria-label="'+(item.showInGame?'隐藏':'展示')+item.name+'">'+(item.showInGame?'隐藏':'展示')+'</button>':''}</article>`;}).join(''):'<div class="empty">'+($('#basic-only')?.checked?'此类别还没有标记基础款':'暂无展示的衣服，请先在衣橱挑选')+'</div>');
 const active=itemById(selected)||catalog[0];const edit=$('#edit-current');if(edit){edit.hidden=false;edit.disabled=!!active.deleted;}$('#print-current').textContent='裁缝铺';$('#print-current').disabled=!!active.deleted;if(edit)edit.disabled=!!active.deleted||!active.showInGame;$('#color-label').textContent=active.name;const palette=['#dbe9fc','#a7c6ed','#709bce','#416dA8','#263f65'];$('#color-swatches').innerHTML=palette.map(c=>`<button class="swatch ${colors(active).main.toLowerCase()===c.toLowerCase()?'selected':''}" style="background:${c}" data-color="${c}" aria-label="主色 ${c}"></button>`).join('');$('#custom-color').value=colors(active).main;$('#detail-color').value=colors(active).detail;
 const wish=itemById(state.wish);$('#wish-title').textContent=gateDue()?'进阶关卡待完成':wish&&!state.owned.includes(wish.id)?wish.name:'继续学习';$('#wish-copy').textContent=gateDue()?'完成后继续赚积分':wish&&!state.owned.includes(wish.id)?Math.max(0,wish.price-state.points)===0?'积分已足够，可直接解锁':'还差 '+(wish.price-state.points)+' 积分':'每组 10 积分';
 $('#study-button').textContent=gateDue()?'进阶挑战 ↗':'开始学习 ↗';$('#mobile-study').textContent=gateDue()?'完成进阶 · 继续赚积分 ↗':'开始学习 · 每组 10 积分 ↗';
 if(!CURATION_MODE){const visible=catalog.filter(i=>!i.deleted&&i.showInGame===true);$('#collection-count').textContent=visible.filter(i=>state.owned.includes(i.id)).length+' / '+visible.length;document.querySelectorAll('#delete-garment,#restore-garment,#edit-current,[data-studio="preppy"]').forEach(e=>e.hidden=true);}
}
function showModal(html){$('#modal-content').innerHTML=html;$('#overlay').hidden=false;document.body.style.overflow='hidden';$('#modal').scrollTop=0;$('#close-modal').focus();}
function closeModal(){if(lesson&&lesson.phase!=='done'&&!window.confirm('离开本组学习？本组尚未完成，不会结算衣橱点。'))return;$('#overlay').hidden=true;document.body.style.overflow='';lesson=null;pendingItem=null;}
function equipmentKey(item){return item.slot==='jewelry'&&['belt','waistwrap','armwarmers'].includes(item.accessoryType)?'jewelry:'+item.accessoryType:item.slot;}
function equip(id){const item=itemById(id),e=state.equipped;if(!item||item.deleted)return;if(item.unavailable){toast('这件衣服正在重新生成，暂不可用');return;}if(!state.owned.includes(id))return;const key=equipmentKey(item);
 if(e[key]===id&&['coat','jewelry','bag','socks'].includes(item.slot)){delete e[key];toast('已取下'+item.name);}
 else {if(item.slot==='dress'){state.split={top:e.top||state.split.top,bottom:e.bottom||state.split.bottom};delete e.top;delete e.bottom;}
 if((item.slot==='top'||item.slot==='bottom')&&e.dress){delete e.dress;e.top=state.split.top;e.bottom=state.split.bottom;}
 e[key]=id;if(item.slot==='top'||item.slot==='bottom')state.split[item.slot]=id;toast('已穿上 · '+item.name);}
 selected=id;if(item.slot==='bra'&&item.body==='open-arms-v2')localStorage.setItem('wardrobe-underlayer-v1',id);persist();render();
}
function showProduct(id){const item=itemById(id);pendingItem=id;state.wish=id;persist();render();showModal(`<h2>${item.name}</h2><div class="product-preview">${thumb(item)}</div><div class="product-price">${item.price} 积分 · 已有 ${state.points}</div><button class="primary" data-action="${state.points>=item.price?'buy':'study-product'}">${state.points>=item.price?'解锁并试穿':gateDue()?'完成进阶挑战':'去学习，赚 10 积分'}</button><button class="secondary" data-action="dismiss">稍后</button>`);}
function buy(){const item=itemById(pendingItem);if(!item||state.owned.includes(item.id)||state.points<item.price)return;state.points-=item.price;state.owned.push(item.id);const id=item.id;lesson=null;closeModal();category=item.slot;equip(id);toast('新衣入橱 · '+item.name);}
function shuffle(items){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function sliceWords(start,size){return Array.from({length:size},(_,i)=>words[(start+i+words.length)%words.length]);}
function questionFor(word,kind){
 const answer=kind==='meaning'?word.meaning:word.word;
 const pool=words.filter(x=>x.word!==word.word&&x.family!==word.family).map(x=>kind==='meaning'?x.meaning:x.word);
 const context=kind==='context'?word.context:null;
 return {word,kind,answer,stem:kind==='initial'?word.initialStem:kind==='context'?(context?context.stem:word.example.replace(word.word,'_____')):'',options:['spell','initial'].includes(kind)?[]:context?shuffle(context.options):shuffle([answer,...shuffle([...new Set(pool)]).slice(0,3)]),explanation:context?context.explanation:''};
}
function sampleQuestions(pool,kinds){
 const original=shuffle(pool.filter(w=>w.context))[0];
 const selected=original?[original,...shuffle(pool.filter(w=>w!==original)).slice(0,kinds.length-1)]:shuffle(pool).slice(0,kinds.length);
 return shuffle(selected.map((w,i)=>questionFor(w,kinds[i])));
}
function studyIntro(){lesson=null;if(gateDue()){checkpointIntro();return;}startLesson();}
function startLesson(){
 if(gateDue()){checkpointIntro();return;}
 const size=Math.min(GROUP_SIZE,CHECKPOINT_SIZE-state.learnedCount%CHECKPOINT_SIZE);
 lesson={type:'normal',words:sliceWords(state.learnedCount,size),index:0,cardIndex:0,phase:'cards',questions:[],correct:false,attempted:false,firstCorrect:0,settled:false};renderLesson();
}
function nextCard(){if(!lesson||lesson.phase!=='cards')return;if(lesson.cardIndex<lesson.words.length-1)lesson.cardIndex++;else lesson.phase='summary';renderLesson();}
function previousCard(){if(!lesson||lesson.phase!=='cards')return;lesson.cardIndex=Math.max(0,lesson.cardIndex-1);renderLesson();}
function reviewCards(){if(!lesson||lesson.phase!=='summary')return;lesson.cardIndex=0;lesson.phase='cards';renderLesson();}
function startQuiz(){if(!lesson||lesson.type!=='normal'||lesson.phase!=='summary')return;lesson.questions=sampleQuestions(lesson.words,['context','meaning','initial','reverse','initial']);lesson.phase='quiz';renderLesson();}
function checkpointIntro(){lesson=null;showModal(`<h2>进阶挑战</h2><p>已累计学习 ${state.learnedCount} 个词。</p><div class="checkpoint-rule">从最近 30 个词中随机出 10 题，含拼写。<br>首次答对至少 8 题，即可继续赚积分。</div><button class="primary" data-action="checkpoint-start">开始挑战</button><button class="secondary" data-action="dismiss">稍后再来</button>`);}
function startCheckpoint(){
 if(!gateDue()){startLesson();return;}
 const pool=sliceWords(state.learnedCount-CHECKPOINT_SIZE,CHECKPOINT_SIZE);
 lesson={type:'advanced',words:pool,index:0,phase:'quiz',questions:sampleQuestions(pool,['context','initial','spell','meaning','reverse','spell','context','initial','spell','meaning']),correct:false,attempted:false,firstCorrect:0,settled:false};renderLesson();
}
function renderLesson(){const l=lesson;
 if(l.phase==='done'){
  if(l.type==='normal')showModal(`<h2>本组完成</h2><div class="reward-num">+10</div><p class="reward-label">积分已到账</p><button class="primary" data-action="another-lesson">${gateDue()?'进入进阶挑战':'下一组学习 ↗'}</button><button class="secondary" data-action="return-wardrobe">回衣橱</button>`);
  else showModal(`<h2>${l.passed?'进阶通过':'再试一次'}</h2><div class="checkpoint-score">${l.firstCorrect} / 10</div><p class="reward-label">${l.passed?'可以继续学习赚积分了':'首次答对 8 题即可通过，积分保留'}</p><button class="primary" data-action="${l.passed?'another-lesson':'checkpoint-start'}">${l.passed?'下一组学习 ↗':'重新挑战'}</button><button class="secondary" data-action="dismiss">回衣橱</button>`);
  return;
 }
 if(l.phase==='cards'){
  const w=l.words[l.cardIndex];
  showModal(`<div class="lesson-head"><h2>第 ${state.completed+1} 组</h2><span>${l.cardIndex+1} / ${l.words.length}</span></div><div class="single-card"><article class="word-card"><strong>${w.word}</strong><div class="meaning">${w.meaning}</div><p>${w.example}</p><p class="example-translation">${w.translation}</p></article></div><div class="card-navigation"><button class="secondary" data-action="previous-card" ${l.cardIndex===0?'disabled':''}>上一张</button><button class="primary" data-action="next-card">${l.cardIndex===l.words.length-1?'查看汇总':'下一张'}</button></div>`);
  return;
 }
 if(l.phase==='summary'){
  showModal(`<div class="lesson-head"><h2>本组汇总</h2><span>${l.words.length} 个词</span></div><div class="word-summary">${l.words.map(w=>`<div><strong>${w.word}</strong><span>${w.meaning}</span></div>`).join('')}</div><button class="primary" data-action="start-quiz">开始小测 · 随机 5 题</button><button class="secondary" data-action="review-cards">再看词卡</button>`);
  return;
 }
 const q=l.questions[l.index],typed=['spell','initial'].includes(q.kind);
 const header=`<div class="lesson-head"><h2>${l.type==='advanced'?'进阶挑战':'本组小测'}</h2><span>${l.index+1} / ${l.questions.length}</span></div><div class="progress"><div style="width:${l.index/l.questions.length*100}%"></div></div>`;
 const prompt=q.stem|| (q.kind==='meaning'?q.word.word:q.word.meaning);
 const label=q.kind==='initial'?'根据首字母补全单词':q.kind==='spell'?'写出对应的英文单词':q.kind==='context'?'选择最合适的词':q.kind==='meaning'?'选择正确词义':'选择对应的英文单词';
 const input=typed?`<div class="spelling-row">${q.kind==='initial'?'<span class="initial-prefix">'+q.word.word[0]+'</span>':''}<input id="spell-answer" class="spell-input" aria-label="${q.kind==='initial'?'补全单词':'英文拼写'}" autocomplete="off" autocapitalize="off" spellcheck="false"></div><button class="primary" data-action="submit-spell">检查答案</button>`:`<div class="answers">${q.options.map((o,i)=>`<button class="answer" data-answer="${i}">${o}</button>`).join('')}</div>`;
 showModal(header+`<div class="${q.stem?'sentence-question':'word'}">${prompt}</div><p class="question">${label}</p>${input}<div id="feedback" class="feedback" role="status"></div><button class="primary" data-action="next-word" hidden>${l.index===l.questions.length-1?'完成':'下一题'}</button>`);
}

function answer(index,button){if(!lesson||lesson.phase!=='quiz'||lesson.correct)return;const q=lesson.questions[lesson.index];if(!q||['spell','initial'].includes(q.kind)||index<0||index>=q.options.length)return;recordAnswer(q.options[index]===q.answer,button);}
function recordAnswer(correct,button){const l=lesson,q=l.questions[l.index];if(correct){if(!l.attempted)l.firstCorrect++;l.correct=true;if(button)button.classList.add('correct');$('#feedback').textContent='✓ '+q.word.word+' · '+q.word.meaning+(q.explanation?'。'+q.explanation:'');document.querySelector('[data-action="next-word"]').hidden=false;if(['spell','initial'].includes(q.kind)){$('#spell-answer').disabled=true;document.querySelector('[data-action="submit-spell"]').hidden=true;}}
 else {l.attempted=true;if(button){button.classList.add('wrong');button.disabled=true;}$('#feedback').textContent='再试一次：'+q.answer;}}
function submitSpelling(){if(!lesson||lesson.phase!=='quiz'||lesson.correct)return;const q=lesson.questions[lesson.index];if(!['spell','initial'].includes(q.kind))return;const value=$('#spell-answer').value.trim().toLowerCase();if(!value){$('#feedback').textContent='先输入英文单词';return;}recordAnswer(value===q.answer.toLowerCase()||(q.kind==='initial'&&q.word.word[0]+value===q.answer.toLowerCase()),null);}
function settleLesson(){if(!lesson||lesson.settled)return;const l=lesson;l.settled=true;if(l.type==='normal'){state.points+=10;state.completed++;state.learnedCount+=l.words.length;}else{l.passed=l.firstCorrect>=8;if(l.passed)state.passedGates++;}l.phase='done';persist();render();}
function nextWord(){if(!lesson||lesson.phase!=='quiz'||!lesson.correct)return;lesson.index++;lesson.correct=false;lesson.attempted=false;if(lesson.index>=lesson.questions.length)settleLesson();renderLesson();}

function saveLook(){const look={clothingOrder:state.clothingOrder||'top',face:window.CharacterPortraits?.selected(),name:'我的穿搭 '+String(state.looks.length+1).padStart(2,'0'),character:state.character,equipped:Object.assign({},state.equipped),colors:JSON.parse(JSON.stringify(state.colors)),split:Object.assign({},state.split)};state.looks.unshift(look);state.looks=state.looks.slice(0,5);persist();toast('已收藏当前穿搭 · 最多保存 5 套');}
function showLooks(){showModal(`<h2>收藏穿搭</h2>${state.looks.length?state.looks.map((l,i)=>`<div class="look-row"><div><strong>${l.name}</strong><small>${characters[l.character].name} · ${Object.keys(l.equipped).length} 件单品</small></div><button data-look="${i}">穿上这一套 ↗</button></div>`).join(''):'<p>还没有收藏。搭配好第一套，点击“收藏这套穿搭”。</p>'}<button class="secondary" data-action="dismiss">回到试衣间</button>`);}
function recolor(main,detail){if(!state.owned.includes(selected)){toast('解锁后就能自由改色');return;}const old=colors(itemById(selected));state.colors[selected]={main:main||old.main,detail:detail||old.detail};persist();render();}
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;innerPreview=category==='bra'||category==='briefs';const worn=state.equipped[category];if(worn)selected=worn;render();}});
$('#items').addEventListener('click',e=>{const b=e.target.closest('[data-item-id]');if(!b)return;const id=b.dataset.itemId;if(state.owned.includes(id))equip(id);else showProduct(id);});
$('#characters').addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(!b)return;state.characters[state.character]={equipped:Object.assign({},state.equipped),split:Object.assign({},state.split)};state.character=Number(b.dataset.character);const saved=state.characters[state.character];if(saved){state.equipped=Object.assign({},saved.equipped);state.split=Object.assign({},saved.split);}persist();render();});
$('#color-swatches').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(b)recolor(b.dataset.color);});$('#custom-color').addEventListener('input',e=>recolor(e.target.value));$('#detail-color').addEventListener('input',e=>recolor(null,e.target.value));
$('#inner-toggle').addEventListener('click',()=>{innerPreview=!innerPreview;render();});$('#line-toggle').addEventListener('click',()=>{lineOnly=!lineOnly;render();});$('#owned-only').addEventListener('change',render);$('#save-look').addEventListener('click',saveLook);$('#study-button').addEventListener('click',studyIntro);$('#close-modal').addEventListener('click',closeModal);$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#overlay').hidden)closeModal();if(e.key==='Tab'&&!$('#overlay').hidden){const focusable=Array.from($('#modal').querySelectorAll('button:not([disabled]):not([hidden]),input')).filter(x=>x.offsetParent!==null);const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.nav==='study')studyIntro();else if(b.dataset.nav==='looks')showLooks();else {openWorkspace('wardrobe');window.scrollTo({top:0,behavior:'smooth'});}}));
$('#help').addEventListener('click',()=>showModal('<h2>玩法</h2><ul class="help-list"><li>每组逐张学习 10 个 GRE 单词，汇总后随机 5 题。</li><li>完成一组立即到账 10 积分，可连续学习。</li><li>每学 30 词，完成一次进阶挑战再继续赚积分。</li><li>题型含翻译、首字母填空和选择题。进阶 10 题含拼写，首次答对至少 8 题通过。</li><li>点击单品试穿或解锁；再次点击外套、耳饰可取下。</li></ul><button class="primary" data-action="dismiss">知道了</button>'));
$('#modal-content').addEventListener('click',e=>{const ans=e.target.closest('[data-answer]');if(ans){answer(Number(ans.dataset.answer),ans);return;}const look=e.target.closest('[data-look]');if(look){const l=state.looks[Number(look.dataset.look)];state.characters[state.character]={equipped:Object.assign({},state.equipped),split:Object.assign({},state.split)};state.character=l.character;state.clothingOrder=l.clothingOrder||'top';state.equipped=Object.assign({},l.equipped);state.split=Object.assign({},l.split);state.colors=JSON.parse(JSON.stringify(l.colors));if(l.face)window.CharacterPortraits?.select(l.face);persist();render();closeModal();toast('已恢复穿搭与配色');return;}const b=e.target.closest('[data-action]');if(!b)return;switch(b.dataset.action){case'dismiss':closeModal();break;case'buy':buy();break;case'study-product':studyIntro();break;case'start-lesson':startLesson();break;case'start-quiz':startQuiz();break;case'next-card':nextCard();break;case'previous-card':previousCard();break;case'review-cards':reviewCards();break;case'checkpoint-start':startCheckpoint();break;case'submit-spell':submitSpelling();break;case'next-word':nextWord();break;case'return-wardrobe':{const wish=state.wish;lesson=null;closeModal();if(wish&&!state.owned.includes(wish))showProduct(wish);break;}case'another-lesson':lesson=null;studyIntro();break;}});
$('#modal-content').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='spell-answer'){e.preventDefault();submitSpelling();}});
$('#mobile-study').addEventListener('click',studyIntro);$('#jump-wardrobe').addEventListener('click',()=>$('.wardrobe').scrollIntoView({behavior:'smooth',block:'start'}));
render();

function clothingSlots(){return ['bra','briefs','socks','shoes',...(state.clothingOrder==='bottom'?['top','bottom']:['bottom','top']),'dress','coat','jewelry','bag'];}
function renderClothingOrder(){let box=document.querySelector('#clothing-order');if(!box){box=document.createElement('div');box.id='clothing-order';box.className='clothing-order';box.innerHTML='<span>衣服与裤裙叠放</span><div><button data-clothing-order="top">上衣盖裤腰</button><button data-clothing-order="bottom">裤腰盖上衣</button></div>';document.querySelector('.figure-wrap').after(box);box.onclick=e=>{const b=e.target.closest('[data-clothing-order]');if(!b)return;state.clothingOrder=b.dataset.clothingOrder;persist();render();};}box.querySelectorAll('button').forEach(b=>{const selected=b.dataset.clothingOrder===(state.clothingOrder||'top');b.setAttribute('aria-pressed',String(selected));b.classList.toggle('active',selected);});}
function liveFigure(){const equipped=Object.values(state.equipped).map(itemById).filter(i=>i&&!i.unavailable&&!i.deleted&&(CURATION_MODE||i.showInGame===true)&&(!innerPreview||['bra','briefs'].includes(i.slot))),worn=window.UnderwearWardrobe.presentation?.(equipped,clothingSlots())||equipped,img=(url,name,style='')=>url?`<img src="${url}" alt="${name}" style="${style}" draggable="false">`:'';const ordered=clothingSlots().flatMap(slot=>worn.filter(i=>i.slot===slot)),bodyURL=window.CharacterPortraits?.baseBody(window.UnderwearWardrobe.body(worn,clothingSlots()))||window.UnderwearWardrobe.body(worn,clothingSlots()),garmentStyle=i=>window.GarmentBodyOcclusion?.garmentStyle?.(i,ordered,bodyURL)||'';let out=(window.HairStudio?.layer('back')||'')+(window.HairStudio?.layer('front','behind')||'');for(const i of worn)out+=img(i.back,i.name+'后片',garmentStyle(i));const bodyStyle=window.GarmentBodyOcclusion?.style(worn)||'';out+=img(window.CharacterPortraits?.baseBody(window.UnderwearWardrobe.body(worn,clothingSlots()))||window.UnderwearWardrobe.body(worn,clothingSlots()),'温柔',bodyStyle);for(const slot of clothingSlots())for(const i of worn.filter(i=>i.slot===slot&&!(i.accessoryType==='cap'||i.accessoryType==='sunglasses'||/帽|墨镜/.test(i.name||''))))out+=(slot===(state.clothingOrder==='bottom'?'bottom':'top')?window.GarmentBodyOcclusion?.waistShadow(worn,state.clothingOrder)||'':'')+img(UnderwearWardrobe.image(i),i.name,(slot==='socks'?bodyStyle:'')+garmentStyle(i))+img(i.printOverlay,i.name+'印花',(slot==='socks'?bodyStyle:'')+garmentStyle(i));out+=window.HairStudio?.layer('back','front')||'';out+=window.HairStudio?.backDetailLayer?.()||'';out+=(window.HairStudio?.layer('front','body-front')||'')+(window.CharacterPortraits?.layer(bodyStyle)||'');out+=window.HairStudio?.layer('front')||'';out+=window.HairStudio?.faceLayer?.()||'';for(const i of worn.filter(i=>i.accessoryType==='cap'||i.accessoryType==='sunglasses'||/帽|墨镜/.test(i.name||'')))out+=img(UnderwearWardrobe.image(i),i.name)+img(i.printOverlay,i.name+'印花');return '<div class="campus-figure" role="img" aria-label="最新修版穿搭">'+out+'</div>';}
function openWorkspace(mode){const frame=document.getElementById(mode+'-editor');if(frame?.dataset.editorSrc){const src=frame.dataset.editorSrc;delete frame.dataset.editorSrc;frame.onload=()=>frame.contentWindow.postMessage({type:'wardrobe-select',id:selected},location.origin);frame.src=src;}const editing=mode!=='wardrobe';$('#main-wardrobe').hidden=editing;$('#asset-workspace').hidden=!editing;$('#preppy-editor').hidden=mode!=='preppy';$('#prints-editor').hidden=mode!=='prints';$('#tee-editor').hidden=mode!=='tee';document.querySelector('main>header h1').textContent=mode==='preppy'?'修版型':mode==='prints'?'裁缝铺':mode==='tee'?'T 恤修版型':'我的衣橱';document.querySelectorAll('.sidebar .nav').forEach(b=>b.classList.toggle('active',b.dataset.studio===mode||mode==='wardrobe'&&b.dataset.nav==='wardrobe'));if(!editing)refreshLibrary();if(mode==='prints'||mode==='preppy'){const id=selected;$('#'+(mode==='prints'?'prints':'preppy')+'-editor').contentWindow.postMessage({type:'wardrobe-select',id},location.origin);}}
document.querySelectorAll('[data-studio]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.dataset.studio)));
$('#edit-current').addEventListener('click',()=>openWorkspace('preppy'));
$('#print-current').addEventListener('click',()=>openWorkspace('prints'));
async function refreshLibrary(){if(!window.WardrobeLibrary)return;try{const groups=await window.WardrobeLibrary.refresh();applyLibrary(groups);for(const item of catalog)if((ART_MODE||item.price===0)&&!state.owned.includes(item.id))state.owned.push(item.id);persist();render();}catch(e){console.warn('最新衣橱：'+e.message);}}
window.addEventListener?.('message',event=>{if(event.origin===location.origin&&event.source===$('#preppy-editor').contentWindow&&event.data?.type==='wardrobe-selection-changed'){const item=itemById(event.data.id);if(item){category=item.slot;innerPreview=['bra','briefs'].includes(item.slot);if(state.equipped[equipmentKey(item)]===item.id){selected=item.id;persist();render();}else equip(item.id);}return;}if(event.origin===location.origin&&event.data?.type==='wardrobe-updated'){refreshLibrary();if(event.data.group!=='imprints')$('#prints-editor').contentWindow.postMessage({type:'wardrobe-source-changed'},location.origin);}});
window.addEventListener?.('focus',refreshLibrary);if(window.WardrobeLibrary){window.WardrobeLibrary.onchange(event=>{refreshLibrary();if(event.data?.group!=='imprints')$('#prints-editor').contentWindow.postMessage({type:'wardrobe-source-changed'},location.origin);});refreshLibrary();}

let regenerationStamp=null;window.setInterval?.(async()=>{if(document.visibilityState==='hidden')return;try{const response=await fetch('/api/regeneration',{cache:'no-store'});const result=await response.json(),stamp=JSON.stringify(result.jobs);if(regenerationStamp!==null&&stamp!==regenerationStamp)await refreshLibrary();regenerationStamp=stamp;}catch(e){}},4000);

// Completed art packages appear without reloading or interrupting the fitting frame.
window.setInterval?.(async()=>{if(document.visibilityState==='hidden'||!window.WardrobeLibrary)return;try{const stamp=gs=>JSON.stringify(gs.map(g=>[g.group,g.revision,g.items.map(i=>[i.id,i.image,i.back,i.thumbnail,i.deleted,i.unavailable,i.basicTemplate,i.showInGame,i.hideBodyFrom,i.bodyOcclusionRects])])),before=stamp(WardrobeLibrary.groups),groups=await WardrobeLibrary.refresh();if(stamp(groups)===before)return;applyLibrary(groups);for(const item of catalog)if((ART_MODE||item.price===0)&&!state.owned.includes(item.id))state.owned.push(item.id);persist();render();$('#prints-editor').contentWindow.postMessage({type:'wardrobe-source-changed'},location.origin);}catch(e){console.warn('素材同步：'+e.message);}},10000);

// Soft deletion keeps original art, fitting drafts, prints and notes recoverable.
let garmentDeletionBusy=false;
async function setGarmentDeleted(id,deleted){
 if(garmentDeletionBusy)return;garmentDeletionBusy=true;$('#delete-garment').disabled=true;$('#restore-garment').disabled=true;
 try{
  const response=await fetch('/api/garment-deletions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,deleted})}),result=await response.json();
  if(!response.ok)throw Error(result.error||'操作失败');
  if(deleted){for(const slot of Object.keys(state.equipped))if(state.equipped[slot]===id)delete state.equipped[slot];if(selected===id)selected=catalog.find(i=>i.id!==id&&!i.deleted&&i.slot===category)?.id||catalog.find(i=>i.id!==id&&!i.deleted)?.id||id;}
  persist();await refreshLibrary();
  for(const frame of ['preppy-editor','prints-editor'])$('#'+frame).contentWindow.postMessage({type:'wardrobe-visibility-changed'},location.origin);
  toast(deleted?'已删除，可点击“撤销删除”恢复':'衣服已恢复');
 }catch(e){toast(e.message);}finally{garmentDeletionBusy=false;$('#restore-garment').disabled=false;render();}
}
$('#delete-garment').addEventListener('click',()=>{if(itemById(selected)&&!itemById(selected).deleted)setGarmentDeleted(selected,true);});
$('#restore-garment').addEventListener('click',()=>{const last=window.WardrobeLibrary?.groups.find(g=>g.group==='deletions')?.deletedItems?.[0];if(last)setGarmentDeleted(last.id,false);});




$('#items').addEventListener('click',async e=>{const b=e.target.closest('[data-show-id]');if(!b)return;e.stopPropagation();b.disabled=true;try{const item=itemById(b.dataset.showId),r=await fetch('/api/wardrobe-visibility',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,visible:!item.showInGame})}),v=await r.json();if(!r.ok)throw Error(v.error);await refreshLibrary();for(const id of ['prints-editor','preppy-editor'])document.getElementById(id)?.contentWindow?.postMessage({type:'wardrobe-visibility-changed'},location.origin);toast(v.visible?'已展示':'已隐藏');}catch(err){toast(err.message);b.disabled=false;}});
$('#items').addEventListener('click',async e=>{const b=e.target.closest('[data-basic-id]');if(!b)return;e.stopPropagation();b.disabled=true;try{const item=itemById(b.dataset.basicId),r=await fetch('/api/garment-basics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,basic:!item.basicTemplate})}),v=await r.json();if(!r.ok)throw Error(v.error);await refreshLibrary();toast(v.basic?'已标为基础款，可按轮廓做 diversity':'已取消基础款');}catch(err){toast(err.message);b.disabled=false;}});

