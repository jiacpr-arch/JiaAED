#!/usr/bin/env node
// Burn opaque boxes into a screenshot before it goes anywhere public.
//
//   node scripts/redact-image.mjs <input> <output.png> <boxes.json>
//
// boxes.json: { "boxes": [{ "x": 10, "y": 20, "w": 300, "h": 40, "why": "customer name" }, ...],
//               "crop": { "x": 0, "y": 52, "w": 1920, "h": 1028 } }   (crop optional)
// (a bare array of boxes also works). All coordinates are pixels of the
// ORIGINAL image; boxes are burned in first, then the crop is taken. Boxes are composited onto the pixels and the
// result is re-encoded as a fresh PNG (no EXIF/XMP/ICC text, no layers), so the
// covered content cannot be recovered from the output file. Always open the
// output and check it by eye — a box in the wrong place hides nothing.
//
// Used for the PRIMEDIC CLOUD screenshot on /aed/heartsave-y8-gps: cover user
// names, emails, phone numbers, customer names, addresses, serial numbers, and
// every per-device map pin / coordinate.
import { readFileSync } from "node:fs";
import sharp from "sharp";

const [input, output, boxesPath] = process.argv.slice(2);
if (!input || !output || !boxesPath) {
  console.error("usage: node scripts/redact-image.mjs <input> <output.png> <boxes.json>");
  process.exit(1);
}
if (!output.endsWith(".png")) {
  console.error("output must be .png (lossless, so the boxes stay solid)");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(boxesPath, "utf8"));
const boxes = Array.isArray(spec) ? spec : spec.boxes;
const crop = Array.isArray(spec) ? null : spec.crop ?? null;
if (!Array.isArray(boxes) || boxes.length === 0) {
  console.error("boxes.json must be a non-empty array");
  process.exit(1);
}

const img = sharp(input).rotate(); // apply EXIF orientation before measuring
const { width, height } = await img.metadata();

const overlays = boxes.map((b, i) => {
  const x = Math.max(0, Math.floor(b.x));
  const y = Math.max(0, Math.floor(b.y));
  const w = Math.min(width - x, Math.ceil(b.w));
  const h = Math.min(height - y, Math.ceil(b.h));
  if (!(w > 0 && h > 0)) throw new Error(`box ${i} (${b.why ?? "?"}) is outside the image`);
  return {
    input: { create: { width: w, height: h, channels: 4, background: { r: 24, g: 41, b: 35, alpha: 1 } } },
    left: x,
    top: y,
  };
});

// Burn the boxes into a raw buffer first so the crop below can't reorder them.
const burned = await img
  .flatten({ background: "#ffffff" }) // drop alpha so nothing shows through
  .composite(overlays)
  .png()
  .toBuffer();

let out = sharp(burned);
if (crop) out = out.extract({ left: crop.x, top: crop.y, width: crop.w, height: crop.h });
await out.png({ compressionLevel: 9 }).toFile(output); // no .withMetadata() ⇒ no EXIF/XMP

const size = crop ? `${crop.w}×${crop.h} (cropped from ${width}×${height})` : `${width}×${height}`;
console.log(`redacted ${boxes.length} region(s) → ${output} ${size}`);
