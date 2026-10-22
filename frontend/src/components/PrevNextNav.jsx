// PrevNextNav.jsx — 文章底部 上一篇 / 下一篇
import { memo, useEffect, useState } from 'react';
import { fetchFullIndex } from '../api/content';
import { getPrevNext } from '../lib/nav';

const PrevNextNav = ({ currentPath, onNavigate }) => {
    const [nav, setNav] = useState({ prev: null, next: null });

    useEffect(() => {
        let cancelled = false;
        fetchFullIndex()
            .then((index) => {
                if (!cancelled) setNav(getPrevNext(index, currentPath));
            })
            .catch((err) => console.error('Failed to load prev/next:', err));
        return () => { cancelled = true; };
    }, [currentPath]);

    const item = (dir, data) => data && (
        <button type="button" className={`prevnext-btn ${dir}`} onClick={() => onNavigate(data.path, data.mtime)}>
            <span className="prevnext-label">{dir === 'prev' ? '← 上一篇' : '下一篇 →'}</span>
            <span className="prevnext-title">{data.name}</span>
        </button>
    );

    if (!nav.prev && !nav.next) return null;
    return (
        <nav className="prevnext-nav" aria-label="文章导航">
            {item('prev', nav.prev)}
            {item('next', nav.next)}
        </nav>
    );
};

export default memo(PrevNextNav);
