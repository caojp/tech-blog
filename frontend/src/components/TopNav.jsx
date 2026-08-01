import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopNav.css';
import ThemeSwitcher from './ThemeSwitcher.jsx';

const TopNav = ({ categories, onCategorySelect, isDarkMode, toggleTheme, isSideNavOpen, toggleSideNav }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);  // 状态控制菜单展开/收起
    const filteredCategories = categories.filter(category => category.is_dir);
    const navigate = useNavigate();

    const handleTitleClick = () => {
        navigate('/');
    };


    return (
        <nav className={`top-nav ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="top-nav-left">
                <h1 className="top-title" onClick={handleTitleClick}>
                    TechBlog
                </h1>

                {/* 折叠/展开按钮 */}
                <button
                    type="button"
                    className={`toggle-button ${isSideNavOpen ? 'active' : ''}`}
                    onClick={toggleSideNav}
                    aria-label="切换侧边栏"
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                </button>

                <ThemeSwitcher isDarkMode={isDarkMode} onChange={toggleTheme} />

                {/* 移动端汉堡菜单按钮 */}
                <div className="hamburger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>
            </div>

            {/* 菜单列表，移动端通过 isMenuOpen 控制 */}
            <div className={`top-nav-right ${isMenuOpen ? 'open' : ''}`}>
                <ul className="nav-list">
                    {filteredCategories.map((category) => (
                        <li key={category.path} className="nav-item">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onCategorySelect(category);
                                    // 点击后折叠汉堡菜单
                                    setIsMenuOpen(false);
                                    // 如果 SideNav 未展开，则展开它
                                    if (!isSideNavOpen) {
                                        toggleSideNav();
                                    }
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
};

export default memo(TopNav);
