import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/MarkdownRenderer.css';

// slugify 将标题文本转换为可用的 id，支持中英文，并对重复标题自动去重。
const slugify = (text) => {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
};

const MarkdownRenderer = ({ content, setAnchors, isDarkMode, isSideNavCollapsed }) => {
    const containerRef = useRef(null);
    const [eyeCareMode, setEyeCareMode] = useState(false);

    // 内容渲染完成后，从 DOM 提取标题并生成锚点。
    // 之前的实现把 useEffect 写在 react-markdown 的 components.h1/h2/h3 回调里，
    // 违反了 React Hooks 规则（Hooks 不能在回调/嵌套函数中调用），
    // 会导致锚点错乱甚至运行时报错。改为在渲染后统一从 DOM 提取。
    useEffect(() => {
        if (!containerRef.current) return;

        const headings = containerRef.current.querySelectorAll('h1, h2, h3');
        const anchors = [];
        const usedIds = new Set();

        headings.forEach((heading) => {
            const text = heading.textContent || '';
            const level = parseInt(heading.tagName.substring(1), 10);
            let id = heading.id || slugify(text) || `heading-${anchors.length}`;

            // 同文档内重复标题追加序号，避免 id 冲突导致目录跳转错误
            if (usedIds.has(id)) {
                let counter = 1;
                while (usedIds.has(`${id}-${counter}`)) counter++;
                id = `${id}-${counter}`;
            }
            usedIds.add(id);
            heading.id = id;

            anchors.push({ level, id, text });
        });

        setAnchors(anchors);
    }, [content, setAnchors]);

    const markdownClass = `markdown-content ${isDarkMode ? 'dark-mode' : ''} ${eyeCareMode ? 'eye-care-mode' : ''} ${!isSideNavCollapsed ? 'collapsed' : ''}`;

    return (
        <div className={markdownClass} ref={containerRef}>
            <button
                className="button-eye-care"
                onClick={() => setEyeCareMode(!eyeCareMode)}
            >
                {eyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
            </button>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                        </a>
                    ),
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={okaidia}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
