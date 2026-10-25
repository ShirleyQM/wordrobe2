"""Download upstream THA3 sources and author-linked weights into the local tools folder."""
from pathlib import Path
import urllib.request, zipfile, json, hashlib, shutil
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / '.tools/face-workflow'
def download(url, dst):
    if dst.exists(): return
    dst.parent.mkdir(parents=True, exist_ok=True)
    print('Downloading', url, flush=True)
    with urllib.request.urlopen(url, timeout=120) as response, open(str(dst)+'.part', 'wb') as out:
        shutil.copyfileobj(response, out)
    Path(str(dst)+'.part').replace(dst)
    print('Saved', dst.name, dst.stat().st_size, flush=True)
download('https://codeload.github.com/pkhungurn/talking-head-anime-3-demo/zip/refs/heads/main', BASE/'tha3-source.zip')
with zipfile.ZipFile(BASE/'tha3-source.zip') as z:
    z.extractall(BASE/'tha3-unpacked')
src=BASE/'tha3-unpacked/talking-head-anime-3-demo-main'
shutil.copytree(src, BASE/'tha3', dirs_exist_ok=True)
download('https://www.dropbox.com/s/y7b8jl4n2euv8xe/talking-head-anime-3-models.zip?dl=1', BASE/'tha3-models.zip')
with zipfile.ZipFile(BASE/'tha3-models.zip') as z:
    print('Archive entries', z.namelist()[:12], flush=True)
    for item in z.infolist():
        parts=Path(item.filename).parts
        if ('separable_float' in parts or 'standard_float' in parts) and item.filename.endswith('.pt'):
            variant=next(p for p in parts if p in ('standard_float','separable_float'))
            dst=BASE/'tha3/data/models'/variant/parts[-1]
            dst.parent.mkdir(parents=True,exist_ok=True)
            with z.open(item) as f, dst.open('wb') as o: shutil.copyfileobj(f,o)
            print('Extracted',variant, dst.name,flush=True)
report={str(p.relative_to(BASE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (BASE/'tha3/data/models').rglob('*.pt')}
(BASE/'tha3-download-hashes.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
