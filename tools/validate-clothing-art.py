"""Read-only technical preflight. Visual acceptance remains mandatory.

Masks are 939x1676 L/LA/RGBA PNGs: L is coverage, LA/RGBA uses alpha.
This tool never generates, expands, repairs, imports or publishes artwork.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

CANVAS = (939, 1676)


def load(path, mask=False):
    with Image.open(path) as im:
        if im.format != "PNG" or im.size != CANVAS:
            raise ValueError(f"{path}: expected PNG on {CANVAS}")
        if mask:
            if im.mode == "L":
                return np.array(im)
            if im.mode not in ("RGBA", "LA"):
                raise ValueError(f"{path}: mask must be L, LA or RGBA")
        return np.array(im.convert("RGBA"))[:, :, 3]


def validate(front, back, outline, forbidden=None, required=None, opaque_threshold=250):
    """Inputs are alpha/coverage arrays. No body silhouette is accepted."""
    errors = []
    if not np.any(front):
        errors.append("front is empty")
    if not np.any(front == 0):
        errors.append("front has no transparent background")
    if np.any(back):
        errors.append("back must be completely transparent: no inner/rear pieces")
    # One level allows rounding in alpha multiplication, not geometry expansion.
    outside = int(np.count_nonzero(front.astype(np.int16) > outline.astype(np.int16) + 1))
    if outside:
        errors.append(f"front exceeds approved garment coverage: {outside} pixels")
    if forbidden is not None:
        unwanted = int(np.count_nonzero((forbidden > 0) & (front > 0)))
        if unwanted:
            errors.append(f"paint inside explicitly forbidden openings: {unwanted} pixels")
    if required is not None:
        missing = int(np.count_nonzero((required > 0) & (front < opaque_threshold)))
        if missing:
            errors.append(f"opaque fabric missing in required interior: {missing} pixels; repaint")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ("front", "back", "outline", "outline-record"):
        parser.add_argument("--" + key, type=Path, required=True)
    parser.add_argument("--forbidden", type=Path)
    parser.add_argument("--required-opaque", type=Path)
    parser.add_argument("--opaque-threshold", type=int, default=250)
    args = parser.parse_args()
    errors = []
    hashes = {}
    try:
        if not 1 <= args.opaque_threshold <= 255:
            raise ValueError("opaque threshold must be 1..255")
        record = json.loads(args.outline_record.read_text(encoding="utf-8-sig"))
        digest = hashlib.sha256(args.outline.read_bytes()).hexdigest()
        if (record.get("basis") != "approved-garment-outline"
                or record.get("approved") is not True
                or record.get("sha256") != digest):
            raise ValueError("outline record must identify the approved garment mask and its hash")
        if record.get("bodyAlphaExpanded") is not False:
            raise ValueError("outline provenance must explicitly exclude body-alpha expansion")
        arrays = [load(args.front), load(args.back), load(args.outline, mask=True)]
        forbidden = load(args.forbidden, mask=True) if args.forbidden else None
        required = load(args.required_opaque, mask=True) if args.required_opaque else None
        errors.extend(validate(*arrays, forbidden, required, args.opaque_threshold))
        for key in ("front", "back", "outline", "outline_record", "forbidden", "required_opaque"):
            path = getattr(args, key)
            if path:
                hashes[key] = hashlib.sha256(path.read_bytes()).hexdigest()
    except (OSError, ValueError, KeyError) as exc:
        errors.append(str(exc))
    print(json.dumps({"technicalPass": not errors, "visualPass": None,
                      "runtimeValidated": False, "sha256": hashes, "errors": errors},
                     ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
