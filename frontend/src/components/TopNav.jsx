import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopNav.css';
import ThemeSwitcher from './ThemeSwitcher.jsx';

const TopNav = ({ categories, onCategorySelect, isDarkMode, toggleTheme, isEyeCareMode, toggleEyeCare, isSideNavOpen, toggleSideNav }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const topNavRef = useRef(null);   // .top-nav 始终 100vw，作为稳定测量容器
    const fixedRef = useRef(null);    // 品牌 Logo + 功能图标区：固定宽度，不参与溢出
    const probeRef = useRef(null);    // 隐藏探针：只测分类菜单的自然横向宽度
    const filteredCategories = categories.filter(category => category.is_dir);
    const navigate = useNavigate();

    // 解耦测量与显示：探针在 .top-nav 里（不会因显示状态塌缩）
    useEffect(() => {
        const topNav = topNavRef.current;
        const fixed = fixedRef.current;
        const probe = probeRef.current;
        if (!topNav || !fixed || !probe) return;

        const checkOverflow = () => {
            // 可用宽度 = 总导航栏宽度 - 左侧固定区（Logo + 功能图标）宽度
            const availableWidth = topNav.clientWidth - fixed.offsetWidth;
            // 探针 scrollWidth = 所有分类项横向排开的自然总宽
            const naturalWidth = probe.scrollWidth;
            const overflow = naturalWidth > availableWidth + 1; // +1 容差防亚像素抖动
            setIsOverflowing(prev => {
                if (prev === overflow) return prev;
                if (!overflow) setIsMenuOpen(false);
                return overflow;
            });
        };

        checkOverflow();

        // 监听菜单项增减、字体加载
        const probeObserver = new ResizeObserver(checkOverflow);
        probeObserver.observe(probe);

        // 监听导航栏整体尺寸变化（窗口缩放、DPI 变化）
        const topNavObserver = new ResizeObserver(checkOverflow);
        topNavObserver.observe(topNav);

        window.addEventListener('resize', checkOverflow);
        document.fonts?.ready?.then(checkOverflow);

        return () => {
            probeObserver.disconnect();
            topNavObserver.disconnect();
            window.removeEventListener('resize', checkOverflow);
        };
    }, [filteredCategories.length]);

    // 点击外部关闭下拉
    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (e) => {
            const panel = document.querySelector('.nav-dropdown-panel');
            const hamburger = document.querySelector('.hamburger-menu');
            if (panel && !panel.contains(e.target) && hamburger && !hamburger.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleTitleClick = () => {
        navigate('/');
    };

    const handleSearchClick = () => {
        navigate('/search');
    };

    const handleTagsClick = () => {
        navigate('/tags');
    };

    const handleCategoryClick = useCallback((category) => (e) => {
        e.preventDefault();
        onCategorySelect(category);
        setIsMenuOpen(false);
        if (!isSideNavOpen) {
            toggleSideNav();
        }
    }, [onCategorySelect, isSideNavOpen, toggleSideNav]);

    // 分类菜单渲染器（内联和下拉共用）
    const renderCategoryList = () => (
        <ul className="nav-list">
            {filteredCategories.map((category) => (
                <li key={category.path} className="nav-item">
                    <a
                        href="#"
                        onClick={handleCategoryClick(category)}
                        className="nav-link"
                    >
                        {category.name}
                    </a>
                </li>
            ))}
        </ul>
    );

    return (
        <nav ref={topNavRef} className={`top-nav ${isDarkMode ? 'dark-mode' : ''} ${isOverflowing ? 'is-overflowing' : ''}`}>
            {/* 左区：品牌标题 + 功能图标（不参与溢出测量） */}
            <div ref={fixedRef} className="top-nav-fixed">
                {/* 标题区：AldusBlog 品牌 Logo */}
                <div className="top-nav-brand">
                    <button
                        type="button"
                        className="brand-logo"
                        onClick={handleTitleClick}
                        aria-label="AldusBlog 返回首页"
                        data-tip="返回首页"
                    >
                        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
                            <defs>
                                <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="100%" stopColor="#7c3aed" />
                                </linearGradient>
                            </defs>
                            <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#brand-g)" />
                            <path d="M8.5 24 L16 8.5 L23.5 24" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12.3 18.2 H19.7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <span className="brand-name">AldusBlog</span>
                    </button>
                </div>

                {/* 功能区：图标按钮组（与标题区分离） */}
                <div className="top-nav-actions">
                    <button
                        type="button"
                        className="nav-icon-btn"
                        onClick={handleSearchClick}
                        aria-label="搜索"
                        data-tip="搜索"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        className="nav-icon-btn"
                        onClick={handleTagsClick}
                        aria-label="标签"
                        data-tip="标签"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                        </svg>
                    </button>

                    {/* 折叠/展开按钮 */}
                    <button
                        type="button"
                        className={`toggle-button ${isSideNavOpen ? 'active' : ''}`}
                        onClick={toggleSideNav}
                        aria-label="切换侧边栏"
                        data-tip="目录"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </button>

                    <ThemeSwitcher isDarkMode={isDarkMode} onChange={toggleTheme} />

                    {/* 护眼模式切换按钮 */}
                    <button
                        type="button"
                        className={`toggle-button eye-care-button ${isEyeCareMode ? 'active' : ''}`}
                        onClick={toggleEyeCare}
                        aria-label="切换护眼模式"
                        title={isEyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
                    >
                        {isEyeCareMode ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        )}
                    </button>

                    {/* 溢出时才显示的汉堡菜单按钮 */}
                    {isOverflowing && (
                        <button
                            type="button"
                            className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="切换菜单"
                        >
                            <span className="bar"></span>
                            <span className="bar"></span>
                            <span className="bar"></span>
                        </button>
                    )}
                </div>
            </div>

            {/* 隐藏探针：直接放在 .top-nav 里，永远横向、永不参与显示 */}
            <ul ref={probeRef} className="nav-probe" aria-hidden="true">
                {filteredCategories.map((category) => (
                    <li key={category.path} className="nav-item">
                        <span className="nav-link">{category.name}</span>
                    </li>
                ))}
            </ul>

            {/* 内联分类菜单：始终渲染、尽量展示；放不下的部分以右侧渐变淡出，
                剩余分类收进汉堡下拉（点击汉堡查看全部） */}
            <div className="top-nav-right">
                <div className="nav-list-wrapper">
                    {renderCategoryList()}
                </div>
            </div>

            {/* 溢出态：多列下拉面板（fixed 定位，独立于内联菜单） */}
            {isOverflowing && (
                <div className={`nav-dropdown-panel ${isMenuOpen ? 'open' : ''}`}>
                    {renderCategoryList()}
                </div>
            )}
        </nav>
    );
};

export default memo(TopNav);
