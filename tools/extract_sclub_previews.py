import hashlib
import json
import pathlib
import re
import extract_sims_previews as extractor

BASE = pathlib.Path(r'D:\文档\Electronic Arts\The Sims 4\Mods')
FOLDERS = [BASE / 'S-CLUB', BASE / '【小爱SIMS】S-Club 后续更新']
extractor.OUT = pathlib.Path(__file__).resolve().parents[1] / 'S-Club头发预览图'


def main():
    paths = []
    duplicates = []
    by_name = {}
    for folder in FOLDERS:
        for path in sorted(folder.rglob('*.package')):
            if not re.search(r's[\W_]*club', path.name, re.I):
                continue
            if 'hair' not in path.name.lower() or re.search(r'hair[\W_]*acc', path.name, re.I):
                continue
            name = path.name.casefold()
            same = by_name.setdefault(name, [])
            matched = None
            for previous in same:
                if previous.stat().st_size == path.stat().st_size and hashlib.sha256(previous.read_bytes()).digest() == hashlib.sha256(path.read_bytes()).digest():
                    matched = previous
                    break
            if matched:
                duplicates.append({'file': str(path), 'identical_to': str(matched)})
            else:
                paths.append(path)
                same.append(path)
    extractor.main(paths, label='S-Club 头发', source_description=[str(p) for p in FOLDERS], example='EMA、2024、Hair')
    (extractor.OUT / '重复文件清单.json').write_text(json.dumps(duplicates, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Identical duplicate packages skipped: {len(duplicates)}')


if __name__ == '__main__':
    main()
