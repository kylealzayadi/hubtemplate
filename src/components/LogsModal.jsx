import { useState } from 'react';
import { HABITS } from '../data/tracking.js';

function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}

function toDateStr(d) {
  const copy = new Date(d);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function formatHeading(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Browse historical daily logs. Reads straight from localStorage. To
// show a new tracker here, add a block alongside HABITS / WORKOUTS below.
export default function LogsModal({ onClose }) {
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));

  const habitsLog = loadLocal('hub_habits_log');
  const workoutsLog = loadLocal('hub_workouts_log');

  const habitsDay = habitsLog[selectedDate] || {};
  const workoutsDay = workoutsLog[selectedDate];

  const shiftDate = (delta) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  };

  const isToday = selectedDate === toDateStr(new Date());

  const allHabitItems = Object.values(HABITS).flatMap(b =>
    b.items.map(i => ({ ...i, bucket: b.label }))
  );
  const habitsChecked = allHabitItems.filter(i => habitsDay[i.id]).length;

  return (
    <div className="gym-overlay" onClick={onClose}>
      <div className="logs-modal" onClick={e => e.stopPropagation()}>
        <div className="logs-nav">
          <button className="gym-nav-btn" onClick={() => shiftDate(-1)}>&larr;</button>
          <span className="logs-nav-date">{formatHeading(selectedDate)}{isToday && <span className="logs-today-tag">today</span>}</span>
          <button className="gym-nav-btn" onClick={() => shiftDate(1)}>&rarr;</button>
        </div>

        <div className="logs-body">
          <div className="logs-block">
            <div className="logs-block-head">
              <span className="logs-badge" data-type="gear">Habits</span>
              <span className="logs-tally">{habitsChecked}/{allHabitItems.length}</span>
            </div>
            {allHabitItems.length === 0 ? (
              <div className="logs-none">No habits defined</div>
            ) : (
              allHabitItems.map(item => (
                <div key={item.id} className={`logs-line${habitsDay[item.id] ? ' on' : ''}`}>
                  <span className="logs-mark">{habitsDay[item.id] ? '✓' : '·'}</span>
                  <span className="logs-label">{item.name}</span>
                  <span className="logs-dose">{item.bucket}</span>
                </div>
              ))
            )}
          </div>

          <div className="logs-block">
            <div className="logs-block-head">
              <span className="logs-badge" data-type="gym">Workout</span>
            </div>
            <div className={`logs-line gym-line${workoutsDay === true ? ' went' : workoutsDay === false ? ' skipped' : ''}`}>
              <span className="logs-mark">{workoutsDay === true ? '✓' : workoutsDay === false ? '✗' : '·'}</span>
              <span className="logs-label">{workoutsDay === true ? 'Done' : workoutsDay === false ? 'Skipped' : 'No entry'}</span>
            </div>
          </div>
        </div>

        <button className="gym-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
