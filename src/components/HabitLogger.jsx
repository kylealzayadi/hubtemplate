import { useState, useCallback, useEffect } from 'react';
import { queueEvent } from '../lib/syncClient.js';

// Generic yes/no daily tracker. Used by HabitsTab as the "did you work
// out today?" widget — but it's reusable for anything binary that you
// want a monthly heatmap of (meditate, journal, no alcohol, etc.).
//
// To repurpose, instantiate with a unique storageKey + logType + question
// label. Pattern:
//
//   <HabitLogger
//     storageKey="hub_meditation_log"
//     logType="meditation"
//     question="Did you meditate today?"
//     yesLabel="Yes" noLabel="No"
//     yesText="Meditation: done" noText="Meditation: skipped" />

const DEFAULT_STORAGE_KEY = 'hub_workouts_log';
const DEFAULT_LOG_TYPE = 'workouts';

function loadLog(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}

function saveLog(key, log) {
  localStorage.setItem(key, JSON.stringify(log));
}

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function getMonthDays(year, month) {
  const days = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function MonthSummary({ log, setLog, storageKey, logType, onClose, yesLabel, noLabel }) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const sync = (dateKey, value) => {
    queueEvent({
      log_type: logType,
      date: dateKey,
      item_id: '_',
      value: value === true ? 1 : 0,
      ts: Date.now(),
      submitted_at: new Date().toISOString()
    });
  };

  const toggleDay = (dateKey) => {
    const cellDate = new Date(dateKey + 'T12:00:00');
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (cellDate > endOfToday) return;
    setLog(prev => {
      const cur = prev[dateKey];
      const next = { ...prev };
      let newStatus;
      if (cur === undefined)      { next[dateKey] = true;  newStatus = true; }
      else if (cur === true)      { next[dateKey] = false; newStatus = false; }
      else                        { delete next[dateKey];  newStatus = undefined; }
      saveLog(storageKey, next);
      sync(dateKey, newStatus);
      return next;
    });
  };

  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = getMonthDays(year, month);
  const firstDow = new Date(year, month, 1).getDay();

  const yesCount = days.filter(d => log[d] === true).length;
  const noCount = days.filter(d => log[d] === false).length;
  const totalLogged = yesCount + noCount;
  const rate = totalLogged > 0 ? Math.round((yesCount / totalLogged) * 100) : 0;

  return (
    <div className="gym-overlay" onClick={onClose}>
      <div className="gym-summary" onClick={e => e.stopPropagation()}>
        <div className="gym-summary-header">
          <button className="gym-nav-btn" onClick={() => setMonthOffset(m => m - 1)}>&larr;</button>
          <h2>{monthName}</h2>
          <button className="gym-nav-btn" onClick={() => setMonthOffset(m => m + 1)}>&rarr;</button>
        </div>

        <div className="gym-stats-row">
          <div className="gym-stat">
            <div className="gym-stat-val green">{yesCount}</div>
            <div className="gym-stat-label">{yesLabel}</div>
          </div>
          <div className="gym-stat">
            <div className="gym-stat-val red">{noCount}</div>
            <div className="gym-stat-label">{noLabel}</div>
          </div>
          <div className="gym-stat">
            <div className="gym-stat-val">{rate}%</div>
            <div className="gym-stat-label">Rate</div>
          </div>
        </div>

        <div className="gym-calendar">
          <div className="gym-cal-header">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="gym-cal-dow">{d}</div>
            ))}
          </div>
          <div className="gym-cal-grid">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} className="gym-cal-cell empty" />
            ))}
            {days.map(d => {
              const dayNum = parseInt(d.slice(8));
              const status = log[d];
              const isToday = d === today();
              const cellDate = new Date(d + 'T12:00:00');
              const endOfToday = new Date();
              endOfToday.setHours(23, 59, 59, 999);
              const isFuture = cellDate > endOfToday;
              let cls = 'gym-cal-cell';
              if (status === true) cls += ' yes';
              else if (status === false) cls += ' no';
              if (isToday) cls += ' today';
              if (isFuture) cls += ' future';
              else cls += ' clickable';
              return (
                <div
                  key={d}
                  className={cls}
                  onClick={isFuture ? undefined : () => toggleDay(d)}
                  title={isFuture ? '' : 'Click to cycle: none → yes → no'}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>

        <div className="gym-legend">
          <span><span className="gym-dot yes" /> {yesLabel}</span>
          <span><span className="gym-dot no" /> {noLabel}</span>
          <span><span className="gym-dot" /> No entry</span>
        </div>

        <button className="gym-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function HabitLogger({
  storageKey = DEFAULT_STORAGE_KEY,
  logType = DEFAULT_LOG_TYPE,
  question = 'Did you do it today?',
  yesLabel = 'Yes',
  noLabel = 'No',
  yesText = 'Today: yes',
  noText = 'Today: no',
}) {
  const [log, setLog] = useState(() => loadLog(storageKey));
  const [showSummary, setShowSummary] = useState(false);
  const todayKey = today();

  useEffect(() => {
    const reload = () => setLog(loadLog(storageKey));
    window.addEventListener('hub-sync-pull', reload);
    return () => window.removeEventListener('hub-sync-pull', reload);
  }, [storageKey]);

  const sync = (value) => {
    queueEvent({
      log_type: logType,
      date: todayKey,
      item_id: '_',
      value: value === true ? 1 : 0,
      ts: Date.now(),
      submitted_at: new Date().toISOString()
    });
  };

  const todayStatus = log[todayKey];

  const markToday = useCallback((status) => {
    setLog(prev => {
      const next = { ...prev, [todayKey]: status };
      saveLog(storageKey, next);
      return next;
    });
    sync(status);
  }, [todayKey, storageKey]);

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="gym-logger">
      <div className="gym-date-label">{dateLabel}</div>
      {todayStatus === undefined ? (
        <>
          <div className="gym-question">{question}</div>
          <div className="gym-btn-row">
            <button className="gym-yes" onClick={() => markToday(true)}>{yesLabel}</button>
            <button className="gym-no" onClick={() => markToday(false)}>{noLabel}</button>
          </div>
        </>
      ) : (
        <div className="gym-answered">
          <span className={`gym-answer ${todayStatus ? 'yes' : 'no'}`}>
            {todayStatus ? yesText : noText}
          </span>
          <button className="gym-change" onClick={() => {
            setLog(prev => {
              const next = { ...prev };
              delete next[todayKey];
              saveLog(storageKey, next);
              return next;
            });
            sync(undefined);
          }}>Change</button>
        </div>
      )}
      <button className="gym-summary-btn" onClick={() => setShowSummary(true)}>Monthly Summary</button>
      {showSummary && (
        <MonthSummary
          log={log}
          setLog={setLog}
          storageKey={storageKey}
          logType={logType}
          onClose={() => setShowSummary(false)}
          yesLabel={yesLabel}
          noLabel={noLabel}
        />
      )}
    </div>
  );
}
