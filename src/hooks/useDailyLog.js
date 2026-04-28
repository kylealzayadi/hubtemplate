import { useState, useCallback } from 'react';

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

// Daily check log keyed by ISO date. All state in localStorage.
//
//   const habits = useDailyLog('hub_habits_log');
//   habits.toggle('water');                  // toggle today
//   habits.isChecked('water');               // is today's 'water' checked?
//   habits.toggleFor('water', someDate);     // toggle a specific date
export function useDailyLog(storageKey) {
  const [log, setLog] = useState(() => load(storageKey));
  const today = todayKey();

  const toggleFor = useCallback((itemId, dateInput) => {
    const date = dateKey(dateInput);
    setLog(prev => {
      const day = { ...(prev[date] || {}) };
      day[itemId] = !day[itemId];
      const next = { ...prev, [date]: day };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

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
