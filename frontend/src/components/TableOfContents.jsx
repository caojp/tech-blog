import React from 'react';
import '../styles/TableOfContents.css'; // 引入样式文件

const TableOfContents = ({ anchors }) => {
    // console.log('Rendering TableOfContents with anchors:', anchors); // Debug log
    return (
        <div className="table-of-contents">
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
