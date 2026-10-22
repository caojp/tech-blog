// SearchPage.jsx — 标题/路径搜索
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFullIndex } from '../api/content';
import { searchArticles } from '../lib/search';
import '../styles/SearchPage.css';

const SearchPage = () => {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [articles, setArticles] = useState(null); // null = 索引加载中
    const [error, setError] = useState(null);

    // 首次进入时构建全量索引（复用懒加载缓存，之后进入零请求）
    useEffect(() => {
        let cancelled = false;
        fetchFullIndex()
            .then((list) => { if (!cancelled) setArticles(list); })
            .catch((err) => {
                console.error('Failed to fetch index for search:', err);
                if (!cancelled) setError('搜索索引加载失败，请稍后重试。');
            });
        return () => { cancelled = true; };
    }, []);

    // 输入防抖 200ms 后匹配
    useEffect(() => {
        const timer = setTimeout(() => setQuery(query.trim()), 200);
        return () => clearTimeout(timer);
    }, [query]);

    const results = useMemo(
        () => (articles && query ? searchArticles(articles, query) : []),
        [articles, query]
    );

    const handleArticleClick = (path) => {
        navigate(`/?path=${encodeURIComponent(path)}`);
    };

    const breadcrumb = (path) => {
        const parts = path.split('/');
        parts.pop();
        return parts.join(' / ');
    };

    return (
        <div className="search-page">
            <div className="search-page-header">
                <a href="/" className="search-page-home" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← 返回首页</a>
                <h1>搜索</h1>
            </div>

            <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="输入关键词，搜索文章标题或目录…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />

            {error && <div className="status-message error">{error}</div>}
            {!articles && !error && <div className="status-message">正在构建搜索索引...</div>}
            {articles && query && results.length === 0 && (
                <div className="status-message">没有匹配「{query}」的文章</div>
            )}
            {articles && query && results.length > 0 && (
                <div className="search-results">
                    <div className="search-result-count">找到 {results.length} 篇文章</div>
                    <ul>
                        {results.map((r) => (
                            <li key={r.path}>
                                <button type="button" onClick={() => handleArticleClick(r.path)}>
                                    {r.name}
                                </button>
                                <span className="search-result-path">{breadcrumb(r.path)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
