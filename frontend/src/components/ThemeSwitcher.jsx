// src/components/ThemeSwitcher.jsx
import React from 'react';
import '../styles/ThemeSwitcher.css'; // 引入样式文件

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
                <span className="theme-switch-inner"></span>
            </label>
        </div>
    );
};

export default ThemeSwitcher;
