/**
 * Fix UTF-8 double-encoding (mojibake) across admin-plus page.tsx files.
 * Run: node scripts/fix-encoding.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function walkDir(dir, pattern) {
  const results = [];
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results.push(...walkDir(full, pattern));
    else if (pattern.test(item.name)) results.push(full);
  }
  return results;
}

// Replacement map: double-encoded → correct UTF-8
// Order matters: longer patterns first to avoid partial matches
const replacements = [
  // 3-char mojibake (multi-byte Unicode chars doubly encoded)
  ['\u00E2\u20AC\u201C', '\u2014'],  // â€" → — (em-dash)
  ['\u00E2\u20AC\u2122', '\u2019'],  // â€™ → ' (right single quote)
  ['\u00E2\u20AC\u0153', '\u201C'],  // â€œ → " (left double quote)
  ['\u00E2\u20AC\u009D', '\u201D'],  // â€ → " (right double quote)
  ['\u00E2\u2020\u201C', '\u2194'],  // â†" → ↔ (bidirectional arrow)
  ['\u00E2\u02C6\u0178', '\u221E'],  // âˆž → ∞ (infinity)
  ['\u00E2\u201D\u20AC', '\u2500'],  // â"€ → ─ (box drawing horizontal)

  // 2-char mojibake (Latin accented chars doubly encoded)
  ['\u00C3\u00A1', '\u00E1'],  // Ã¡ → á
  ['\u00C3\u00A2', '\u00E2'],  // Ã¢ → â
  ['\u00C3\u00A3', '\u00E3'],  // Ã£ → ã
  ['\u00C3\u00A4', '\u00E4'],  // Ã¤ → ä
  ['\u00C3\u00A7', '\u00E7'],  // Ã§ → ç
  ['\u00C3\u00A9', '\u00E9'],  // Ã© → é
  ['\u00C3\u00AA', '\u00EA'],  // Ãª → ê
  ['\u00C3\u00AB', '\u00EB'],  // Ã« → ë
  ['\u00C3\u00AD', '\u00ED'],  // Ã­ → í
  ['\u00C3\u00B3', '\u00F3'],  // Ã³ → ó
  ['\u00C3\u00B5', '\u00F5'],  // Ãµ → õ
  ['\u00C3\u00BA', '\u00FA'],  // Ãº → ú
  ['\u00C3\u00B1', '\u00F1'],  // Ã± → ñ
  ['\u00C3\u00BC', '\u00FC'],  // Ã¼ → ü
];

// Scan admin-plus pages AND also test files
const dirs = [
  path.join(root, 'src/app/(adminplus)/admin-plus'),
  path.join(root, 'tests'),
];

let totalFixed = 0;
for (const dir of dirs) {
  const files = walkDir(dir, /\.(tsx?|spec\.ts)$/);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      totalFixed++;
      console.log('Fixed:', path.relative(root, file));
    }
  }
}
console.log(`\n${totalFixed} files fixed.`);
