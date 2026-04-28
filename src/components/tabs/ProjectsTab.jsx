import { useEffect, useState } from 'react';
import { LANG_COLORS } from '../../hooks/useGithub.js';

function ContribGraph({ heatmap, loading, year, years, onYearChange }) {
  const days = heatmap || [];

  const weeks = [];
  let week = [];
  for (const day of days) {
    if (day.dow === 0 && week.length) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
  }
  if (week.length) weeks.push(week);

  const months = [];
  let lastMonth = '';
  for (let wi = 0; wi < weeks.length; wi++) {
    const firstDay = weeks[wi][0];
    const m = new Date(firstDay.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
    if (m !== lastMonth) {
      months.push({ label: m, col: wi });
      lastMonth = m;
    }
  }

  const activeDays = days.filter(d => d.level > 0).length;
  const gridCols = `14px repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`;

  return (
    <div className="contrib-graph">
      <div className="contrib-header">
        <span className="contrib-total">{activeDays} active days</span>
        <select
          className="contrib-year-select"
          value={year}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {loading && !days.length ? (
        <span className="loading">loading contributions...</span>
      ) : !days.length ? (
        <span className="loading">No contribution data for {year}</span>
      ) : (
        <>
          <div className="contrib-months" style={{ gridTemplateColumns: gridCols }}>
            {months.map((m, i) => (
              <span key={i} className="contrib-month" style={{ gridColumnStart: m.col + 2 }}>{m.label}</span>
            ))}
          </div>
          <div className="contrib-grid" style={{ gridTemplateColumns: gridCols }}>
            {[0,1,2,3,4,5,6].map(dow => (
              <span key={dow} className="contrib-dow">
                {dow === 1 ? 'Mon' : dow === 3 ? 'Wed' : dow === 5 ? 'Fri' : ''}
              </span>
            ))}
            {weeks.map((week, wi) =>
              [0,1,2,3,4,5,6].map(dow => {
                const day = week.find(d => d.dow === dow);
                if (!day) return <span key={`${wi}-${dow}`} className="contrib-cell empty" />;
                return (
                  <span
                    key={day.date}
                    className={`contrib-cell lv${day.isFuture ? '-future' : day.level}`}
                    title={`${day.date}`}
                  />
                );
              })
            )}
          </div>
          <div className="contrib-legend">
            <span>Less</span>
            <span className="contrib-cell lv0" />
            <span className="contrib-cell lv1" />
            <span className="contrib-cell lv2" />
            <span className="contrib-cell lv3" />
            <span className="contrib-cell lv4" />
            <span>More</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectsTab({ fullRepos, loading, error, onLoad, commits, heatmap, heatmapYear, commitsLoading, heatmapLoading, onLoadCommits, onLoadHeatmap }) {
  const [tab, setTab] = useState('repos');
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, currentYear - 5];
  const selectedYear = heatmapYear ?? currentYear;

  useEffect(() => {
    onLoad();
    onLoadHeatmap(currentYear);
    onLoadCommits();
  }, []);

  return (
    <div className="projects-tab-wrap">
      <div className="panel">
        <div className="panel-title">Contributions</div>
        <ContribGraph
          heatmap={heatmap}
          loading={heatmapLoading}
          year={selectedYear}
          years={years}
          onYearChange={onLoadHeatmap}
        />
      </div>

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
