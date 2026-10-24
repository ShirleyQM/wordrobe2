import collections
import hashlib
import html
import io
import json
import pathlib
import struct
import zlib
from PIL import Image

SOURCE = pathlib.Path(r'D:\文档\Electronic Arts\The Sims 4\Mods\SUNBERRY')
OUT = pathlib.Path(__file__).resolve().parents[1] / 'SUNBERRY预览图'


def entries(path):
    with path.open('rb') as stream:
        header = stream.read(96)
        if header[:4] != b'DBPF':
            raise ValueError('Not a DBPF package')
        count = struct.unpack_from('<I', header, 36)[0]
        offset = struct.unpack_from('<Q', header, 64)[0]
        stream.seek(offset)
        index = stream.read(struct.unpack_from('<I', header, 44)[0])
    flags = struct.unpack_from('<I', index)[0]
    if flags & ~7:
        raise ValueError(f'Unknown index flags {flags}')
    pos = 4
    shared = {}
    for bit, key in [(1, 'type'), (2, 'group'), (4, 'hi')]:
        if flags & bit:
            shared[key] = struct.unpack_from('<I', index, pos)[0]
            pos += 4
    result = []
    for _ in range(count):
        item = {}
        for key in ['type', 'group', 'hi', 'lo', 'offset', 'size', 'mem']:
            if key in shared:
                item[key] = shared[key]
            else:
                item[key] = struct.unpack_from('<I', index, pos)[0]
                pos += 4
        item['compression'], _ = struct.unpack_from('<HH', index, pos)
        pos += 4
        result.append(item)
    if pos != len(index):
        raise ValueError(f'Index length mismatch {pos}/{len(index)}')
    return result


def read_resource(stream, item):
    stream.seek(item['offset'])
    data = stream.read(item['size'] & 0x7fffffff)
    if item['compression'] == 0x5a42:
        data = zlib.decompress(data)
    elif item['compression'] != 0:
        raise ValueError(f"Unsupported compression {item['compression']:04X}")
    if len(data) != item['mem']:
        raise ValueError('Resource size mismatch')
    return data


def main(paths=None, label='SUNBERRY', source_description=None, example='25.12、Dress'):
    images = OUT / '图片'
    images.mkdir(parents=True, exist_ok=True)
    records, errors = [], []
    paths = sorted(SOURCE.glob('*.package')) if paths is None else paths
    used_names = set()
    for path in paths:
        record = {'file': path.name, 'source': str(path), 'images': [], 'thumbnail_resources': 0}
        output_stem = path.stem
        if output_stem.casefold() in used_names:
            output_stem += '__' + hashlib.sha256(str(path).encode()).hexdigest()[:10]
        used_names.add(output_stem.casefold())
        try:
            items = entries(path)
            seen = set()
            with path.open('rb') as stream:
                for item in items:
                    if item['type'] not in (0x3c1af1f2, 0x5b282d45):
                        continue
                    record['thumbnail_resources'] += 1
                    data = read_resource(stream, item)
                    digest = hashlib.sha256(data).hexdigest()
                    if digest in seen:
                        continue
                    seen.add(digest)
                    with Image.open(io.BytesIO(data)) as picture:
                        picture.load()
                        width, height = picture.size
                        suffix = '' if not record['images'] else f"__{len(record['images'])+1:02d}"
                        name = output_stem + suffix + '.png'
                        picture.convert('RGB').save(images / name)
                    record['images'].append({'path': '图片/' + name, 'width': width, 'height': height})
        except Exception as exc:
            record['error'] = str(exc)
            errors.append({'file': path.name, 'error': str(exc)})
        records.append(record)
    missing = [r['file'] for r in records if not r['images']]
    summary = {'source': source_description or str(SOURCE), 'packages': len(records),
               'with_preview': sum(bool(r['images']) for r in records),
               'images': sum(len(r['images']) for r in records),
               'missing': len(missing), 'errors': errors}
    (OUT / '提取清单.json').write_text(json.dumps({'summary': summary, 'files': records}, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / '未找到内置预览.txt').write_text('\n'.join(missing), encoding='utf-8-sig')
    page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>SUNBERRY 预览图</title>
<style>body{margin:0;background:#f5f2ed;color:#292724;font:15px system-ui}header{position:sticky;top:0;background:#fffef9f5;padding:20px 30px;border-bottom:1px solid #ddd;z-index:2}h1{margin:0 0 8px;font-size:24px}p{margin:8px 0;color:#666}input{padding:12px;width:min(550px,80%);font:inherit;border:1px solid #aaa;border-radius:8px}main{padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}article{background:white;border-radius:12px;padding:14px;overflow:hidden}article img{width:100%;height:245px;object-fit:contain;background:#f1f1f1}h2{font-size:13px;overflow-wrap:anywhere;font-weight:500}a{color:inherit}small{color:#777}.empty{height:245px;display:grid;place-items:center;background:#eee;color:#777}</style>
<header><h1>SUNBERRY · 本地预览图</h1><p id="summary"></p><input id="query" placeholder="搜索编号或文件名，例如 25.12、Dress"><label> <input style="width:auto" type="checkbox" id="missing">只看缺图</label><p id="count"></p></header><main id="grid"></main>
<script>const records=DATA;const summary=SUMMARY;
document.getElementById('summary').textContent=`${summary.packages} 个文件 · ${summary.with_preview} 个有预览 · ${summary.images} 张不同图片 · ${summary.missing} 个无内置预览。点击图片查看原图；图片来自本地包内，分辨率保留原样。`;
function render(){let q=document.getElementById('query').value.toLowerCase(),m=document.getElementById('missing').checked;let list=records.filter(r=>r.file.toLowerCase().includes(q)&&(!m||!r.images.length));let grid=document.getElementById('grid');grid.replaceChildren();for(let r of list){let card=document.createElement('article');if(r.images.length){for(let image of r.images){let a=document.createElement('a');a.href=image.path;a.target='_blank';let img=document.createElement('img');img.src=image.path;img.loading='lazy';img.alt=r.file;a.append(img);card.append(a)}}else{let div=document.createElement('div');div.className='empty';div.textContent=r.error?'提取失败':'无内置预览';card.append(div)}let title=document.createElement('h2');title.textContent=r.file;card.append(title);let small=document.createElement('small');small.textContent=r.images.map(i=>`${i.width}×${i.height}`).join(' / ');card.append(small);grid.append(card)}document.getElementById('count').textContent=`显示 ${list.length} 个文件`};document.getElementById('query').oninput=render;document.getElementById('missing').onchange=render;render();</script></html>'''
    page = page.replace('SUNBERRY', html.escape(label)).replace('25.12、Dress', html.escape(example))
    page = page.replace('DATA', json.dumps(records, ensure_ascii=False).replace('<', '\\u003c')).replace('SUMMARY', json.dumps(summary, ensure_ascii=False).replace('<', '\\u003c'))
    (OUT / '预览图目录.html').write_text(page, encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    main()
