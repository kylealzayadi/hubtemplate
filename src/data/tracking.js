// Define your daily tracking here.
//
// This file is the example schema for what the Habits tab renders. Replace
// the example items below with whatever you actually want to track —
// supplements, study sessions, household chores, anything that's a daily
// yes/no.
//
// Shape:
//
//   HABITS = {
//     <bucketKey>: {
//       label: 'Display name',
//       items: [
//         { id: 'unique-id', name: 'What it is', note?: 'extra hint' },
//         ...
//       ]
//     },
//     ...
//   }
//
// Each bucket renders as a section in the Habits tab. Each item is an
// independent toggle stored in localStorage.
//
// `id` is the storage key — don't change it for an existing tracker
// (you'd lose history). `name` can change freely.
//
// Optional click-to-expand notes per item live in HABIT_INFO.
//
// Days-of-week scheduling: see WEEK_SCHEDULE below for the (optional)
// weekday-based example. The Habits tab just renders HABITS — wire up
// WEEK_SCHEDULE in your own tab if you want a weekday-keyed schedule.

export const HABITS = {
  morning: {
    label: 'Morning',
    items: [
      { id: 'water',       name: 'Drink water' },
      { id: 'stretch',     name: 'Stretch / mobility' },
      { id: 'review-day',  name: 'Review the day ahead' },
    ],
  },
  afternoon: {
    label: 'Afternoon',
    items: [
      { id: 'walk',        name: 'Walk outside' },
      { id: 'deep-work',   name: 'One focused work block', note: '90 min, no notifications' },
    ],
  },
  evening: {
    label: 'Evening',
    items: [
      { id: 'read',        name: 'Read 20 minutes' },
      { id: 'tidy',        name: 'Tidy desk + kitchen' },
      { id: 'shutdown',    name: 'Shutdown ritual', note: 'tomorrow plan + close laptop' },
    ],
  },
};

// Optional: longer-form notes per item. Click an item in the Habits tab
// to expand. Keyed by HABITS[*].items[*].id.
export const HABIT_INFO = {
  'deep-work': {
    purpose: 'One uninterrupted block beats four fragmented ones. Write it down before you start.',
    rationale: '90 min ≈ one ultradian cycle. Phone in another room, single tab open.',
  },
  'shutdown': {
    purpose: 'A tiny ritual that tells your brain the workday is over.',
    rationale: 'Reduces the rumination loop at night. Three things tomorrow, then close the laptop.',
  },
};

// Optional weekday tags shown in the WeekStrip across the top of the page.
// Each weekday key (0=Sun..6=Sat) maps to an array of short tags.
// Customize freely — these are purely cosmetic.
export const WEEK_SCHEDULE = {
  0: ['rest'],
  1: ['focus'],
  2: ['focus', 'workout'],
  3: ['focus'],
  4: ['focus', 'workout'],
  5: ['focus'],
  6: ['workout'],
};

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
