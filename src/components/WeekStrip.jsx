import { DAYS, WEEK_SCHEDULE } from '../data/tracking.js';

const TAG_CLASSES = {
  focus:   'tag-focus',
  workout: 'tag-workout',
  rest:    'tag-rest',
};

// Week-at-a-glance strip across the top. Tags come from WEEK_SCHEDULE
// in src/data/tracking.js — edit there to change what shows up.
export default function WeekStrip() {
  const now = new Date();
  const todayDow = now.getDay();

  return (
    <div id="week-strip" className="week-strip">
      {DAYS.map((name, dow) => {
        const tags = WEEK_SCHEDULE[dow] || [];
        const isToday = dow === todayDow;

        return (
          <div key={dow} className={`day-cell${isToday ? ' today' : ''}`}>
            <div className="day-name">{name}</div>
            <div className="day-pills">
              {tags.length > 0 ? (
                tags.map((t, i) => (
                  <span key={i} className={`day-tag ${TAG_CLASSES[t] || ''}`}>{t}</span>
                ))
              ) : (
                <span style={{ color: '#1e1e1e', fontSize: '9px' }}>—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
