import { memo, useState, useEffect, useCallback } from 'react';
import '../styles/TableOfContents.css'; // 引入样式文件

const TableOfContents = ({ anchors, isDarkMode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [activeId, setActiveId] = useState(null);

    // 处理折叠按钮的点击事件
    const handleToggle = () => {
        setCollapsed(!collapsed);
    };

    // 滚动时高亮当前章节（进入视口上沿的最后一个锚点）
    const updateActive = useCallback(() => {
        const probe = 140; // 顶部导航高度偏移
        let current = null;
        for (const a of anchors) {
            const el = document.getElementById(a.id);
            if (el && el.getBoundingClientRect().top <= probe) current = a.id;
        }
        setActiveId(current);
    }, [anchors]);

    useEffect(() => {
        setActiveId(null); // 文章切换时重置
        let raf = 0;
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(updateActive);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        updateActive();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(raf);
        };
    }, [updateActive]);

    // 检查当前屏幕宽度是否为窄屏幕
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setCollapsed(true); // 默认折叠
            } else {
                setCollapsed(false); // 非窄屏幕默认不折叠
            }
        };

        // 初始检查屏幕宽度
        handleResize();

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize);

        // 清除事件监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className={`table-of-contents ${isDarkMode ? 'dark-mode' : ''} ${collapsed ? 'collapsed' : ''}`}>
            <button className="toggle-button" onClick={handleToggle} aria-label="折叠目录">
                <svg className="toc-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            <ul>
                {anchors.map((anchor, index) => (
                    <li key={index} className={`toc-level-${anchor.level}`}>
                        <a
                            href={`#${anchor.id}`}
                            className={anchor.id === activeId ? 'active' : ''}
                            onClick={() => setActiveId(anchor.id)}
                        >
                            {anchor.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default memo(TableOfContents);
