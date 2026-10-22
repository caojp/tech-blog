// ArticleMeta.jsx — 文章元信息：修改日期、字数、预计阅读时长、标签
import { memo } from 'react';
import { getTagsForPath } from '../api/content';

// 统计字数：中文按字、英文/数字按词
function countWords(content) {
    const text = content || '';
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latin = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || []).length;
    return cjk + latin;
}

function formatDate(mtime) {
    if (!mtime) return '';
    const d = new Date(mtime);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

const ArticleMeta = ({ path, mtime, content }) => {
    const words = countWords(content);
    const minutes = Math.max(1, Math.round(words / 300));
    const date = formatDate(mtime);
    const tags = getTagsForPath(path);

    return (
        <div className="article-meta">
            <div className="article-meta-stats">
                {date && <span className="article-meta-item">{date}</span>}
                <span className="article-meta-item">{words.toLocaleString()} 字</span>
                <span className="article-meta-item">约 {minutes} 分钟</span>
            </div>
            {tags.length > 0 && (
                <div className="article-tags">
                    {tags.map((tag) => (
                        <span key={tag} className="article-tag">{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(ArticleMeta);
