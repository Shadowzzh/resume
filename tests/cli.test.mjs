import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";
import { renderCliResume } from "../renderers/cli/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderCliResume prints a full resume-oriented CLI view", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const resume = buildPublicResume(canonical);

  const output = renderCliResume(resume);
  const skillsStart = output.indexOf("[专业技能]");
  const experienceStart = output.indexOf("[工作经历]", skillsStart);
  const skillsSection = output.slice(skillsStart, experienceStart);

  assert.match(output, /^张子恒\n全栈工程师\n/m);
  assert.match(output, /\[基本信息\]\n所在地\s+杭州，浙江，中国\n当前状态\s+寻找新的工作机会/);
  assert.match(output, /\[个人摘要\]\n6 年\+ Web 开发经验，以企业级前端为主，主要使用 Vue、React、Next\.js，近年将职责扩展至 AI Agent 服务与全栈交付。/);
  assert.match(output, /负责安全平台前端与 Node\.js \/ Fastify Agent 执行控制服务/);
  assert.match(output, /独立交付 Go 跨平台基线检查工具/);
  assert.match(output, /具备 Docker 容器化与离线交付经验/);
  assert.match(output, /日常将 AI Agent 用于开发、测试和运维，并持续维护自建 Linux 服务。/);
  assert.match(output, /\[联系方式\]\n邮箱\s+shadow1746556951@gmail\.com\nGitHub\s+https:\/\/github\.com\/Shadowzzh\n博客\s+https:\/\/blog\.zihengzhang\.com\//);
  assert.match(output, /\[专业技能\]\n前端\s+熟练使用 JavaScript \/ TypeScript，具备 Vue 2 \/ Vue 3、React 与 Next\.js 企业级应用开发能力，能够独立承担中后台业务开发、组件封装、复杂交互与跨页面状态管理/);
  assert.match(output, /前端\s+[^\n]*Vite \/ Webpack 构建与升级经验，能够建设和维护 Monorepo、业务组件库与自动化测试，支持多环境及离线构建/);
  assert.match(output, /服务端\s+具备 Node\.js \/ Fastify 服务开发与架构设计能力，能够设计接口与任务执行机制，处理长任务状态持久化、会话恢复和进程管理，完成从开发联调到 Docker 部署及日志排障的交付链路。具备 Go 跨平台工具开发与规则执行框架设计能力，可完成 Linux \/ Windows 适配、多架构构建和版本交付；参与 Java \/ Spring Boot 接口开发与联调/);
  assert.match(output, /部署与交付\s+具备 Docker、Nginx 与 Linux \/ Shell 实践，能够独立完成服务部署、镜像分层与离线交付/);
  assert.match(output, /并结合应用、进程及容器日志进行故障定位和排查/);
  assert.doesNotMatch(output, /前端工程化\s{2,}/);
  assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Zod|Dumi|Father/);
  assert.match(output, /\[工作经历\]\n2024-03 ~ 至今\s+杭州奇盾\s+全栈工程师\n  - 负责公司安全产品的前端建设与迭代，覆盖 Vue、React、Next\.js/);
  assert.match(output, /主导 Node\.js \/ Fastify Agent 执行控制服务开发，负责平台前端与任务服务的联调交付，并参与 Java \/ Spring Boot 接口开发。/);
  assert.match(output, /独立开发并交付 Go 跨平台主机安全基线检查工具，覆盖 Linux \/ Windows，完成规则执行框架、平台适配、测试验证与多架构构建发布。/);
  assert.match(output, /2022-02 ~ 2023-10\s+杭州沃土教育\s+前端开发工程师\n  - 负责培训平台、CMS 系统与营销活动低代码平台等业务前端开发，覆盖 Vue \/ React 中后台、H5 与钉钉小程序。/);
  assert.doesNotMatch(output, /Dumi|Father/);
  assert.match(output, /\[访问方式\]\nnpx @zhangziheng\/resume\ncurl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json\ncurl -fsSL https:\/\/resume\.zihengzhang\.com\/resume\.7 -o \/tmp\/resume\.7 && man \/tmp\/resume\.7/);
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
  assert.match(output, /\[代表项目\]\n- 自动化渗透测试平台（Vue 3 \/ Node\.js \/ Fastify \/ Claude Agent SDK \/ Playwright \/ CDP \/ Docker \/ Java \/ Spring Boot）/);
  assert.match(output, /- 移动端自动化探索与接口资产梳理（Mobilewright \/ MCP \/ adb \/ mitmproxy \/ MobSF）/);
  assert.match(output, /- 主机安全基线检查工具（Go \/ PowerShell \/ YAML \/ Makefile）/);
  assert.match(
    output,
    /\[代表项目\]\n- 自动化渗透测试平台（[^\n]*）[\s\S]*?- 企业安全产品官网建设与迭代（Next\.js \/ React \/ TypeScript \/ Tailwind CSS \/ Resend \/ Docker）\n  - 基于 Next\.js \+ React \+ Tailwind CSS 设计并开发企业安全产品官网[^\n]*\n  - 官网从产品展示延伸到线索收集与资料下载：[^\n]*\n- 主机安全基线检查工具（[^\n]*）[\s\S]*?- 移动端自动化探索与接口资产梳理（[^\n]*）\n  - [^\n]*mitmproxy[^\n]*静态分析[^\n]*功能大纲[^\n]*接口资产[^\n]*拓扑[^\n]*\n  - [^\n]*功能大纲[^\n]*接口清单[^\n]*拓扑[^\n]*/
  );
  assert.match(
    output,
    /- 主机安全基线检查工具（Go \/ PowerShell \/ YAML \/ Makefile）\n  - 用 Go 开发主机安全基线检查工具：[^\n]*设计声明式 YAML 规则及采集执行框架，将规则描述与执行逻辑分离[^\n]*/
  );
  assert.doesNotMatch(output, /内容驱动企业官网/);
  assert.doesNotMatch(output, /lisu-official-site/);
  assert.match(
    output,
    /\[个人项目\]\n- 视频转图文工作台（Python \/ Flask \/ React 19 \/ TypeScript \/ Whisper \/ DeepSeek \/ ffmpeg \/ yt-dlp）\n  - [^\n]*下载在线视频[^\n]*时间锚点[^\n]*X（Twitter）[^\n]*YouTube[^\n]*哔哩哔哩[^\n]*等平台[^\n]*定位原视频[^\n]*\n  - [^\n]*Flask[^\n]*持久化任务状态与中间产物[^\n]*断点续跑[^\n]*\n  链接：https:\/\/github\.com\/Shadowzzh\/VideoDoc\n- AI 产品文档生成工具箱（AI Agent \/ Node\.js \/ Playwright \/ CDP \/ JavaScript \/ Markdown）\n  - [^\n]*\n  - [^\n]*将“现场判断”与“稳定动作”分离[^\n]*\n  链接：https:\/\/github\.com\/Shadowzzh\/product-docs-toolkit/
  );
  assert.match(output, /链接：https:\/\/github\.com\/Shadowzzh\/product-docs-toolkit/);
  assert.match(output, /链接：https:\/\/github\.com\/Shadowzzh\/VideoDoc/);
  assert.doesNotMatch(output, /\bName\b/);
  assert.doesNotMatch(output, /\bSummary\b/);
});
