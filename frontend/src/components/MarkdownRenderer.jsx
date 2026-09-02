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
 */
function preprocessMermaid(source) {
    let result = source;

    // === 1. 边标签：-->|label| ===
    const arrowRe = /((?:-->|-->|==>|-.->|<-->|<==>|o--o|o==o)(?:>>)?)\|(?!")([^|]+)\|/g;
    result = result.replace(arrowRe, (match, arrow, label) => {
        const trimmed = label.trim();
        if (/^".*"$/.test(trimmed)) return match;
        if (trimmed.startsWith('"')) return match;
        if (!/[(){}\[\]\/\\#]/.test(label)) return match;
        if (label.includes('"')) {
            return `${arrow}|"${label.replace(/"/g, '&quot;')}"|`;
        }
        return `${arrow}|"${label}"|`;
    });

    // === 2. 节点标签：矩形 id[text] ===
    result = result.replace(
        /(\b[A-Za-z0-9_]+)\[([^\]]*)\]/g,
        (match, id, text) => {
            const trimmed = text.trim();
            if (/^".*"$/.test(trimmed)) return match;
            if (trimmed.startsWith('"')) return match;
            if (['subgraph', 'direction', 'classDef', 'style', 'class', 'linkStyle'].includes(id.toLowerCase())) return match;
            if (/^\[\(.*\)\]$/.test(text) || /^\{\{(.*)\}\}$/.test(text)) return match;
            if (/^\/.*\/$/.test(text) || /^\\.*\\$/.test(text)) return match;
            if (!/[#<>'"\{\}\[\]\(\)\/\\]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return match;
            const safe = text.includes('"') ? text.replace(/"/g, '&quot;') : text;
            return `${id}["${safe}"]`;
        }
    );

    // === 3. 节点标签：圆角 id(text) ===
    result = result.replace(
        /(\b[A-Za-z0-9_]+)\(([^)]*)\)/g,
        (match, id, text) => {
            const trimmed = text.trim();
            if (/^".*"$/.test(trimmed)) return match;
            if (trimmed.startsWith('"')) return match;
            if (['subgraph', 'direction', 'classDef', 'style', 'class', 'linkStyle'].includes(id.toLowerCase())) return match;
            if (text.startsWith('(') && text.endsWith(')')) return match;
            if (!/[#<>'"\{\}\[\]\(\)\/\\]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return match;
            const safe = text.includes('"') ? text.replace(/"/g, '&quot;') : text;
            return `${id}("${safe}")`;
        }
    );

    // === 4. 节点标签：菱形 id{text} ===
    result = result.replace(
        /(\b[A-Za-z0-9_]+)\{([^}]*)\}/g,
        (match, id, text) => {
            const trimmed = text.trim();
            if (/^".*"$/.test(trimmed)) return match;
            if (trimmed.startsWith('"')) return match;
            if (['subgraph', 'direction', 'classDef', 'style', 'class', 'linkStyle'].includes(id.toLowerCase())) return match;
            if (text.startsWith('{') && text.endsWith('}')) return match;
            if (!/[#<>'"\{\}\[\]\(\)\/\\]|<br\s*\/?>|&amp;|&lt;|&gt;/.test(text)) return match;
            const safe = text.includes('"') ? text.replace(/"/g, '&quot;') : text;
            return `${id}{"${safe}"}`;
        }
    );

    return result;
}

const MarkdownRenderer = ({ content, setAnchors, isDarkMode, isSideNavOpen }) => {
    const containerRef = useRef(null);
    const [highlightStyle, setHighlightStyle] = useState('okaidia');
    const [copyButtonText, setCopyButtonText] = useState('⎘');
    const mermaidCounter = useRef(0);

    // 全屏浮层状态：{ svg: string, width: number, height: number } | null
    const [fullscreenSvg, setFullscreenSvg] = useState(null);

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
    }, [content, setAnchors]);

    // 打开全屏：从已渲染的 .mermaid-block 取 SVG
    const openFullscreen = useCallback((e) => {
        const wrapper = e.currentTarget.closest('.mermaid-wrapper');
        if (!wrapper) return;
        const svgEl = wrapper.querySelector('.mermaid-block svg');
        if (!svgEl) return;
        const rect = svgEl.getBoundingClientRect();
        setFullscreenSvg({
            outerHTML: svgEl.outerHTML,
            width: rect.width,
            height: rect.height,
        });
    }, []);

    const closeFullscreen = useCallback(() => setFullscreenSvg(null), []);

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
                    // 表格：用 .table-wrapper 包裹，超出时容器内横向滚动
                    table: ({ ...props }) => (
                        <div className="table-wrapper">
                            <table {...props} />
                        </div>
                    ),
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1].toLowerCase() : '';
                        const codeStr = String(children).replace(/\n$/, '');

                        // mermaid 图表
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

            {/* 全屏浮层 */}
            {fullscreenSvg && (
                <MermaidFullscreen
                    svgData={fullscreenSvg}
                    onClose={closeFullscreen}
                />
            )}
        </div>
    );
};

/**
 * Mermaid 全屏查看组件：拖拽平移 + 滚轮缩放 + 工具栏按钮
 */
const MermaidFullscreen = ({ svgData, onClose }) => {
    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    // ESC 关闭
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z * 1.2, 10));
            else if (e.key === '-') setZoom(z => Math.max(z / 1.2, 0.1));
            else if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
        };
        document.addEventListener('keydown', handleKey);
        // 禁止背景滚动
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    // 滚轮缩放（以鼠标位置为中心）
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((prevZoom) => {
            const newZoom = Math.min(Math.max(prevZoom * delta, 0.1), 10);
            // 以鼠标位置为缩放中心调整 pan
            setPan((prevPan) => ({
                x: mx - (mx - prevPan.x) * (newZoom / prevZoom),
                y: my - (my - prevPan.y) * (newZoom / prevZoom),
            }));
            return newZoom;
        });
    }, []);

    // 拖拽平移
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }, [pan]);

    useEffect(() => {
        if (!isPanning) return;
        const handleMove = (e) => {
            setPan({
                x: panStart.current.panX + (e.clientX - panStart.current.x),
                y: panStart.current.panY + (e.clientY - panStart.current.y),
            });
        };
        const handleUp = () => setIsPanning(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isPanning]);

    // 触摸支持
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 1) {
            setIsPanning(true);
            const t = e.touches[0];
            panStart.current = { x: t.clientX, y: t.clientY, panX: pan.x, panY: pan.y };
        }
    }, [pan]);

    useEffect(() => {
        if (!isPanning) return;
        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                const t = e.touches[0];
                setPan({
                    x: panStart.current.panX + (t.clientX - panStart.current.x),
                    y: panStart.current.panY + (t.clientY - panStart.current.y),
                });
            }
        };
        const handleTouchEnd = () => setIsPanning(false);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPanning]);

    const zoomIn = () => setZoom(z => Math.min(z * 1.25, 10));
    const zoomOut = () => setZoom(z => Math.max(z / 1.25, 0.1));
    const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    return (
        <div className="mermaid-fullscreen-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="mermaid-fullscreen-toolbar">
                <span className="zoom-info">缩放: {Math.round(zoom * 100)}%  ·  ESC 关闭  ·  + / - 缩放  ·  0 重置  ·  鼠标拖动平移</span>
                <div className="mermaid-fullscreen-actions">
                    <button onClick={zoomOut} title="缩小 (-)">−</button>
                    <button onClick={reset} title="重置 (0)">重置</button>
                    <button onClick={zoomIn} title="放大 (+)">+</button>
                    <button className="close-btn" onClick={onClose} title="关闭 (ESC)">关闭</button>
                </div>
            </div>
            <div
                ref={canvasRef}
                className={`mermaid-fullscreen-canvas ${isPanning ? 'panning' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div
                    className="mermaid-fullscreen-svg"
                    style={{
                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                    }}
                    dangerouslySetInnerHTML={{ __html: svgData.outerHTML }}
                />
            </div>
        </div>
    );
};

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function renderMermaidError(source, errorMsg, lineNum) {
    const hint = errorMsg.includes('Parse error')
        ? `<div class="mermaid-hint">💡 提示: 节点/边标签中包含 ( ) [ ] { } / 等特殊字符时，请用双引号包裹标签文本，例如：<code>A -->|"标签文本"| B</code></div>`
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

export default memo(MarkdownRenderer);
