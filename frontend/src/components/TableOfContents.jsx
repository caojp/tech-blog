import React, {useState} from 'react';
import '../styles/TableOfContents.css'; // 引入样式文件

const TableOfContents = ({ anchors, isDarkMode }) => {
    // console.log('Rendering TableOfContents with anchors:', anchors); // Debug log

    // 状态来控制是否折叠
    const [collapsed, setCollapsed] = useState(false);

    // 处理折叠按钮的点击事件
    const handleToggle = () => {
        setCollapsed(!collapsed);
    };


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
