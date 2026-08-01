import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopNav from '../components/TopNav';
import MarkdownRenderer from '../components/MarkdownRenderer';
import {fetchCategories, fetchMarkdownContent} from '../api/content';
import SideNav from '../components/SideNav';
import TableOfContents from '../components/TableOfContents.jsx';

const THEME_STORAGE_KEY = 'tech-blog-theme';

// getInitialTheme 读取本地保存的主题偏好，无保存时跟随系统偏好。
const getInitialTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // loadMarkdown 加载指定文章内容，统一管理 loading / error 状态。
    const loadMarkdown = useCallback(async (filePath) => {
        setLoading(true);
        setError(null);
        try {
            const markdownContent = await fetchMarkdownContent(filePath);
            setContent(markdownContent.data);
        } catch (err) {
            console.error('Failed to fetch markdown content:', err);
            setError('文章加载失败，请稍后重试。');
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

    const handleCategorySelect = useCallback((category) => {
        setActiveCategory(category);
        setSubcategories(category.children || []);
        setActiveFile(null);
    }, []);

    const handleFileSelect = useCallback((file) => {
        setActiveFile(file);
        if (file.path.endsWith('.md')) {
            // 将文章路径写入 URL，支持刷新恢复与链接分享。
            setSearchParams({ path: file.path }, { replace: true });
            loadMarkdown(file.path);
        }
    }, [setSearchParams, loadMarkdown]);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    const toggleSideNav = useCallback(() => {
        setIsSideNavOpen(prev => !prev);
    }, []);

    return (
        <div className={`home-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <TopNav
                categories={categories}
                onCategorySelect={handleCategorySelect}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                isSideNavOpen={isSideNavOpen}
                toggleSideNav={toggleSideNav}
            />

            <div className="main-content">
                {isSideNavOpen && (
                    <SideNav
                        subcategories={subcategories}
                        onFileSelect={handleFileSelect}
                        isDarkMode={isDarkMode}
                        toggleSideNav={toggleSideNav}
                    />
                )}

                {loading && <div className="status-message">加载中...</div>}
                {error && <div className="status-message error">{error}</div>}
                {content && !loading && !error && (
                    <>
                        <MarkdownRenderer
                            content={content}
                            setAnchors={setAnchors}
                            isDarkMode={isDarkMode}
                            isSideNavOpen={isSideNavOpen}
                        />
                        <TableOfContents anchors={anchors} isDarkMode={isDarkMode}/>
                    </>
                )}
            </div>
        </div>
    );
};

export default HomePage;
