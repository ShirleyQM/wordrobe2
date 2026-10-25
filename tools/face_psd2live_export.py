"""Rebuild the trial engine project from its layout; do not install or accept Cubism SDK licenses."""
import json,hashlib
from pathlib import Path
from face_psd2live import client,ROOT
OUT=ROOT/'assets/materials/characters/face-live-workflow-v1/engine'
OUT.mkdir(exist_ok=True)
with client() as c:
    layout=OUT.parent/'layout.json'
    report={'tool':'PSD2Live 3.6.7','input':'../layout.json','sourceHashes':{str(p.relative_to(OUT.parent)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [layout,*sorted((OUT.parent/'parts').glob('*.png'))]},'operations':[]}
    c.edit('project_import_layout',path=str(layout));c.edit('rig_generate')
    for op,args in [('project_save_as',{'path':str(OUT/'OriginalFaceTrial.psd2live')}),('project_export_model',{'output_directory':str(OUT/'cubism')}),('project_export_target',{'target':'p2lrt','output_directory':str(OUT/'p2lrt')}),('project_export_target',{'target':'web','output_directory':str(OUT/'web')})]:
        try:
            result=c.edit(op,**args);report['operations'].append({'operation':op,'args':args,'result':result,'ok':True});print(op,args.get('target',''),json.dumps(result,ensure_ascii=False)[:1800])
        except Exception as e:
            report['operations'].append({'operation':op,'args':args,'ok':False,'error':str(e)});print('FAILED',op,str(e))
    page=OUT/'web/index.html'
    if page.exists():page.write_text(page.read_text(encoding='utf8').replace('const select = document.getElementById("clip");','window.__p2lTrial = player;\n  const select = document.getElementById("clip");'),encoding='utf8')
    report['validation']='Export/toolchain experiment only. No claim of accepted facial rig or official Core visual validation. Web preview exposes __p2lTrial solely for repeatable local verification.'
    (OUT/'export-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
