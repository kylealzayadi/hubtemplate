import { usePomodoro } from '../../hooks/usePomodoro.js';

export default function WorkflowTab() {
  const { mode, running, display, sessions, startLabel, toggle, reset, switchMode } = usePomodoro();

  return (
    <div className="panel" style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
      <div className="panel-title" style={{ textAlign: 'center' }}>Pomodoro</div>

      <div className="pom-mode-btns">
        <button
          className={`pom-mode${mode === 'work' ? ' active' : ''}`}
          id="pom-work-btn"
          onClick={() => switchMode('work')}
        >Work · 20m</button>
        <button
          className={`pom-mode${mode === 'break' ? ' active' : ''}`}
          id="pom-break-btn"
          onClick={() => switchMode('break')}
        >Break · 5m</button>
      </div>

      <div className={`pom-display${mode === 'break' ? ' break' : ''}`} id="pom-display">
        {display}
      </div>

      <div className="pom-controls">
        <button className="pom-btn" id="pom-start" onClick={toggle}>
          {startLabel}
        </button>
        <button className="pom-btn pom-reset" onClick={reset}>Reset</button>
      </div>

      <div className="pom-sessions">
        <span className="pom-session-label">Sessions completed</span>
        <span className="pom-session-count" id="pom-count">{sessions}</span>
      </div>
    </div>
  );
}
