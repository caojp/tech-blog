// src/lib/stats.js — 博客概览统计（纯函数，便于单测）
import { articleName } from './nav.js';

// 文章总数 / 目录总数
export function buildBlogStats(index) {
    const dirs = new Set();
    for (const a of index || []) {
        const parts = a.path.split('/');
        parts.pop(); // 去掉文件名
        let acc = '';
        for (const seg of parts) {
            acc = acc ? `${acc}/${seg}` : seg;
            dirs.add(acc);
        }
    }
    return { articleCount: (index || []).length, dirCount: dirs.size };
}

// 最近更新的 N 篇文章（按 mtime 降序；无 mtime 的排最后）
export function getRecentArticles(index, n = 10) {
    const withMtime = (index || [])
        .filter((a) => a.mtime)
        .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    const rest = (index || []).filter((a) => !a.mtime);
    const merged = withMtime.concat(rest);
    return merged.slice(0, n).map((a) => ({
        path: a.path,
        mtime: a.mtime || null,
        name: articleName(a.path),
    }));
}
