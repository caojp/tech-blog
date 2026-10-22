// src/lib/nav.js — 上一篇 / 下一篇（纯函数，便于单测）
//
// 顺序 = 全量索引的排序（路径字典序），与侧栏展示顺序一致。
// @returns { prev: {path, mtime, name} | null, next: ... }

export function articleName(path) {
    if (!path) return '';
    return (path.split('/').pop() || '').replace(/\.md$/i, '');
}

export function getPrevNext(index, currentPath) {
    if (!index || !currentPath) return { prev: null, next: null };
    const i = index.findIndex((a) => a.path === currentPath);
    if (i === -1) return { prev: null, next: null };
    const wrap = (item) => (item ? { path: item.path, mtime: item.mtime || null, name: articleName(item.path) } : null);
    return {
        prev: i > 0 ? wrap(index[i - 1]) : null,
        next: i < index.length - 1 ? wrap(index[i + 1]) : null,
    };
}
