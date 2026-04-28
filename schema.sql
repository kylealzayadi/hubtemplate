-- One wide table holds all sync state.
--
--   log_type   → which tracker the row belongs to  (e.g. 'habits', 'money', 'workouts')
--   date       → 'YYYY-MM-DD' for daily rows, '_' for non-day rows (settings, blobs)
--   item_id    → key inside the tracker            (e.g. 'water', 'reading', 'state')
--   value      → 0/1 toggle, OR epoch ms for anchor settings
--   meta       → arbitrary JSON payload (used for richer state, e.g. money state blob)
--
-- Adding a new tracker = pick a new log_type string. No schema change required.

CREATE TABLE IF NOT EXISTS log_entries (
  log_type     TEXT NOT NULL,
  date         TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  value        INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,        -- unix ms, last-write-wins
  submitted_at TEXT,                    -- ISO 8601 when the user toggled
  meta         TEXT,                    -- arbitrary JSON payload
  PRIMARY KEY (log_type, date, item_id)
);

CREATE INDEX IF NOT EXISTS idx_log_type_date ON log_entries (log_type, date);
