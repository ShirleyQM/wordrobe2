"""Apply explicitly located shallow FRONT cuff arcs and fabric-side shading.

User-requested alpha/RGB edit, not AI painting, body filling or a cuff detector.
Config contains per-cuff endpoints, inward direction, depth and shadow strength.
Writes a NEW candidate directory only. Never publishes or modifies source files.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import tempfile

import numpy as np
from PIL import Image


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def cuff_fields(size, cuffs):
    w, h = size
    yy, xx = np.mgrid[:h, :w].astype(np.float64)
    # Evaluate pixel centres. Width/depth are in this garment's native coordinates.
    xx += .5
    yy += .5
    keep = np.ones((h, w), dtype=np.float64)
    shade = np.zeros((h, w), dtype=np.float64)
    for c in cuffs:
        a, b = np.array(c['a'], float), np.array(c['b'], float)
        tangent = b-a
        width = np.linalg.norm(tangent)
        if not np.isfinite(width) or width < 8:
            raise ValueError('cuff endpoints too close or invalid')
        tangent /= width
        normal = np.array(c['inward'], float)
        normal_length = np.linalg.norm(normal)
        if not np.isfinite(normal_length) or normal_length < 1e-8:
            raise ValueError('inward direction required')
        normal /= normal_length
        if abs(np.dot(tangent, normal)) > .02:
            raise ValueError('inward must be perpendicular to cuff edge')
        depth, strength = float(c['depth']), float(c.get('shadow', .12))
        if not 0 < depth <= width*.12 or not 0 <= strength <= .22:
            raise ValueError('shallow arc depth <=12% width and shadow <=22% required')
        u = (xx-a[0])*tangent[0]+(yy-a[1])*tangent[1]
        v = (xx-a[0])*normal[0]+(yy-a[1])*normal[1]
        active = (u >= 0) & (u <= width) & (v >= -2) & (v <= depth+16)
        along = np.sin(np.pi*np.clip(u/width, 0, 1))**2
        arc = depth*along
        coverage = np.clip(v-arc+.5, 0, 1)
        keep = np.minimum(keep, np.where(active, coverage, 1))
        # Shade only on the FRONT fabric side, never a rear crescent/inner oval.
        inward_distance = v-arc
        weight = strength*along**.45*np.exp(-((inward_distance-2.5)/4.0)**2)
        weight *= active & (inward_distance >= 0) & (inward_distance <= 14)
        shade = np.maximum(shade, weight)
    return keep, shade


def build(config, output):
    cfg = json.loads(config.read_text(encoding='utf-8-sig'))
    base = config.resolve().parent
    if output.exists():
        raise ValueError('new output directory required')
    src = (base/cfg['source']).resolve()
    with Image.open(src) as im:
        if im.mode != 'RGBA':
            raise ValueError('source must be RGBA')
        original = im.copy()
    if list(original.size) != cfg['canvas'] or sha(src) != cfg['sourceSha256']:
        raise ValueError('source canvas/hash changed')
    old = np.array(original)
    keep, shade = cuff_fields(original.size, cfg['cuffs'])
    cut = np.rint((1-keep)*255).astype('uint8')
    shadow = np.rint(shade*255).astype('uint8')
    new = old.copy()
    # Quantized maps are also used by the saved-user-mesh surface patch.
    new[:, :, 3] = np.rint(old[:, :, 3]*(1-cut.astype(float)/255)).astype('uint8')
    new[:, :, :3] = np.rint(old[:, :, :3]*(1-shadow[:, :, None].astype(float)/255)).astype('uint8')
    # Fully transparent source RGB stays unchanged too; no hidden source edits.
    new[old[:, :, 3] == 0] = old[old[:, :, 3] == 0]
    assert np.all(new[:, :, 3] <= old[:, :, 3])
    unaffected = (cut == 0) & (shadow == 0)
    assert np.array_equal(new[unaffected], old[unaffected])
    changed = np.any(new != old, axis=2)
    if not np.any(changed):
        raise ValueError('no cuff paint touched: review locations')
    out = Image.fromarray(new)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.cuff-', dir=output.parent) as temp:
        d = Path(temp)/'item'
        d.mkdir()
        original.save(d/'before.png')
        out.save(d/'front.png')
        Image.new('RGBA', original.size).save(d/'back.png')
        Image.fromarray(cut).save(d/'cut-mask.png')
        Image.fromarray(shadow).save(d/'shadow-mask.png')
        if cfg.get('body'):
            with Image.open(base/cfg['body']) as im:
                body = im.convert('RGBA')
            if body.size != original.size:
                raise ValueError('body canvas mismatch')
            Image.alpha_composite(body, out).save(d/'tryon.png')
            Image.alpha_composite(body, original).save(d/'tryon-before.png')
        for name, color in [('light', '#e8edf0'), ('dark', '#25303c')]:
            bg = Image.new('RGBA', original.size, color)
            Image.alpha_composite(bg, out).save(d/f'review-{name}.png')
        (d/'config.json').write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding='utf8')
        (d/'qa.json').write_text(json.dumps({
            'technicalPass': True, 'visualPass': None, 'runtimeValidated': False,
            'sourceSha256': cfg['sourceSha256'], 'frontSha256': sha(d/'front.png'),
            'changedPixels': int(changed.sum()),
            'alphaIncreasedPixels': 0, 'outsideMasksUnchanged': True,
            'method': 'explicit shallow front cuff arc and fabric-side shadow; no inner or rear layer'
        }, indent=2), encoding='utf8')
        d.rename(output)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        build(args.config, args.output)
    except (ValueError, KeyError, OSError, TypeError) as exc:
        parser.exit(1, str(exc)+'\n')
