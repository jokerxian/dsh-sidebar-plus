# 增强侧边栏功能插件 / Sidebar Plus

一个插件，两个右侧栏页面：

- **文件夹**：浏览任意本地文件夹，右键把文件或整个文件夹添加到当前对话。
- **Git**：仓库状态、改动、提交图、完整 diff、提交编辑器，以及抓取 / 拉取 / 推送。

同时保留会话顶部的「Git」视图与会话标题栏的状态胶囊。

## 入口

- 右侧栏标签菜单里的「文件夹」与「Git」
- 会话标题栏的文件夹按钮（文件夹面板）
- 会话顶部「Git」视图；标题栏 Git 状态胶囊

## 实现

- `host/folder.js` + `lib/fsops.js`：文件夹路由（`/sidebar-plus/folder/rpc`、`/sidebar-plus/folder/read`）
- `host/git.js` + `lib/git.js`：Git 路由（`/sidebar-plus/git/rpc`）
- `client.js`：两个浏览器半边的组合；各自保留 `fd-` / `gw-` 样式前缀与独立 Host 路由。

安装/更新后刷新页面（Ctrl+R）。
