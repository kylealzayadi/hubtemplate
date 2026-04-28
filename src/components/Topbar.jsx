import { useState, useEffect } from 'react';

export default function Topbar({ onPaletteToggle }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
      setDate(now.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="topbar">
      <span className="topbar-label">Command Center</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="palette-btn" onClick={onPaletteToggle} title="Theme">🎨</button>
        <span className="topbar-date">{date}</span>
        <span className="clock" id="clock">{time}</span>
      </div>
    </div>
  );
}
