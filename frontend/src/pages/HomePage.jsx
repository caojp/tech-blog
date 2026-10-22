import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ReadingProgressBar from '../components/ReadingProgressBar';
import {fetchCategories, fetchCategoryChildren, fetchMarkdownContent} from '../api/content';
import SideNav from '../components/SideNav';
import TableOfContents from '../components/TableOfContents.jsx';

// 全屏查看 Mermaid 属低频操作，按需加载
const MermaidFullscreen = lazy(() => import('../components/MermaidFullscreen'));

const THEME_STORAGE_KEY = 'aldusblog-theme';
const EYE_CARE_STORAGE_KEY = 'aldusblog-eye-care';
const SIDENAV_STORAGE_KEY = 'aldusblog-side-nav-open';

// getInitialTheme 读取本地保存的主题偏好，无保存时跟随系统偏好。
const getInitialTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// getInitialEyeCare 读取本地保存的护眼模式偏好，默认关闭。
const getInitialEyeCare = () => {
    return localStorage.getItem(EYE_CARE_STORAGE_KEY) === 'true';
};

// getInitialSideNav 读取本地保存的侧栏开合状态，无保存时按屏幕宽度。
const getInitialSideNav = () => {
    const saved = localStorage.getItem(SIDENAV_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
    return window.innerWidth > 768;
};

const HomePage = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [content, setContent] = useState('');
    // 这两个 state 当前仅记录选中项（setter 被调用），值预留给后续高亮功能，暂不读取。
    const [, setActiveCategory] = useState(null);
    const [, setActiveFile] = useState(null);
    const [anchors, setAnchors] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
    const [isEyeCareMode, setIsEyeCareMode] = useState(getInitialEyeCare);
    const [isSideNavOpen, setIsSideNavOpen] = useState(getInitialSideNav);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fullscreenSvg, setFullscreenSvg] = useState(null);
    // 当前文章：路径（用于相对图片/评论锚点）+ 修改日期（autoindex mtime，深链打开时无）
    const [currentPath, setCurrentPath] = useState(null);
    const [currentMtime, setCurrentMtime] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    // 防竞态：连续快速切换分类时，只采用最后一次请求的结果
    const navReqIdRef = useRef(0);

    // loadMarkdown 加载指定文章内容，统一管理 loading / error 状态。
    const loadMarkdown = useCallback(async (filePath) => {
        setLoading(true);
        setError(null);
        try {
            const markdownContent = await fetchMarkdownContent(filePath);
            setContent(markdownContent.data);
            setCurrentPath(filePath);
        } catch (err) {
            console.error('Failed to fetch markdown content:', err);
            // 错误细分：超时 / 404 / HTTP 状态码 / 其他网络问题
            if (err && err.name === 'AbortError') {
                setError('文章加载超时，请稍后重试。');
            } else if (err && err.status === 404) {
                setError('文章不存在或已被移动。');
            } else if (err && err.status) {
                setError(`文章加载失败（HTTP ${err.status}）。`);
            } else {
                setError('文章加载失败，请检查网络或服务是否运行。');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchCategories();
                if (response.status === 'success') {
                    setCategories(response.data);
                    // 优先从 URL 恢复上次阅读的文章，否则展示首页 index.md
                    const pathFromUrl = searchParams.get('path');
                    const target = pathFromUrl
                        ? { path: pathFromUrl }
                        : response.data.find(category => !category.is_dir);
                    if (target && target.path) {
                        await loadMarkdown(target.path);
                    }
                } else {
                    setError('初始化失败，请稍后重试。');
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
                setError('目录加载失败，请稍后重试。');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // 仅在挂载时执行：URL 变化不应触发重新拉取目录树。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 应用主题到 body 并持久化到 localStorage。
    useEffect(() => {
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(isDarkMode ? 'dark-mode' : 'light-mode');
        localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // 应用护眼模式到 body 并持久化。
    useEffect(() => {
        if (isEyeCareMode) {
            document.body.classList.add('eye-care-mode');
        } else {
            document.body.classList.remove('eye-care-mode');
        }
        localStorage.setItem(EYE_CARE_STORAGE_KEY, String(isEyeCareMode));
    }, [isEyeCareMode]);

    // 选中分类：生产模式按需拉取该分类的子节点（懒加载），dev 模式直接用已打包的树
    const handleCategorySelect = useCallback(async (category) => {
        setActiveCategory(category);
        setActiveFile(null);
        const reqId = ++navReqIdRef.current;

        let children = Array.isArray(category.children) ? category.children : null;
        if (children === null) {
            const res = await fetchCategoryChildren(category.path);
            if (reqId !== navReqIdRef.current) return; // 已被更新的选择覆盖
            children = res.data;
            // 回写 categories，避免再次选中同一分类时重复请求
            setCategories(prev => prev.map(c => c.path === category.path ? { ...c, children } : c));
        }
        setSubcategories(children);
    }, []);

    const handleFileSelect = useCallback((file) => {
        setActiveFile(file);
        if (file.path.endsWith('.md')) {
            // 将文章路径写入 URL，支持刷新恢复与链接分享。
            // 必须用 encodeURIComponent 字符串形式：URLSearchParams 对象形式会把 `+` 解码为空格，
            // 导致文件名含 `+`（如 "MySQL 索引原理B+树.md"）的文章 404。
            setSearchParams(`?path=${encodeURIComponent(file.path)}`, { replace: true });
            setCurrentMtime(file.mtime || null);
            loadMarkdown(file.path);
        }
    }, [setSearchParams, loadMarkdown]);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    const toggleEyeCare = useCallback(() => {
        setIsEyeCareMode(prev => !prev);
    }, []);

    const toggleSideNav = useCallback(() => {
        setIsSideNavOpen(prev => {
            const next = !prev;
            localStorage.setItem(SIDENAV_STORAGE_KEY, String(next));
            return next;
        });
    }, []);

    // 从 上一篇/下一篇、首页最近更新 跳转文章：更新 URL + mtime + 内容
    const handleArticleNavigate = useCallback((filePath, mtime) => {
        setSearchParams(`?path=${encodeURIComponent(filePath)}`, { replace: true });
        setCurrentMtime(mtime || null);
        loadMarkdown(filePath);
    }, [setSearchParams, loadMarkdown]);

    // 是否首页（根级 readme/index）：显示博客概览
    const isHomeArticle = currentPath && !currentPath.includes('/');

    // 全屏 Mermaid 回调
    const handleOpenFullscreen = useCallback((svgData) => {
        setFullscreenSvg(svgData);
    }, []);

    const handleCloseFullscreen = useCallback(() => {
        setFullscreenSvg(null);
    }, []);

    return (
        <div className={`home-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <TopNav
                categories={categories}
                onCategorySelect={handleCategorySelect}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                isEyeCareMode={isEyeCareMode}
                toggleEyeCare={toggleEyeCare}
                isSideNavOpen={isSideNavOpen}
                toggleSideNav={toggleSideNav}
            />

            <div className="main-content">
                    <SideNav
                        subcategories={subcategories}
                        onFileSelect={handleFileSelect}
                        isDarkMode={isDarkMode}
                        toggleSideNav={toggleSideNav}
                        isSideNavOpen={isSideNavOpen}
                        onLoadChildren={fetchCategoryChildren}
                    />

                {loading && <div className="status-message">加载中...</div>}
                {error && <div className="status-message error">{error}</div>}
                {content && !loading && !error && (
                    <>
                        <ReadingProgressBar key={currentPath} />
                        <MarkdownRenderer
                            content={content}
                            setAnchors={setAnchors}
                            isDarkMode={isDarkMode}
                            isSideNavOpen={isSideNavOpen}
                            onOpenFullscreen={handleOpenFullscreen}
                            filePath={currentPath}
                            mtime={currentMtime}
                            onNavigate={handleArticleNavigate}
                            showOverview={isHomeArticle}
                        />
                        <TableOfContents anchors={anchors} isDarkMode={isDarkMode}/>
                    </>
                )}
            </div>

            {fullscreenSvg && createPortal(
                <Suspense fallback={null}>
                    <MermaidFullscreen
                        svgData={fullscreenSvg}
                        onClose={handleCloseFullscreen}
                        isDarkMode={isDarkMode}
                    />
                </Suspense>,
                document.body
            )}
        </div>
    );
};

export default HomePage;
