// TagPage.jsx — 标签云 + 按标签筛选文章
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchFullIndex, getTagsForPath } from '../api/content';
import '../styles/TagPage.css';

const TagPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState(null); // null = 加载中
    const [error, setError] = useState(null);
    const selectedTag = searchParams.get('tag') || '';

    useEffect(() => {
        let cancelled = false;
        fetchFullIndex()
            .then((list) => {
                if (!cancelled) setArticles(list);
            })
            .catch((err) => {
                console.error('Failed to fetch full index:', err);
                if (!cancelled) setError('标签索引加载失败，请稍后重试。');
            });
        return () => { cancelled = true; };
    }, []);

    // 标签 -> 文章数
    const tagCounts = useMemo(() => {
        const map = new Map();
        for (const a of articles || []) {
            for (const tag of getTagsForPath(a.path)) {
                map.set(tag, (map.get(tag) || 0) + 1);
            }
        }
        return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
    }, [articles]);

    // 选中标签下的文章
    const filtered = useMemo(() => {
        if (!selectedTag || !articles) return [];
        return articles.filter((a) => getTagsForPath(a.path).includes(selectedTag));
    }, [selectedTag, articles]);

    const articleName = (path) => {
        const name = path.split('/').pop() || path;
        return name.replace(/\.md$/i, '');
    };

    const handleTagClick = (tag) => {
        setSearchParams(tag ? { tag } : {}, { replace: true });
    };

    const handleArticleClick = (path) => {
        navigate(`/?path=${encodeURIComponent(path)}`);
    };

    return (
        <div className="tag-page">
            <div className="tag-page-header">
                <a href="/" className="tag-page-home" onClick={(e) => { e.preventDefault(); navigate('/'); }}>← 返回首页</a>
                <h1>标签</h1>
            </div>

            {error && <div className="status-message error">{error}</div>}
            {!articles && !error && <div className="status-message">标签索引加载中...</div>}

            {articles && (
                <>
                    <div className="tag-cloud">
                        <button
                            type="button"
                            className={`tag-chip ${!selectedTag ? 'active' : ''}`}
                            onClick={() => handleTagClick('')}
                        >
                            全部 <span className="tag-count">{articles.length}</span>
                        </button>
                        {tagCounts.map(([tag, count]) => (
                            <button
                                key={tag}
                                type="button"
                                className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                                onClick={() => handleTagClick(tag)}
                            >
                                {tag} <span className="tag-count">{count}</span>
                            </button>
                        ))}
                    </div>

                    {selectedTag && (
                        <div className="tag-article-list">
                            <h2>「{selectedTag}」下的文章（{filtered.length}）</h2>
                            <ul>
                                {filtered.map((a) => (
                                    <li key={a.path}>
                                        <button type="button" onClick={() => handleArticleClick(a.path)}>
                                            {articleName(a.path)}
                                        </button>
                                        <span className="tag-article-path">{a.path}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TagPage;
