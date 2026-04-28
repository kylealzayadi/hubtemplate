import { useState } from 'react';

// Quick-add modal — opens a pre-filled Google Calendar new-event URL.
// Doesn't require any Google API integration; it just composes a URL.
export default function AddEventModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(true);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const start = date.replace(/-/g, '');
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');

    let gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}`;
    if (recurring) {
      gcalUrl += `&recur=RRULE:FREQ=MONTHLY`;
    }
    window.open(gcalUrl, '_blank');

    onClose();
    setTitle('');
    setRecurring(true);
  }

  return (
    <div className="cal-overlay" onClick={onClose}>
      <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h2>Add Event</h2>
          <button className="cal-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="cal-field">
            <span>What</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
              autoFocus
              required
            />
          </label>
          <label className="cal-field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <div className="cal-toggle-row">
            <button
              type="button"
              className={`cal-toggle-btn${recurring ? ' active' : ''}`}
              onClick={() => setRecurring(true)}
            >
              Monthly (Subscription)
            </button>
            <button
              type="button"
              className={`cal-toggle-btn${!recurring ? ' active' : ''}`}
              onClick={() => setRecurring(false)}
            >
              One-time
            </button>
          </div>
          <button type="submit" className="cal-submit-btn">
            Add to Google Calendar
          </button>
          <p className="cal-hint">{recurring ? 'Repeats monthly' : 'One-time event'} — all-day, opens Google Calendar pre-filled</p>
        </form>
      </div>
    </div>
  );
}
