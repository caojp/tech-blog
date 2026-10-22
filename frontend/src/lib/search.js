// src/lib/search.js — 文章标题/路径匹配（纯函数，便于单测）
//
// 评分规则（从高到低）：
//  100  文件名以关键词开头
//   80  文件名包含关键词
//   70  路径某段目录名包含关键词
//   60  完整路径包含关键词
// 返回按分数降序（同分按路径字典序）的文章列表，最多 100 条。

export function searchArticles(articles, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];

    const results = [];
    for (const article of articles) {
        const path = article.path || '';
        const name = (path.split('/').pop() || '').replace(/\.md$/i, '');
        const pathLower = path.toLowerCase();
        const nameLower = name.toLowerCase();

        let score = 0;
        if (nameLower.startsWith(q)) {
            score = 100;
        } else if (nameLower.includes(q)) {
            score = 80;
        } else if (pathLower.split('/').some((seg) => seg.includes(q))) {
            score = 70;
        } else if (pathLower.includes(q)) {
            score = 60;
        }
        if (score > 0) {
            results.push({ ...article, name, score });
        }
    }

    results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path, 'zh-CN'));
    return results.slice(0, 100);
}
