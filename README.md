# Personal Site v1

一个基于 `Astro` 的内容型个人网站，面向以下目标：

- 中文优先的个人主页、项目页和公开笔记页
- 从私有 `notes` 仓库中拉取可发布 Obsidian 笔记
- 用静态数据维护精选项目，不直接镜像全部 GitHub 仓库

当前站点名称：`LiuJrX-Space`

## 页面

- `/`
- `/notes`
- `/notes/[slug]`
- `/tags`
- `/tags/[tag]`
- `/projects`
- `/about`

## 内容模型

公开笔记需要使用以下 frontmatter：

```yaml
title: "文章标题"
publish: true
pubDate: 2026-05-07
updatedDate: 2026-05-07
summary: "一句摘要"
tags:
  - AI
  - Notes
```

## 本地开发

建议使用 `Node >= 18.17.1`。当前这台机器自带的系统 Node 较旧，如果你本地也遇到版本问题，优先升级 Node 再运行。

```bash
npm install
npm run dev
```

如果暂时没有配置私有仓库读取，站点会继续使用仓库内置的示例笔记。

## 私有 notes 同步

构建前会运行 `scripts/sync-notes.mjs`。你需要配置：

```bash
NOTES_REPO=LiuJrX/Notebook
NOTES_BRANCH=main
GITHUB_TOKEN=ghp_xxx
```

说明：

- `NOTES_REPO` 指向你的私有 notes 仓库
- 脚本会扫描整个笔记仓库，只同步 `publish: true` 的文章
- 笔记列表和首页“最近笔记”按 `updatedDate` 倒序排列
- 笔记详情页会同时显示 `pubDate` 和 `updatedDate`
- 默认会忽略 `.obsidian`、`Daily`、`Templates`、`Private` 等目录
- 如需自定义忽略目录，可设置 `NOTES_IGNORE_DIRS=dirA,dirB,dirC`
- 同步出的文件会落到 `src/content/notes/generated/`
- 文章中使用 Markdown 相对路径引用的本地图片，也会按原相对路径一并同步

## Cloudflare Pages 部署

这个项目适合直接部署到 [Cloudflare Pages](https://pages.cloudflare.com/)。

### 1. 连接 GitHub 仓库

把仓库 `LiuJrX/LiuJrX-Space` 导入到 Cloudflare Pages。

### 2. 构建设置

建议使用下面这组配置：

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Node version: `20`

说明：

- `npm run build` 会自动先执行 `prebuild`
- `prebuild` 会运行 `scripts/sync-notes.mjs`
- 也就是说，Cloudflare 在每次构建前都会先拉取私有 `Notebook` 仓库里的公开笔记

### 3. Cloudflare Pages 环境变量

在 Pages 项目的 `Settings -> Environment variables` 里添加：

```bash
NOTES_REPO=LiuJrX/Notebook
NOTES_BRANCH=main
GITHUB_TOKEN=你的_github_token
```

如果你需要覆盖联系表单的 Web3Forms key，也可以加：

```bash
PUBLIC_WEB3FORMS_ACCESS_KEY=你的_web3forms_key
```

可选：

```bash
NOTES_IGNORE_DIRS=.git,.obsidian,node_modules,Daily,Templates,Private
```

### 4. GitHub Token 权限建议

用于拉取私有笔记仓库的 token 建议这样配置：

- 使用 `fine-grained personal access token`
- 仓库范围只授权 `LiuJrX/Notebook`
- 权限只给 `Contents: Read-only`

不要这样做：

- 不要把 `GITHUB_TOKEN` 写进仓库文件
- 不要把它命名成 `PUBLIC_GITHUB_TOKEN`
- 不要把真实 token 提交到 `README`、`.env.example` 或构建脚本里

当前同步脚本已经避免把 token 直接拼进 clone URL，因此不会进入前端产物，也更不容易在构建日志中裸露。

### 5. 部署完成后检查

Cloudflare Pages 首次部署完成后，建议检查：

1. 首页、`/notes`、`/tags`、`/projects`、`/about` 是否能正常访问
2. 最新公开笔记是否已经出现在首页和 `/notes`
3. 私有仓库里的未发布笔记没有被同步出来
4. Contact 弹窗能否正常发送消息
5. 数学公式、代码高亮、Markdown 表格是否显示正常

### 6. 更新内容后的自动流程

你后续的日常流程就是：

1. 在 Obsidian 里写笔记
2. 给可发布笔记加上 `publish: true`
3. push 到私有仓库 `LiuJrX/Notebook`
4. push 网站代码到 `LiuJrX/LiuJrX-Space`
5. Cloudflare Pages 自动构建并更新站点

如果你希望做到“笔记仓库一更新就自动触发网站仓库重新部署”，可以后续再补一层 GitHub Actions / webhook。
