# npm Trusted Publisher OIDC 排障记录

## 概要

仓库 `Shadowzzh/resume` 在使用 GitHub Actions 通过 npm Trusted Publisher 的 OIDC 模式发布 `@zhangziheng/resume` 时，经历了多轮失败重试。最终确认问题不在构建产物，而在 OIDC 身份匹配和 npm CLI 版本要求。

最终结果：

- GitHub Actions 发布工作流成功
- npm registry 已可查询到 `@zhangziheng/resume@0.1.2`

## 现象

排障过程中出现过两类典型错误：

- 混合态配置下发布返回 `E404`
- 纯 OIDC 配置下发布返回 `ENEEDAUTH`

当时已确认以下事实：

- 本地 `npm test`、`npm run validate`、`npm run build`、`npm run build:full`、`npm pack --dry-run` 全部通过
- CI、Deploy、PDF、Pages 相关问题已经修复
- 发布前 `NODE_AUTH_TOKEN` 已显式清空
- 发布时使用的 `.npmrc` 不包含 token，只包含 npm registry 和 `always-auth=false`

这意味着问题已经缩小到“Trusted Publisher 未正确接管认证”。

## 根因

最终确认有两个根因同时存在。

### 1. GitHub 仓库 OIDC subject template 不是默认模板

通过 GitHub API 查询仓库 OIDC 配置：

```bash
gh api repos/Shadowzzh/resume/actions/oidc/customization/sub
```

返回结果为：

```json
{"use_default":false}
```

这说明仓库启用了自定义 OIDC subject template。npm Trusted Publisher 依赖 GitHub OIDC 身份与后台配置精确匹配，自定义 `sub` 会导致 npm 无法识别当前工作流身份。

### 2. 发布工作流中的 npm 版本不满足 Trusted Publisher 要求

虽然工作流使用的是 Node 22，但 `actions/setup-node` 默认带上的 npm 仍可能是 10.x。排障时本地环境实际为：

```bash
node -v
# v22.8.0

npm -v
# 10.8.2
```

根据 npm 官方 Trusted Publisher / provenance 文档，GitHub Actions OIDC 发布需要满足较新的 Node 与 npm CLI 要求。npm CLI 版本过低时，即使工作流具备 `id-token: write`，`npm publish --provenance` 也可能不会进入 Trusted Publisher 认证链路，而是退回普通认证逻辑，最终报出 `ENEEDAUTH`。

## 修复

### 1. 恢复仓库默认 OIDC subject template

使用 GitHub API 将仓库配置切回默认模板：

```bash
printf '{"use_default":true}' | env -u GITHUB_TOKEN gh api \
  -X PUT repos/Shadowzzh/resume/actions/oidc/customization/sub \
  --input -
```

再次查询后返回：

```json
{"use_default":true}
```

### 2. 更新 Publish NPM 工作流中的 Node/npm 版本

修改了 [publish-npm.yml](/Users/zzh/Documents/code/resume/.github/workflows/publish-npm.yml#L17)：

- `node-version` 固定为 `22.14.0`
- 新增步骤显式安装 `npm@^11.5.1`
- 输出 `node --version` 与 `npm --version` 作为诊断信息

关键片段如下：

```yaml
- uses: actions/setup-node@v5
  with:
    node-version: 22.14.0
    cache: npm

- name: Ensure npm Trusted Publisher requirements
  run: |
    npm install --global npm@^11.5.1
    node --version
    npm --version
```

### 3. 保持纯 OIDC 发布方式

最终成功方案仍保持纯 OIDC，不回退到 `NPM_TOKEN`：

- 不向 `.npmrc` 写入 token
- 显式清空 `NODE_AUTH_TOKEN`
- 使用 `npm publish --provenance`

## 验证结果

修复完成后，手动触发 GitHub Actions 工作流：

- Workflow: `Publish NPM`
- Run ID: `24391166382`
- 结果：`success`

外部验证：

```bash
npm view @zhangziheng/resume version
# 0.1.2
```

说明包 `@zhangziheng/resume@0.1.2` 已成功发布到 npm registry。

## 经验总结

- 纯 OIDC 场景下出现 `ENEEDAUTH`，不一定说明 npm 后台 Trusted Publisher 没配对，也可能是 npm CLI 版本过低，导致根本没有进入 Trusted Publisher 认证逻辑。
- 如果 GitHub 仓库启用了自定义 OIDC `sub` 模板，优先确认是否与第三方平台的 Trusted Publisher 绑定规则兼容；对 npm 来说，恢复默认模板通常更稳妥。
- 发布链路排障时，保留无 token 的 `.npmrc`、清空 `NODE_AUTH_TOKEN`、输出 Node/npm 版本，可以更快判断问题属于“身份匹配”还是“CLI 能力”。

## 相关变更

- 提交：`429ac38` (`fix: satisfy npm trusted publisher requirements`)
- 工作流运行：
  `https://github.com/Shadowzzh/resume/actions/runs/24391166382`
