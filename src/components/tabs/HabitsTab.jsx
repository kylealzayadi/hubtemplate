import { useState } from 'react';
import { HABITS, HABIT_INFO } from '../../data/tracking.js';
import { useHabits } from '../../hooks/useHabits.js';
import HabitLogger from '../HabitLogger.jsx';
import LogsModal from '../LogsModal.jsx';

// Renders the daily checklist defined in src/data/tracking.js, plus a
// generic yes/no daily logger ("did you work out today?"). Add more
// HabitLogger instances or your own panels alongside.

function HabitsPanel() {
  const { checked, toggleHabit } = useHabits();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const buckets = Object.entries(HABITS);
  const allItems = buckets.flatMap(([, b]) => b.items);
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const totalDone = allItems.filter(i => checked[i.id]).length;

  return (
    <div className="panel pill-panel-wrap">
      <div className="gym-date-label">{dateLabel}</div>
      <div className="pill-bar-header">
        <div className="pill-bar-title">Daily Habits · {totalDone}/{allItems.length}</div>
        <button className="logs-btn" onClick={() => setOpen(!open)}>{open ? 'Collapse' : 'View Details'}</button>
      </div>

      {/* Compact view: one tile per bucket */}
      <div className="pill-bar-checks">
        {buckets.map(([key, bucket]) => {
          const done = bucket.items.every(i => checked[i.id]);
          return (
            <div
              key={key}
              className={`pill-bar-item${done ? ' done' : ''}`}
              onClick={() => {
                // Tapping the bucket tile toggles every item in the bucket
                const allDone = bucket.items.every(i => checked[i.id]);
                bucket.items.forEach(i => {
                  if (allDone || !checked[i.id]) toggleHabit(i.id);
                });
              }}
            >
              <div className={`pill-check${done ? ' done' : ''}`}>
                <span className="pill-check-mark">✓</span>
              </div>
              <span className="pill-bar-label">{bucket.label}</span>
            </div>
          );
        })}
      </div>

      {/* Detail view: every item in every bucket, individually toggleable */}
      {open && (
        <div className="pill-detail-body">
          {buckets.map(([key, bucket]) => (
            <div key={key} className="pill-section">
              <div className="pill-time">
                <span>{bucket.label}</span>
                <span className="pill-count">{bucket.items.length} items</span>
              </div>
              {bucket.items.map(item => {
                const isChecked = !!checked[item.id];
                const isOpen = expanded === item.id;
                const info = HABIT_INFO[item.id];
                return (
                  <div key={item.id} className={`pill-item-wrap${isOpen ? ' expanded' : ''}`}>
                    <div className="pill-item clickable" onClick={() => toggleHabit(item.id)}>
                      <div className={`pill-check${isChecked ? ' done' : ''}`} style={{ marginRight: 10 }}>
                        <span className="pill-check-mark">✓</span>
                      </div>
                      <span className="pill-name">
                        {item.name}
                        {item.note && <span className="pill-eod">{item.note}</span>}
                        {info && (
                          <span
                            className="pill-expand-arrow"
                            onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : item.id); }}
                          >{isOpen ? '▾' : '▸'}</span>
                        )}
                      </span>
                    </div>
                    {isOpen && info && (
                      <div className="pill-info">
                        {info.purpose && (
                          <div className="pill-info-block">
                            <div className="pill-info-label">What it is</div>
                            <div className="pill-info-text">{info.purpose}</div>
                          </div>
                        )}
                        {info.rationale && (
                          <div className="pill-info-block">
                            <div className="pill-info-label">How</div>
                            <div className="pill-info-text">{info.rationale}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HabitsTab() {
  const [logsOpen, setLogsOpen] = useState(false);
  return (
    <>
      <div className="today-grid">
        <div className="panel">
          <div className="panel-title-row">
            <div className="panel-title">Today</div>
            <button className="logs-btn" onClick={() => setLogsOpen(true)}>View Logs</button>
          </div>
          <HabitsPanel />
        </div>
        <div className="right-stack">
          {/* Drop in additional <HabitLogger /> instances for any other
              binary daily tracker — pass a unique storageKey + logType. */}
          <HabitLogger
            storageKey="hub_workouts_log"
            question="Did you work out today?"
            yesLabel="Yes" noLabel="No"
            yesText="Workout: done" noText="Workout: skipped"
          />
        </div>
      </div>
      {logsOpen && <LogsModal onClose={() => setLogsOpen(false)} />}
    </>
  );
}
