export default function TabNav({ activeTab, onSwitch }) {
  return (
    <nav className="tab-nav">
      <button
        className={`tab-btn${activeTab === 'habits' ? ' active' : ''}`}
        onClick={() => onSwitch('habits')}
      >Habits</button>
      <button
        className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`}
        onClick={() => onSwitch('projects')}
      >Projects</button>
      <button
        className={`tab-btn${activeTab === 'workflow' ? ' active' : ''}`}
        onClick={() => onSwitch('workflow')}
      >Workflow</button>
      <button
        className={`tab-btn${activeTab === 'money' ? ' active' : ''}`}
        onClick={() => onSwitch('money')}
      >Money</button>
      <button
        className={`tab-btn${activeTab === 'tools' ? ' active' : ''}`}
        onClick={() => onSwitch('tools')}
      >Tools</button>
      <button
        className={`tab-btn${activeTab === 'business' ? ' active' : ''}`}
        onClick={() => onSwitch('business')}
      >Business</button>
    </nav>
  );
}
