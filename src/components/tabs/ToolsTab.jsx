import { useState } from 'react';

// Example "tools launcher" tab. The pattern: a password-gated grid of
// cards that route to embedded mini-tools (loaded into an iframe by
// App.jsx via the TOOL_ROUTES map).
//
// Replace the example tools below with your own, and update TOOL_ROUTES
// in App.jsx to match. Set VITE_TOOLS_PASSWORD in .env.local.

const TOOLS = [
  { name: 'Example Tool A', route: '#/tool-a' },
  { name: 'Example Tool B', route: '#/tool-b' },
];

const TOOLS_PASS = import.meta.env.VITE_TOOLS_PASSWORD || 'changeme';

export default function ToolsTab() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('tools-unlocked') === '1');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleUnlock(e) {
    e.preventDefault();
    if (input === TOOLS_PASS) {
      setUnlocked(true);
      sessionStorage.setItem('tools-unlocked', '1');
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  }

  if (!unlocked) {
    return (
      <div className="panel">
        <div className="panel-title">Tools</div>
        <form className="tools-lock" onSubmit={handleUnlock}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            className={`tools-lock-input${error ? ' error' : ''}`}
            autoFocus
          />
          <button type="submit" className="tools-lock-btn">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">Tools</div>
      <div className="tools-grid">
        {TOOLS.map((tool) => (
          <a key={tool.name} className="tool-card" href={tool.route}>
            <div className="tool-name">{tool.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
