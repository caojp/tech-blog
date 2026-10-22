// GiscusComments.jsx — 基于 GitHub Discussions 的评论组件（零后端）
//
// ⚠️ 使用前必须配置（只需一次）：
//   1. 确保 aldus-blog 仓库公开，并在仓库 Settings → General → Features 里开启 Discussions；
//   2. 打开 https://giscus.app ，选择仓库并按指引生成配置；
//   3. 把生成结果里的 repo / repoId / category / categoryId 四个值填到下面的 GISCUS_CONFIG。
//   未配置时组件不渲染评论，只会在控制台打一条警告，不影响页面。
import { memo, useEffect, useRef } from 'react';

const GISCUS_CONFIG = {
    repo: '',        // 例如 'caojp/aldus-blog'
    repoId: '',      // 例如 'R_kgDOxxxxxx'
    category: '',    // 例如 'General'
    categoryId: '',  // 例如 'DIC_kwDOxxxxxx'
};

const GiscusComments = ({ filePath, isDarkMode }) => {
    const containerRef = useRef(null);
    const theme = isDarkMode ? 'dark' : 'light';

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        // 清空旧实例（主题切换时会重建）
        container.innerHTML = '';

        const { repo, repoId, category, categoryId } = GISCUS_CONFIG;
        if (!repo || !repoId || !category || !categoryId) {
            console.warn('[Giscus] 尚未配置评论（repo/repoId/category/categoryId），请按 GiscusComments.jsx 顶部说明填写');
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.setAttribute('data-repo', repo);
        script.setAttribute('data-repo-id', repoId);
        script.setAttribute('data-category', category);
        script.setAttribute('data-category-id', categoryId);
        // 每篇文章一个独立讨论串：mapping=specific + term=文章路径
        script.setAttribute('data-mapping', 'specific');
        script.setAttribute('data-term', filePath || '');
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'bottom');
        script.setAttribute('data-theme', theme);
        script.setAttribute('data-lang', 'zh-CN');
        container.appendChild(script);
    }, [filePath, theme]);

    return <div className="giscus-comments" ref={containerRef} />;
};

export default memo(GiscusComments);
