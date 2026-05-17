#!/usr/bin/env node
// Rasterize each project's `public/icons/source.svg` into the 8 PWA PNG sizes.
// Idempotent: re-running without source changes yields byte-identical output.
// Run from `frontend/` via `npm run icons`.

import sharp from 'sharp';
import { readdir, readFile, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = resolve(SCRIPT_DIR, '..', 'projects');

const exists = async (p) => {
  try { await access(p); return true; } catch { return false; }
};

const apps = (await readdir(PROJECTS_DIR, { withFileTypes: true }))
  .filter(d => d.isDirectory() && d.name !== 'shared')
  .map(d => d.name)
  .sort();

let totalGenerated = 0;
let totalSkipped = 0;

for (const app of apps) {
  const iconsDir = join(PROJECTS_DIR, app, 'public', 'icons');
  const srcPath = join(iconsDir, 'source.svg');

  if (!(await exists(srcPath))) {
    console.log(`· skip   ${app.padEnd(22)} (no source.svg)`);
    totalSkipped++;
    continue;
  }

  const svg = await readFile(srcPath);

  for (const size of SIZES) {
    const outPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svg, { density: 600 })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, palette: false })
      .toFile(outPath);
  }

  console.log(`✓ done   ${app.padEnd(22)} (8 PNGs)`);
  totalGenerated++;
}

console.log(`\n${totalGenerated} app(s) generated · ${totalSkipped} skipped`);
