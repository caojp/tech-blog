import { memo } from 'react';
import '../styles/ThemeSwitcher.css';

const SunIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const ThemeSwitcher = ({ isDarkMode, onChange }) => {
    return (
        <div className="theme-switcher">
            <input
                type="checkbox"
                id="theme-switch"
                className="theme-switch-checkbox"
                checked={isDarkMode}
                onChange={onChange}
            />
            <label htmlFor="theme-switch" className="theme-switch-label">
                <span className="theme-switch-inner">
                    <span className="icon sun"><SunIcon /></span>
                    <span className="icon moon"><MoonIcon /></span>
                </span>
            </label>
        </div>
    );
};

export default memo(ThemeSwitcher);
