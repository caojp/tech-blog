/**
 * 内容加载层：开发用 Vite 虚拟模块，生产用 HTTP 运行时拉取。
 *
 * 开发模式 (npm run dev)：
 *   POSTS_DIR 由 .env.development 配置，虚拟模块在 build/dev 时打包所有 md。
 *
 * 生产模式 (npm run build + nginx)：
 *   不需要 build 机器上有 md 目录。
 *   nginx 配置 alias 指向服务器上的 md 目录，前端运行时通过 HTTP 拉取目录树和文件内容。
 *   环境变量 VITE_POSTS_URL 配置 nginx 拉取地址前缀，默认 /posts。
 */

const isProd = import.meta.env.PROD;
const POSTS_URL = import.meta.env.VITE_POSTS_URL || '/posts';

// ===== 开发模式：虚拟模块（Vite 在 production build 时会 tree-shake 掉这段） =====
let devData = { files: {}, tree: [] };
if (import.meta.env.DEV) {
    // @ts-ignore — virtual:posts 是 Vite 插件生成的虚拟模块，TS 不识别
    const mod = await import('virtual:posts');
    devData = mod.default;
}

// ===== 生产模式：HTTP 运行时拉取 =====
let cachedTree = null;

/**
 * 递归拉取 nginx autoindex JSON，构建目录树。
 * nginx 需要：autoindex on; autoindex_format json;
 */
async function buildTreeFromAutoindex(dirPath = '') {
    const url = dirPath ? `${POSTS_URL}/${dirPath}/` : `${POSTS_URL}/`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const entries = await res.json();

    const children = [];
    const dirPromises = [];

    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;

        if (entry.type === 'directory') {
            // 异步递归子目录
            dirPromises.push(
                buildTreeFromAutoindex(fullPath).then(subChildren => {
                    if (subChildren.length > 0) {
                        children.push({
                            name: entry.name,
                            path: fullPath,
                            is_dir: true,
                            children: subChildren,
                        });
                    }
                })
            );
        } else if (entry.name.endsWith('.md')) {
            children.push({
                name: entry.name,
                path: fullPath,
                is_dir: false,
            });
        }
    }

    await Promise.all(dirPromises);

    // 排序：目录在前，按 name 字母序
    children.sort((a, b) => {
        if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
        return a.name.localeCompare(b.name, 'zh-CN');
    });

    return children;
}

/**
 * 获取目录树。
 * @returns {Promise<{ status: string, data: Array }>}
 */
export const fetchCategories = async () => {
    if (isProd) {
        if (cachedTree) return { status: 'success', data: cachedTree };
        try {
            cachedTree = await buildTreeFromAutoindex();
            return { status: 'success', data: cachedTree };
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            return { status: 'error', data: [] };
        }
    } else {
        return { status: 'success', data: devData.tree };
    }
};

/**
 * 获取单个 md 文件内容。
 * @param {string} filePath - 相对路径，如 "golang/基础/post1.md"
 * @returns {Promise<{ status: string, data: string }>}
 */
export const fetchMarkdownContent = async (filePath) => {
    if (isProd) {
        try {
            const res = await fetch(`${POSTS_URL}/${filePath}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const content = await res.text();
            return { status: 'success', data: content };
        } catch (err) {
            console.error('Failed to fetch markdown:', err);
            return { status: 'error', data: '' };
        }
    } else {
        const content = devData.files[filePath];
        if (content === undefined) {
            throw new Error(`File not found: ${filePath}`);
        }
        return { status: 'success', data: content };
    }
};
