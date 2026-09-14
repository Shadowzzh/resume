import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume } from "../scripts/normalize.mjs";
import { renderHtmlSite } from "../renderers/html/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderHtmlSite writes relative internal links that work at root and nested paths", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    const result = await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    assert.equal(result.homepagePath, path.join(outputDir, "index.html"));
    assert.equal(result.printPagePath, path.join(outputDir, "print", "index.html"));

    await assert.doesNotReject(fs.access(path.join(outputDir, "index.html")));
    await assert.doesNotReject(fs.access(path.join(outputDir, "print", "index.html")));
    await assert.rejects(fs.access(path.join(outputDir, "resume", "index.html")));

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");

    assert.doesNotMatch(homepage, /href="print\/"/);
    assert.doesNotMatch(homepage, /href="projects\/[a-z-]+\/"/);
    assert.doesNotMatch(homepage, /href="\/resume\//);
    await assert.rejects(fs.access(path.join(outputDir, "projects", "component-library", "index.html")));
    await assert.rejects(fs.access(path.join(outputDir, "projects")));

    // favicon / 站点图标使用相对路径，首页在根、print 页在子目录均能命中
    assert.match(homepage, /<link rel="icon" href="favicon\.ico" sizes="any" \/>/);
    assert.match(homepage, /<link rel="icon" type="image\/png" sizes="32x32" href="favicon-32x32\.png" \/>/);
    assert.match(homepage, /<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon\.png" \/>/);
    assert.match(homepage, /<link rel="manifest" href="site\.webmanifest" \/>/);
    assert.match(homepage, /<meta name="theme-color" content="#0F172A" \/>/);
    assert.doesNotMatch(homepage, /\{\{basePath\}\}/);
    assert.match(printPage, /href="\.\.\/favicon\.ico"/);
    assert.doesNotMatch(printPage, /\{\{basePath\}\}/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite mirrors the reference resume-style homepage while keeping the print resume intact", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");
    const skillsStart = homepage.indexOf("专业技能");
    const experienceStart = homepage.indexOf("工作经历", skillsStart);
    const skillsSection = homepage.slice(skillsStart, experienceStart);
    const qidunHighlights = homepage.match(
      /<ul class="point-list-v5 experience-highlights-v5">([\s\S]*?)<\/ul>/
    )?.[1] ?? "";
    const wotuHighlights = homepage.match(
      /杭州沃土教育 · 前端开发工程师[\s\S]*?<ul class="point-list-v5 experience-highlights-v5">([\s\S]*?)<\/ul>/
    )?.[1] ?? "";

    assert.match(homepage, /https:\/\/cdn\.tailwindcss\.com/);
    assert.match(homepage, /max-width:\s*210mm/);
    assert.match(homepage, /padding:\s*20px 15mm 36px/);
    assert.match(homepage, /padding:\s*16px 16px 28px/);
    assert.match(homepage, /resume-header/);
    assert.match(homepage, /section-title-v5/);
    assert.match(homepage, /专业技能/);
    assert.match(homepage, /核心项目经历/);
    assert.match(homepage, /<div class="section-title-v5">个人项目<\/div>/);
    assert.match(homepage, /全栈工程师偏前端/);
    assert.doesNotMatch(homepage, /AI 应用与工程化/);
    assert.doesNotMatch(homepage, /高级前端工程师 \/ AI 应用与工程化/);
    assert.match(homepage, /6 年\+ Web 前端经验，长期做企业级业务系统的前端，从 ERP、CMS、内容管理这类后台，到前台展示页面、小程序、H5。/);
    assert.match(homepage, /近年转向 AI Agent 应用与全栈：用 Node\.js 做过自动化渗透平台的任务服务，用 Go 独立交付过跨 Linux\/Windows 的基线检测工具/);
    assert.match(homepage, /平时也喜欢软硬件 DIY：用树莓派、NAS、开发机等多台异构 Linux 主机自建服务/);
    assert.match(homepage, /日常用 AI Agent 管理运维这套机器群，把配置、排障、复盘沉淀成可复用的技能库/);
    assert.match(homepage, /端到端跑通从开发、测试到容器化部署的完整链路/);
    assert.match(homepage, /自动化渗透测试平台/);
    assert.match(homepage, /浏览器自动化生成产品文档/);
    assert.match(homepage, /<span class="project-owner-v5">个人项目<\/span>/);
    assert.doesNotMatch(homepage, /<span>2025-12 - 至今<\/span>/);
    assert.match(homepage, /CNAPP 云原生应用保护平台/);
    assert.match(homepage, /多平台业务组件库/);
    assert.match(homepage, /跨平台基线检测工具/);
    assert.doesNotMatch(homepage, /class="badge-v5/);
    assert.doesNotMatch(homepage, /\[核心问题\]/);
    assert.match(homepage, /前端开发/);
    assert.match(homepage, /前端工程化/);
    assert.match(homepage, /服务端与工具/);
    assert.match(homepage, /部署与交付/);
    assert.match(homepage, /熟练掌握 Vue 2 \/ Vue 3、React 与 Next\.js/);
    assert.match(homepage, /具备 Go 跨平台检测工具开发与发布经验/);
    assert.match(homepage, /自建过 FRP 内网穿透、Tailscale 组网与 Grafana \/ Loki 日志观测体系/);
    assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Zod|Dumi|Father/);
    assert.match(homepage, /当前状态/);
    assert.match(homepage, /所在地/);
    assert.match(qidunHighlights, /负责公司前端项目建设与迭代，覆盖 Vue、React、Next\.js 技术栈，支撑终端安全、云原生安全与自动化渗透测试等产品。/);
    assert.match(qidunHighlights, /随着自动化渗透测试业务发展，职责扩展至全栈交付，开发 Node\.js \/ Fastify Agent 任务服务，并参与 Java \/ Spring Boot 接口开发与联调。/);
    assert.match(qidunHighlights, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机安全基线检查与测试验证。/);
    assert.match(qidunHighlights, /建设 AI Agent 运行与交付环境，完成 Kali Linux Docker 容器封装、分层构建与离线交付。/);
    assert.match(wotuHighlights, /负责中后台业务功能和多平台通用业务组件开发，推动多个业务项目统一升级组件库版本。/);
    assert.match(homepage, /邮箱/);
    assert.match(homepage, /tel:\d{11}/);
    assert.match(homepage, /博客/);
    assert.doesNotMatch(homepage, /个人优势与认知/);
    assert.doesNotMatch(homepage, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
    assert.doesNotMatch(homepage, /\bundefined\b/);
    assert.doesNotMatch(homepage, /\bnull\b/);
    assert.doesNotMatch(homepage, /href="#projects"/);
    assert.doesNotMatch(homepage, /联系我/);
    assert.doesNotMatch(homepage, /精选项目/);
    assert.doesNotMatch(homepage, /职业经历/);

    assert.match(printPage, /个人摘要/);
    assert.match(printPage, /专业技能/);
    assert.match(printPage, /工作经历/);
    assert.match(printPage, /项目/);
    assert.match(printPage, /联系方式/);
    assert.match(printPage, /<strong>负责：<\/strong>/);
    assert.doesNotMatch(printPage, /<strong>问题：<\/strong>/);
    assert.match(printPage, /负责公司前端项目建设与迭代，覆盖 Vue、React、Next\.js 技术栈，支撑终端安全、云原生安全与自动化渗透测试等产品。/);
    assert.match(printPage, /随着自动化渗透测试业务发展，职责扩展至全栈交付，开发 Node\.js \/ Fastify Agent 任务服务，并参与 Java \/ Spring Boot 接口开发与联调。/);
    assert.match(printPage, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机安全基线检查与测试验证。/);
    assert.match(printPage, /建设 AI Agent 运行与交付环境，完成 Kali Linux Docker 容器封装、分层构建与离线交付。/);
    assert.match(printPage, /2024-03 - 至今 \/ 杭州西湖区/);
    assert.match(printPage, /React<\/span><span class="tag">Vue 3<\/span><span class="tag">Next\.js<\/span><span class="tag">Node\.js<\/span><span class="tag">Go<\/span><span class="tag">Java \/ Spring Boot<\/span><span class="tag">Docker/);
    assert.match(printPage, /使用 Vue、React 开发培训平台、CMS 系统、钉钉小程序、H5 页面及营销活动低代码平台。/);
    assert.match(printPage, /负责中后台业务功能和多平台通用业务组件开发/);
    assert.doesNotMatch(printPage, /Dumi|Father/);
    assert.match(printPage, /使用 Vue 3 \+ Tailwind CSS 构建 UI，并支撑系统迭代维护。/);
    assert.match(printPage, /电话/);
    assert.doesNotMatch(printPage, /\bundefined\b/);
    assert.doesNotMatch(printPage, /\bnull\b/);
    assert.doesNotMatch(printPage, /<h2>项目经验<\/h2>/);
    assert.doesNotMatch(printPage, /核心技术栈/);
    assert.doesNotMatch(printPage, /访问方式/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite stops emitting per-project detail pages and keeps project content on the homepage", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");

    await assert.rejects(fs.access(path.join(outputDir, "projects")));
    await assert.rejects(
      fs.access(path.join(outputDir, "projects", "component-library", "index.html"))
    );

    assert.match(homepage, /多平台业务组件库/);
    assert.match(homepage, /浏览器自动化生成产品文档/);
    assert.match(homepage, /自动化渗透测试平台/);
    assert.match(homepage, /项目背景/);
    assert.match(homepage, /\[负责内容\]/);
    assert.match(homepage, /\[项目结果\]/);
    assert.doesNotMatch(homepage, /class="section-kicker"/);
    assert.doesNotMatch(printPage, /href="\.\.\/projects\//);
    assert.doesNotMatch(printPage, /href="projects\//);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
