import React from 'react';
import '../styles/TopNav.css';
import ThemeSwitcher from './ThemeSwitcher.jsx';

const TopNav = ({ categories, onCategorySelect, isDarkMode, toggleTheme, isSideNavCollapsed, toggleSideNav }) => {
    const filteredCategories = categories.filter(category => category.is_dir);

    return (
        <nav className={`top-nav ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="top-nav-left">
                <h1 className="top-title">TechBlog</h1>
                {/* 添加一个折叠/展开按钮 */}
                <div className="toggle-button" onClick={toggleSideNav}>
                    {/* 切换箭头方向 */}
                    <div className={`lines ${isSideNavCollapsed ? 'collapsed' : ''}`}>
                        <div className="line"></div>
                        <div className="line arrow"></div> {/* 中间的箭头行 */}
                        <div className="line"></div>
                    </div>
                </div>
                {/*<p className="slogan">技术探秘者 探索技术世界的奥秘，分享技术发现与心得。</p>*/}
                <ThemeSwitcher isDarkMode={isDarkMode} onChange={toggleTheme} />
            </div>
            <div className="top-nav-right">
                <ul className="nav-list">
                    {filteredCategories.map((category) => (
                        <li key={category.path} className="nav-item">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onCategorySelect(category);
                                }}
                                className="nav-link"
                            >
                                {category.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}

export default TopNav;
