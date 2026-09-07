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
    variantId: "frontend"
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

    assert.doesNotMatch(homepage, /href="print\/"/);
    assert.match(homepage, /href="projects\/auto-pentest-platform\/"/);
    assert.match(homepage, /href="projects\/cnapp-platform\/"/);
    assert.match(homepage, /href="projects\/component-library\/"/);
    assert.match(homepage, /href="projects\/security-baseline-agent\/"/);
    assert.doesNotMatch(homepage, /href="\/resume\//);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite mirrors the reference resume-style homepage while keeping the print resume intact", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
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
    assert.match(homepage, /高级前端工程师/);
    assert.match(homepage, /AI 应用与工程化/);
    assert.match(homepage, /6 年\+ Web 开发经验，长期参与终端安全、云原生安全与 AI 安全验证产品建设。/);
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
    assert.match(homepage, /并可进行 Kubernetes 基础发布与排障/);
    assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Fastify|Zod|Claude Agent SDK|Dumi|Father/);
    assert.match(homepage, /当前状态/);
    assert.match(homepage, /所在地/);
    assert.match(homepage, /具备 Node\.js\/Fastify AI Agent 服务与 Go 平台工具开发经验/);
    assert.match(homepage, /能够完成前端及 Java\/Go 服务的 Docker、Nginx 部署/);
    assert.match(qidunHighlights, /负责公司前端项目建设与迭代，覆盖 Vue、React、Next\.js 技术栈，支撑终端安全、云原生安全与自动化渗透测试等产品。/);
    assert.match(qidunHighlights, /随着自动化渗透测试业务发展，职责扩展至全栈交付，开发 Node\.js \/ Fastify Agent 任务服务，并参与 Java \/ Spring Boot 接口开发与联调。/);
    assert.match(qidunHighlights, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机及 DM8 数据库安全基线检查与测试验证。/);
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
    assert.match(printPage, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机及 DM8 数据库安全基线检查与测试验证。/);
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

test("renderHtmlSite turns project pages into structured case-study pages", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const projectPage = await fs.readFile(
      path.join(outputDir, "projects", "component-library", "index.html"),
      "utf8"
    );
    const baselineProjectPage = await fs.readFile(
      path.join(outputDir, "projects", "security-baseline-agent", "index.html"),
      "utf8"
    );
    const aiProjectPage = await fs.readFile(
      path.join(outputDir, "projects", "auto-pentest-platform", "index.html"),
      "utf8"
    );
    const documentAutomationPage = await fs.readFile(
      path.join(outputDir, "projects", "document-automation", "index.html"),
      "utf8"
    );

    assert.match(projectPage, /项目概览/);
    assert.match(projectPage, /项目背景/);
    assert.doesNotMatch(projectPage, /核心问题/);
    assert.match(projectPage, /解决方案/);
    assert.match(projectPage, /我负责的部分/);
    assert.match(projectPage, /项目结果/);
    assert.match(projectPage, /https:\/\/www\.busionline\.com/);
    assert.doesNotMatch(projectPage, /<strong>状态<\/strong>/);
    assert.doesNotMatch(projectPage, /<h2>Details<\/h2>/);
    assert.match(baselineProjectPage, /负责 Linux、Windows 主机与 DM8 数据库基线检查开发/);
    assert.match(aiProjectPage, /Java \/ Spring Boot/);
    assert.doesNotMatch(aiProjectPage, /<strong>周期<\/strong>/);
    assert.match(aiProjectPage, /Kali Linux Docker 执行环境/);
    assert.match(aiProjectPage, /Agent 任务运行时/);
    assert.match(aiProjectPage, /智能体包与源码准备、工作区管理、任务启动、中断恢复、追加输入、状态持久化和进程清理/);
    assert.match(aiProjectPage, /Web\/API 发现、白盒分析、测试用例生成和黑盒验证/);
    assert.match(documentAutomationPage, /Playwright \/ CDP/);
    assert.match(documentAutomationPage, /Playwright local \/ CDP 会话接入/);
    assert.match(documentAutomationPage, /5 个通用工具累计通过 30 项回归测试/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
