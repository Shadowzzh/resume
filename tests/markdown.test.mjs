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
  assert.match(output, /## 个人摘要\n\n6 年\+ Web 开发经验，长期做企业级业务系统的前端，从 ERP、CMS、内容管理这类后台，到前台展示页面、小程序、H5。/m);
  assert.match(output, /近年转向 AI Agent 应用与全栈：用 Node\.js 做过自动化渗透平台的任务服务，用 Go 独立交付过跨 Linux\/Windows 的基线检测工具/m);
  assert.match(output, /平时也喜欢软硬件 DIY：用树莓派、NAS、开发机等多台异构 Linux 主机自建服务/m);
  assert.match(output, /日常用 AI Agent 管理运维这套机器群/m);
  assert.match(output, /端到端跑通从开发、测试到容器化部署的完整链路/m);
  assert.match(output, /## 基本信息\n\n- 所在地：杭州，浙江，中国\n- 当前状态：寻找新的工作机会\n/m);
  assert.match(
    output,
    /## 联系方式\n\n- 邮箱：\[shadow1746556951@gmail\.com\]\(mailto:shadow1746556951@gmail\.com\)\n- 电话：\[\d{11}\]\(tel:\d{11}\)\n- GitHub：\[Shadowzzh\]\(https:\/\/github\.com\/Shadowzzh\)\n- 博客：\[blog\.zihengzhang\.com\]\(https:\/\/blog\.zihengzhang\.com\/\)\n/m
  );
  assert.match(output, /## 专业技能\n\n### 前端开发\n\n长期使用 JavaScript \/ TypeScript，熟练掌握 Vue 2 \/ Vue 3、React 与 Next\.js/m);
  assert.match(output, /### 前端工程化\n\n具备 Vite \/ Webpack 项目的构建与升级经验/m);
  assert.match(output, /### 服务端与工具\n\n具备 Go 跨平台检测工具开发与发布经验/m);
  assert.match(output, /### 部署与交付\n\n具备 Docker 容器化、Nginx 配置与 Linux \/ Shell 实践/m);
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
  assert.match(output, /## 个人项目\n\n### 浏览器自动化生成产品文档\n\n- 技术栈：Claude Code \/ Node\.js \/ Playwright \/ CDP \/ Markdown \/ VitePress/m);
  assert.match(output, /### 主机安全基线检查工具\n\n- 技术栈：Go \/ PowerShell \/ YAML \/ Makefile/m);
  assert.match(output, /Kali Linux Docker 容器封装/);
  assert.doesNotMatch(output, /### CNAPP 云原生应用保护平台/);
  assert.doesNotMatch(output, /### 多平台业务组件库/);
  assert.doesNotMatch(output, /Dumi|Father/);
  assert.match(
    output,
    /## 访问方式\n\n- `npx @zhangziheng\/resume`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.7 \| man -l -`\n/m
  );
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
  assert.doesNotMatch(output, /\bundefined\b/);
  assert.doesNotMatch(output, /\bnull\b/);
});
