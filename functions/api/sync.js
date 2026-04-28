// Cloudflare Pages Function: /api/sync
// POST  { events: [{log_type, date, item_id, value, ts}, ...] } → upsert (last-write-wins)
// GET   ?type=<log_type>  → returns all rows (optional filter)
// Auth: Authorization: Bearer <API_KEY>  (API_KEY env var set in Pages dashboard)

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.API_KEY) {
    return json({ error: 'server missing API_KEY' }, 500);
  }
  if (request.headers.get('Authorization') !== `Bearer ${env.API_KEY}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
    const events = Array.isArray(body.events) ? body.events : [];
    if (!events.length) return json({ ok: true, n: 0 });

    const stmt = env.DB.prepare(
      `INSERT INTO log_entries (log_type, date, item_id, value, updated_at)
         VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(log_type, date, item_id) DO UPDATE SET
         value      = excluded.value,
         updated_at = excluded.updated_at
       WHERE excluded.updated_at >= log_entries.updated_at`
    );

    const batch = events
      .filter(e => e && e.log_type && e.date && e.item_id != null)
      .map(e => stmt.bind(
        String(e.log_type),
        String(e.date),
        String(e.item_id),
        e.value ? 1 : 0,
        Number(e.ts) || Date.now()
      ));

    if (batch.length) await env.DB.batch(batch);
    return json({ ok: true, n: batch.length });
  }

  if (request.method === 'GET') {
    const type = new URL(request.url).searchParams.get('type');
    const query = type
      ? env.DB.prepare(`SELECT log_type, date, item_id, value, updated_at FROM log_entries WHERE log_type = ? ORDER BY date DESC, item_id`).bind(type)
      : env.DB.prepare(`SELECT log_type, date, item_id, value, updated_at FROM log_entries ORDER BY log_type, date DESC, item_id`);
    const { results } = await query.all();
    return json({ entries: results });
  }

  return json({ error: 'method not allowed' }, 405);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
