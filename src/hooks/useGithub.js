import { useState, useCallback } from 'react';

// Configure via .env.local: VITE_GITHUB_USERNAME=your-login
// Leave blank to disable the GitHub widgets gracefully.
//
// Uses the public GitHub REST API directly from the browser. No auth, so
// you're sharing a 60-req/hour rate limit with everyone on your IP.
// Plenty for a personal dashboard.
//
// Note: GitHub's contribution heatmap is not exposed via the API — only
// scrapable from HTML, which can't be done from the browser due to CORS.
// If you want a heatmap, add a tiny backend that scrapes and serves it.
const USERNAME = import.meta.env.VITE_GITHUB_USERNAME || '';

export const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  'C#': '#178600', Swift: '#F05138', HTML: '#e34c26',
  CSS: '#563d7c', 'C++': '#f34b7d', Go: '#00ADD8', Rust: '#dea584',
  Ruby: '#701516', Java: '#b07219', Kotlin: '#A97BFF'
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function filterRepos(repos) {
  return repos.filter(r =>
    !r.fork &&
    r.name !== USERNAME &&
    r.name !== `${USERNAME}.github.io`
  );
}

export function useGithub() {
  const [sidebarRepos, setSidebarRepos] = useState(null);
  const [fullRepos, setFullRepos]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [fullLoaded, setFullLoaded]     = useState(false);

  const loadRepos = useCallback(async () => {
    if (!USERNAME) { setSidebarRepos([]); setFullRepos([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=20`);
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const repos = await res.json();
      const filtered = filterRepos(repos);
      setSidebarRepos(filtered.slice(0, 3).map((r, i) => ({
        name: r.name, url: r.html_url,
        lang: r.language || '', date: formatDate(r.updated_at), index: i
      })));
      setFullRepos(filtered.map((r, i) => ({
        name: r.name, url: r.html_url,
        lang: r.language || '', date: formatDate(r.updated_at), index: i
      })));
      setFullLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFull = useCallback(async () => {
    if (fullLoaded) return;
    await loadRepos();
  }, [fullLoaded, loadRepos]);

  const [commits, setCommits] = useState(null);
  const [commitsLoading, setCommitsLoading] = useState(false);

  const loadCommits = useCallback(async () => {
    if (commits || !USERNAME) { if (!USERNAME) setCommits([]); return; }
    setCommitsLoading(true);
    try {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/events?per_page=100`);
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const events = await res.json();
      const pushEvents = events.filter(e => e.type === 'PushEvent');
      const flat = pushEvents.flatMap(e =>
        e.payload.commits.map(c => ({
          repo: e.repo.name.replace(`${USERNAME}/`, ''),
          message: c.message.split('\n')[0],
          sha: c.sha.slice(0, 7),
          date: formatDate(e.created_at),
          time: new Date(e.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          url: `https://github.com/${e.repo.name}/commit/${c.sha}`,
          ts: new Date(e.created_at).getTime()
        }))
      );
      flat.sort((a, b) => b.ts - a.ts);
      setCommits(flat);
    } catch { setCommits([]); }
    finally { setCommitsLoading(false); }
  }, [commits]);

  return { sidebarRepos, fullRepos, loading, error, loadRepos, loadFull, commits, commitsLoading, loadCommits, hasUsername: !!USERNAME };
}
