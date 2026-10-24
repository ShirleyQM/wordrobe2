const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const rows=JSON.parse(fs.readFileSync('assets/materials/patterns/lettering/manifest.json','utf8'));
assert.equal(rows.length,36);assert.equal(new Set(rows.map(r=>r.id)).size,36);
for(const row of rows){assert.ok(row.alpha);assert.ok(row.png.startsWith('png/'));const png=fs.readFileSync(path.join('assets/materials/patterns/lettering',row.png));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');}
const select={},context={URLSearchParams,location:{search:''},document:{querySelector:()=>select},console,fetch:async url=>({ok:true,json:async()=>url.includes('/lettering/')?rows:[{id:'M001',alpha:true,png:'png/example.png',category:'botanical'}]})};
vm.createContext(context);const source=fs.readFileSync('assets/garment-prints/editor.js','utf8').split('const CATEGORIES=')[0];vm.runInContext(source,context);
(async()=>{await vm.runInContext('loadPatterns()',context);assert.equal(vm.runInContext("PATTERNS.filter(p=>p[0].startsWith('lettering-')).length",context),36);assert.ok(select.innerHTML.includes('花体英文 · 36 款'));
assert.equal(vm.runInContext("motifCategory='lettering';filteredPatterns().length",context),36);
for(const style of ['black-handwritten','burgundy-elegant','cocoa-retro','navy-casual'])assert.equal(vm.runInContext(`motifCategory='lettering-${style}';filteredPatterns().length`,context),9);
assert.equal(vm.runInContext("motifCategory='new';filteredPatterns().length",context),37);
assert.equal(vm.runInContext("patternURL('lettering-T01')",context),'assets/materials/patterns/lettering/'+rows[0].png);
assert.equal(vm.runInContext("motifCategory='classic';filteredPatterns().length",context),9);
console.log('PASS: 36 real PNGs, lettering registration, all four category filters, original motifs, and exact render asset URLs.');})().catch(e=>{console.error(e);process.exitCode=1;});
