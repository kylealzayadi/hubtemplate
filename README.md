# The Hub

A personal command-center template. One page that holds your daily
habits, a money tracker, a Pomodoro timer, and your public GitHub
activity. It's a static site — no backend, no database, no API keys.
All data lives in your browser's localStorage.

Fork it, swap the example widgets for whatever you actually want to
track, and host it wherever — Netlify, Vercel, GitHub Pages, S3,
or just open `dist/index.html` after a build.

## What's in the box

- **Habits tab** — daily checklist + a yes/no day logger with a monthly
  summary calendar.
- **Money tab** — running balance + transactions + savings buckets.
- **Projects tab** — your public GitHub repos and recent commits (uses
  the public GitHub API directly from the browser).
- **Workflow tab** — Pomodoro timer.
- **Tools tab** — password-gated launcher for embedded tools.
- **Theme picker** — Discord-style palettes plus a randomizer.
- **Soft lock screen** — keeps the page private from a glance.

## Stack

- React 19
- Vite
- Vanilla CSS (one file, themeable via CSS variables)

That's it. No server. No deps beyond React and Vite.

## Run it

Requires Node 20+.

```bash
git clone <your-fork>
cd <your-fork>
npm install

cp .env.example .env.local
# edit .env.local — at minimum set VITE_LOCK_PASSWORD

npm run dev
```

Open the URL Vite prints. Default lock password is whatever you put in
`.env.local`.

## Deploy

`npm run build` produces a static `dist/` directory. Drop it on any
host that serves static files — Netlify, Vercel, Cloudflare Pages,
GitHub Pages, an S3 bucket, your own VPS, doesn't matter. There's no
backend to provision.

## Where data lives

Everything's in `localStorage`, keyed under `hub_*`. That means:

- Data is per-browser. Open it on your laptop and your phone — those
  are separate datasets.
- Clearing site data wipes it.
- There's no sync.

If you later want cross-device sync, the cleanest path is to add a tiny
backend (Cloudflare Workers + D1, Supabase, a single Postgres on Fly,
whatever) and a small client that reads/writes the same `hub_*` keys.
The trackers are already structured around `(log_type, date, item_id,
value)` rows — easy to mirror.

## Customizing

- **Daily checklist**: edit `src/data/tracking.js`. The schema and
  options are documented inline.
- **Add a tracker**: instantiate `<HabitLogger>` with a unique
  `storageKey` + `logType` + question. See `HabitsTab.jsx` for the
  pattern.
- **Tabs**: add/remove in `src/App.jsx` and `src/components/TabNav.jsx`.
- **Profile + links in the hero row**: set `VITE_PROFILE` in
  `.env.local` (JSON-encoded).
- **Theme**: 🎨 button in the topbar, or edit
  `src/data/discordThemes.js`.
- **Avatar**: drop a file at `public/imgs/avatar.png` and uncomment the
  `<img>` line in `App.jsx`.

## Layout

```
src/
  App.jsx                # top-level layout, hero row, tabs
  main.jsx               # entry
  index.css              # all styling (CSS variables for theming)
  components/
    LockScreen.jsx
    Topbar.jsx
    WeekStrip.jsx
    TabNav.jsx
    PaletteBar.jsx
    StatusBar.jsx
    AddEventModal.jsx    # quick "add to Google Calendar" composer
    HabitLogger.jsx      # generic yes/no daily tracker (reusable)
    LogsModal.jsx        # browse historical daily logs
    tabs/
      HabitsTab.jsx
      MoneyTab.jsx
      ProjectsTab.jsx
      WorkflowTab.jsx
      ToolsTab.jsx
      BusinessTab.jsx    # placeholder
  data/
    tracking.js          # ← define your daily/weekly checklist here
    discordThemes.js
  hooks/
    useDailyLog.js       # date-keyed log primitive
    useHabits.js
    useGithub.js
    usePalette.js
    usePomodoro.js
    useScale.js
```

## License

MIT — see `LICENSE`.
