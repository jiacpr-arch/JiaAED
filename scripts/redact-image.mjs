#!/usr/bin/env node
// Burn opaque boxes into a screenshot before it goes anywhere public.
//
//   node scripts/redact-image.mjs <input> <output.png> <boxes.json>
//
// boxes.json: [{ "x": 10, "y": 20, "w": 300, "h": 40, "why": "customer name" }, ...]
// in pixels of the ORIGINAL image. Boxes are composited onto the pixels and the
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

const boxes = JSON.parse(readFileSync(boxesPath, "utf8"));
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

await img
  .flatten({ background: "#ffffff" }) // drop alpha so nothing shows through
  .composite(overlays)
  .png({ compressionLevel: 9 })
  .toFile(output); // sharp writes no metadata unless .withMetadata() is called

console.log(`redacted ${boxes.length} region(s) → ${output} (${width}×${height})`);
