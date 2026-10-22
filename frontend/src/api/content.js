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
export const POSTS_URL = import.meta.env.VITE_POSTS_URL || '/posts';

// ===== 开发模式：虚拟模块（Vite 在 production build 时会 tree-shake 掉这段） =====
let devData = { files: {}, tree: [] };
if (import.meta.env.DEV) {
    // @ts-ignore — virtual:posts 是 Vite 插件生成的虚拟模块，TS 不识别
    const mod = await import('virtual:posts');
    devData = mod.default;
}

// ===== 生产模式：HTTP 运行时拉取 =====
// 按需懒加载：只缓存"已拉取过"的目录子节点，展开时再拉，
// 避免一次性递归请求 345 个目录（原来页面初始化要发数百个请求）。
let dirCache = new Map();

// 文章内容缓存：同一篇文章在会话内只拉取一次（笔记可能被编辑，刷新页面即重新拉取）
const contentCache = new Map();

/**
 * 对相对路径逐段做 URL 编码。
 * 目录/文件名可能含 `#`、`?`、空格、中文等字符：
 * `#` 会被当作 URL fragment、`?` 会被当作 query，导致请求被截断、目录丢失。
 */
export function encodePath(pathStr) {
    return pathStr.split('/').map(encodeURIComponent).join('/');
}

/**
 * 拉取单个目录的条目列表（nginx autoindex JSON）。
 *
 * 容错策略：单个目录的失败不能拖垮整棵目录树。
 * 典型场景：目录内存在 index.html 时，nginx 的 index 指令会直接返回该 HTML 文件
 * 而不是 autoindex JSON（其他静态服务器也可能返回 HTML 目录页），
 * 此时 JSON 解析失败，跳过该目录即可，不影响其余目录。
 */
async function fetchDirEntries(dirPath = '') {
    const url = dirPath ? `${POSTS_URL}/${encodePath(dirPath)}/` : `${POSTS_URL}/`;
    try {
        // 8 秒超时，避免单个目录卡死整个目录树构建
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        let res;
        try {
            res = await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }
        if (!res.ok) return [];

        try {
            const entries = await res.json();
            return Array.isArray(entries) ? entries : [];
        } catch {
            // 服务器返回了非 JSON 内容（如 HTML 目录页 / index.html 文件）
            console.warn(`[content] 目录列表非 JSON，已跳过: ${url}`);
            return [];
        }
    } catch (err) {
        console.warn(`[content] 拉取目录列表失败，已跳过: ${url}`, err);
        return [];
    }
}

/**
 * 把 autoindex 原始条目转为树节点：
 * 目录 → children: null（未加载，展开时再拉）；md 文件 → 叶子节点。
 */
function buildChildNodes(entries, parentPath) {
    const children = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
        if (entry.type === 'directory') {
            children.push({
                name: entry.name,
                path: fullPath,
                is_dir: true,
                children: null, // 懒加载标记：展开时通过 fetchCategoryChildren 拉取
            });
        } else if (entry.name.endsWith('.md')) {
            children.push({
                name: entry.name,
                path: fullPath,
                is_dir: false,
                // autoindex 的 mtime 可用于展示文章修改日期；dev 模式无此字段
                mtime: entry.mtime || null,
            });
        }
    }

    // 排序：目录在前，按 name 字母序
    children.sort((a, b) => {
        if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
        return a.name.localeCompare(b.name, 'zh-CN');
    });

    return children;
}

/**
 * 拉取并缓存某个目录的直接子节点（按需懒加载，带缓存）。
 * 生产模式：HTTP autoindex；dev 模式：直接读已打包的全量树（虚拟模块），零请求。
 */
async function fetchDirChildren(dirPath = '') {
    if (dirCache.has(dirPath)) return dirCache.get(dirPath);
    if (isProd) {
        const entries = await fetchDirEntries(dirPath);
        const nodes = buildChildNodes(entries, dirPath);
        dirCache.set(dirPath, nodes);
        return nodes;
    }
    // dev：从虚拟模块全量树按路径取（树在启动时已构建好）；根目录直接返回整棵树
    let nodes = [];
    if (!dirPath) {
        nodes = devData.tree;
    } else {
        const node = findNodeByPath(devData.tree, dirPath);
        nodes = node && Array.isArray(node.children) ? node.children : [];
    }
    dirCache.set(dirPath, nodes);
    return nodes;
}

/**
 * 获取目录树（懒加载顶层）。
 * @returns {Promise<{ status: string, data: Array }>}
 */
export const fetchCategories = async () => {
    if (isProd) {
        try {
            const data = await fetchDirChildren('');
            return { status: 'success', data };
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            return { status: 'error', data: [] };
        }
    } else {
        return { status: 'success', data: devData.tree };
    }
};

/**
 * 按需懒加载：获取指定目录的直接子节点（选中分类 / 展开文件夹时调用）。
 * @param {string} dirPath - 目录相对路径，如 "Go/GoAdvanced"
 * @returns {Promise<{ status: string, data: Array }>}
 */
export const fetchCategoryChildren = async (dirPath) => {
    if (isProd) {
        try {
            const data = await fetchDirChildren(dirPath);
            return { status: 'success', data };
        } catch (err) {
            console.error(`Failed to fetch children of ${dirPath}:`, err);
            return { status: 'error', data: [] };
        }
    } else {
        // dev 模式树已全量打包，直接在虚拟模块的树里查找
        const node = findNodeByPath(devData.tree, dirPath);
        return { status: 'success', data: node && Array.isArray(node.children) ? node.children : [] };
    }
};

// dev 模式辅助：在已打包的全量树中按路径查找节点
function findNodeByPath(nodes, dirPath) {
    for (const n of nodes) {
        if (n.path === dirPath) return n;
        if (n.is_dir && Array.isArray(n.children)) {
            const found = findNodeByPath(n.children, dirPath);
            if (found) return found;
        }
    }
    return null;
}

/**
 * 按需构建全量文章索引（用于标签页 / 归档）。
 * 复用 fetchDirChildren 的逐目录拉取与 dirCache 缓存：
 * 首次调用会遍历全部目录（一次性、约几百个请求），之后全部走缓存。
 * @returns {Promise<Array<{ path: string, mtime: string|null }>>}
 */
let fullIndexPromise = null;
export const fetchFullIndex = async () => {
    if (fullIndexPromise) return fullIndexPromise;
    fullIndexPromise = (async () => {
        const root = await fetchDirChildren('');
        const walk = async (dirPath) => {
            const nodes = await fetchDirChildren(dirPath);
            const subResults = await Promise.all(
                nodes.filter((n) => n.is_dir).map((n) => walk(n.path))
            );
            const files = nodes
                .filter((n) => !n.is_dir)
                .map((n) => ({ path: n.path, mtime: n.mtime || null }));
            return subResults.flat().concat(files);
        };
        const articles = [];
        for (const n of root) {
            if (n.is_dir) articles.push(...await walk(n.path));
            else articles.push({ path: n.path, mtime: n.mtime || null });
        }
        articles.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));
        return articles;
    })().catch((err) => {
        fullIndexPromise = null; // 失败后允许重试
        throw err;
    });
    return fullIndexPromise;
};

/**
 * 从文章相对路径提取标签 = 路径的目录链。
 * 例：'Go/GoAdvanced/框架/gin/README.md' → ['Go', 'GoAdvanced', '框架', 'gin']
 */
export const getTagsForPath = (path) => {
    if (!path) return [];
    const parts = path.split('/');
    parts.pop(); // 去掉文件名
    return parts.filter(Boolean);
};

/**
 * 获取单个 md 文件内容（带会话内缓存）。
 * @param {string} filePath - 相对路径，如 "golang/基础/post1.md"
 * @returns {Promise<{ status: string, data: string }>}
 * 错误处理：失败时 throw 带 status 属性的 Error，由调用方细分提示——
 *   err.name === 'AbortError' → 超时；err.status === 404 → 文章不存在；
 *   其他 → 网络/服务错误。
 */
export const fetchMarkdownContent = async (filePath) => {
    if (isProd) {
        const cached = contentCache.get(filePath);
        if (cached !== undefined) return { status: 'success', data: cached };

        // 15 秒超时，避免单个文章请求卡住页面
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        let res;
        try {
            res = await fetch(`${POSTS_URL}/${encodePath(filePath)}`, { signal: controller.signal });
        } finally {
            clearTimeout(timer);
        }

        if (res.status === 404) {
            const err = new Error(`文章不存在 (404): ${filePath}`);
            err.status = 404;
            throw err;
        }
        if (!res.ok) {
            const err = new Error(`HTTP ${res.status}: ${filePath}`);
            err.status = res.status;
            throw err;
        }
        const content = await res.text();
        contentCache.set(filePath, content);
        return { status: 'success', data: content };
    } else {
        const content = devData.files[filePath];
        if (content === undefined) {
            const err = new Error(`File not found: ${filePath}`);
            err.status = 404;
            throw err;
        }
        return { status: 'success', data: content };
    }
};
