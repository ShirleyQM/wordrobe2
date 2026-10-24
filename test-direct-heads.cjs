const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const folder='exports/cixiu-placement-final-20261024',manifest=JSON.parse(fs.readFileSync(folder+'-manifest.json')),published=JSON.parse(fs.readFileSync('assets/materials/published/hair-defaults.json'));
const ctx={window:{},location:{hash:''},URLSearchParams,ToolStorage:{ready:{then(){}}}};vm.runInNewContext(fs.readFileSync(folder+'/boot.js','utf8'),ctx);const td=ctx.window.ToolData;
assert.deepEqual(JSON.parse(JSON.stringify(td.data['api/hair-defaults'].positionDefaults)),published.positionDefaults);
for(const row of manifest.images){const mapped=td.images[row.source];assert(mapped,row.source);assert(fs.existsSync(path.join(folder,mapped.split('#')[0])));if(row.direct){assert(!mapped.includes('#'),row.source);assert(!row.file.startsWith('atlas-'));assert(row.width>120);}}
const hairCtx={window:{HAIR_STORAGE_KEY:'hair-test',addEventListener(){}},localStorage:{getItem:()=>null}};vm.runInNewContext(fs.readFileSync('assets/hair-studio.js','utf8').replace('return {mount,layer,faceLayer,','return {materialURL,mount,layer,faceLayer,'),hairCtx);let count=0;for(const side of ['front','back'])for(const r of hairCtx.window.HairStudio.consumer.catalog(side)){const source=hairCtx.window.HairStudio.materialURL(side,r.id),url=td.images[source];assert(url&&!url.includes('#'),side+r.id);count++;}assert.equal(count,88);
assert(manifest.files<=200);const zip='exports/词秀-发型定位检查版-20261024.zip';assert(fs.statSync(zip).size<10485760);
for(const name of fs.readdirSync(folder+'/assets').filter(n=>n.endsWith('.svg'))){const svg=fs.readFileSync(folder+'/assets/'+name,'utf8');assert(!/<script|<foreignObject|(?:href|xlink:href)="https?:/i.test(svg));for(const m of svg.matchAll(/base64,([^"]+)/g))assert(Buffer.from(m[1],'base64').length<1048576);}
console.log('PASS: 88 hairstyles use standalone URLs without fragments; every saved fit matches the canonical table; '+manifest.files+' files; ZIP under 10 MiB; SVG and Base64 checks pass.');



