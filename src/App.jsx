import { useState, useEffect, useCallback } from 'react';
import LockScreen from './components/LockScreen.jsx';
import Topbar from './components/Topbar.jsx';
import WeekStrip from './components/WeekStrip.jsx';
import TabNav from './components/TabNav.jsx';
import HabitsTab from './components/tabs/HabitsTab.jsx';
import ProjectsTab from './components/tabs/ProjectsTab.jsx';
import WorkflowTab from './components/tabs/WorkflowTab.jsx';
import MoneyTab from './components/tabs/MoneyTab.jsx';
import ToolsTab from './components/tabs/ToolsTab.jsx';
import BusinessTab from './components/tabs/BusinessTab.jsx';
import PaletteBar from './components/PaletteBar.jsx';
import StatusBar from './components/StatusBar.jsx';
import AddEventModal from './components/AddEventModal.jsx';
import { usePalette } from './hooks/usePalette.js';
import { useGithub } from './hooks/useGithub.js';
import { LANG_COLORS } from './hooks/useGithub.js';

// Configure your hero row via the VITE_PROFILE env var (JSON-encoded).
// Example .env.local:
//   VITE_PROFILE='{"name":"Your Name","links":[{"label":"site","url":"https://example.com"}]}'
function loadProfile() {
  try {
    const raw = import.meta.env.VITE_PROFILE;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed) return parsed;
  } catch {}
  return null;
}

const PROFILE = loadProfile() || {
  name: 'Your Name',
  links: [
    { label: 'website',  url: 'https://example.com' },
    { label: 'github',   url: 'https://github.com/' },
    { label: 'linkedin', url: 'https://linkedin.com/' },
  ],
};

// In-page tools that load in an iframe under #/<key>.
// Wire up the "Tools" tab cards to point at these routes, and add real
// embeddable URLs here. Empty by default.
const TOOL_ROUTES = {
  // 'tool-a': { name: 'Example Tool A', url: 'https://example.com/tool-a' },
};

// Optional quick-launch buttons in the hero row. Replace with your own
// frequently-used services or remove.
const QUICK_LINKS = [
  // { url: 'https://calendar.google.com/calendar/u/0/r', label: 'Google Cal', dotClass: 'google-cal' },
];

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(2) || '');
  const [activeTab, setActiveTab] = useState('habits');
  const palette = usePalette();
  const github = useGithub();
  const [copied, setCopied] = useState(null);
  const [calModalOpen, setCalModalOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(2) || '');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const activeTool = TOOL_ROUTES[route];

  const copyLink = useCallback((url) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  useEffect(() => {
    github.loadRepos();
  }, []);

  function handleTabSwitch(name) {
    setActiveTab(name);
    if (name === 'projects') github.loadFull();
  }

  if (activeTool) {
    return (
      <LockScreen>
        <div className="tool-page">
          <div className="tool-page-header">
            <a href="#/" className="tool-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Hub
            </a>
            <span className="tool-page-title">{activeTool.name}</span>
          </div>
          <iframe className="tool-iframe" src={activeTool.url} title={activeTool.name} />
        </div>
      </LockScreen>
    );
  }

  return (
    <LockScreen>
      <Topbar onPaletteToggle={palette.toggleOpen} />

      <PaletteBar
        colors={palette.colors}
        locked={palette.locked}
        open={palette.open}
        activePreset={palette.activePreset}
        onGenerate={palette.generate}
        onToggleLock={palette.toggleLock}
        onApplyPreset={palette.applyPreset}
        onClose={palette.toggleOpen}
      />

      <div className="main-content">
        <div className="hero-row">
          <div className="hero-profile">
            <div className="avatar" id="avatar">
              {/* Drop your own avatar in /public/imgs/avatar.png and uncomment: */}
              {/* <img src="/imgs/avatar.png" alt={PROFILE.name} /> */}
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👤</div>
            </div>
            <div className="hero-info">
              <h1>{PROFILE.name}</h1>
              <div className="hero-links">
                {(PROFILE.links || []).map(({ url, label }) => (
                  <span key={url} className="hero-link-wrap">
                    <a href={url} target="_blank" rel="noreferrer">{label}</a>
                    <button
                      className={`copy-btn${copied === url ? ' copied' : ''}`}
                      onClick={() => copyLink(url)}
                      title="Copy link"
                    >
                      {copied === url ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      )}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-repos">
            <div className="label">Active Projects</div>
            <div className="project-grid">
              {github.loading && !github.sidebarRepos && <span className="loading">loading...</span>}
              {github.error && !github.sidebarRepos && <span className="error">{github.error}</span>}
              {github.sidebarRepos && github.sidebarRepos.length === 0 && !github.loading && (
                <span className="loading">Set VITE_GITHUB_USERNAME to populate.</span>
              )}
              {github.sidebarRepos && github.sidebarRepos.map((repo, i) => {
                const color = LANG_COLORS[repo.lang] || '#333';
                return (
                  <a key={repo.name} className="project-row" href={repo.url} target="_blank" rel="noreferrer">
                    <span className="project-index">0{i + 1}</span>
                    <div className="project-info">
                      <div className="project-name">{repo.name}</div>
                      <div className="project-date">{repo.date}</div>
                    </div>
                    {repo.lang && <span className="lang-pip" style={{ background: color }} title={repo.lang}></span>}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="quick-links-col">
            {QUICK_LINKS.map(({ url, label, dotClass }) => (
              <a key={url} className="quick-link-btn" href={url} target="_blank" rel="noreferrer">
                <span className={`quick-dot ${dotClass || ''}`}></span>
                {label}
              </a>
            ))}
            <div className="split-btn">
              <button className="split-btn-half" onClick={() => setCalModalOpen(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Event
              </button>
              <a className="split-btn-half google" href="https://calendar.google.com/calendar/r" target="_blank" rel="noreferrer">
                <span className="quick-dot google-cal"></span>
                Google Cal
              </a>
            </div>
          </div>
        </div>

        <WeekStrip />

        <TabNav activeTab={activeTab} onSwitch={handleTabSwitch} />

        <div className={`tab-content${activeTab === 'habits' ? ' active' : ''}`} id="tab-habits">
          <HabitsTab />
        </div>

        <div className={`tab-content${activeTab === 'projects' ? ' active' : ''}`} id="tab-projects">
          <ProjectsTab
            fullRepos={github.fullRepos}
            loading={github.loading}
            error={github.error}
            onLoad={github.loadFull}
            commits={github.commits}
            commitsLoading={github.commitsLoading}
            onLoadCommits={github.loadCommits}
          />
        </div>

        <div className={`tab-content${activeTab === 'workflow' ? ' active' : ''}`} id="tab-workflow">
          <WorkflowTab />
        </div>

        <div className={`tab-content${activeTab === 'money' ? ' active' : ''}`} id="tab-money">
          <MoneyTab />
        </div>

        <div className={`tab-content${activeTab === 'tools' ? ' active' : ''}`} id="tab-tools">
          <ToolsTab />
        </div>

        <div className={`tab-content${activeTab === 'business' ? ' active' : ''}`} id="tab-business">
          <BusinessTab />
        </div>
      </div>

      <AddEventModal open={calModalOpen} onClose={() => setCalModalOpen(false)} />

      <StatusBar />
    </LockScreen>
  );
}
