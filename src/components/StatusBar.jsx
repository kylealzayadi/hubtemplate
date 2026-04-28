export default function StatusBar() {
  const buildTime = new Date(__BUILD_TIME__);
  const formatted = buildTime.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="statusbar">
      <span className="status-text">last push: {formatted}</span>
    </div>
  );
}
