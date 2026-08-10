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
    variantId: "frontend"
  });
  const resume = buildPublicResume(canonical);

  const output = renderMarkdownResume(resume);
  const skillsStart = output.indexOf("## 专业技能");
  const experienceStart = output.indexOf("## 工作经历", skillsStart);
  const skillsSection = output.slice(skillsStart, experienceStart);

  assert.match(output, /^# 张子恒\n\n> 高级前端工程师\n/m);
  assert.match(output, /## 个人摘要\n\n6 年\+ Web 开发经验，长期参与终端安全、云原生安全与 AI 安全验证产品建设。/m);
  assert.match(output, /具备 Node\.js\/Fastify AI Agent 服务与 Go 平台工具开发经验/m);
  assert.match(output, /## 基本信息\n\n- 所在地：杭州，浙江，中国\n- 当前状态：寻找新的工作机会\n/m);
  assert.match(
    output,
    /## 联系方式\n\n- 邮箱：\[shadow1746556951@gmail\.com\]\(mailto:shadow1746556951@gmail\.com\)\n- 电话：\[\d{11}\]\(tel:\d{11}\)\n- GitHub：\[Shadowzzh\]\(https:\/\/github\.com\/Shadowzzh\)\n- 博客：\[blog\.zihengzhang\.com\]\(https:\/\/blog\.zihengzhang\.com\/\)\n/m
  );
  assert.match(output, /## 专业技能\n\n### 前端开发\n\n长期使用 JavaScript \/ TypeScript，熟练掌握 Vue 2 \/ Vue 3、React 与 Next\.js/m);
  assert.match(output, /### 前端工程化\n\n具备 Vite \/ Webpack 项目的构建与升级经验/m);
  assert.match(output, /### 服务端与工具\n\n具备 Go 跨平台检测工具开发与发布经验/m);
  assert.match(output, /### 部署与交付\n\n具备 Docker 容器化、Nginx 配置及 Linux \/ Shell 实践/m);
  assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Fastify|Zod|Claude Agent SDK|Dumi|Father/);
  assert.match(
    output,
    /## 工作经历\n\n### 杭州奇盾｜前端开发工程师\n\n- 时间：2024-03 - 至今\n- 负责终端安全、云原生安全与 AI 安全验证产品的前端建设与迭代/m
  );
  assert.match(output, /负责 Go 跨平台基线检测工具开发，完成 Linux、Windows 主机及 DM8 数据库安全基线检查与测试验证。/);
  assert.match(output, /参与 Java \/ Spring Boot 后端接口开发与联调。/);
  assert.match(
    output,
    /## 代表项目\n\n### CNAPP 云原生应用保护平台\n\n- 技术栈：Vue 3 \/ TypeScript \/ Vite \/ Pinia \/ Vue Query/m
  );
  assert.match(output, /### AI 安全验证平台\n\n- 技术栈：Vue 3 \/ TypeScript \/ Fastify \/ Zod \/ Claude Agent SDK \/ Docker \/ Java \/ Spring Boot/m);
  assert.match(output, /### 多平台业务组件库\n\n- 技术栈：Vue \/ React \/ 钉钉小程序 \/ H5/m);
  assert.doesNotMatch(output, /Dumi|Father/);
  assert.match(
    output,
    /## 访问方式\n\n- `npx @zhangziheng\/resume`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.7 \| man -l -`\n/m
  );
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
  assert.doesNotMatch(output, /### 跨平台基线检测工具/);
  assert.doesNotMatch(output, /\bundefined\b/);
  assert.doesNotMatch(output, /\bnull\b/);
});
