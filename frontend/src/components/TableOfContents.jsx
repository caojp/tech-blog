import React, {useState, useEffect } from 'react';
import '../styles/TableOfContents.css'; // 引入样式文件

const TableOfContents = ({ anchors, isDarkMode }) => {
    const [collapsed, setCollapsed] = useState(false);

    // 处理折叠按钮的点击事件
    const handleToggle = () => {
        setCollapsed(!collapsed);
    };
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
            <button className="toggle-button" onClick={handleToggle}></button>
            <ul>
                {anchors.map((anchor, index) => (
                    <li key={index} className={`toc-level-${anchor.level}`}>
                        <a href={`#${anchor.id}`}>{anchor.text}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TableOfContents;
