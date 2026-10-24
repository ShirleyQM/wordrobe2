"""Cut and align the six generated hairstyle masters; never edit source images."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/materials/characters/sclub-six-v1'
BODY = ROOT / 'assets/materials/characters/hair-original-clean-v3/game/body-hairless.png'
SPECS = [
    # Explicit head/eye anchors, not silhouette bounding-box scaling.
    dict(id='rose', name='ROSE · 轻羽短卷', scale=.36, eye=470, frontCenter=410, backCenter=365, backDy=0),
    dict(id='010525', name='010525 · 侧垂长卷', scale=.48, eye=280, frontCenter=522, backCenter=330, backDy=0),
    dict(id='010724', name='010724 · 高双马尾', scale=.52, eye=300, frontCenter=390, backCenter=384, backDy=0),
    dict(id='030125', name='030125 · 斜刘海长直', scale=.53, eye=280, frontCenter=445, backCenter=325, backDy=0),
    dict(id='040524', name='040524 · 偏分长直', scale=.53, eye=280, frontCenter=485, backCenter=335, backDy=0),
    dict(id='040324', name='040324 · 中分后拢', scale=.40, eye=350, frontCenter=385, backCenter=384, backDy=0),
]
COLORS = [('黑', '#252b35'), ('棕', '#79513b'), ('金', '#c9ad75'), ('粉', '#c88caa')]


def clean(im):
    data = np.array(im.convert('RGBA'))
    # Source alpha inspection showed empty background at 0 and hair interiors at
    # 252..254. Keep the antialias ramp; remove only alpha noise below 4/255.
    alpha = np.clip((data[:, :, 3].astype(float) - 4) / 249, 0, 1)
    data[:, :, 3] = np.round(alpha * 255).astype('uint8')
    g = np.round(data[:, :, 0] * .2126 + data[:, :, 1] * .7152 + data[:, :, 2] * .0722).astype('uint8')
    data[:, :, :3] = g[:, :, None]
    data[data[:, :, 3] == 0] = 0
    return Image.fromarray(data)


def place(im, spec, side):
    scale = spec['scale']
    center = spec[side + 'Center']
    left = round(470 - center * scale)
    top = round(180 - spec['eye'] * scale + (spec['backDy'] if side == 'back' else 0))
    out = Image.new('RGBA', (939, 1676))
    piece = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    out.alpha_composite(piece, (left, top))
    return out


def recolor(im, color):
    data = np.array(im)
    tone = data[:, :, 0:1].astype(float) / 255
    rgb = np.array([int(color[i:i+2], 16) for i in [1, 3, 5]], float)
    shadow = rgb * .25 + [3, 4, 7]
    highlight = rgb * .5 + np.array([232, 228, 225]) * .5
    low = tone < .55
    t = np.clip(np.where(low, (tone - .08) / .47, (tone - .55) / .4), 0, 1)
    a, b = np.where(low, shadow, rgb), np.where(low, rgb, highlight)
    data[:, :, :3] = np.round(a * (1-t) + b * t).astype('uint8')
    data[data[:, :, 3] == 0] = 0
    return Image.fromarray(data)


def font(size=18):
    return ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', size)


def main():
    body = Image.open(BODY).convert('RGBA')
    qa = OUT / 'qa'
    qa.mkdir(exist_ok=True)
    allsheet = Image.new('RGB', (1200, 6 * 450), '#eeeae4')
    catalog = []
    for spec in SPECS:
        folder = OUT / 'items' / spec['id']
        folder.mkdir(parents=True, exist_ok=True)
        layers = {}
        for kind in ['lineart', 'gray']:
            source = Image.open(OUT / 'sources' / f"{spec['id']}-{kind}.png")
            for side, x in [('front', 0), ('back', 768)]:
                piece = clean(source.crop((x, 0, x+768, 1024)))
                # Same fixed crop and pad on both sides, no individual bbox fit.
                part = Image.new('RGBA', (720, 1112))
                part.alpha_composite(piece.resize((720, 960), Image.Resampling.LANCZOS), (0, 76))
                part.save(folder / f'{side}-{kind}.png')
                if kind == 'gray':
                    game = place(piece, spec, side)
                    game.save(folder / f'{side}-game-gray.png')
                    layers[side] = game
        row = Image.new('RGB', (1200, 450), '#eeeae4')
        for n, (label, color) in enumerate(COLORS):
            back, front = [recolor(layers[s], color) for s in ['back', 'front']]
            back.save(folder / f'back-{n}.png')
            front.save(folder / f'front-{n}.png')
            worn = back.copy()
            worn.alpha_composite(body)
            worn.alpha_composite(front)
            worn.save(folder / f'tryon-{n}.png')
            near = worn.crop((270, 25, 680, 590)).resize((290, 400), Image.Resampling.LANCZOS)
            tile = Image.new('RGBA', near.size, '#eeeae4')
            tile.alpha_composite(near)
            row.paste(tile.convert('RGB'), (n*300+5, 30))
            ImageDraw.Draw(row).text((n*300+15, 3), spec['name']+' · '+label, font=font(15), fill='#333333')
        row.save(qa / f"{spec['id']}-four-colors.jpg", quality=94)
        allsheet.paste(row, (0, SPECS.index(spec)*450))
        catalog.append({**spec, 'frontId': str(18+SPECS.index(spec)), 'backId': str(17+SPECS.index(spec)), 'front': f"items/{spec['id']}/front-game-gray.png", 'back': f"items/{spec['id']}/back-game-gray.png", 'headAnchor': [470,180], 'defaultFit': {'x':0,'y':0,'scale':1.2}, 'productionCanvas': [720,1112]})
    allsheet.save(qa / 'six-styles-four-colors.jpg', quality=94)
    (OUT / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Built six styles; 12 grayscale pieces, 12 original lineart pieces, 24 actual body try-ons.')


if __name__ == '__main__':
    main()
