import { useState, useCallback } from 'react';

export const PAL_DEFAULTS = ['#0b1112', '#192528', '#2a3f43', '#ef615e', '#d4dadb'];
export const PAL_VARS = ['--bg', '--surface', '--border', '--accent', '--text'];

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function lerpHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a), [br, bg, bb] = hexToRgb(b);
  const r  = Math.round(ar + (br - ar) * t).toString(16).padStart(2, '0');
  const g  = Math.round(ag + (bg - ag) * t).toString(16).padStart(2, '0');
  const bl = Math.round(ab + (bb - ab) * t).toString(16).padStart(2, '0');
  return `#${r}${g}${bl}`;
}

function applyToRoot(colors) {
  const root = document.documentElement;
  const [bg, surface, border, accent, text] = colors;
  PAL_VARS.forEach((v, i) => root.style.setProperty(v, colors[i]));
  // Always keep text white
  root.style.setProperty('--text', '#ffffff');
  root.style.setProperty('--surface2',   lerpHex(surface, border, 0.4));
  root.style.setProperty('--border2',    lerpHex(border,  '#ffffff', 0.15));
  root.style.setProperty('--text-muted', '#999999');
  root.style.setProperty('--text-dim',   '#555555');
}

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem('hub_palette'));
    if (saved && saved.length === 5) return saved;
  } catch {}
  return [...PAL_DEFAULTS];
}

export function usePalette() {
  const [colors, setColors] = useState(() => {
    const c = loadSaved();
    applyToRoot(c);
    return c;
  });
  const [locked, setLocked] = useState([false, false, false, false, false]);
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(() => {
    const saved = localStorage.getItem('hub_palette_preset');
    return saved !== null ? JSON.parse(saved) : null;
  });

  const apply = useCallback((next) => {
    applyToRoot(next);
    setColors(next);
    localStorage.setItem('hub_palette', JSON.stringify(next));
  }, []);

  const generate = useCallback(() => {
    const hue       = Math.random() * 360;
    const accentHue = (hue + 140 + Math.random() * 80) % 360;
    const sat       = 10 + Math.random() * 18;
    const next = [
      hslToHex(hue, sat,      4 + Math.random() * 4),
      hslToHex(hue, sat,      9 + Math.random() * 4),
      hslToHex(hue, sat,      17 + Math.random() * 7),
      hslToHex(accentHue, 60 + Math.random() * 25, 60 + Math.random() * 10),
      hslToHex(hue, 8  + Math.random() * 8,        76 + Math.random() * 12),
    ];
    apply(colors.map((c, i) => locked[i] ? c : next[i]));
    setActivePreset(null);
    localStorage.setItem('hub_palette_preset', 'null');
  }, [colors, locked, apply]);

  const toggleLock = useCallback((i) => {
    setLocked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }, []);

  const applyPreset = useCallback((i, theme) => {
    setActivePreset(i);
    localStorage.setItem('hub_palette_preset', JSON.stringify(i));
    apply([...theme.colors]);
  }, [apply]);

  const toggleOpen = useCallback(() => setOpen(prev => !prev), []);

  return { colors, locked, open, activePreset, generate, toggleLock, applyPreset, toggleOpen };
}
