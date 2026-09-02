import { memo, useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia, oneDark, oneLight, vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import '../styles/MarkdownRenderer.css';

// 按需注册代码高亮语言
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

const highlightStyles = { okaidia, oneDark, oneLight, vscDarkPlus, vs };

const slugify = (text) => {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-');
};

// WeakMap：.mermaid-block 元素 → 原始源码
const mermaidSourceMap = new WeakMap();

/**
 * Mermaid 源码预处理器：自动给 flowchart 的节点标签和边标签加引号。
 *
 * 架构：占位符隔离法
 * 1. 先抽取所有 edge label → 存数组 + 替换为 __MERMAID_EDGE_N__
 *    （防止节点正则误匹配 edge label 内的内容，也防止 edge label 自己被节点正则二次破坏）
 * 2. 在占位符保护下处理节点标签（rect/round/diamond）
 * 3. 单独处理每个抽取出来的 edge label（无论是否已加引号，内部 " 全部 → &quot;）
 * 4. 用处理后的 edge label 还原占位符
 *
 * Mermaid flowchart 中 #()[]{}+/ 等字符是语法标记。
 * + 在节点标签里会被当成 subgraph 合并语法。
 */
function preprocessMermaid(source) {
    // === Step 1: 抽取所有 edge label，替换为占位符 ===
    const edgeLabels = [];
    let protectedSource = source.replace(
        /((?:-->|-->|==>|-.->|<-->|<==>|o--o|o==o)(?:>>)?)\|([^|]+)\|/g,
        (match, arrow, label) => {
            const idx = edgeLabels.length;
            edgeLabels.push({ arrow, label });
            return `${arrow}|__MERMAID_EDGE_${idx}__|`;
        }
    );

    // === Step 2: 在占位符保护下处理节点标签 ===
    // 矩形 id[text]
    protectedSource = protectedSource.replace(/(\b[A-Za-z0-9_]+)\[([^\]]*)\]/g, (m, id, text) => {
        const trimmed = text.trim();
        if (/^".*"$/.test(trimmed)) return m;
        if (trimmed.startsWith('"')) return m;
        if (['subgraph','direction','classDef','style','class','linkStyle'].includes(id.toLowerCase())) return m;
        if (text.startsWith('(')) return m;   // 圆柱 [(text)]
        if (text.startsWith('/')) return m;   // 平行四边形 /text/
        if (text.startsWith('{')) return m;   // 六边形 {{text}}
        if (!/[#<>'"\(\)\{\}\[\]\/\\+]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return m;
        const safe = text.replace(/"/g, '&quot;');
        return `${id}["${safe}"]`;
    });

    // 圆角 id(text)
    protectedSource = protectedSource.replace(/(\b[A-Za-z0-9_]+)\(([^)]*)\)/g, (m, id, text) => {
        const trimmed = text.trim();
        if (/^".*"$/.test(trimmed)) return m;
        if (trimmed.startsWith('"')) return m;
        if (['subgraph','direction','classDef','style','class','linkStyle'].includes(id.toLowerCase())) return m;
        if (text.startsWith('(')) return m;   // 圆形 ((text))
        if (!/[#<>'"\(\)\{\}\[\]\/\\+]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return m;
        const safe = text.replace(/"/g, '&quot;');
        return `${id}("${safe}")`;
    });

    // 菱形 id{text}
    protectedSource = protectedSource.replace(/(\b[A-Za-z0-9_]+)\{([^}]*)\}/g, (m, id, text) => {
        const trimmed = text.trim();
        if (/^".*"$/.test(trimmed)) return m;
        if (trimmed.startsWith('"')) return m;
        if (['subgraph','direction','classDef','style','class','linkStyle'].includes(id.toLowerCase())) return m;
        if (text.startsWith('{')) return m;   // 六边形 {{text}}
        if (!/[#<>'"\(\)\{\}\[\]\/\\+]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return m;
        const safe = text.replace(/"/g, '&quot;');
        return `${id}{"${safe}"}`;
    });

    // === Step 3: 处理每个 edge label 并还原占位符 ===
    let result = protectedSource;
    for (let i = edgeLabels.length - 1; i >= 0; i--) {
        const { arrow, label } = edgeLabels[i];
        const trimmed = label.trim();
        let newLabel;
        if (/^".*"$/.test(trimmed)) {
            // 已经是完整引号包裹 "..." — 内部 " 转 &quot;
            const inner = trimmed.slice(1, -1).replace(/"/g, '&quot;');
            newLabel = `"${inner}"`;
        } else if (trimmed.startsWith('"')) {
            // 只有开头引号（用户尝试加引号）
            const inner = trimmed.slice(1).replace(/"/g, '&quot;');
            newLabel = `"${inner}"`;
        } else if (/[()+{}\[\]\/\\#<>'+]/.test(trimmed) || /<br\s*\/?>/.test(trimmed)) {
            // 含特殊字符，需要加引号
            const safe = trimmed.replace(/"/g, '&quot;');
            newLabel = `"${safe}"`;
        } else {
            newLabel = label;
        }
        const placeholder = `__MERMAID_EDGE_${i}__`;
        result = result.split(`|${placeholder}|`).join(`|${newLabel}|`);
    }

    return result;
}

const MarkdownRenderer = ({ content, setAnchors, isDarkMode, isSideNavOpen, onOpenFullscreen }) => {
    const containerRef = useRef(null);
    const [highlightStyle, setHighlightStyle] = useState('okaidia');
    const [copyButtonText, setCopyButtonText] = useState('⎘');
    const mermaidCounter = useRef(0);

    // 初始化 mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: isDarkMode ? 'dark' : 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
        });
    }, [isDarkMode]);

    // 内容渲染完成后：提取锚点 + 渲染 mermaid
    useEffect(() => {
        if (!containerRef.current) return;

        // === 锚点提取 ===
        const headings = containerRef.current.querySelectorAll('h1, h2, h3');
        const anchors = [];
        const usedIds = new Set();

        headings.forEach((heading) => {
            const text = heading.textContent || '';
            const level = parseInt(heading.tagName.substring(1), 10);
            let id = heading.id || slugify(text) || `heading-${anchors.length}`;

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

        // === mermaid 图表渲染 ===
        const renderMermaid = async () => {
            const containers = containerRef.current.querySelectorAll('.mermaid-block');
            for (const el of containers) {
                if (el.dataset.rendered === 'true') continue;
                const rawSource = mermaidSourceMap.get(el) || '';
                if (!rawSource.trim()) continue;

                try {
                    const processed = preprocessMermaid(rawSource);
                    mermaidCounter.current += 1;
                    const id = `mermaid-${mermaidCounter.current}-${Date.now()}`;
                    const { svg } = await mermaid.render(id, processed);
                    el.innerHTML = svg;
                    el.dataset.rendered = 'true';
                    el.classList.add('mermaid-rendered');
                } catch (err) {
                    console.error('Mermaid 渲染失败:', err);
                    const lineMatch = /line\s+(\d+)/i.exec(err.message);
                    const lineNum = lineMatch ? lineMatch[1] : '?';
                    el.innerHTML = renderMermaidError(rawSource, err.message, lineNum);
                }
            }
        };

        const rafId = requestAnimationFrame(renderMermaid);
        return () => cancelAnimationFrame(rafId);
    }, [content, setAnchors, isDarkMode, isSideNavOpen]);

    // 打开全屏：克隆 SVG 并重命名 id，然后通过回调交给父组件
    const openFullscreen = useCallback((e) => {
        const wrapper = e.currentTarget.closest('.mermaid-wrapper');
        if (!wrapper) return;
        const svgEl = wrapper.querySelector('.mermaid-block svg');
        if (!svgEl) return;

        // 1. 算自然尺寸（用 viewBox）
        let naturalW = 0, naturalH = 0;
        if (svgEl.viewBox && svgEl.viewBox.baseVal && svgEl.viewBox.baseVal.width > 0) {
            naturalW = svgEl.viewBox.baseVal.width;
            naturalH = svgEl.viewBox.baseVal.height;
        } else {
            const rect = svgEl.getBoundingClientRect();
            naturalW = Math.round(rect.width) || 800;
            naturalH = Math.round(rect.height) || 600;
        }

        // 2. 深拷贝 SVG 节点
        const clone = svgEl.cloneNode(true);

        // 3. 重命名所有 id：加 "-fs" 后缀，避免与原 DOM 冲突
        const suffix = '-fs';
        const idMap = new Map();

        clone.querySelectorAll('[id]').forEach((el) => {
            const oldId = el.getAttribute('id');
            idMap.set(oldId, oldId + suffix);
            el.setAttribute('id', oldId + suffix);
        });

        // 4. 修复所有 url(#xxx) 引用
        clone.querySelectorAll('[clip-path], [fill], [stroke], [marker-start], [marker-end], [marker-mid]').forEach((el) => {
            ['clip-path', 'fill', 'stroke', 'marker-start', 'marker-end', 'marker-mid'].forEach((attr) => {
                const val = el.getAttribute(attr);
                if (val && val.startsWith('url(#')) {
                    const oldId = val.slice(5, -1);
                    const newId = idMap.get(oldId);
                    if (newId) el.setAttribute(attr, `url(#${newId})`);
                }
            });
        });

        // 5. 设置具体的 width/height（覆盖 SVG 自带的 width="100%"）
        clone.setAttribute('width', Math.round(naturalW));
        clone.setAttribute('height', Math.round(naturalH));

        // 6. 序列化并回调给父组件（不在本组件持有 state，避免重渲染清除所有 Mermaid）
        const serializer = new XMLSerializer();
        const sanitizedHtml = serializer.serializeToString(clone);

        onOpenFullscreen?.({
            html: sanitizedHtml,
            naturalWidth: naturalW,
            naturalHeight: naturalH,
        });
    }, [onOpenFullscreen]);

    const markdownClass = `markdown-content ${isDarkMode ? 'dark-mode' : ''} ${!isSideNavOpen ? 'collapsed' : ''}`;

    const handleCopyToClipboard = (code) => {
        navigator.clipboard.writeText(code)
            .then(() => {
                setCopyButtonText('✓ 已经复制');
                setTimeout(() => setCopyButtonText('⎘'), 2000);
            })
            .catch((err) => console.error('复制失败:', err));
    };

    return (
        <div className={markdownClass} ref={containerRef}>
            <div className="feature-area">
                <div className="highlight-style-selector">
                    <label htmlFor="highlight-style">代码高亮风格: </label>
                    <select
                        id="highlight-style"
                        value={highlightStyle}
                        onChange={(e) => setHighlightStyle(e.target.value)}
                    >
                        {Object.keys(highlightStyles).map((style) => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                        </a>
                    ),
                    table: ({ ...props }) => (
                        <div className="table-wrapper">
                            <table {...props} />
                        </div>
                    ),
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1].toLowerCase() : '';
                        const codeStr = String(children).replace(/\n$/, '');

                        if (!inline && lang === 'mermaid') {
                            const setRef = (el) => {
                                if (el) mermaidSourceMap.set(el, codeStr);
                            };
                            return (
                                <div className="mermaid-wrapper">
                                    <button
                                        type="button"
                                        className="mermaid-fullscreen-btn"
                                        title="全屏查看"
                                        aria-label="全屏查看"
                                        onClick={openFullscreen}
                                    >
                                        ⛶
                                    </button>
                                    <div
                                        ref={setRef}
                                        className="mermaid-block"
                                    />
                                </div>
                            );
                        }

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
                                        onClick={() => handleCopyToClipboard(codeStr)}
                                    >
                                        {copyButtonText}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    style={highlightStyles[highlightStyle]}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {codeStr}
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

const MemoMarkdownRenderer = memo(MarkdownRenderer);
export default MemoMarkdownRenderer;

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function renderMermaidError(source, errorMsg, lineNum) {
    const hint = errorMsg.includes('Parse error')
        ? `<div class="mermaid-hint">💡 提示: 节点/边标签中包含 ( ) [ ] { } / + # 等特殊字符时，请用双引号包裹标签文本，例如：<code>A -->|"标签文本"| B</code></div>`
        : '';
    return `
        <div class="mermaid-error-wrap">
            <div class="mermaid-error-title">
                ⚠️ Mermaid 渲染失败 <span class="mermaid-error-line">(第 ${lineNum} 行)</span>
            </div>
            <div class="mermaid-error-msg">${escapeHtml(errorMsg)}</div>
            ${hint}
            <pre class="mermaid-error-src">${escapeHtml(source)}</pre>
        </div>
    `;
}
