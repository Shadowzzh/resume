import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";
import { renderMarkdownResume } from "../renderers/markdown/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderMarkdownResume prints a README-style public resume", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const resume = buildPublicResume(canonical);

  const output = renderMarkdownResume(resume);
  const skillsStart = output.indexOf("## 专业技能");
  const experienceStart = output.indexOf("## 工作经历", skillsStart);
  const skillsSection = output.slice(skillsStart, experienceStart);

  assert.match(output, /^# 张子恒\n\n> 全栈工程师偏前端\n/m);
  assert.match(output, /## 个人摘要\n\n6 年\+ Web 开发经验，以企业级前端为主，主要使用 Vue、React、Next\.js，近年将职责扩展至 AI Agent 服务与全栈交付。/m);
  assert.match(output, /负责安全平台前端与 Node\.js \/ Fastify Agent 执行控制服务/m);
  assert.match(output, /独立交付 Go 跨平台基线检查工具/m);
  assert.match(output, /具备 Docker 容器化与离线交付经验/m);
  assert.match(output, /日常将 AI Agent 用于开发、测试和运维，并持续维护自建 Linux 服务。/m);
  assert.match(output, /## 基本信息\n\n- 所在地：杭州，浙江，中国\n- 当前状态：寻找新的工作机会\n/m);
  assert.match(
    output,
    /## 联系方式\n\n- 邮箱：\[shadow1746556951@gmail\.com\]\(mailto:shadow1746556951@gmail\.com\)\n- 电话：\[\d{11}\]\(tel:\d{11}\)\n- GitHub：\[Shadowzzh\]\(https:\/\/github\.com\/Shadowzzh\)\n- 博客：\[blog\.zihengzhang\.com\]\(https:\/\/blog\.zihengzhang\.com\/\)\n/m
  );
  assert.match(output, /## 专业技能\n\n### 前端\n\n熟练使用 JavaScript \/ TypeScript，具备 Vue 2 \/ Vue 3、React 与 Next\.js 企业级应用开发能力，能够独立承担中后台业务开发、组件封装、复杂交互与跨页面状态管理/m);
  assert.match(output, /### 前端\n\n[^\n]*Vite \/ Webpack 构建与升级经验，能够建设和维护 Monorepo、业务组件库与自动化测试，支持多环境及离线构建/m);
  assert.match(output, /### 服务端\n\n具备 Node\.js \/ Fastify 服务开发与架构设计能力，能够设计接口与任务执行机制，处理长任务状态持久化、会话恢复和进程管理，完成从开发联调到 Docker 部署及日志排障的交付链路。具备 Go 跨平台工具开发与规则执行框架设计能力，可完成 Linux \/ Windows 适配、多架构构建和版本交付；参与 Java \/ Spring Boot 接口开发与联调/m);
  assert.match(output, /### 部署与交付\n\n具备 Docker、Nginx 与 Linux \/ Shell 实践，能够独立完成服务部署、镜像分层与离线交付，并结合应用、进程及容器日志进行故障定位和排查/m);
  assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Zod|Dumi|Father/);
  assert.match(
    output,
    /## 工作经历\n\n### 杭州奇盾｜全栈工程师偏前端\n\n- 时间：2024-03 - 至今\n- 负责公司前端项目建设与迭代，覆盖 Vue、React、Next\.js 技术栈/m
  );
  assert.match(output, /随着自动化渗透测试业务发展，职责扩展至全栈交付，开发 Node\.js \/ Fastify Agent 任务服务，并参与 Java \/ Spring Boot 接口开发与联调。/);
  assert.match(output, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机安全基线检查与测试验证。/);
  assert.match(output, /建设 AI Agent 运行与交付环境，完成 Kali Linux Docker 容器封装、分层构建与离线交付。/);
  assert.match(
    output,
    /## 代表项目\n\n### 自动化渗透测试平台\n\n- 技术栈：Vue 3 \/ Node\.js \/ Fastify \/ Claude Agent SDK \/ Playwright \/ CDP \/ Docker \/ Java \/ Spring Boot/m
  );
  assert.match(output, /## 个人项目\n\n### 浏览器自动化生成产品文档\n\n- 技术栈：AI Agent \/ Node\.js \/ Playwright \/ CDP \/ JavaScript \/ Markdown/m);
  assert.match(output, /### 主机安全基线检查工具\n\n- 技术栈：Go \/ PowerShell \/ YAML \/ Makefile/m);
  assert.match(output, /Kali Linux Docker 容器封装/);
  assert.doesNotMatch(output, /### CNAPP 云原生应用保护平台/);
  assert.doesNotMatch(output, /### 多平台业务组件库/);
  assert.doesNotMatch(output, /Dumi|Father/);
  assert.match(
    output,
    /## 访问方式\n\n- `npx @zhangziheng\/resume`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json`\n- `curl -fsSL https:\/\/resume\.zihengzhang\.com\/resume\.7 -o \/tmp\/resume\.7 && man \/tmp\/resume\.7`\n/m
  );
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
  assert.doesNotMatch(output, /\bundefined\b/);
  assert.doesNotMatch(output, /\bnull\b/);
});
