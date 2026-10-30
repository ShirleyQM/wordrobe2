"""Uniformly register actual garment paint, clip to approved outline, emit QA candidates.

No body-alpha fill, geometry fitting, inner pieces, visual approval or publishing.
Paths in config are relative to that config. Output directory must not exist.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import tempfile

import numpy as np
from PIL import Image, ImageChops
from validate_front import load, validate


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def register(config, output, inspect_only=False):
    cfg = json.loads(config.read_text(encoding="utf-8-sig"))
    base = config.resolve().parent
    def file(key):
        return (base / cfg[key]).resolve()
    canvas = tuple(cfg["canvas"])
    if (len(canvas) != 2 or any(type(v) is not int or v <= 0 for v in canvas)):
        raise ValueError("canvas must contain two positive integers")
    scale = cfg["registration"]["scale"]
    tx, ty = cfg["registration"]["translate"]
    if any(type(v) not in (int, float) or not math.isfinite(v) for v in (scale, tx, ty)) or scale <= 0:
        raise ValueError("finite positive uniform scale and finite translation required")
    source, outline_file, record_file = file("source"), file("outline"), file("outlineRecord")
    record = json.loads(record_file.read_text(encoding="utf-8-sig"))
    if not (record.get("basis") == "approved-garment-outline"
            and record.get("approved") is True
            and record.get("bodyAlphaExpanded") is False
            and record.get("sha256") == sha(outline_file)):
        raise ValueError("approved garment outline record/hash required; no body-expanded alpha")
    coverage = source.parent / "coverage.json"
    if coverage.exists() and json.loads(coverage.read_text(encoding="utf-8-sig")).get("completedPixels", 0) > 0:
        raise ValueError("legacy completedPixels source: trace and repaint clean material first")
    with Image.open(source) as im:
        if im.format != "PNG" or "A" not in im.getbands():
            raise ValueError("source must be PNG with actual alpha")
        raw = im.convert("RGBA")
    bbox = raw.getchannel("A").getbbox()
    if not bbox or raw.getchannel("A").getextrema()[0] != 0:
        raise ValueError("source must contain visible paint and a transparent background")
    mapped = [bbox[0]*scale+tx, bbox[1]*scale+ty, bbox[2]*scale+tx, bbox[3]*scale+ty]
    if mapped[0] < 0 or mapped[1] < 0 or mapped[2] > canvas[0] or mapped[3] > canvas[1]:
        raise ValueError("transformed source would be clipped by canvas; review placement/source debris")
    outline = load(outline_file, mask=True, canvas=canvas)
    # Premultiplied sampling prevents hidden transparent RGB from creating fringes.
    paint = raw.convert("RGBa").transform(
        canvas, Image.Transform.AFFINE, (1/scale, 0, -tx/scale, 0, 1/scale, -ty/scale),
        resample=Image.Resampling.BICUBIC).convert("RGBA")
    registered = paint.copy()
    paint.putalpha(ImageChops.multiply(paint.getchannel("A"), Image.fromarray(outline)))
    front = np.array(paint.getchannel("A"))
    before_alpha = np.array(registered.getchannel("A"))
    loss = before_alpha.astype(np.float64)-front.astype(np.float64)
    loss_fraction = float(loss.sum()/max(1, before_alpha.astype(np.float64).sum()))
    clipping = {"removedAlphaFraction": loss_fraction,
                "removedOpaquePixels": int(np.count_nonzero((before_alpha >= 200) & (front < 40))),
                "reviewThreshold": 0.02, "reviewRequired": loss_fraction > 0.02}
    if inspect_only:
        if output.exists():
            raise ValueError("output must be a new directory")
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix=".clip-inspection-", dir=output.parent) as temp:
            folder = Path(temp)/"inspection"
            folder.mkdir()
            registered.save(folder/"registered-paint.png")
            paint.save(folder/"clipped-preview.png")
            removed = registered.copy()
            removed.putalpha(Image.fromarray(loss.astype("uint8")))
            removed.save(folder/"removed-paint.png")
            box = registered.getchannel("A").getbbox()
            crop_size = (box[2]-box[0], box[3]-box[1])
            comparison = Image.new("RGB", (crop_size[0]*2, crop_size[1]), "#cbd6df")
            for n, image in enumerate((registered, paint)):
                bg = Image.new("RGBA", canvas, "#cbd6df")
                comparison.paste(Image.alpha_composite(bg, image).crop(box).convert("RGB"), (n*crop_size[0], 0))
            comparison.save(folder/"clipping-comparison.png")
            report = {"inspectionOnly": True, "technicalPass": False, "visualPass": None,
                      "runtimeValidated": False, "clipping": clipping,
                      "sourceSha256": sha(source), "outlineSha256": sha(outline_file),
                      "canvas": list(canvas), "registration": cfg["registration"],
                      "evidenceSha256": sha(folder/"clipping-comparison.png")}
            (folder/"inspection.json").write_text(json.dumps(report, indent=2), encoding="utf8")
            folder.rename(output.resolve())
        return report
    if clipping["reviewRequired"]:
        review = json.loads(file("clippingReview").read_text(encoding="utf-8-sig")) if cfg.get("clippingReview") else {}
        review_root = file("clippingReview").parent if cfg.get("clippingReview") else base
        evidence = review_root/review.get("evidence", "")
        if not (review.get("reviewed") is True
                and review.get("sourceSha256") == sha(source)
                and review.get("outlineSha256") == sha(outline_file)
                and review.get("canvas") == list(canvas)
                and review.get("registration") == cfg["registration"]
                and isinstance(review.get("reason"), str) and review["reason"].strip()
                and evidence.is_file() and review.get("evidenceSha256") == sha(evidence)):
            raise ValueError(f"unreviewed substantial clipping ({loss_fraction:.1%} alpha removed); "
                             "run --inspect-clipping, inspect before/after and removed cloth, "
                             "correct the outline/placement or supply a hash-bound clippingReview")
        clipping["reviewSha256"] = sha(file("clippingReview"))
    back = np.zeros_like(front)
    forbidden = load(file("forbidden"), mask=True, canvas=canvas) if cfg.get("forbidden") else None
    required = load(file("requiredOpaque"), mask=True, canvas=canvas) if cfg.get("requiredOpaque") else None
    threshold = cfg.get("opaqueThreshold", 250)
    if type(threshold) is not int or not 1 <= threshold <= 255:
        raise ValueError("opaqueThreshold must be integer 1..255")
    errors = validate(front, back, outline, forbidden, required, threshold)
    if errors:
        raise ValueError("; ".join(errors))
    output = output.resolve()
    if output.exists():
        raise ValueError("output must be a new directory; never overwrite an existing item")
    output.parent.mkdir(parents=True, exist_ok=True)
    inputs = {"source": sha(source), "outline": sha(outline_file), "outlineRecord": sha(record_file)}
    for key in ("forbidden", "requiredOpaque", "body"):
        if cfg.get(key):
            inputs[key] = sha(file(key))
    details = cfg.get("details", [])
    for rect in details:
        if (len(rect) != 4 or any(type(v) is not int for v in rect)
                or not 0 <= rect[0] < rect[2] <= canvas[0]
                or not 0 <= rect[1] < rect[3] <= canvas[1]):
            raise ValueError("details use integer in-canvas [left, top, right, bottom] rectangles")
    body = None
    if cfg.get("body"):
        with Image.open(file("body")) as im:
            if im.size != canvas:
                raise ValueError("body preview canvas mismatch")
            body = im.convert("RGBA")
    # Build a new candidate package; never write catalogs or user fitting files.
    with tempfile.TemporaryDirectory(prefix=".garment-candidate-", dir=output.parent) as temp:
        folder = Path(temp) / "item"
        folder.mkdir()
        registered.save(folder/"registered-paint.png")
        paint.save(folder/"front.png")
        Image.new("RGBA", canvas).save(folder/"back.png")
        paint.getchannel("A").save(folder/"mask.png")
        for name, color in (("light", "#f4f0eb"), ("dark", "#24323d")):
            bg = Image.new("RGBA", canvas, color)
            Image.alpha_composite(bg, paint).save(folder/f"review-{name}.png")
        if body is not None:
            Image.alpha_composite(body, paint).save(folder/"tryon.png")
        for n, rect in enumerate(details, 1):
            for name in ("review-light", "review-dark", "tryon"):
                p = folder/f"{name}.png"
                if p.exists():
                    with Image.open(p) as im:
                        im.crop(rect).save(folder/f"detail-{n:02}-{name}.png")
        artifact_hashes = {p.name: sha(p) for p in sorted(folder.glob("*.png"))}
        qa = {"technicalPass": True, "visualPass": None, "runtimeValidated": False,
              "canvas": list(canvas), "inputs": inputs, "artifacts": artifact_hashes,
              "registration": {"scale": scale, "translate": [tx, ty], "uniform": True},
              "innerPiecesPolicy": "front-visible-only; visual verification required", "colorExtension": False,
              "sourceBounds": bbox, "clippedToApprovedGarmentOutline": True}
        qa["clipping"] = clipping
        (folder/"qa.json").write_text(json.dumps(qa, ensure_ascii=False, indent=2), encoding="utf8")
        (folder/"registration-config.json").write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf8")
        folder.rename(output)
    return qa


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--inspect-clipping", action="store_true",
                        help="write review evidence only; never emit front.png or pass QA")
    args = parser.parse_args()
    try:
        qa = register(args.config, args.output, inspect_only=args.inspect_clipping)
        print(json.dumps({"technicalPass": qa.get("technicalPass", True), "visualPass": None,
                          "inspectionOnly": qa.get("inspectionOnly", False),
                          "output": str(args.output.resolve()), "clipping": qa["clipping"],
                          "artifacts": qa.get("artifacts", {})}, indent=2))
        return 0
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(json.dumps({"technicalPass": False, "errors": [str(exc)]}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
