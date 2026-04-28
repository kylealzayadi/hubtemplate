// Cloudflare Worker entry — serves the built SPA from /dist and handles two API routes.
//
//   POST /api/sync    upsert log entries (last-write-wins on updated_at)
//   GET  /api/sync    list rows (optional ?type= filter)
//   GET  /api/github-contributions?user=<login>&from=YYYY-MM-DD&to=YYYY-MM-DD
//                     scrapes the public contributions calendar (no auth needed)
//
// In production, set the API_KEY environment variable in Cloudflare Pages →
// Settings → Environment variables. The Pages Function variant in
// functions/api/sync.js enforces it; this Worker exposes /api/sync without
// auth for simplicity — add a Bearer check here if you deploy via Workers
// instead of Pages.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/sync') {
      if (!env.DB) return json({ error: 'D1 not bound' }, 500);

      if (request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
        const events = Array.isArray(body.events) ? body.events : [];
        if (!events.length) return json({ ok: true, n: 0 });

        const stmt = env.DB.prepare(
          `INSERT INTO log_entries (log_type, date, item_id, value, updated_at, submitted_at, meta)
             VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(log_type, date, item_id) DO UPDATE SET
             value        = excluded.value,
             updated_at   = excluded.updated_at,
             submitted_at = excluded.submitted_at,
             meta         = excluded.meta
           WHERE excluded.updated_at >= log_entries.updated_at`
        );

        const batch = events
          .filter(e => e && e.log_type && e.date && e.item_id != null)
          .map(e => stmt.bind(
            String(e.log_type),
            String(e.date),
            String(e.item_id),
            Number.isFinite(Number(e.value)) ? Math.trunc(Number(e.value)) : 0,
            Number(e.ts) || Date.now(),
            e.submitted_at || null,
            e.meta || null
          ));

        if (batch.length) await env.DB.batch(batch);
        return json({ ok: true, n: batch.length });
      }

      if (request.method === 'GET') {
        const type = url.searchParams.get('type');
        const query = type
          ? env.DB.prepare('SELECT log_type, date, item_id, value, updated_at, submitted_at, meta FROM log_entries WHERE log_type = ? ORDER BY date DESC, item_id').bind(type)
          : env.DB.prepare('SELECT log_type, date, item_id, value, updated_at, submitted_at, meta FROM log_entries ORDER BY date DESC, log_type, item_id');
        const { results } = await query.all();
        return json({ entries: results });
      }

      return json({ error: 'method not allowed' }, 405);
    }

    if (url.pathname === '/api/github-contributions') {
      const user = url.searchParams.get('user');
      if (!user) return json({ error: 'missing ?user=' }, 400);
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const ghUrl = new URL(`https://github.com/users/${user}/contributions`);
      if (from) ghUrl.searchParams.set('from', from);
      if (to) ghUrl.searchParams.set('to', to);
      try {
        const res = await fetch(ghUrl.toString(), {
          headers: { 'Accept': 'text/html' }
        });
        if (!res.ok) return json({ error: 'GitHub fetch failed' }, 502);
        const html = await res.text();
        const days = [];
        const re = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          days.push({ date: m[1], level: parseInt(m[2]) });
        }
        return json({ days });
      } catch {
        return json({ error: 'fetch failed' }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
