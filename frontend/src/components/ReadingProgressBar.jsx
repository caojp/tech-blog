// ReadingProgressBar.jsx — 顶部阅读进度条
import { memo, useEffect, useState } from 'react';

const ReadingProgressBar = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            const doc = document.documentElement;
            const total = doc.scrollHeight - window.innerHeight;
            if (total <= 0) return 0;
            return Math.min(100, Math.max(0, (window.scrollY / total) * 100));
        };
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setProgress(update()));
        };
        // 文章内容变化（高度变化）后也要重算
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            cancelAnimationFrame(raf);
        };
    }, []);

    return <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden="true" />;
};

export default memo(ReadingProgressBar);
