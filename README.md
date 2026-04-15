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
```

构建产物输出到 `dist/`。

更多说明：

- 项目流程与架构文档：`docs/architecture-and-flow.md`

发布说明：

- GitHub Pages 发布目录来自 `dist/`
- 自定义域名文件 `CNAME` 在构建时自动写入
- npm 包名为 `@zhangziheng/resume`
- 首次发布 scoped 公共包依赖 `publishConfig.access = public`

需要的仓库配置：

- GitHub Pages source: `GitHub Actions`
- GitHub secret: `NPM_TOKEN`
