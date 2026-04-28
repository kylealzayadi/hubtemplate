import { useDailyLog } from './useDailyLog.js';

// Convenience wrapper around useDailyLog for the "habits" tracker.
// Add similar wrappers for additional trackers, or call useDailyLog
// directly with your own storage key + log_type.
export function useHabits() {
  const { toggle, today } = useDailyLog('hub_habits_log', 'habits');
  return { checked: today, toggleHabit: toggle };
}
