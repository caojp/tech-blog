// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite 虚拟模块插件：扫描 POSTS_DIR，把所有 md 文件打包成一个 JS 模块。
 *
 * 为什么不用 import.meta.glob？
 *   glob + alias 对项目外部目录不太行——Vite 会生成超长相对路径导致解析失败。
 *   虚拟模块直接用 Node.js fs 同步扫描 + 读取，绕过所有路径解析问题。
 *
 * 为什么要同步读取所有 md？
 *   个人博客内容量小（KB~MB 级），build 时一次性读入最简单，运行时零开销。
 *   换得的好处：posts 目录可以放在任意位置（甚至完全在项目外），.env 改一行就行。
 */
function postsPlugin(postsAbsPath) {
  const VIRTUAL_ID = 'virtual:posts';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;

  /**
   * 递归扫描目录，返回 { files: Map<相对路径, 内容字符串>, tree: FileNode[] }
   */
  function scanDir(dir, baseDir) {
    const files = new Map();
    const children = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue; // 跳过隐藏文件
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const sub = scanDir(fullPath, baseDir);
        for (const [k, v] of sub.files) files.set(k, v);
        // 只有子目录里有 md 文件才把目录加进树
        if (sub.files.size > 0) {
          children.push({
            name: entry.name,
            path: path.relative(baseDir, fullPath).split(path.sep).join('/'),
            is_dir: true,
            children: sub.tree,
          });
        }
      } else if (entry.name.endsWith('.md')) {
        const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/');
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.set(relPath, content);
        children.push({
          name: entry.name,
          path: relPath,
          is_dir: false,
        });
      }
    }

    // 排序：目录在前，按 name 字母序
    children.sort((a, b) => {
      if (a.is_dir !== b.is_dir) return a.is_dir ? -1 : 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });

    return { files, tree: children };
  }

  return {
    name: 'posts-plugin',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;

      if (!fs.existsSync(postsAbsPath)) {
        console.warn(`[posts-plugin] 目录不存在: ${postsAbsPath}`);
        return `export default { files: {}, tree: [] };`;
      }

      console.log(`[posts-plugin] 扫描目录: ${postsAbsPath}`);
      const { files, tree } = scanDir(postsAbsPath, postsAbsPath);
      console.log(`[posts-plugin] 找到 ${files.size} 个 md 文件`);

      // 生成 JS 代码：把 files 的所有值做 JSON.stringify 嵌入
      // 用 JSON.stringify 自动处理中文、转义、换行
      const filesObj = {};
      for (const [k, v] of files) filesObj[k] = v;

      return `
// 这个模块由 vite posts-plugin 在 build/dev 时自动生成
// 不要手动编辑
export default {
  files: ${JSON.stringify(filesObj)},
  tree: ${JSON.stringify(tree)},
};
`;
    },
    // dev 模式下监听 posts 目录变化，自动热更新
    configureServer(server) {
      server.watcher.add(postsAbsPath);
      server.watcher.on('all', (event, filePath) => {
        if (filePath && filePath.endsWith('.md')) {
          console.log(`[posts-plugin] 文件变化 (${event}): ${filePath} → 重新扫描`);
          // 触发模块失效，下一次 import 会重新 load
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  // 支持 Windows 反斜杠和正斜杠两种写法
  const postsDir = (env.POSTS_DIR || '../posts').replace(/\\/g, '/');

  // 如果是绝对路径（Windows 盘符开头或 Unix / 开头）直接用；否则相对 __dirname 解析
  const postsAbsPath = path.isAbsolute(postsDir)
    ? path.resolve(postsDir)
    : path.resolve(__dirname, postsDir);

  // 生产模式不需要 POSTS_DIR（运行时 HTTP 拉取），只在开发模式打印日志
  if (mode === 'development') {
    console.log(`[vite] mode=${mode}, POSTS_DIR=${postsDir} → ${postsAbsPath}`);
  }

  return {
    plugins: [react(), postsPlugin(postsAbsPath)],
  };
});
