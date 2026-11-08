// Makes every hard-coded green in the stylesheets follow the workspace theme.
//
//   node scripts/theme-palette.mjs
//
// 1. In each listed stylesheet, a green colour value (hex or rgb/rgba) in a declaration becomes
//    var(--pbc-<id>, <original>). Without a theme override the original colour shows, so the green
//    theme looks exactly as before.
// 2. styles/pb-theme-palette.css is (re)written with the purple and black value of every such colour,
//    plus the Tailwind colour tokens of the settings screens (tmpb/reference.css @theme).
// Purple keeps each colour's lightness and saturation and moves its hue to violet; black removes the
// colour and darkens the accents, so text keeps the contrast it had on the green design.
// Running it again is safe: colours already wrapped are skipped.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const files = [
  'index.css',
  'styles/compact-ui.css', 'styles/components.css', 'styles/global.css', 'styles/postbank-glass.css',
  'styles/postbank-login.css', 'styles/postbank-workspace.css', 'styles/sky-theme.css',
  'pages/management-dashboard.css', 'pages/settings-profile.css', 'components/portfolio-actions.css',
  'tmpb/styles/patterns.css',
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l, l, l].map(v => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
const hex2 = n => n.toString(16).padStart(2, '0');
const isGreen = (h, s, l) => h >= 70 && h <= 180 && s >= 0.1 && l > 0.03 && l < 0.995;
function themed([r, g, b], theme) {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (theme === 'purple') return hslToRgb(268 + (h - 140) * 0.3, clamp(s * 1.08), l);
  if (theme === 'blue') return hslToRgb(206 + (h - 140) * 0.25, clamp(s * 1.05), l);
  // red: a deep crimson; mid tones a little darker so white text on accents stays strong.
  if (theme === 'red') return hslToRgb(356 + (h - 140) * 0.12, clamp(s * 1.1), s > 0.35 && l < 0.62 ? l * 0.9 : l);
  // black: neutral warm grey; saturated accents go near-black, dark text gets darker.
  const nl = s > 0.35 && l < 0.62 ? l * 0.42 : l < 0.35 ? l * 0.55 : l;
  return hslToRgb(42, s * 0.06, nl);
}

function parseHex(text) {
  let v = text.slice(1).toLowerCase();
  if (v.length === 3 || v.length === 4) v = [...v].map(c => c + c).join('');
  if (v.length !== 6 && v.length !== 8) return null;
  return { rgb: [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)), alpha: v.length === 8 ? v.slice(6) : null, id: v };
}

const palette = new Map(); // id -> { rgb, alphaCss }
function register(id, rgb, alphaCss) { if (!palette.has(id)) palette.set(id, { rgb, alphaCss }); return id; }

function convertValue(value) {
  // Leave url(...) alone: a var() cannot live inside it.
  const urls = [];
  value = value.replace(/url\([^)]*\)/g, m => { urls.push(m); return `\u0000${urls.length - 1}\u0000`; });
  value = value.replace(/(var\(--pbc-[\w-]+,\s*)?(#[0-9a-fA-F]{3,8})\b/g, (m, wrapped, hex) => {
    if (wrapped) return m;
    const c = parseHex(hex); if (!c) return m;
    const [h, s, l] = rgbToHsl(...c.rgb); if (!isGreen(h, s, l)) return m;
    const id = register(c.id, c.rgb, c.alpha ? `${c.alpha}` : null);
    return `var(--pbc-${id},${hex})`;
  });
  value = value.replace(/(var\(--pbc-[\w-]+,\s*)?rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)/g, (m, wrapped, r, g, b, a) => {
    if (wrapped) return m;
    const rgb = [r, g, b].map(Number); const [h, s, l] = rgbToHsl(...rgb); if (!isGreen(h, s, l)) return m;
    const id = register(`rgb-${rgb.join('-')}${a ? '-' + a.replace(/[.%]/g, '_') : ''}`, rgb, a ? `a:${a}` : null);
    return `var(--pbc-${id},${m})`;
  });
  return value.replace(/\u0000(\d+)\u0000/g, (_, i) => urls[Number(i)]);
}

// Colours wrapped by an earlier run still need their palette entry.
function registerWrapped(text) {
  for (const m of text.matchAll(/var\(--pbc-([\w-]+),\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))\)/g)) {
    if (m[2].startsWith('#')) { const c = parseHex(m[2]); if (c) register(m[1], c.rgb, c.alpha); continue; }
    const n = m[2].match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)/);
    if (n) register(m[1], [n[1], n[2], n[3]].map(Number), n[4] ? `a:${n[4]}` : null);
  }
}

let changed = 0;
for (const file of files) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, 'utf8');
  registerWrapped(before);
  // Declarations only: "prop: value" followed by ; or } (selectors end in "{", so IDs are never touched).
  const after = before.replace(/(^|[{;\s])(--?[\w-]+|[a-zA-Z-]+)(\s*:\s*)([^;{}]+)(?=[;}])/g,
    (m, lead, prop, colon, value) => lead + prop + colon + convertValue(value));
  if (after !== before) { fs.writeFileSync(full, after); changed++; }
}

// Tailwind tokens of the settings screens: green ones get a themed value under the same name.
const tokens = [];
for (const m of fs.readFileSync(path.join(root, 'tmpb/reference.css'), 'utf8').matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
  const c = parseHex(m[2]); if (!c) continue;
  const [h, s, l] = rgbToHsl(...c.rgb); if (isGreen(h, s, l)) tokens.push({ name: m[1], rgb: c.rgb, alpha: c.alpha });
}

function css(rgb, alphaCss) {
  const hex = '#' + rgb.map(hex2).join('');
  if (!alphaCss) return hex;
  if (alphaCss.startsWith('a:')) { const a = alphaCss.slice(2); return `rgba(${rgb.join(',')},${a})`; }
  return hex + alphaCss;
}
function block(theme) {
  const lines = [...palette.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([id, { rgb, alphaCss }]) => `--pbc-${id}:${css(themed(rgb, theme), alphaCss)}`);
  for (const t of tokens) lines.push(`${t.name}:${css(themed(t.rgb, theme), t.alpha)}`);
  return `html[data-pb-theme="${theme}"]{\n  ${lines.join(';\n  ')};\n}\n`;
}
fs.writeFileSync(path.join(root, 'styles/pb-theme-palette.css'),
  `/* Generated by scripts/theme-palette.mjs: the purple, black, blue and red value of every green the stylesheets use. Do not edit by hand. */\n${block('purple')}${block('black')}${block('blue')}${block('red')}`);
console.log(`files changed: ${changed}, colours: ${palette.size}, tailwind tokens: ${tokens.length}`);
