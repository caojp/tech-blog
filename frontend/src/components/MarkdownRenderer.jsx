import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import * as PrismStyles from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/MarkdownRenderer.css';

const extractTextFromChildren = (children) =>
    Array.isArray(children)
        ? children.map(child => extractTextFromChildren(child)).join('')
        : typeof children === 'string'
            ? children
            : React.isValidElement(children) && children.props?.children
                ? extractTextFromChildren(children.props.children)
                : '';

const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0;
};

const MarkdownRenderer = ({ content, setAnchors, isDarkMode, isSideNavCollapsed }) => {
    const [localAnchors, setLocalAnchors] = useState([]);
    const [contentReady, setContentReady] = useState(false);
    const [eyeCareMode, setEyeCareMode] = useState(false);
    const [highlightStyle, setHighlightStyle] = useState('okaidia');
    const [copyButtonText, setCopyButtonText] = useState('⎘');

    const styles = useMemo(() => PrismStyles, []);

    const markdownClass = useMemo(
        () =>
            `markdown-content ${isDarkMode ? 'dark-mode' : ''} ${eyeCareMode ? 'eye-care-mode' : ''} ${
                !isSideNavCollapsed ? 'collapsed' : ''
            }`,
        [isDarkMode, eyeCareMode, isSideNavCollapsed]
    );

    const addAnchor = useCallback((level, id, text) => {
        setLocalAnchors((prevAnchors) => {
            if (!prevAnchors.find(anchor => anchor.id === id)) {
                return [...prevAnchors, { level, id, text }];
            }
            return prevAnchors;
        });
    }, []);

    useEffect(() => {
        if (content) {
            setContentReady(false);
            setLocalAnchors([]);
            setContentReady(true);
        }
    }, [content]);

    useEffect(() => {
        if (contentReady) {
            setAnchors(localAnchors);
        }
    }, [localAnchors, contentReady, setAnchors]);

    const handleCopyToClipboard = (code) => {
        navigator.clipboard.writeText(code)
            .then(() => {
                setCopyButtonText('✓ 已经复制');
                setTimeout(() => setCopyButtonText('⎘'), 2000);
            })
            .catch((err) => console.error('复制失败:', err));
    };

    const renderHeading = (level) => ({ node, ...props }) => {
        const text = extractTextFromChildren(props.children);
        const hash = hashString(text);
        const id = `hash-${hash}`;

        useEffect(() => {
            addAnchor(level, id, text);
        }, [id, text, level, addAnchor]);

        const HeadingTag = `h${level}`;
        return <HeadingTag id={id} {...props} />;
    };

    return (
        <div className={markdownClass}>
            <div className="feature-area">
                <button className="button-eye-care" onClick={() => setEyeCareMode(!eyeCareMode)}>
                    {eyeCareMode ? '关闭护眼模式' : '开启护眼模式'}
                </button>
                <div className="highlight-style-selector">
                    <label htmlFor="highlight-style">代码高亮风格: </label>
                    <select
                        id="highlight-style"
                        value={highlightStyle}
                        onChange={(e) => setHighlightStyle(e.target.value)}
                    >
                        {Object.keys(styles).map((style) => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: renderHeading(1),
                    h2: renderHeading(2),
                    h3: renderHeading(3),
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                        </a>
                    ),
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="code-container">
                                <div className="code-header">
                                    <span className="code-dots">
                                        <span>🔴</span>
                                        <span>🟡</span>
                                        <span>🟢</span>
                                    </span>
                                    <button
                                        className="copy-button"
                                        onClick={() => handleCopyToClipboard(String(children).replace(/\n$/, ''))}
                                    >
                                        {copyButtonText}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    style={styles[highlightStyle]}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
