import React, { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/MarkdownRenderer.css';

const extractTextFromChildren = (children) => {
    if (typeof children === 'string') {
        return children;
    }
    if (Array.isArray(children)) {
        return children.map(child => extractTextFromChildren(child)).join('');
    }
    if (React.isValidElement(children) && children.props && children.props.children) {
        return extractTextFromChildren(children.props.children);
    }
    return '';
};

const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
};

const MarkdownRenderer = ({ content, setAnchors, isDarkMode }) => {
    const [localAnchors, setLocalAnchors] = useState([]);
    const [contentReady, setContentReady] = useState(false);
    const [eyeCareMode, setEyeCareMode] = useState(false);

    const addAnchor = useCallback((level, id, text) => {
        setLocalAnchors(prevAnchors => {
            const newAnchor = { level, id, text };
            if (!prevAnchors.find(anchor => anchor.id === id)) {
                return [...prevAnchors, newAnchor];
            }
            return prevAnchors;
        });
    }, []);

    useEffect(() => {
        if (content) {
            setContentReady(false); // 在加载新内容时将contentReady设置为false
            setLocalAnchors([]); // 清空localAnchors
            setContentReady(true); // 渲染新内容后再将contentReady设置为true
        }
    }, [content]);

    useEffect(() => {
        if (contentReady) {
            setAnchors(localAnchors);
        }
    }, [localAnchors, contentReady, setAnchors]);

    const markdownClass = `markdown-content ${isDarkMode ? 'dark-mode' : ''} ${eyeCareMode ? 'eye-care-mode' : ''}`;

    return (
        <div className={markdownClass}>
            <button
                className="button-eye-care"
                onClick={() => setEyeCareMode(!eyeCareMode)}
            >
                {eyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
            </button>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => {
                        const text = extractTextFromChildren(props.children);
                        const hash = hashString(text);
                        const id = `hash-${hash}`;
                        useEffect(() => {
                            addAnchor(1, id, text);
                        }, [id, text, addAnchor]);
                        return <h1 id={id} {...props} />;
                    },
                    h2: ({ node, ...props }) => {
                        const text = extractTextFromChildren(props.children);
                        const hash = hashString(text);
                        const id = `hash-${hash}`;
                        useEffect(() => {
                            addAnchor(2, id, text);
                        }, [id, text, addAnchor]);
                        return <h2 id={id} {...props} />;
                    },
                    h3: ({ node, ...props }) => {
                        const text = extractTextFromChildren(props.children);
                        const hash = hashString(text);
                        const id = `hash-${hash}`;
                        useEffect(() => {
                            addAnchor(3, id, text);
                        }, [id, text, addAnchor]);
                        return <h3 id={id} {...props} />;
                    },
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
