# Resume

单一内容源的简历仓库。

目标：

- 在一个地方维护简历内容
- 生成 `HTML`、`PDF`、`man`、`resume.json`
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

本地预览开发：

- `npm run dev:html` 或 `pnpm dev:html`
- 监听 `content/`、`scripts/`、`renderers/`、`site/` 变更并自动重新构建
- `dist/` 变更后浏览器自动刷新，默认地址是 `http://localhost:3000`

更多说明：

- 项目流程与架构文档：`docs/architecture-and-flow.md`

发布说明：

- GitHub Pages 发布目录来自 `dist/`
- 自定义域名文件 `CNAME` 在构建时自动写入
- npm 包名为 `@zhangziheng/resume`
- 首次发布 scoped 公共包依赖 `publishConfig.access = public`

Makefile 发布命令：

- `make build`
  执行 `npm test`、`npm run validate`、`npm run build:full`

- `make deploy-pages`
  执行构建，自动提交当前改动，然后推送 `main` 触发 GitHub Pages 部署

- `make publish-npm-patch`
- `make publish-npm-minor`
- `make publish-npm-major`
  执行构建，自动提交当前改动，执行 `npm version` 升级版本并创建 tag，然后推送 `main` 和 tag 触发 npm 发布

- `make full-patch`
- `make full-minor`
- `make full-major`
  一条命令完成完整发布流程。由于会推送 `main` 和 `v*` tag，因此会同时触发 GitHub Pages 部署和 npm 发布

- `make full VERSION=patch`
  通用入口，等价于 `make full-patch`

注意：

- 发布命令要求当前分支是 `main`
- 发布命令会自动提交当前工作区改动，请先确认 `git status`

需要的仓库配置：

- GitHub Pages source: `GitHub Actions`
- npm Trusted Publisher with GitHub Actions OIDC
