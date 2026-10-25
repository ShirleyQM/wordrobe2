"""Local, isolated PSD2Live trial client. Credentials stay in ignored .tools files."""
import sys,os,re,json,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];TOOLS=ROOT/'.tools/face-workflow'
spec=importlib.util.spec_from_file_location('p2l_proxy',TOOLS/'psd2live-3.6.7/app/resources/mcp_proxy.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
def client():
    log=(TOOLS/'mcp.log').read_text(encoding='utf8',errors='replace');token=re.search(r'^token\s+([^\s]+)',log,re.M).group(1)
    return mod.Client(endpoint='http://127.0.0.1:23879/mcp',token=token,timeout=60)
if __name__=='__main__':
    op=sys.argv[1];req=json.loads(Path(sys.argv[2][1:]).read_text(encoding='utf8-sig')) if len(sys.argv)>2 and sys.argv[2].startswith('@') else json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
    with client() as c:
        data,images=c.call(op,req);name=op.replace('/','-');(TOOLS/(name+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
        for i,img in enumerate(images):(TOOLS/(name+f'-{i}.png')).write_bytes(img)
        shown={k:data[k] for k in ['id','description','request_schema'] if k in data} if op=='workspace_get_operation' else data
        text=json.dumps(shown,ensure_ascii=False,indent=2);print(text[:12000]);print('IMAGE_COUNT',len(images))
