export default function Header({ streak, onSettingsClick, settingsOpen }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="wordmark">Lectio</span>
        <div className="header-right">
          {streak > 0 && (
            <div className="streak" title={`${streak}-day streak`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <polygon points="5,0 6.5,3.5 10,4 7.5,6.5 8,10 5,8 2,10 2.5,6.5 0,4 3.5,3.5" />
              </svg>
              <span>Day {streak}</span>
            </div>
          )}
          <button
            className={`settings-btn${settingsOpen ? ' active' : ''}`}
            onClick={onSettingsClick}
            aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
          >
            {settingsOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="14" y2="14" />
                <line x1="14" y1="2" x2="2" y2="14" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="8" cy="8" r="2.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l1.41-1.41M3.05 12.95l1.41-1.41" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
