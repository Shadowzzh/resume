# Resume

单一内容源的简历仓库。

目标：

- 在一个地方维护简历内容
- 生成 `HTML`、`Markdown`、`PDF`、`man`、`resume.json`
- 提供 `npx @zhangziheng/resume` 的终端入口

内容源使用 `YAML + Markdown`：

- `content/profile.yaml`
- `content/experience.yaml`
- `content/skills.yaml`
- `content/projects/*.md`
- `content/variants/*.yaml`

常用命令：

```bash
npm install
npm test
npm run validate
npm run build
npm run dev:html
```

构建产物输出到 `dist/`。

投放版本（variant）：

```bash
# 默认构建全栈版（fullstack）
npm run build
```

`content/variants/fullstack.yaml` 决定投放策略（标题、摘要、首页项目排序）；未设置 `VARIANT` 时默认使用 `fullstack`。构建会在末尾打印当前使用的 variant。

本地预览开发：

- `npm run dev:html` 或 `pnpm dev:html`
- 监听 `content/`、`scripts/`、`renderers/`、`site/` 变更并自动重新构建
- `dist/` 变更后浏览器自动刷新，默认地址是 `http://localhost:3000`

更多说明：

- 项目流程与架构文档：`docs/architecture-and-flow.md`

发布说明：

- Cloudflare Pages 发布目录来自 `dist/`（项目名 `resume`，生产地址 https://resume-01u.pages.dev）
- 自定义域名 `resume.zihengzhang.com` 走 DNSPod 分线路解析：境内线路 A → `120.55.127.195`（阿里云 Nginx → FRPS → NAS 容器），默认（境外）线路 CNAME → `resume-01u.pages.dev`（Cloudflare Pages）；两条链路产物同源
- GitHub Pages 已于 2026-10-29 停用并删除，不再发布；推 `main` 由 GitHub Actions（`cloudflare/wrangler-action@v3`）构建并部署到 Cloudflare Pages
- `CNAME` 文件是 GitHub Pages 时代的遗留，构建仍会写入，对 Cloudflare Pages 无影响
- npm 包名为 `@zhangziheng/resume`
- 首次发布 scoped 公共包依赖 `publishConfig.access = public`

Makefile 发布命令：

- `make build`
  执行 `npm test`、`npm run validate`、`npm run build:full`

- `make deploy-pages`
  执行构建，自动提交当前改动，然后推送 `main` 触发 Cloudflare Pages 部署（本地 `pre-push` hook 同时会把新版部署到 NAS）

- `make publish-npm-patch`
- `make publish-npm-minor`
- `make publish-npm-major`
  执行构建，自动提交当前改动，执行 `npm version` 升级版本并创建 tag，然后推送 `main` 和 tag 触发 npm 发布

- `make full-patch`
- `make full-minor`
- `make full-major`
  一条命令完成完整发布流程。由于会推送 `main` 和 `v*` tag，因此会同时触发 Cloudflare Pages 部署和 npm 发布

- `make full VERSION=patch`
  通用入口，等价于 `make full-patch`

注意：

- 发布命令要求当前分支是 `main`
- 发布命令会自动提交当前工作区改动，请先确认 `git status`

需要的仓库配置：

- Cloudflare Pages 项目：`resume`（项目 ID `3acdde32-bb69-4ca0-8cb4-03520c6c46b4`，Cloudflare Account ID `4c2834af0e9dbfbb5acb3108d0be46de`）
- 仓库 Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- 手动直传（本地无 CI 时）：`wrangler pages deploy dist --project-name resume --branch main`
- npm Trusted Publisher with GitHub Actions OIDC
