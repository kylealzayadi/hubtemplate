import { useEffect, useState } from 'react';
import { LANG_COLORS } from '../../hooks/useGithub.js';

export default function ProjectsTab({ fullRepos, loading, error, onLoad, commits, commitsLoading, onLoadCommits }) {
  const [tab, setTab] = useState('repos');

  useEffect(() => {
    onLoad();
    onLoadCommits();
  }, []);

  return (
    <div className="projects-tab-wrap">
      <div className="panel">
        <div className="panel-title-row">
          <div className="panel-title">GitHub</div>
          <div className="projects-tab-nav">
            <button className={`projects-tab-btn${tab === 'repos' ? ' active' : ''}`} onClick={() => setTab('repos')}>Repos</button>
            <button className={`projects-tab-btn${tab === 'commits' ? ' active' : ''}`} onClick={() => setTab('commits')}>Commits</button>
          </div>
        </div>

        {tab === 'repos' && (
          <div id="projects-full-list">
            {loading && !fullRepos && <span className="loading">loading...</span>}
            {error && !fullRepos && <span className="error">{error}</span>}
            {fullRepos && fullRepos.length === 0 && (
              <span className="loading">Set VITE_GITHUB_USERNAME in .env.local to populate this tab.</span>
            )}
            {fullRepos && fullRepos.slice(0, 6).map((repo, i) => {
              const color = LANG_COLORS[repo.lang] || '#333';
              return (
                <a key={repo.name} className="project-row" href={repo.url} target="_blank" rel="noreferrer">
                  <span className="project-index">{String(i + 1).padStart(2, '0')}</span>
                  <div className="project-info">
                    <div className="project-name">{repo.name}</div>
                    <div className="project-date">{repo.date}</div>
                  </div>
                  {repo.lang && (
                    <>
                      <span className="lang-pip" style={{ background: color }} title={repo.lang}></span>
                      <span className="lang-label" style={{ fontSize: '11px', color: '#fff' }}>{repo.lang}</span>
                    </>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {tab === 'commits' && (
          <div className="commits-list">
            {commitsLoading && <span className="loading">loading...</span>}
            {commits && commits.length === 0 && <span className="loading">No recent public commits</span>}
            {commits && commits.map((c, i) => (
              <a key={`${c.sha}-${i}`} className="commit-row" href={c.url} target="_blank" rel="noreferrer">
                <div className="commit-main">
                  <span className="commit-sha">{c.sha}</span>
                  <span className="commit-msg">{c.message}</span>
                </div>
                <div className="commit-meta">
                  <span className="commit-repo">{c.repo}</span>
                  <span className="commit-date">{c.date} · {c.time}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
