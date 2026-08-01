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
                <div className="toggle-button" onClick={toggleSideNav}>
                    <div className={`lines ${isSideNavOpen ? 'collapsed' : ''}`}>
                        <div className="line"></div>
                        <div className="line arrow"></div>
                        <div className="line"></div>
                    </div>
                </div>

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
