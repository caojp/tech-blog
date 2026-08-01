import { memo, useState, useEffect, useRef, useCallback } from 'react';
import '../styles/SideNav.css';

const STORAGE_KEY = 'tech-blog-sidebar-width';
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// 根据屏幕尺寸返回合适的默认侧边栏宽度
const getDefaultWidth = () => {
    const w = window.innerWidth;
    if (w >= 2560) return 360;
    if (w >= 1920) return 320;
    if (w >= 1366) return 280;
    return 240;
};

const SideNav = ({ subcategories, onFileSelect, isDarkMode, toggleSideNav, isSideNavOpen }) => {
    const [expandedPaths, setExpandedPaths] = useState({});
    const [activePath, setActivePath] = useState(null);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? parseInt(saved, 10) : getDefaultWidth();
    });
    const [isResizing, setIsResizing] = useState(false);
    const sidebarWidthRef = useRef(sidebarWidth);

    useEffect(() => {
        sidebarWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    // 拖拽调整宽度
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem(STORAGE_KEY, String(sidebarWidthRef.current));
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    const startResize = useCallback((e) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const toggleExpand = (path) => {
        setExpandedPaths((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const handleFileSelect = (subcategory) => {
        setActivePath(subcategory.path);
        onFileSelect(subcategory);
        // 手机端选择文件后自动收起侧边栏
        if (window.innerWidth <= 768) {
            toggleSideNav();
        }
    };

    const renderSubcategories = (categories) => {
        return (
            <ul className="nav-list">
                {categories.map((subcategory) => (
                    <li key={subcategory.path} className="nav-item">
                        {subcategory.is_dir ? (
                            <>
                                <div
                                    onClick={() => toggleExpand(subcategory.path)}
                                    className={`folder-name ${expandedPaths[subcategory.path] ? 'expanded' : ''}`}
                                >
                                    {subcategory.name}
                                </div>
                                {expandedPaths[subcategory.path] && subcategory.children && (
                                    <ul className="sub-list">
                                        {renderSubcategories(subcategory.children)}
                                    </ul>
                                )}
                            </>
                        ) : (
                            <div
                                className={`file-name ${activePath === subcategory.path ? 'active' : ''}`}
                                onClick={() => handleFileSelect(subcategory)}
                            >
                                {subcategory.name}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <>
            {/* 移动端背景遮罩 */}
            <div
                className={`side-nav-backdrop ${isSideNavOpen ? 'visible' : ''}`}
                onClick={toggleSideNav}
            />
            <nav
                className={`side-nav ${isDarkMode ? 'dark-mode' : ''} ${isSideNavOpen ? 'open' : ''} ${isResizing ? 'resizing' : ''}`}
                style={{ width: `${sidebarWidth}px` }}
            >
                <div className="side-nav-content">
                    {renderSubcategories(subcategories)}
                </div>
                {/* 桌面端拖拽手柄 */}
                <div
                    className="side-nav-resize-handle"
                    onMouseDown={startResize}
                />
            </nav>
        </>
    );
};

export default memo(SideNav);
