import { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/MarkdownRenderer.css';

// 按需注册代码高亮语言，避免全量引入 react-syntax-highlighter（原全量包接近 1MB）。
// 未注册的语言会以纯文本展示，不会报错。
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsxLang from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import markdownLang from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';

SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('jsx', jsxLang);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('markdown', markdownLang);
SyntaxHighlighter.registerLanguage('md', markdownLang);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('c#', csharp);

// slugify 将标题文本转换为可用的 id，支持中英文，并对重复标题自动去重。
const slugify = (text) => {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
};

const MarkdownRenderer = ({ content, setAnchors, isDarkMode, isSideNavOpen }) => {
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

    const markdownClass = `markdown-content ${isDarkMode ? 'dark-mode' : ''} ${eyeCareMode ? 'eye-care-mode' : ''} ${!isSideNavOpen ? 'collapsed' : ''}`;

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
                    a: ({ ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                        </a>
                    ),
                    code({ inline, className, children, ...props }) {
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

export default memo(MarkdownRenderer);
