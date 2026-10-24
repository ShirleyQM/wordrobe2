const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=__dirname,{canonicalURL}=require('./asset-paths.cjs');
const base=path.join(root,'assets/materials');
for(const folder of ['garments','patterns/classic','patterns/motifs','characters/campus','characters/open-arms','published','sources/imported'])assert.ok(fs.statSync(path.join(base,folder)).isDirectory());
assert.equal(canonicalURL(root,'/assets/fit-catalog/collection.json'),'/assets/materials/garments/collection.json');
assert.equal(canonicalURL(root,'/assets/prints/rose.png'),'/assets/materials/patterns/classic/rose.png');
assert.equal(canonicalURL(root,'/assets/new-materials/catalog.json'),'/assets/materials/sources/imported/catalog.json');
assert.equal(canonicalURL(root,'/assets/extracted-motifs-v1/manifest.json'),'/assets/materials/patterns/motifs/manifest.json');
const migration=JSON.parse(fs.readFileSync(path.join(base,'migration.json'),'utf8'));
for(const entry of migration.records){
 const record=JSON.parse(fs.readFileSync(path.join(base,'published',entry.group+'.json'),'utf8'));
 assert.ok(record.revision>=entry.revision,'published revisions never regress');
 const legacy=JSON.parse(fs.readFileSync(path.join(root,'assets/live-wardrobe',entry.group+'.json'),'utf8'));
 if(record.revision===entry.revision)assert.deepEqual(record.draft,legacy.draft,'all user draft data survives migration');
 for(const item of record.items)for(const field of ['front','back','image','thumbnail'])if(item[field])assert.ok(fs.existsSync(path.join(root,canonicalURL(root,item[field]))),item[field]);
}
(async()=>{let groups;await require('./wardrobe-store.cjs')(root)({method:'GET'},{writeHead(){},end(text){groups=JSON.parse(text).groups;}},'/api/wardrobe');const library=groups.find(g=>g.group==='library');assert.equal(library.items.length,JSON.parse(fs.readFileSync(path.join(base,'garments/collection.json'),'utf8')).items.length);assert.ok(library.items.every(i=>i.image.startsWith('/assets/materials/')));console.log('PASS: unified material directories, all canonical garment sources, current revisions and all user drafts preserved, old URL compatibility.');})().catch(e=>{console.error(e);process.exitCode=1;});
