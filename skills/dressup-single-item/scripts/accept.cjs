const {fs,path,hash,readBatch,write}=require('./lib.cjs');
const {root,config}=readBatch(process.argv[2]),id=process.argv[3],note=process.argv.slice(4).join(' ');
if(!config.items.some(x=>x.id===id)||note.length<12)throw new Error('Require valid item and actual visual observations');
const dir=path.join(root,'items',id),file=path.join(dir,'qa.json'),qa=JSON.parse(fs.readFileSync(file));
if(!qa.technical_pass)throw new Error('Technical QA failed');
if(hash(path.join(dir,'proof.png'))!==qa.proof_hash||hash(path.join(dir,'tryon.png'))!==qa.tryon_hash||hash(path.join(dir,'layer.png'))!==qa.layer_hash)throw new Error('Evidence changed; rerun QA');
if(config.requireWearablePartition){const p=path.join(dir,'wearable-qa.json'),w=JSON.parse(fs.readFileSync(p));if(w.alpha_partition_max_error!==0||hash(path.join(dir,w.front))!==w.front_hash||hash(path.join(dir,w.back))!==w.back_hash||hash(path.join(dir,'proof.png'))!==w.proof_hash||hash(path.join(dir,'tryon.png'))!==w.tryon_hash)throw new Error('Wearable partition failed or stale');w.visual_reviewed=true;w.visual_notes=note;w.reviewed_at=new Date().toISOString();write(p,w);}
qa.visual_reviewed=true;qa.wearable_validated=true;qa.visual_notes=note;qa.reviewed_at=new Date().toISOString();write(file,qa);console.log(id+' wearable validation recorded');
