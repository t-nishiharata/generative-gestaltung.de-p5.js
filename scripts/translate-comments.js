// Translate top JSDoc help blocks in sketch.js files under 01_P to Japanese
// Heuristic, pattern-based translation for common phrases used across the book.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT, '01_P');

function walk(dir, filterFn) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results.push(...walk(full, filterFn));
    } else if (filterFn(full)) {
      results.push(full);
    }
  }
  return results;
}

function hasJapanese(text) {
  // Hiragana, Katakana, CJK Unified Ideographs
  return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text);
}

function translateLine(line) {
  // Only translate within comment lines that start with ' *'
  const raw = line;
  let s = line;

  // Section headers
  s = s.replace(/\bMOUSE\b/g, 'マウス');
  s = s.replace(/\bKEYS\b/g, 'キー');

  // Common legends
  s = s.replace(/position x\/y/gi, '位置 x/y');
  s = s.replace(/position x/gi, '位置 x');
  s = s.replace(/position y/gi, '位置 y');
  s = s.replace(/left click/gi, '左クリック');
  s = s.replace(/right click/gi, '右クリック');
  s = s.replace(/middle click/gi, 'ミドルクリック');
  s = s.replace(/double click/gi, 'ダブルクリック');
  s = s.replace(/drag( the)? mouse/gi, 'マウスドラッグ');
  s = s.replace(/move( the)? mouse/gi, 'マウス移動');

  // Save actions
  s = s.replace(/save png/gi, 'PNG を保存');
  s = s.replace(/save jpg|save jpeg/gi, 'JPG を保存');
  s = s.replace(/save pdf/gi, 'PDF を保存');
  s = s.replace(/save svg/gi, 'SVG を保存');
  s = s.replace(/save gif/gi, 'GIF を保存');
  s = s.replace(/save (color )?palette/gi, 'カラーパレットを保存');

  // Arrows and keys
  s = s.replace(/arrow up\/down/gi, '↑/↓');
  s = s.replace(/arrow left\/right/gi, '←/→');
  s = s.replace(/space( bar)?/gi, 'スペース');
  s = s.replace(/backspace/gi, 'Backspace');
  s = s.replace(/delete/gi, 'Delete');
  s = s.replace(/shift/gi, 'Shift');
  s = s.replace(/ctrl/gi, 'Ctrl');
  s = s.replace(/cmd/gi, 'Cmd');
  s = s.replace(/alt/gi, 'Alt');
  s = s.replace(/opt(ion)?/gi, 'Option');

  // Entities
  s = s.replace(/circle(s)?/gi, '円');
  s = s.replace(/rectangle(s)?/gi, '四角形');
  s = s.replace(/line(s)?/gi, '線');
  s = s.replace(/module(s)?/gi, 'モジュール');
  s = s.replace(/grid/gi, 'グリッド');
  s = s.replace(/row and colou?m count/gi, '行数と列数');

  // Attributes
  s = s.replace(/size/gi, 'サイズ');
  s = s.replace(/color/gi, '色');
  s = s.replace(/opacity/gi, '不透明度');
  s = s.replace(/alpha/gi, 'アルファ');
  s = s.replace(/stroke/gi, '線');
  s = s.replace(/fill/gi, '塗り');
  s = s.replace(/background/gi, '背景');
  s = s.replace(/foreground/gi, '前景');
  s = s.replace(/offset/gi, 'オフセット');
  s = s.replace(/position/gi, '位置');
  s = s.replace(/rotation/gi, '回転');
  s = s.replace(/angle/gi, '角度');
  s = s.replace(/thickness|weight/gi, '太さ');
  s = s.replace(/scale/gi, 'スケール');
  s = s.replace(/density/gi, '密度');
  s = s.replace(/speed/gi, '速度');

  // Actions
  s = s.replace(/random position/gi, 'ランダム位置');
  s = s.replace(/toggle/gi, '切り替え');
  s = s.replace(/increase/gi, '増やす');
  s = s.replace(/decrease/gi, '減らす');
  s = s.replace(/reset/gi, 'リセット');

  // Leading description verbs
  s = s.replace(/^\s*\*\s*changing\s+(.+)/i, ' * $1を変化させます。');
  s = s.replace(/^\s*\*\s*change\s+(.+)/i, ' * $1を変化させます。');
  s = s.replace(/^\s*\*\s*generates?\s+(.+)/i, ' * $1を生成します。');
  s = s.replace(/^\s*\*\s*draws?\s+(.+)/i, ' * $1を描画します。');
  s = s.replace(/^\s*\*\s*creates?\s+(.+)/i, ' * $1を作成します。');
  s = s.replace(/^\s*\*\s*makes?\s+(.+)/i, ' * $1を作ります。');

  return s;
}

function translateBlock(block) {
  if (hasJapanese(block)) return null; // skip if already translated
  const lines = block.split(/\r?\n/);
  const out = lines.map(l => {
    if (!/^\s*\*/.test(l)) return l; // keep non-star lines
    return translateLine(l);
  });
  return out.join('\n');
}

function processFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const re = /\/\*\*[\s\S]*?\*\//m;
  const m = src.match(re);
  if (!m) return { filePath, changed: false, reason: 'no-javadoc' };
  const original = m[0];
  const translated = translateBlock(original);
  if (!translated || translated === original) {
    return { filePath, changed: false, reason: 'skip-or-nochange' };
  }
  const out = src.replace(original, translated);
  fs.writeFileSync(filePath, out, 'utf8');
  return { filePath, changed: true };
}

function main() {
  const files = walk(TARGET_DIR, p => /sketch\.js$/.test(p));
  const results = [];
  for (const f of files) {
    try {
      results.push(processFile(f));
    } catch (e) {
      results.push({ filePath: f, changed: false, reason: 'error:' + e.message });
    }
  }
  const changed = results.filter(r => r.changed).length;
  const skipped = results.length - changed;
  console.log(`Processed ${results.length} files. Updated ${changed}, skipped ${skipped}.`);
}

if (require.main === module) {
  main();
}
