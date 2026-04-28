# The Hub

A personal command-center framework. One page that pulls your daily habits,
a money tracker, a Pomodoro timer, and your GitHub activity into a single
keyboard-friendly dashboard. Built to be forked and customized — the widgets
in this template are deliberately generic; replace them with whatever you
actually want to track.

This is not a polished product. It's the skeleton I use, cleaned up enough
that someone else can pick it up and make it theirs.

## Stack

- **Frontend**: React 19 + Vite
- **Backend**: Cloudflare Pages Functions (or a single Cloudflare Worker)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Sync**: client-side queue → POST `/api/sync` → D1 upsert (last-write-wins)
- **Storage**: localStorage on the client; D1 mirrors it across devices

No build step on the server. Vite builds a static SPA into `dist/`, the
Worker serves the assets and the `/api/sync` endpoint.

## Architecture

```
┌──────────────────┐      ┌────────────────────┐      ┌──────────┐
│  Browser (SPA)   │◄────►│  Cloudflare Worker │◄────►│    D1    │
│  React + Vite    │ HTTPS│  worker.js         │  SQL │ (SQLite) │
│  localStorage    │      │  /api/sync         │      └──────────┘
└──────────────────┘      └────────────────────┘
```

- Every toggle/edit writes to `localStorage` immediately (offline-first).
- A small queue in `src/lib/syncClient.js` batches events and POSTs to
  `/api/sync`. On load, it pulls all rows back and merges by `updated_at`.
- The schema is one wide table — `log_entries(log_type, date, item_id,
  value, updated_at, ...)` — with `(log_type, date, item_id)` as the
  primary key. Adding a new tracker means picking a new `log_type` string.

## Layout

```
src/
  App.jsx              # top-level layout, hero row, tabs
  main.jsx             # entry
  index.css            # all styling (single file, CSS variables for theming)
  components/
    LockScreen.jsx     # password gate (client-side only)
    Topbar.jsx         # clock + theme button
    WeekStrip.jsx      # this-week strip across the top
    TabNav.jsx
    PaletteBar.jsx     # theme picker
    StatusBar.jsx
    AddEventModal.jsx  # quick "add to Google Calendar" modal
    HabitLogger.jsx    # generic yes/no daily tracker
    LogsModal.jsx      # browse historical daily logs
    tabs/
      HabitsTab.jsx    # daily checklist + habit logger
      MoneyTab.jsx     # liquid balance + transactions + savings
      ProjectsTab.jsx  # GitHub repos + contributions heatmap
      WorkflowTab.jsx  # Pomodoro
      ToolsTab.jsx     # password-gated tool launcher (example)
      BusinessTab.jsx  # placeholder
  data/
    tracking.js        # ← define your daily/weekly checklist here
    discordThemes.js   # color palette presets
  hooks/
    useDailyLog.js     # date-keyed log primitive (used by all trackers)
    useHabits.js       # convenience wrapper around useDailyLog
    useGithub.js       # GitHub API + contribution heatmap
    usePalette.js
    usePomodoro.js
    useScale.js
  lib/
    syncClient.js      # offline queue + pull/push to /api/sync
functions/api/sync.js  # Pages Function variant of /api/sync
worker.js              # Workers variant — serves assets + /api/sync + GitHub proxy
schema.sql             # one CREATE TABLE
wrangler.toml          # Cloudflare config (placeholder DB id — fill in)
```

## Run it locally

Requires Node 20+ and a free Cloudflare account if you want sync to work.

```bash
git clone <your-fork>
cd <your-fork>
npm install

cp .env.example .env.local
# edit .env.local — at minimum set VITE_API_KEY and VITE_LOCK_PASSWORD

npm run dev
```

Without Cloudflare set up, the app runs fine offline-only — toggles persist
in localStorage and the sync queue silently fails. To enable sync:

```bash
# create a D1 database
npm run db:create
# → copy the printed database_id into wrangler.toml

# initialize the schema
npm run db:init:local      # for local dev
npm run db:init            # for production

# run with the Worker
npm run pages:dev
```

In Cloudflare Pages → Settings → Environment variables, set `API_KEY`
(no `VITE_` prefix) to the same value as `VITE_API_KEY` in `.env.local`.
The Worker checks the `Authorization: Bearer <API_KEY>` header.

## Adding your own widgets

The fastest path:

1. **Add a tracker.** Pick a new `log_type` string (e.g. `'reading'`).
   Use `useDailyLog('hub_reading_log', 'reading')` in a component — you
   get `toggle(id)`, `isChecked(id)`, and a `today` map for free, plus
   automatic D1 sync.
2. **Add a tab.** Create `src/components/tabs/MyTab.jsx`, register it in
   `App.jsx` and `TabNav.jsx`.
3. **Customize the daily checklist.** Edit `src/data/tracking.js` —
   structure is documented inline.
4. **Style.** All variables live at the top of `src/index.css`. The
   palette bar (🎨 in the topbar) lets you preview theme changes live.

The schema is intentionally schema-less in the value column. `value` is a
`0|1` toggle for most rows, an epoch timestamp for "anchor" settings,
and the `meta` column holds arbitrary JSON for richer state (the money
tab uses this to store the full balance + transaction list as one blob).

## Configuration

All configuration lives in `.env.example` — copy it to `.env.local` and
fill in your own values. Read it for what each variable does. Nothing
sensitive should ever land in source-controlled files.

## Deployment

The included `.github/workflows/deploy.yml` is a Cloudflare Pages
deployment via `wrangler pages deploy`. You'll need two GitHub repository
secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Or skip the
workflow and run `npx wrangler pages deploy dist` manually after each
build.

## License

MIT — see `LICENSE`.
