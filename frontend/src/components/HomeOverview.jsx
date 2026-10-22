// HomeOverview.jsx — 首页博客概览：统计 + 最近更新
import { memo, useEffect, useState } from 'react';
import { fetchFullIndex } from '../api/content';
import { buildBlogStats, getRecentArticles } from '../lib/stats';

const HomeOverview = ({ onNavigate }) => {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        let cancelled = false;
        fetchFullIndex()
            .then((index) => {
                if (cancelled) return;
                setStats(buildBlogStats(index));
                setRecent(getRecentArticles(index, 10));
            })
            .catch((err) => console.error('Failed to load overview:', err));
        return () => { cancelled = true; };
    }, []);

    const formatDate = (mtime) => {
        const d = new Date(mtime);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('zh-CN');
    };

    return (
        <section className="home-overview">
            {stats && (
                <div className="overview-stats">
                    <span>📄 文章 <b>{stats.articleCount}</b></span>
                    <span>📁 目录 <b>{stats.dirCount}</b></span>
                </div>
            )}
            {recent.length > 0 && (
                <div className="overview-recent">
                    <h2>最近更新</h2>
                    <ul>
                        {recent.map((a) => (
                            <li key={a.path}>
                                <button type="button" onClick={() => onNavigate(a.path, a.mtime)}>
                                    {a.name}
                                </button>
                                {a.mtime && <span className="overview-date">{formatDate(a.mtime)}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default memo(HomeOverview);
