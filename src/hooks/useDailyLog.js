import { useState, useCallback, useEffect } from 'react';
import { queueEvent } from '../lib/syncClient.js';

function dateKey(d) {
  if (typeof d === 'string') return d;
  const copy = new Date(d ?? Date.now());
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function todayKey() {
  return dateKey();
}

function load(storageKey) {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
}

// Daily check log keyed by ISO date. Exposes both today-shortcut and
// date-targeted variants so any day in the week can be toggled.
//
//   const habits = useDailyLog('hub_habits_log', 'habits');
//   habits.toggle('water');                  // toggle today
//   habits.isChecked('water');               // is today's 'water' checked?
//   habits.toggleFor('water', someDate);     // toggle a specific date
//
// Pass a non-empty `logType` to enable D1 sync. Pass `null` to keep the
// log local-only.
export function useDailyLog(storageKey, logType) {
  const [log, setLog] = useState(() => load(storageKey));
  const today = todayKey();

  useEffect(() => {
    const reload = () => setLog(load(storageKey));
    window.addEventListener('hub-sync-pull', reload);
    return () => window.removeEventListener('hub-sync-pull', reload);
  }, [storageKey]);

  const toggleFor = useCallback((itemId, dateInput) => {
    const date = dateKey(dateInput);
    setLog(prev => {
      const day = { ...(prev[date] || {}) };
      const newVal = !day[itemId];
      day[itemId] = newVal;
      const next = { ...prev, [date]: day };
      localStorage.setItem(storageKey, JSON.stringify(next));
      if (logType) {
        queueEvent({
          log_type: logType,
          date,
          item_id: itemId,
          value: newVal ? 1 : 0,
          ts: Date.now(),
          submitted_at: new Date().toISOString()
        });
      }
      return next;
    });
  }, [storageKey, logType]);

  const isCheckedFor = (itemId, dateInput) => {
    const date = dateKey(dateInput);
    return !!(log[date]?.[itemId]);
  };

  return {
    toggle: (id) => toggleFor(id),
    isChecked: (id) => isCheckedFor(id),
    toggleFor,
    isCheckedFor,
    log,
    today: log[today] || {},
    date: today
  };
}
