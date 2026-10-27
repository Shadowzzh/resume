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
    assert.match(homepage, /全栈工程师/);
    assert.doesNotMatch(homepage, /AI 应用与工程化/);
    assert.doesNotMatch(homepage, /高级前端工程师 \/ AI 应用与工程化/);
    assert.match(homepage, /6 年\+ Web 开发经验，以企业级前端为主，主要使用 Vue、React、Next\.js，近年将职责扩展至 AI Agent 服务与全栈交付。/);
    assert.match(homepage, /负责安全平台前端与 Node\.js \/ Fastify Agent 执行控制服务/);
    assert.match(homepage, /独立交付 Go 跨平台基线检查工具/);
    assert.match(homepage, /具备 Docker 容器化与离线交付经验/);
    assert.match(homepage, /日常将 AI Agent 用于开发、测试和运维，并持续维护自建 Linux 服务。/);
    assert.match(homepage, /自动化渗透测试平台/);
    assert.match(homepage, /AI 产品文档生成工具箱/);
    assert.match(homepage, /<span class="project-owner-v5">个人项目<\/span>/);
    assert.doesNotMatch(homepage, /<span>2025-12 - 至今<\/span>/);
    assert.match(homepage, /跨平台主机安全基线检查工具/);
    assert.doesNotMatch(homepage, /experience-projects-v5/);
    assert.doesNotMatch(homepage, /class="badge-v5/);
    assert.doesNotMatch(homepage, /\[核心问题\]/);
    assert.match(skillsSection, /tech-label-v5">前端<\/div>/);
    assert.match(skillsSection, /Vite \/ Webpack 构建与升级经验，能够建设和维护 Monorepo、业务组件库与自动化测试，支持多环境及离线构建/);
    assert.match(skillsSection, /tech-label-v5">服务端<\/div>/);
    assert.match(homepage, /部署与交付/);
    assert.match(homepage, /熟练使用 JavaScript \/ TypeScript，具备 Vue 2 \/ Vue 3、React 与 Next\.js 企业级应用开发能力，能够独立承担中后台业务开发、组件封装、复杂交互与跨页面状态管理/);
    assert.match(homepage, /具备 Node\.js \/ Fastify 服务开发与架构设计能力，能够设计接口与任务执行机制，处理长任务状态持久化、会话恢复和进程管理，完成从开发联调到 Docker 部署及日志排障的交付链路/);
    assert.match(homepage, /具备 Docker、Nginx 与 Linux \/ Shell 实践，能够独立完成服务部署、镜像分层与离线交付，并结合应用、进程及容器日志进行故障定位和排查/);
    assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Zod|Dumi|Father/);
    assert.match(homepage, /当前状态/);
    assert.match(homepage, /所在地/);
    assert.match(qidunHighlights, /负责公司安全产品的前端建设与迭代，覆盖 Vue、React、Next\.js，支撑终端安全、云原生安全与自动化渗透测试等业务。/);
    assert.match(qidunHighlights, /主导 Node\.js \/ Fastify Agent 执行控制服务开发，负责平台前端与任务服务的联调交付，并参与 Java \/ Spring Boot 接口开发。/);
    assert.match(qidunHighlights, /独立开发并交付 Go 跨平台主机安全基线检查工具，覆盖 Linux \/ Windows，完成规则执行框架、平台适配、测试验证与多架构构建发布。/);
    assert.match(qidunHighlights, /建设 AI Agent 容器化运行环境，完成 Kali Linux 镜像分层、离线交付与客户环境部署，并承担运行日志分析和故障排查。/);
    assert.match(wotuHighlights, /建设多平台通用业务组件，对 UI 组件进行二次封装，推动多个业务项目统一升级组件库版本，支撑跨项目复用。/);

    // 元和早期经历：首页只讲部分业务页面开发维护与后端联调，不包装组件抽象或复用成果
    const yuanheHome = homepage.match(
      /苏州元和信息有限公司 · 前端开发工程师[\s\S]*?<\/article>/
    )?.[0] ?? "";
    assert.ok(yuanheHome, "the finance review experience is rendered on the homepage");
    assert.match(yuanheHome, /在既定项目框架下，参与财务评审系统部分业务页面开发与维护/);
    assert.match(yuanheHome, /与相应后端完成接口联调/);
    assert.doesNotMatch(yuanheHome, /抽象可复用业务组件|封装业务组件|提升页面复用性/);
    assert.match(homepage, /邮箱/);
    assert.doesNotMatch(homepage, /tel:/);
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
    assert.match(printPage, /负责公司安全产品的前端建设与迭代，覆盖 Vue、React、Next\.js，支撑终端安全、云原生安全与自动化渗透测试等业务。/);
    assert.match(printPage, /主导 Node\.js \/ Fastify Agent 执行控制服务开发，负责平台前端与任务服务的联调交付，并参与 Java \/ Spring Boot 接口开发。/);
    assert.match(printPage, /独立开发并交付 Go 跨平台主机安全基线检查工具，覆盖 Linux \/ Windows，完成规则执行框架、平台适配、测试验证与多架构构建发布。/);
    assert.match(printPage, /建设 AI Agent 容器化运行环境，完成 Kali Linux 镜像分层、离线交付与客户环境部署，并承担运行日志分析和故障排查。/);
    assert.match(printPage, /2024-03 - 至今 \/ 杭州西湖区/);
    assert.match(printPage, /React<\/span><span class="tag">Vue 3<\/span><span class="tag">Next\.js<\/span><span class="tag">Node\.js<\/span><span class="tag">Go<\/span><span class="tag">Java \/ Spring Boot<\/span><span class="tag">Docker/);
    assert.match(printPage, /负责培训平台、CMS 系统与营销活动低代码平台等业务前端开发，覆盖 Vue \/ React 中后台、H5 与钉钉小程序。/);
    assert.match(printPage, /建设多平台通用业务组件，对 UI 组件进行二次封装，推动多个业务项目统一升级组件库版本，支撑跨项目复用。/);
    assert.doesNotMatch(printPage, /Dumi|Father/);
    assert.match(printPage, /在既定项目框架下，参与财务评审系统部分业务页面开发与维护，使用 Vue 3 \+ Tailwind CSS 完成页面实现，并与相应后端完成接口联调。/);
    assert.doesNotMatch(printPage, /负责财务评审系统前端开发与迭代/);
    assert.doesNotMatch(printPage, /财务评审系统[^<]*?(?:抽象可复用业务组件|封装业务组件|提升业务页面复用度|降低后续页面开发成本)/);
    assert.doesNotMatch(printPage, /电话/);
    assert.doesNotMatch(printPage, /\bundefined\b/);
    assert.doesNotMatch(printPage, /\bnull\b/);
    assert.doesNotMatch(printPage, /<h2>项目经验<\/h2>/);
    assert.doesNotMatch(printPage, /核心技术栈/);
    assert.doesNotMatch(printPage, /访问方式/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite renders the featured company projects and the official sites in order", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-official-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");
    const projectsStart = homepage.indexOf("核心项目经历");
    const personalStart = homepage.indexOf("个人项目", projectsStart);
    const companySection = homepage.slice(projectsStart, personalStart);

    const companyTitles = [
      "自动化渗透测试平台",
      "企业安全产品官网建设与迭代",
      "主机安全基线检查工具",
      "移动端自动化探索与接口资产梳理"
    ];
    const positions = companyTitles.map((title) => companySection.indexOf(title));

    positions.forEach((position, index) => {
      assert.notEqual(position, -1, `${companyTitles[index]} should be rendered on the homepage`);
    });
    assert.deepEqual(
      [...positions].sort((left, right) => left - right),
      positions,
      "company projects keep the variant order on the homepage"
    );

    assert.match(
      companySection,
      /安全业务包含多条产品线，需要一个统一的企业官网承载产品介绍、案例展示、咨询入口与资料下载，并支持栏目持续迭代。/
    );
    assert.match(
      companySection,
      /负责官网整体设计与前端开发，基于 Next\.js \+ React \+ Tailwind CSS 搭建多栏目产品页与响应式可复用组件；实现咨询表单校验与服务端邮件通知，完成下载中心访问校验与下载服务，并补充容器化部署配置。/
    );
    assert.match(
      companySection,
      /官网从产品展示延伸到线索收集与资料下载：咨询表单完成校验与邮件通知，下载中心完成访问校验与下载服务，形成完整功能链路；以共享组件与统一页面结构支撑多栏目持续迭代，并具备 standalone 构建与容器化部署配置。/
    );
    assert.doesNotMatch(companySection, /内容驱动企业官网/);

    assert.match(
      printPage,
      /企业安全产品官网建设与迭代<\/h3>[\s\S]*?负责：<\/strong>负责官网整体设计与前端开发，基于 Next\.js \+ React \+ Tailwind CSS 搭建多栏目产品页与响应式可复用组件；实现咨询表单校验与服务端邮件通知，完成下载中心访问校验与下载服务，并补充容器化部署配置。/
    );
    assert.match(
      printPage,
      /结果：<\/strong>官网从产品展示延伸到线索收集与资料下载：咨询表单完成校验与邮件通知，下载中心完成访问校验与下载服务，形成完整功能链路。/
    );

    assert.doesNotMatch(homepage, /内容驱动企业官网/);
    assert.doesNotMatch(printPage, /内容驱动企业官网/);
    assert.doesNotMatch(homepage, /lisu-official-site/);
    assert.doesNotMatch(printPage, /lisu-official-site/);
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

    assert.match(homepage, /AI 产品文档生成工具箱/);
    assert.doesNotMatch(homepage, /experience-projects-v5/);
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

test("renderHtmlSite renders the revised APP chain and the personal project copy in homepage and print", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-personal-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");

    // APP 卡片：背景 / 职责 / 结果三处都保留功能大纲、接口资产与拓扑
    const mobileCard =
      homepage.match(
        /<span class="project-title-v5">移动端自动化探索与接口资产梳理<\/span>[\s\S]*?<\/article>/
      )?.[0] ?? "";
    assert.ok(mobileCard, "the revised mobile project card is rendered on the homepage");

    const background = mobileCard.match(/\[项目背景\]<\/span> ([^<]*)<\/li>/)?.[1] ?? "";
    const responsibility = mobileCard.match(/\[负责内容\]<\/span> ([^<]*)<\/li>/)?.[1] ?? "";
    const result = mobileCard.match(/\[项目结果\]<\/span> ([^<]*)<\/li>/)?.[1] ?? "";

    assert.match(background, /快速摸清 APP 的功能入口、业务操作、接口调用与后端服务关系/);
    assert.match(background, /同步采集网络流量/);
    assert.match(background, /静态代码分析/);
    assert.match(background, /功能大纲/);
    assert.match(background, /接口资产/);
    assert.match(background, /架构拓扑/);

    assert.match(responsibility, /Mobilewright/);
    assert.match(responsibility, /mitmproxy/);
    assert.match(responsibility, /静态分析/);
    assert.match(responsibility, /功能大纲/);
    assert.match(responsibility, /接口资产/);
    assert.match(responsibility, /拓扑/);

    assert.match(result, /功能大纲/);
    assert.match(result, /接口清单/);
    assert.match(result, /拓扑/);
    assert.doesNotMatch(mobileCard, /\bundefined\b/);
    assert.doesNotMatch(mobileCard, /\bnull\b/);

    const printMobile =
      printPage.match(
        /<article class="resume-item"><h3>移动端自动化探索与接口资产梳理<\/h3>[\s\S]*?<\/article>/
      )?.[0] ?? "";
    assert.ok(printMobile, "the revised mobile project is rendered on the print page");
    for (const keyword of [/功能大纲/, /mitmproxy/, /静态分析/, /接口资产/, /拓扑/]) {
      assert.match(printMobile, keyword, "print page keeps the APP interface-asset chain");
    }

    // 首页个人区：VideoDoc 在前、文档工具在后，各自恰好 2 条摘要 li
    const personalStart = homepage.indexOf('<div class="section-title-v5">个人项目</div>');
    assert.notEqual(personalStart, -1, "homepage renders the personal project section");
    const personalSection = homepage.slice(personalStart);
    assert.ok(
      personalSection.indexOf("视频转图文工作台") < personalSection.indexOf("AI 产品文档生成工具箱"),
      "VideoDoc comes before the documentation toolkit in the personal section"
    );

    const personalCards = personalSection
      .split('<article class="project-card-v5">')
      .slice(1);
    assert.equal(personalCards.length, 2, "the personal section holds exactly two cards");
    const [videodocCard, documentationCard] = personalCards;
    assert.match(videodocCard, /<span class="project-title-v5">视频转图文工作台<\/span>/);
    // VideoDoc 卡片：通用在线视频下载 + 平台示例，不限定单一平台
    assert.match(videodocCard, /下载在线视频/);
    assert.match(videodocCard, /X（Twitter）/);
    assert.match(videodocCard, /YouTube/);
    assert.match(videodocCard, /哔哩哔哩/);
    assert.match(videodocCard, /等平台/);
    assert.doesNotMatch(videodocCard, /Bilibili|仅支持/);
    assert.match(documentationCard, /<span class="project-title-v5">AI 产品文档生成工具箱<\/span>/);

    for (const card of personalCards) {
      assert.match(card, /<div class="project-tech-v5">技术栈：/);
      const bullets = card.match(/<ul class="point-list-v5">([\s\S]*?)<\/ul>/)?.[1] ?? "";
      assert.equal((bullets.match(/<li>/g) ?? []).length, 2, "each personal card keeps two summary items");
      assert.equal((card.match(/<li>/g) ?? []).length, 2, "tech stack is not counted as a summary item");
      assert.doesNotMatch(bullets, /技术栈：/);
      assert.doesNotMatch(card, /\bundefined\b/);
      assert.doesNotMatch(card, /\bnull\b/);
    }

    assert.match(documentationCard, /将“现场判断”与“稳定动作”分离/);
    assert.match(documentationCard, /会话复用/);
    assert.match(documentationCard, /临时脱敏/);
    assert.match(documentationCard, /SVG 标注/);

    // 打印页个人项目：同样 VideoDoc 在前，各 2 条摘要，中文双引号可见
    const printVideodoc =
      printPage.match(
        /<article class="resume-item"><h3>视频转图文工作台<\/h3>[\s\S]*?<\/article>/
      )?.[0] ?? "";
    const printDocumentation =
      printPage.match(
        /<article class="resume-item"><h3>AI 产品文档生成工具箱<\/h3>[\s\S]*?<\/article>/
      )?.[0] ?? "";
    assert.ok(printVideodoc, "VideoDoc is rendered on the print page");
    assert.match(printVideodoc, /下载在线视频/);
    assert.match(printVideodoc, /X（Twitter）/);
    assert.match(printVideodoc, /哔哩哔哩/);
    assert.match(printVideodoc, /等平台/);
    assert.ok(printDocumentation, "the documentation toolkit is rendered on the print page");
    const printPersonalArea = printPage.slice(printPage.indexOf(printMobile) + printMobile.length);
    assert.ok(
      printPersonalArea.indexOf("视频转图文工作台") < printPersonalArea.indexOf("AI 产品文档生成工具箱"),
      "print personal area keeps VideoDoc before the documentation toolkit"
    );
    assert.equal(
      printPersonalArea.indexOf("AI 产品文档生成工具箱"),
      printPersonalArea.lastIndexOf("AI 产品文档生成工具箱"),
      "the documentation toolkit heading appears once in the personal area"
    );
    for (const article of [printVideodoc, printDocumentation]) {
      assert.equal(
        (article.match(/<li>/g) ?? []).length,
        2,
        "print page renders two summary items per personal project"
      );
    }
    assert.match(printDocumentation, /将“现场判断”与“稳定动作”分离/);

    // 旧标题不再出现在真实输出中
    assert.doesNotMatch(homepage, /浏览器自动化生成产品文档/);
    assert.doesNotMatch(printPage, /浏览器自动化生成产品文档/);
    assert.doesNotMatch(homepage, /移动端自动化信息采集与攻击面梳理/);
    assert.doesNotMatch(printPage, /移动端自动化信息采集与攻击面梳理/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

// 备选项目不在首页/打印页的精选列表里，这里直接核对内容底稿：
// 财务评审系统只写部分业务页面开发维护 + 后端联调，以及线上留痕归档的口径。
test("the finance review project keeps the confirmed partial-page and archiving scope", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  const finance = resume.projects.find((project) => project.id === "finance-review-system");
  assert.ok(finance, "finance-review-system stays in the content source as a backup project");
  assert.equal(finance.featured, false, "the finance review project is not promoted to a featured project");

  assert.match(
    finance.summary[0],
    /在既定项目框架下参与财务评审系统部分后台业务页面开发与维护/
  );
  assert.match(finance.summary[0], /接口联调/);
  assert.match(finance.summary[1], /^系统配合线下评审/);
  assert.match(finance.summary[1], /过程留痕与归档/);
  assert.match(finance.problem[0], /线下流程仍需照常办理/);
  assert.match(finance.impact[0], /完成分配的业务页面功能与接口联调/);
  assert.ok(finance.responsibility.includes("前后端接口联调"));

  assert.match(finance.body, /线下评审业务仍要正常办理/);
  assert.match(finance.body, /leader 负责整体搭建、架构与技术选型/);
  assert.match(finance.body, /参与部分后台业务页面的开发与维护/);

  // 旧稿的组件抽象、页面复用与降本成果没有事实依据，不应再回到内容源
  const financeText = [
    finance.body,
    ...(finance.summary ?? []),
    ...(finance.problem ?? []),
    ...(finance.impact ?? []),
    ...(finance.responsibility ?? [])
  ].join("\n");
  for (const legacyClaim of [
    /组件抽象/,
    /可复用业务组件/,
    /页面复用/,
    /封装业务组件/,
    /配置化/,
    /降低后续页面开发成本/
  ]) {
    assert.doesNotMatch(financeText, legacyClaim, `finance copy should not claim: ${legacyClaim}`);
  }
});
