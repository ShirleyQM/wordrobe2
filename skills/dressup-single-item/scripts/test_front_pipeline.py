"""Isolated regression tests; no project or wardrobe mutation."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image
from register_front import register
from validate_front import validate


class FrontPipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="front-skill-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.a = np.zeros((48, 32), dtype=np.uint8)
        self.a[10:30, 8:24] = 255
        self.a[14:18, 12:16] = 80
        rgba = np.zeros((48, 32, 4), dtype=np.uint8)
        rgba[:, :, :3] = (180, 90, 50)
        rgba[:, :, 3] = self.a
        Image.fromarray(rgba).save(self.root/"source.png")
        self.mask = np.zeros_like(self.a)
        self.mask[10:30, 8:24] = 255
        Image.fromarray(self.mask).save(self.root/"outline.png")
        Image.new("RGBA", (32, 48), "#b0c0d0").save(self.root/"body.png")
        self.record = {"basis": "approved-garment-outline", "approved": True,
                       "bodyAlphaExpanded": False,
                       "sha256": hashlib.sha256((self.root/"outline.png").read_bytes()).hexdigest()}
        self.cfg = {"canvas": [32, 48], "source": "source.png", "outline": "outline.png",
                    "outlineRecord": "outline-record.json", "body": "body.png",
                    "registration": {"scale": 1, "translate": [0, 0]},
                    "details": [[8, 10, 24, 30]]}
        self.save()

    def save(self):
        (self.root/"outline-record.json").write_text(json.dumps(self.record), encoding="utf8")
        (self.root/"config.json").write_text(json.dumps(self.cfg), encoding="utf8")

    def run_art(self, output="candidate"):
        self.save()
        return register(self.root/"config.json", self.root/output)

    def test_identity_preserves_actual_alpha_and_builds_evidence(self):
        result = self.run_art()
        with Image.open(self.root/"candidate/front.png") as im:
            self.assertTrue(np.array_equal(np.array(im.getchannel("A")), self.a))
            self.assertEqual(im.getpixel((13, 15))[3], 80)
        with Image.open(self.root/"candidate/back.png") as im:
            self.assertIsNone(im.getchannel("A").getbbox())
        with Image.open(self.root/"candidate/detail-01-tryon.png") as im:
            self.assertEqual(im.size, (16, 20))
        self.assertIsNone(result["visualPass"])
        self.assertFalse(result["runtimeValidated"])
        self.assertIn("tryon.png", result["artifacts"])

    def test_uniform_transform_coordinates(self):
        self.cfg["registration"] = {"scale": 0.5, "translate": [3, 4]}
        # This fixture tests placement, so permit the transformed paint's full region.
        Image.new("L", (32, 48), 255).save(self.root/"outline.png")
        self.record["sha256"] = hashlib.sha256((self.root/"outline.png").read_bytes()).hexdigest()
        self.run_art()
        with Image.open(self.root/"candidate/registered-paint.png") as im:
            # Bicubic antialiasing may add a one-pixel fringe; measure solid core.
            core = im.getchannel("A").point(lambda a: 255 if a > 128 else 0)
            self.assertEqual(core.getbbox(), (7, 9, 15, 19))

    def test_source_cannot_fill_missing_fabric(self):
        required = np.zeros_like(self.a)
        required[14:18, 12:16] = 255
        Image.fromarray(required).save(self.root/"required.png")
        self.cfg["requiredOpaque"] = "required.png"
        with self.assertRaisesRegex(ValueError, "fabric missing"):
            self.run_art()
        self.assertFalse((self.root/"candidate").exists())

    def test_forbidden_opening_blocks(self):
        Image.fromarray(self.mask).save(self.root/"forbidden.png")
        self.cfg["forbidden"] = "forbidden.png"
        with self.assertRaisesRegex(ValueError, "forbidden openings"):
            self.run_art()

    def test_reject_body_expanded_record(self):
        self.record["bodyAlphaExpanded"] = True
        with self.assertRaisesRegex(ValueError, "outline record"):
            self.run_art()

    def test_reject_legacy_coverage(self):
        (self.root/"coverage.json").write_text('{"completedPixels": 1}', encoding="utf8")
        with self.assertRaisesRegex(ValueError, "legacy"):
            self.run_art()

    def test_reject_canvas_clipping(self):
        self.cfg["registration"]["translate"] = [-20, 0]
        with self.assertRaisesRegex(ValueError, "clipped"):
            self.run_art()

    def test_no_overwriting_candidates(self):
        self.run_art()
        original = (self.root/"candidate/front.png").read_bytes()
        with self.assertRaisesRegex(ValueError, "new directory"):
            self.run_art()
        self.assertEqual(original, (self.root/"candidate/front.png").read_bytes())

    def test_readonly_checks_catch_rear_and_outline_spill(self):
        self.assertTrue(validate(self.a, self.a, self.mask))
        spill = self.a.copy()
        spill[0, 0] = 255
        self.assertTrue(validate(spill, np.zeros_like(self.a), self.mask))

    def test_outline_identity_and_mode(self):
        self.record["sha256"] = "wrong"
        with self.assertRaisesRegex(ValueError, "outline record"):
            self.run_art()
        Image.new("RGB", (32, 48), "white").save(self.root/"outline.png")
        self.record["sha256"] = hashlib.sha256((self.root/"outline.png").read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, "mask must"):
            self.run_art()

    def narrow_outline(self):
        self.mask[:, 20:] = 0
        Image.fromarray(self.mask).save(self.root/"outline.png")
        self.record["sha256"] = hashlib.sha256((self.root/"outline.png").read_bytes()).hexdigest()
        self.save()

    def test_approved_but_narrow_outline_blocks(self):
        self.narrow_outline()
        with self.assertRaisesRegex(ValueError, "substantial clipping"):
            self.run_art()
        self.assertFalse((self.root/"candidate").exists())

    def test_inspection_emits_comparison_not_production_front(self):
        self.narrow_outline()
        result = register(self.root/"config.json", self.root/"inspection", inspect_only=True)
        self.assertFalse(result["technicalPass"])
        self.assertTrue(result["clipping"]["reviewRequired"])
        self.assertTrue((self.root/"inspection/removed-paint.png").exists())
        self.assertFalse((self.root/"inspection/front.png").exists())

    def test_review_bound_to_source_outline_transform_and_evidence(self):
        self.narrow_outline()
        result = register(self.root/"config.json", self.root/"inspection", inspect_only=True)
        review = {k:result[k] for k in ("sourceSha256", "outlineSha256", "canvas", "registration", "evidenceSha256")}
        review.update(reviewed=True, reason="Synthetic intentional side removal", evidence="inspection/clipping-comparison.png")
        path = self.root/"review.json"
        path.write_text(json.dumps(review), encoding="utf8")
        self.cfg["clippingReview"] = "review.json"
        self.run_art()
        review["registration"] = {"scale": 1, "translate": [1, 0]}
        path.write_text(json.dumps(review), encoding="utf8")
        with self.assertRaisesRegex(ValueError, "substantial clipping"):
            self.run_art("bad-transform")
        review["registration"] = self.cfg["registration"]
        review["evidenceSha256"] = "stale"
        path.write_text(json.dumps(review), encoding="utf8")
        with self.assertRaisesRegex(ValueError, "substantial clipping"):
            self.run_art("bad-evidence")


if __name__ == "__main__":
    unittest.main()
