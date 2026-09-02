/**
 * 纯前端内容加载：import Vite 虚拟模块 virtual:posts
 *
 * virtual:posts 由 vite.config.js 中的 postsPlugin 在 build/dev 时生成，
 * 包含 POSTS_DIR 下所有 md 文件的内容 + 目录树。
 * POSTS_DIR 在 .env.development / .env.production 中配置。
 */
import postsData from 'virtual:posts';

const { files, tree } = postsData;

/**
 * 获取目录树。模拟 GET /api/content 返回格式：
 *   { status: 'success', data: FileNode[] }
 */
export const fetchCategories = async () => {
    return { status: 'success', data: tree };
};

/**
 * 获取单个 md 文件内容。模拟 POST /api/markdown 返回格式：
 *   { status: 'success', data: 'markdown 原文' }
 */
export const fetchMarkdownContent = async (filePath) => {
    const content = files[filePath];
    if (content === undefined) {
        throw new Error(`File not found: ${filePath}`);
    }
    return { status: 'success', data: content };
};
