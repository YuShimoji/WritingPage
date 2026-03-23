/**
 * copy-vendor.js — Copies runtime vendor libraries from node_modules/ to vendor/.
 * Run automatically via `npm run postinstall`.
 *
 * JS libraries (vendor/*.js) are committed to git for GitHub Pages.
 * Font files (vendor/fonts/) are .gitignored — Electron-only, generated at install time.
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const vendorDir = path.join(projectRoot, 'vendor');
const fontsDir = path.join(vendorDir, 'fonts');
const fontFilesDir = path.join(fontsDir, 'files');

/** JS libraries to copy: [source in node_modules, dest filename] */
const jsLibs = [
  ['markdown-it/dist/markdown-it.min.js', 'markdown-it.min.js'],
  ['turndown/dist/turndown.js', 'turndown.js'],
  ['morphdom/dist/morphdom-umd.min.js', 'morphdom-umd.min.js'],
  ['lucide/dist/umd/lucide.min.js', 'lucide.min.js'],
  ['kuromoji/build/kuromoji.js', 'kuromoji.js'],
];

/** Font CSS files to copy */
const fontCSS = ['400.css', '700.css'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(0);
  console.log(`  ${path.basename(dest)} (${size} KB)`);
}

// --- JS libraries ---
console.log('Copying JS vendor libraries...');
ensureDir(vendorDir);
for (const [src, dest] of jsLibs) {
  const srcPath = path.join(projectRoot, 'node_modules', src);
  const destPath = path.join(vendorDir, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  SKIP: ${src} not found`);
    continue;
  }
  copyFile(srcPath, destPath);
}

// --- Font files (for Electron offline) ---
console.log('Copying font files (Noto Serif JP, weights 400+700)...');
const fontsourceDir = path.join(projectRoot, 'node_modules', '@fontsource', 'noto-serif-jp');
if (!fs.existsSync(fontsourceDir)) {
  console.warn('  SKIP: @fontsource/noto-serif-jp not found');
} else {
  ensureDir(fontFilesDir);

  // Copy CSS files
  for (const cssFile of fontCSS) {
    const src = path.join(fontsourceDir, cssFile);
    if (fs.existsSync(src)) copyFile(src, path.join(fontsDir, cssFile));
  }

  // Copy woff2 files for weights 400 and 700 only
  const srcFiles = path.join(fontsourceDir, 'files');
  const entries = fs.readdirSync(srcFiles);
  let count = 0;
  for (const entry of entries) {
    if ((entry.includes('-400-') || entry.includes('-700-')) && entry.endsWith('.woff2')) {
      fs.copyFileSync(path.join(srcFiles, entry), path.join(fontFilesDir, entry));
      count++;
    }
  }
  console.log(`  ${count} woff2 files copied`);
}

// --- Kuromoji dictionary files (for morphological analysis) ---
console.log('Copying kuromoji dictionary files...');
const kuromojiDictSrc = path.join(projectRoot, 'node_modules', 'kuromoji', 'dict');
const kuromojiDictDest = path.join(vendorDir, 'kuromoji-dict');
if (!fs.existsSync(kuromojiDictSrc)) {
  console.warn('  SKIP: kuromoji/dict not found');
} else {
  ensureDir(kuromojiDictDest);
  const dictFiles = fs.readdirSync(kuromojiDictSrc);
  let dictCount = 0;
  for (const entry of dictFiles) {
    if (entry.endsWith('.dat.gz')) {
      fs.copyFileSync(path.join(kuromojiDictSrc, entry), path.join(kuromojiDictDest, entry));
      dictCount++;
    }
  }
  const totalSize = (dictFiles
    .filter(f => f.endsWith('.dat.gz'))
    .reduce((sum, f) => sum + fs.statSync(path.join(kuromojiDictDest, f)).size, 0) / (1024 * 1024))
    .toFixed(1);
  console.log(`  ${dictCount} dictionary files copied (${totalSize} MB)`);
}

console.log('Vendor copy complete.');
