/* Deterministic same-canvas masking, requested by user. No creative repainting here.
   Creative occlusion repairs are separate image_gen sources. */
const fs=require('fs');const path=require('path');
const deps='C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(path.join(deps,'sharp'));const {createCanvas,Path2D}=require(path.join(deps,'@napi-rs/canvas'));
const root=__dirname,W=939,H=1676;
function rasterPath(d){const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.fillStyle='white';c.fill(new Path2D(d),'evenodd');return new Uint8Array(c.getImageData(0,0,W,H).data).filter((_,i)=>i%4===3);}
const definitions=[
 {id:'upper',name:'上衣套件 · 衬衫＋开衫',source:'upper-repair.png',z:50,paths:'M433 281 Q420 302 400 312 L347 328 Q332 337 326 363 L311 433 L308 509 L292 590 L280 636 L275 678 L262 716 Q257 738 263 758 L264 777 L261 806 L292 808 L302 765 L316 727 L330 696 L370 708 L399 565 L542 565 L565 708 L608 695 L620 733 L639 769 L642 807 L679 807 L677 771 L684 752 Q687 736 677 711 L660 659 L652 602 L637 551 L631 510 L626 440 L615 362 Q608 337 592 328 L540 311 L512 281 L507 281 Q505 335 470 394 Q435 342 433 281 Z',note:'一个上衣槽位，衬衫与开衫作为组合件；不是两件可独立卸下的商品。包带及遮挡处使用独立补画源。'},
 {id:'skirt',name:'深蓝百褶裙',source:'underlay-repair.png',z:40,paths:'M379 563 Q470 555 560 563 L565 594 Q600 724 651 909 Q566 932 473 931 Q380 931 286 908 Q335 725 375 594 Z',note:'使用无外套补画源，保留完整腰头。'},
 {id:'bag',name:'蓝灰肩包',source:'outfit.png',z:65,paths:'M558 315 L573 315 Q579 457 599 601 L606 638 Q630 638 637 663 L653 733 Q656 747 641 751 L618 756 Q606 757 602 743 L586 671 Q582 650 589 640 L585 606 Q566 454 558 315 Z',note:'包身与前段背带同画布；后段延长带另作隐藏补片。'},
 {id:'socks',name:'白色短袜 · 完整脚部',source:'underlay-repair.png',z:30,paths:'M340 1448 H595 V1650 H340 Z',note:'袜脚使用脱鞋补画源，不把鞋内不可见区域留空。'},
 {id:'shoes',name:'深蓝乐福鞋',source:'outfit.png',z:60,paths:'M376 1535 Q390 1544 417 1534 Q431 1535 440 1556 L448 1592 Q466 1617 464 1630 Q462 1644 443 1646 L395 1642 Q372 1638 370 1620 L371 1580 Z M524 1534 Q550 1535 563 1554 L567 1596 Q572 1616 559 1630 Q544 1645 516 1646 L485 1646 Q471 1643 474 1628 L488 1594 L502 1561 Q507 1540 524 1534 Z',note:'鞋成对导出；不包含袜口或皮肤。'},
 {id:'earrings',name:'银色耳钉',source:'outfit.png',z:75,paths:'M404 212 A4 4 0 1 0 412 212 A4 4 0 1 0 404 212 M529 212 A4 4 0 1 0 537 212 A4 4 0 1 0 529 212',note:'首饰位置沿用原图；耳垂不应烘焙进首饰。'},
 {id:'necklace',name:'银链蓝吊坠',source:'outfit.png',z:70,paths:'M434 324 Q470 343 505 324 L505 327 Q470 347 434 327 Z M468 342 L472 342 L472 350 L475 355 L473 360 L469 361 L466 357 L467 352 L468 350 Z',note:'颈根坐标定位；贴肤饰品需人工复核皮肤残留。'},
 {id:'hair-front',name:'前发 · 中分发冠与鬓角',source:'base.png',z:90,paths:'M390 180 C386 128 409 66 470 37 C525 38 554 80 560 166 L554 196 Q549 202 543 207 L535 205 Q542 178 527 142 Q512 110 489 103 L472 105 L457 102 Q430 105 416 139 Q404 165 406 194 L398 204 Q392 197 390 180 Z',mode:'hair',note:'无刘海，前额留空；前发只含发冠与两侧鬓角，不含脸、耳或眼睛。'}
];
 const cache={};async function source(name){if(cache[name])return cache[name];const file=path.join(root,'sources',name);if(!fs.existsSync(file))return null;const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==W||info.height!==H)throw new Error(name+' has wrong canvas: '+info.width+'x'+info.height);return cache[name]={data,info};}
function outsideWhite(data){const N=W*H,seen=new Uint8Array(N),queue=new Int32Array(N);let head=0,tail=0;function push(p){if(seen[p])return;const i=p*4;if(data[i]<247||data[i+1]<247||data[i+2]<247)return;seen[p]=1;queue[tail++]=p;}
 for(let x=0;x<W;x++){push(x);push((H-1)*W+x);}for(let y=0;y<H;y++){push(y*W);push(y*W+W-1);}while(head<tail){const p=queue[head++],x=p%W;if(x)push(p-1);if(x<W-1)push(p+1);if(p>=W)push(p-W);if(p<N-W)push(p+W);}return seen;}
async function writeLayer(def){const src=await source(def.source);if(!src)return null;const alpha=rasterPath(def.paths),bg=outsideWhite(src.data),out=Buffer.from(src.data);let visible=0,verified=0;let x0=W,y0=H,x1=0,y1=0;
 for(let p=0;p<W*H;p++){const i=p*4;let a=Math.round(alpha[p]*src.data[i+3]/255);if(bg[p])a=0;const x=p%W,y=Math.floor(p/W),r=out[i],g=out[i+1],b=out[i+2];if(def.mode==='hair'){if(r>g+4||r>b+2||x>410&&x<530&&y>145&&y<224)a=0;}if(['upper','earrings','necklace'].includes(def.id)&&r>g+10&&r>b+15)a=0;if(def.id==='shoes'&&r>190&&g>190&&b>190)a=0;out[i+3]=a;if(a){visible++;if(out[i]===src.data[i]&&out[i+1]===src.data[i+1]&&out[i+2]===src.data[i+2])verified++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}else{out[i]=out[i+1]=out[i+2]=0;}}
 await sharp(out,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,'layers',def.id+'.png'));
 await sharp(out,{raw:{width:W,height:H,channels:4}}).extractChannel(3).png().toFile(path.join(root,'masks',def.id+'.png'));
 return {...def,file:'layers/'+def.id+'.png',mask:'masks/'+def.id+'.png',width:W,height:H,x:0,y:0,bounds:[x0,y0,x1,y1],visible_pixels:visible,source_rgb_identity:visible?verified/visible:0,status:'cut-preview-needs-edge-review'};
}
async function writeBody(){const src=await source('base.png'),out=Buffer.from(src.data),bg=outsideWhite(src.data);
 const face=rasterPath('M429 106 Q469 91 509 106 Q532 130 538 176 L550 185 L545 205 L533 216 Q515 250 470 266 Q428 249 404 215 L390 205 L385 185 L400 175 Q407 128 429 106 Z');
 const underwear=rasterPath('M404 305 L422 301 L436 374 L504 374 L516 306 L534 312 L552 385 L571 426 Q583 467 568 497 L568 515 L369 515 L367 497 Q353 468 364 431 L385 379 Z M350 676 Q470 700 590 676 L605 735 L578 751 L524 777 L503 805 L439 805 L415 776 L362 751 L335 736 Z');
 for(let p=0;p<W*H;p++){const i=p*4;const r=out[i],g=out[i+1],b=out[i+2];let a=face[p]||underwear[p]||((r>g+2&&r>b+4)?255:0);if(bg[p])a=0;out[i+3]=a;if(!a)out[i]=out[i+1]=out[i+2]=0;}
 await sharp(out,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,'layers','body.png'));
 return {id:'body',name:'身体与基础内搭',file:'layers/body.png',source:'base.png',z:10,width:W,height:H,x:0,y:0,status:'cut-preview-needs-edge-review',note:'不包含前发或后发；基础内搭暂与身体合层，供头发分层检查。'};
}
async function writeRearHair(){const file=path.join(root,'sources','hair-back-generated.png');if(!fs.existsSync(file))return null;
 const trimmed=await sharp(file).trim({background:'#00000000'}).png().toBuffer();const meta=await sharp(trimmed).metadata();
 const scale=Math.min(374/meta.width,458/meta.height),width=Math.round(meta.width*scale),height=Math.round(meta.height*scale),left=Math.round(469-width/2),top=37;
 await sharp({create:{width:W,height:H,channels:4,background:'#00000000'}}).composite([{input:await sharp(trimmed).resize(width,height).png().toBuffer(),left,top}]).png().toFile(path.join(root,'layers','hair-back.png'));
 return {id:'hair-back',name:'后发 · 完整补画',file:'layers/hair-back.png',source:'hair-back-generated.png',z:0,width:W,height:H,x:0,y:0,status:'generated-repair-registered',registration:{scale,left,top,contentWidth:width,contentHeight:height},note:'后发中间补全，置于身体后方；生成稿先按母版发冠中心与肩外宽度归位，非原图直接切片。'};
}
(async()=>{fs.mkdirSync(path.join(root,'layers'),{recursive:true});fs.mkdirSync(path.join(root,'masks'),{recursive:true});const records=[];for(const def of definitions){const r=await writeLayer(def);if(r)records.push(r);}records.push(await writeBody());const rear=await writeRearHair();if(rear)records.push(rear);
 for(const id of ['body','socks']){const record=records.find(r=>r.id===id);if(!record)continue;const raw=await sharp(path.join(root,record.file)).ensureAlpha().raw().toBuffer();for(let y=1543;y<H;y++)for(let x=0;x<W;x++)raw[(y*W+x)*4+3]=0;const file='layers/'+id+'-shoes-on.png';await sharp(raw,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,file));record.occluded_by_shoes=file;record.occlusion_note='穿鞋时隐藏鞋内脚部及袜脚，避免原身体脚趾轮廓从鞋边露出；卸鞋恢复完整层。';}
 fs.writeFileSync(path.join(root,'layers.json'),JSON.stringify({character:'沈知微',canvas:{width:W,height:H},method:'same-canvas deterministic alpha masks; original RGB retained without rescaling',production_ready:false,layers:records},null,2));console.log('Exported',records.length,'same-canvas PNG layers');
})();
