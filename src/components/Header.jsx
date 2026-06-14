export default function Header({ streak, dark, onDarkToggle, onCalendarClick, calendarOpen }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="wordmark">Paideia</span>
        <div className="header-right">
          {streak > 0 && (
            <button
              className="streak streak-btn"
              title={`${streak}-day streak`}
              onClick={onCalendarClick}
              aria-label={`${streak}-day streak`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <polygon points="5,0 6.5,3.5 10,4 7.5,6.5 8,10 5,8 2,10 2.5,6.5 0,4 3.5,3.5" />
              </svg>
              <span>Day {streak}</span>
            </button>
          )}

          <button
            className={`icon-btn${calendarOpen ? ' active' : ''}`}
            onClick={onCalendarClick}
            aria-label={calendarOpen ? 'Close calendar' : 'Open calendar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="2.5" width="14" height="12" rx="2" />
              <line x1="1" y1="6.5" x2="15" y2="6.5" />
              <line x1="5" y1="1" x2="5" y2="4" />
              <line x1="11" y1="1" x2="11" y2="4" />
            </svg>
          </button>

          <button
            className="icon-btn"
            onClick={onDarkToggle}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <circle cx="8" cy="8" r="3.5" />
                <line x1="8" y1="1" x2="8" y2="2.5" />
                <line x1="8" y1="13.5" x2="8" y2="15" />
                <line x1="1" y1="8" x2="2.5" y2="8" />
                <line x1="13.5" y1="8" x2="15" y2="8" />
                <line x1="3.05" y1="3.05" x2="4.1" y2="4.1" />
                <line x1="11.9" y1="11.9" x2="12.95" y2="12.95" />
                <line x1="12.95" y1="3.05" x2="11.9" y2="4.1" />
                <line x1="4.1" y1="11.9" x2="3.05" y2="12.95" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
