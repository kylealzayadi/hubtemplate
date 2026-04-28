// Offline-first sync client.
// Toggles get queued in localStorage, then flushed to /api/sync.
// On load, we GET /api/sync and merge rows back into localStorage by log_type.

const QUEUE_KEY = 'hub_sync_queue';
const API_URL   = '/api/sync';
const API_KEY   = import.meta.env.VITE_API_KEY;

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
}
function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function syncEnabled() { return !!API_KEY; }

export function queueEvent(event) {
  if (!API_KEY) return;
  const q = loadQueue();
  q.push(event);
  saveQueue(q);
  flushQueue();
}

let flushing = false;
export async function flushQueue() {
  if (!API_KEY || flushing) return;
  const q = loadQueue();
  if (!q.length) return;
  flushing = true;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ events: q })
    });
    if (res.ok) saveQueue([]);
  } catch { /* offline — retry later */ }
  finally { flushing = false; }
}

// Pulls all rows from D1 and merges them back into the per-tracker
// localStorage buckets. Triggered on page load.
//
// To wire up a new tracker:
//   1. Pick a log_type (e.g. 'reading') and a localStorage key
//      (e.g. 'hub_reading_log').
//   2. Add a branch in the loop below to write entries into that bucket.
//   3. Use useDailyLog('hub_reading_log', 'reading') in your component.
export async function pullAndHydrate() {
  if (!API_KEY) return;
  await flushQueue();
  try {
    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!res.ok) return;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return;
    const { entries } = await res.json();
    if (!entries?.length) return;

    const habits = JSON.parse(localStorage.getItem('hub_habits_log') || '{}');
    const workouts = JSON.parse(localStorage.getItem('hub_workouts_log') || '{}');

    for (const e of entries) {
      // 'money' uses item_id='state' with a JSON blob in meta — store the
      // whole state object verbatim. See MoneyTab.jsx.
      if (e.log_type === 'money' && e.item_id === 'state' && e.meta) {
        try {
          const parsed = JSON.parse(e.meta);
          if (parsed && typeof parsed.balance === 'number') {
            localStorage.setItem('hub_money', JSON.stringify({
              balance: parsed.balance,
              transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
              savings: Array.isArray(parsed.savings) ? parsed.savings : [],
            }));
          }
        } catch { /* ignore malformed meta */ }
        continue;
      }
      const val = e.value === 1;
      if (e.log_type === 'habits') {
        if (!habits[e.date]) habits[e.date] = {};
        habits[e.date][e.item_id] = val;
      } else if (e.log_type === 'workouts') {
        workouts[e.date] = !!val;
      }
      // Add additional log_types here as you build new trackers.
    }

    localStorage.setItem('hub_habits_log', JSON.stringify(habits));
    localStorage.setItem('hub_workouts_log', JSON.stringify(workouts));

    window.dispatchEvent(new Event('hub-sync-pull'));
  } catch { /* offline — skip */ }
}

if (typeof window !== 'undefined' && API_KEY) {
  window.addEventListener('load', () => { pullAndHydrate(); });
  window.addEventListener('online', flushQueue);
  setInterval(flushQueue, 60 * 1000);
}
