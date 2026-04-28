import { useState, useEffect, useCallback } from 'react';

const TIMEOUT_MS = 2 * 60 * 60 * 1000;
const STORAGE_KEY = 'hub_last_active';
const PASSWORD = import.meta.env.VITE_LOCK_PASSWORD || 'changeme';

// Soft client-side gate — keeps the page private from someone glancing
// at your laptop. Anyone with devtools can bypass it. Don't put real
// secrets behind this.
export default function LockScreen({ children }) {
  const [locked, setLocked] = useState(() => {
    const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    return Date.now() - last > TIMEOUT_MS;
  });

  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const touch = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  useEffect(() => {
    if (locked) return;
    touch();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => touch();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [locked, touch]);

  useEffect(() => {
    if (locked) return;
    const id = setInterval(() => {
      const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      if (Date.now() - last > TIMEOUT_MS) setLocked(true);
    }, 60000);
    return () => clearInterval(id);
  }, [locked]);

  function handleUnlock(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      touch();
      setLocked(false);
      setInput('');
      setError('');
    } else {
      setError('Wrong password');
      setInput('');
    }
  }

  if (locked) {
    return (
      <div className="lock-screen">
        <form className="lock-box" onSubmit={handleUnlock}>
          <div className="lock-icon">🔒</div>
          <div className="lock-title">Hub Locked</div>
          <div className="lock-subtitle">Enter password to continue</div>
          <input
            className="lock-input"
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          {error && <div className="lock-error">{error}</div>}
          <button className="lock-btn" type="submit">Unlock</button>
        </form>
      </div>
    );
  }

  return children;
}
