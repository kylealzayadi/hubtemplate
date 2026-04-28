import { useEffect } from 'react';
import { DISCORD_THEMES } from '../data/discordThemes.js';

export default function PaletteBar({ colors, locked, open, activePreset, onGenerate, onToggleLock, onApplyPreset, onClose }) {
  const roles = ['BG', 'Surface', 'Border', 'Accent', 'Text'];

  useEffect(() => {
    function handler(e) {
      if (e.code === 'Space' && open && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        onGenerate();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onGenerate]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-panel" onClick={e => e.stopPropagation()}>
        <div className="palette-section">
          <div className="palette-section-label">Theme Presets</div>
          <div className="palette-presets-grid">
            {DISCORD_THEMES.map((theme, i) => (
              <button
                key={i}
                className={`pal-preset-btn${activePreset === i ? ' active' : ''}`}
                onClick={() => onApplyPreset(i, theme)}
              >
                <span className="pal-preset-dot" style={{ background: theme.colors[3] }}></span>
                {theme.name}
              </button>
            ))}
          </div>
        </div>

        <div className="palette-divider"></div>

        <div className="palette-section">
          <div className="palette-section-label">Custom Colors <span style={{ opacity: 0.4, fontWeight: 400 }}>· Space to randomize</span></div>
          <div className="palette-swatches">
            {colors.map((color, i) => (
              <div key={i} className="pal-swatch-row">
                <div className="pal-color-dot" style={{ background: color }}></div>
                <div className="pal-swatch-info">
                  <span className="pal-role">{roles[i]}</span>
                  <span className="pal-hex">{color}</span>
                </div>
                <button
                  className={`pal-lock${locked[i] ? ' locked' : ''}`}
                  onClick={() => onToggleLock(i)}
                >
                  {locked[i] ? '🔒' : '🔓'}
                </button>
              </div>
            ))}
          </div>
          <button className="pal-generate-btn" onClick={onGenerate}>Randomize</button>
        </div>
      </div>
    </div>
  );
}
