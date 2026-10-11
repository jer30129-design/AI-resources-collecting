# AI 资源站 / AI Resource Hub

面向科研、办公、开发与 AIGC 场景的本地演示版资源导航站。当前阶段使用静态模拟内容和浏览器 `localStorage`，不连接后端，也不需要账号。

## 本地运行

```bash
npm install
npm run dev
```

生产构建与预览：

```bash
npm run build
npm run preview
```

## 页面

- `/` 首页与四个资源模块入口
- `/briefs` 每日 AI 简报、主题筛选和往期浏览
- `/resources/research`、`/resources/office`、`/resources/vibe-coding`、`/resources/aigc` 资源浏览
- `/resource/:id` 资源详情
- `/search` 全局资源搜索（支持 `⌘ K` / `Ctrl K`）
- `/me` 本地用户中心

## 本地数据

资源与简报定义在 `src/data.ts`。收藏、浏览记录、关注主题、个人资料、提交和反馈均写入当前浏览器的 `localStorage`；清除站点数据会重置这些演示状态。

## 发布到公网（GitHub Pages）

仓库已包含 GitHub Actions Pages 工作流。将项目推送到 `main` 后，在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将来源设为 **GitHub Actions**；工作流完成后即可通过以下地址访问：

`https://jer30129-design.github.io/AI-resources-collecting/`

部署构建会使用仓库路径作为 Vite base，并生成 `404.html`，以便直接打开资源详情等前端路由。收藏、提交和个人资料仍保存在访问者自己的浏览器，不会跨设备同步。
