const fs=require('fs'),sharp=require('C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out='assets/materials/characters/body-clean-v2',W=939,H=1676;
(async()=>{fs.mkdirSync(out,{recursive:true});fs.copyFileSync('C:/Users/Administrator/.codex/generated_images/01a15a36-fffd-7d52-9f5c-1384fcf76434/exec-5c87ee6f-65da-4793-9bb9-68f958b84bc7.png',out+'/repaint-source.png');const donor=await sharp(out+'/repaint-source.png').resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const files=['head-cutout-v2/body-hairless.png'];for(let t=0;t<4;t++)for(let b=0;b<3;b++)files.push(`underwear-integrated-v1/body-${t}-${b}.png`);
 for(const file of files){const {data}=await sharp('assets/materials/characters/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});const original=Buffer.from(data),alpha=Buffer.alloc(W*H);for(let i=0;i<alpha.length;i++)alpha[i]=original[i*4+3];const smooth=await sharp(alpha,{raw:{width:W,height:H,channels:1}}).median(3).blur(.9).toColourspace('b-w').raw().toBuffer();
 for(let y=270;y<H;y++)for(let x=0;x<W;x++){const k=(y*W+x)*4;if(!original[k+3]&&smooth[y*W+x]<5)continue;let near=false;for(let dy=-5;dy<=5&&!near;dy++)for(let dx=-5;dx<=5;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<W&&yy<H&&original[(yy*W+xx)*4+3]<100){near=true;break;}}
 const skin=original[k]-original[k+1]>14&&original[k+1]-original[k+2]>6;const shoulder=y<355&&skin;
 if(near||shoulder){let best=-1,dist=Infinity;for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=W||yy<0||yy>=H)continue;const q=(yy*W+xx)*4,d=dx*dx+dy*dy;if(d<dist&&donor[q+3]>245&&donor[q]>170&&donor[q]>donor[q+1]*1.035&&donor[q+1]>donor[q+2]*1.015){best=q;dist=d;}}if(best>=0){const blend=shoulder?Math.min(1,(y-270)/12,(355-y)/15):1;for(let c=0;c<3;c++)data[k+c]=Math.round(donor[best+c]*blend+original[k+c]*(1-blend));}}
 data[k+3]=smooth[y*W+x];
 }
 await sharp(data,{raw:{width:W,height:H,channels:4}}).png().toFile(out+'/'+file.split('/').pop());}
 for(const bg of ['#eef3fa','#242d3a'])await sharp(out+'/body-0-0.png').extract({left:275,top:235,width:390,height:220}).resize(780,440).flatten({background:bg}).png().toFile(out+'/shoulders-'+(bg==='#eef3fa'?'light':'dark')+'.png');
 fs.writeFileSync(out+'/README.txt','Built-in image_gen edit: preserve adult character identity, pose and proportions; repaint dark jagged skin contours as natural matte skin. Repaint source retained. Final keeps original face, interior below shoulders and garment pixels except silhouette band. Original silhouette registered, median 3 + blur 0.6 antialias; no automatic bounding-box resize. tools/build-clean-body-v2.cjs is reproducible.\n');console.log('13 registered body variants written');})();

