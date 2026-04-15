import fs from "node:fs/promises";
import path from "node:path";

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function replacePlaceholders(template, values) {
  let output = template;

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }

  return output;
}

function joinHref(basePath, relativePath) {
  let normalizedBase = basePath ?? "";

  if (normalizedBase === "/" || normalizedBase === "./") {
    normalizedBase = "";
  }

  if (normalizedBase && !normalizedBase.endsWith("/")) {
    normalizedBase = `${normalizedBase}/`;
  }

  return `${normalizedBase}${relativePath}`;
}

function renderList(items, className = "") {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return "";
  }

  const listClass = className ? ` class="${className}"` : "";
  const content = safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<ul${listClass}>${content}</ul>`;
}

function renderParagraphs(items) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return "";
  }

  return safeItems.map((item) => `<p>${escapeHtml(item)}</p>`).join("");
}

function parseMarkdownSections(markdown) {
  const sections = new Map();
  const lines = markdown.split("\n");
  let currentTitle = "";
  let currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (currentTitle) {
        sections.set(currentTitle, currentLines);
      }

      currentTitle = trimmed.slice(3).trim();
      currentLines = [];
      continue;
    }

    currentLines.push(trimmed);
  }

  if (currentTitle) {
    sections.set(currentTitle, currentLines);
  }

  return sections;
}

function formatPeriod(start, end) {
  return `${escapeHtml(start)} - ${escapeHtml(end)}`;
}

function formatStatus(status) {
  if (status === "ongoing") {
    return "进行中";
  }

  if (status === "completed") {
    return "已完成";
  }

  return status ? escapeHtml(status) : "未标注";
}

function getYearsOfExperience(resume) {
  const starts = resume.experience
    .map((item) => item.start)
    .filter(Boolean)
    .map((value) => new Date(`${value}-01T00:00:00Z`))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  if (starts.length === 0) {
    return null;
  }

  const first = starts[0];
  const now = new Date();
  let months = (now.getUTCFullYear() - first.getUTCFullYear()) * 12;
  months += now.getUTCMonth() - first.getUTCMonth();

  if (months < 12) {
    return "1 年+";
  }

  const years = Math.floor(months / 12);
  return `${years} 年+`;
}

function renderTagRow(items) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return "";
  }

  const tags = safeItems.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("");
  return `<div class="tag-row">${tags}</div>`;
}

function renderContact(resume) {
  const contactItems = [];

  if (hasValue(resume.basics.contact.email)) {
    const email = escapeHtml(resume.basics.contact.email);
    contactItems.push(["邮箱", `<a href="mailto:${email}">${email}</a>`]);
  }

  if (hasValue(resume.basics.contact.phone)) {
    contactItems.push(["电话", `<span>${escapeHtml(resume.basics.contact.phone)}</span>`]);
  }

  if (hasValue(resume.basics.links.github)) {
    const github = escapeHtml(resume.basics.links.github);
    contactItems.push(["GitHub", `<a href="${github}">${github}</a>`]);
  }

  if (hasValue(resume.basics.links.blog)) {
    const blog = escapeHtml(resume.basics.links.blog);
    contactItems.push(["博客", `<a href="${blog}">${blog}</a>`]);
  }

  if (contactItems.length === 0) {
    return "";
  }

  return contactItems
    .map(([label, value]) => {
      return [
        '<article class="contact-card">',
        `<strong>${escapeHtml(label)}</strong>`,
        value,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderHeroActions(resume, basePath = "/") {
  const actions = [
    {
      label: "GitHub",
      href: resume.basics.links.github,
      className: "action-link action-link-secondary"
    },
    {
      label: "博客",
      href: resume.basics.links.blog,
      className: "action-link action-link-secondary"
    }
  ];

  return actions
    .filter((action) => hasValue(action.href))
    .map((action) => {
      return `<a class="${action.className}" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
    })
    .join("");
}

function renderHeroMeta(resume) {
  const years = getYearsOfExperience(resume);
  const mainStack = resume.skills[0]?.keywords?.slice(0, 3).join(" / ") ?? "React / Vue / Next.js";
  const items = [
    ["经验年限", years ?? "5 年+"],
    ["主战栈", mainStack],
    ["当前状态", resume.basics.availability],
    ["所在地", resume.basics.location.city]
  ];

  return items
    .map(([label, value]) => {
      return [
        '<article class="meta-card">',
        `<strong>${escapeHtml(label)}</strong>`,
        `<span>${escapeHtml(value)}</span>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderHeroSignals(resume) {
  return resume.skills
    .slice(0, 3)
    .map((skill) => {
      return [
        '<article class="signal-card">',
        `<strong>${escapeHtml(skill.name)}</strong>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        renderTagRow(skill.keywords.slice(0, 2)),
        "</article>"
      ].join("");
    })
    .join("");
}

function renderCapabilityMatrix(resume) {
  const levelLabel = {
    strong: "核心能力",
    working: "协作能力"
  };

  return resume.skills
    .map((skill) => {
      const label = levelLabel[skill.level] ?? "能力项";

      return [
        '<article class="capability-card">',
        `<p class="card-label">${escapeHtml(label)}</p>`,
        `<h3>${escapeHtml(skill.name)}</h3>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        '<p class="card-support">代表技术</p>',
        renderTagRow(skill.keywords),
        "</article>"
      ].join("");
    })
    .join("");
}

function renderSelectedWork(resume, basePath = "/") {
  return resume.featuredProjects
    .map((project) => {
      const href = joinHref(basePath, `projects/${project.id}/`);
      const problem = project.problem?.[0] ?? "围绕业务平台的稳定交付与功能迭代推进。";
      const solution = project.summary?.[0] ?? "结合现有系统能力设计并落地实现。";
      const result = project.impact?.[0] ?? "完成目标能力交付并支撑后续迭代。";

      return [
        '<article class="project-card">',
        `<p class="project-meta">${escapeHtml(project.company)} / ${escapeHtml(project.role)} / ${formatPeriod(project.start, project.end)}</p>`,
        `<h3><a href="${href}">${escapeHtml(project.title)}</a></h3>`,
        renderTagRow(project.stack),
        '<div class="evidence-list">',
        `<div class="evidence-item"><strong>问题</strong><p>${escapeHtml(problem)}</p></div>`,
        `<div class="evidence-item"><strong>方案</strong><p>${escapeHtml(solution)}</p></div>`,
        `<div class="evidence-item"><strong>结果</strong><p>${escapeHtml(result)}</p></div>`,
        "</div>",
        `<p class="project-link"><a href="${href}">查看项目详情</a></p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderExperienceSnapshot(resume, basePath = "/") {
  return resume.experience
    .map((item) => {
      const projectLinks = item.projects
        .map((project) => {
          const href = joinHref(basePath, `projects/${project.id}/`);
          return `<a href="${href}">${escapeHtml(project.title)}</a>`;
        })
        .join(" / ");
      const leadPoint = item.summary[0] ?? "";

      return [
        '<article class="timeline-item">',
        `<p class="timeline-meta">${formatPeriod(item.start, item.end)} / ${escapeHtml(item.city)}</p>`,
        `<h3>${escapeHtml(item.company)} / ${escapeHtml(item.role)}</h3>`,
        `<p>${escapeHtml(leadPoint)}</p>`,
        renderTagRow(item.tech_stack?.slice(0, 4) ?? []),
        `<p class="timeline-links">${projectLinks}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderResourceLinks(resume, basePath = "/") {
  const resources = [
    {
      label: "打印版简历",
      description: "适合面试前快速通读完整履历。",
      href: joinHref(basePath, "print/")
    },
    {
      label: "公开 JSON",
      description: "方便程序化读取简历内容。",
      href: resume.branding.curl_endpoint
    },
    {
      label: "GitHub",
      description: "查看代码与公开项目记录。",
      href: resume.basics.links.github
    },
    {
      label: "博客",
      description: "查看技术文章与长期输出。",
      href: resume.basics.links.blog
    }
  ];

  return resources
    .filter((resource) => hasValue(resource.href))
    .map((resource) => {
      return [
        '<article class="resource-card">',
        `<strong>${escapeHtml(resource.label)}</strong>`,
        `<p>${escapeHtml(resource.description)}</p>`,
        `<a href="${escapeHtml(resource.href)}">${escapeHtml(resource.label)}</a>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderExperience(resume, basePath = "/") {
  return resume.experience
    .map((item) => {
      const projectLinks = item.projects
        .map((project) => {
          const href = joinHref(basePath, `projects/${project.id}/`);
          return `<a href="${href}">${escapeHtml(project.title)}</a>`;
        })
        .join(" / ");

      return [
        '<article class="resume-item">',
        `<h3>${escapeHtml(item.company)} / ${escapeHtml(item.role)}</h3>`,
        `<p class="timeline-meta">${formatPeriod(item.start, item.end)} / ${escapeHtml(item.city)}</p>`,
        renderList(item.summary),
        renderTagRow(item.tech_stack ?? []),
        `<p>${projectLinks}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderProjects(resume, basePath = "/") {
  return resume.featuredProjects
    .map((project) => {
      const href = joinHref(basePath, `projects/${project.id}/`);
      const problem = project.problem?.[0] ?? "";
      const result = project.impact?.[0] ?? "";

      return [
        '<article class="resume-item">',
        `<h3><a href="${href}">${escapeHtml(project.title)}</a></h3>`,
        `<p class="project-meta">${escapeHtml(project.company)} / ${formatPeriod(project.start, project.end)} / ${escapeHtml(project.stack.join(" / "))}</p>`,
        `<p><strong>问题：</strong>${escapeHtml(problem)}</p>`,
        `<p><strong>结果：</strong>${escapeHtml(result)}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderSkills(resume) {
  return resume.skills
    .map((skill) => {
      return [
        '<article class="resume-item">',
        `<h3>${escapeHtml(skill.name)}</h3>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        renderTagRow(skill.keywords),
        "</article>"
      ].join("");
    })
    .join("");
}

function renderProjectOverviewMeta(project) {
  const items = [
    ["角色", project.role],
    ["周期", `${project.start} - ${project.end}`],
    ["状态", formatStatus(project.status)],
    ["技术栈", project.stack.join(" / ")]
  ];

  return items
    .map(([label, value]) => {
      return [
        '<article class="meta-card">',
        `<strong>${escapeHtml(label)}</strong>`,
        `<span>${escapeHtml(value)}</span>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderProjectLinks(project) {
  const safeLinks = Array.isArray(project.links) ? project.links.filter(Boolean) : [];

  if (safeLinks.length === 0) {
    return "";
  }

  const links = safeLinks
    .map((link) => {
      return `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`;
    })
    .join("");

  return `<div class="project-links">${links}</div>`;
}

function renderProjectSection(title, content, kicker, dark = false) {
  const panelClass = dark ? "section-block panel panel-dark" : "section-block panel";
  const summaryClass = dark ? "section-copy section-copy-dark" : "section-copy";

  return [
    `<section class="${panelClass}">`,
    '<div class="section-heading">',
    `<p class="section-kicker">${escapeHtml(kicker)}</p>`,
    `<h2>${escapeHtml(title)}</h2>`,
    "</div>",
    `<div class="${summaryClass}">${content}</div>`,
    "</section>"
  ].join("");
}

async function renderPage({ layoutTemplate, pageTitle, bodyClass, content }) {
  return replacePlaceholders(layoutTemplate, {
    pageTitle: escapeHtml(pageTitle),
    bodyClass: escapeHtml(bodyClass),
    content
  });
}

async function loadTemplates(rootDir) {
  const templateDir = path.join(rootDir, "site", "templates");
  const [layout, home, print, project] = await Promise.all([
    fs.readFile(path.join(templateDir, "layout.html"), "utf8"),
    fs.readFile(path.join(templateDir, "home.html"), "utf8"),
    fs.readFile(path.join(templateDir, "print.html"), "utf8"),
    fs.readFile(path.join(templateDir, "project.html"), "utf8")
  ]);

  return { layout, home, print, project };
}

async function writePage(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function renderHomeContent({ resume, templates, basePath }) {
  return replacePlaceholders(templates.home, {
    eyebrow: `${escapeHtml(resume.variant.label)} / ${escapeHtml(resume.basics.location.city)}`,
    name: escapeHtml(resume.basics.displayName),
    headline: escapeHtml(resume.basics.headline.primary),
    summary: escapeHtml(resume.basics.summary.long),
    heroActions: renderHeroActions(resume, basePath),
    heroSignals: renderHeroSignals(resume),
    heroMeta: renderHeroMeta(resume),
    capabilityMatrix: renderCapabilityMatrix(resume),
    selectedWork: renderSelectedWork(resume, basePath),
    experienceSnapshot: renderExperienceSnapshot(resume, basePath),
    accessSummary: escapeHtml("完整简历、公开 JSON、命令行入口和联系方式统一放在这一屏，便于深读与联系。"),
    resourceLinks: renderResourceLinks(resume, basePath),
    commands: [
      "npx @zhangziheng/resume",
      `curl -sL ${resume.branding.curl_endpoint}`,
      `curl -sL ${resume.branding.man_endpoint} | man -l -`
    ]
      .map(escapeHtml)
      .join("\n"),
    contact: renderContact(resume)
  });
}

function renderPrintContent({ resume, templates, basePath }) {
  return replacePlaceholders(templates.print, {
    eyebrow: `${escapeHtml(resume.variant.label)} / ${escapeHtml(resume.basics.location.city)}`,
    name: escapeHtml(resume.basics.displayName),
    headline: escapeHtml(resume.basics.headline.primary),
    summary: `<p>${escapeHtml(resume.basics.summary.long)}</p>`,
    heroMeta: renderHeroMeta(resume),
    skills: renderSkills(resume),
    experience: renderExperience(resume, basePath),
    projects: renderProjects(resume, basePath),
    contact: renderContact(resume)
  });
}

function renderProjectContent({ project, templates }) {
  const sections = parseMarkdownSections(project.body ?? "");
  const background = sections.get("背景") ?? [];
  const headline = project.impact?.[0] ?? project.summary?.[0] ?? "围绕项目目标完成方案落地与能力交付。";
  const overview = renderProjectOverviewMeta(project);
  const backgroundHtml = renderParagraphs(background);
  const problemHtml = renderList(project.problem);
  const solutionHtml = renderList(project.summary);
  const responsibilityHtml = renderList(project.responsibility);
  const impactHtml = renderList(project.impact);
  const projectLinksHtml = renderProjectLinks(project);

  return replacePlaceholders(templates.project, {
    eyebrow: escapeHtml(project.company),
    title: escapeHtml(project.title),
    headline: escapeHtml(headline),
    overview: overview,
    background: `${backgroundHtml || "<p>项目围绕既定业务目标展开，并在现有系统基础上推进落地。</p>"}${projectLinksHtml}`,
    problem: problemHtml || "<p>围绕业务场景的关键问题展开分析与处理。</p>",
    solution: solutionHtml || "<p>结合现有系统能力设计并落地解决方案。</p>",
    responsibility: responsibilityHtml || "<p>承担核心实现与协作落地工作。</p>",
    impact: impactHtml || "<p>完成既定目标能力交付，并支撑后续迭代。</p>"
  });
}

export async function renderHtmlSite({ resume, rootDir, outputDir }) {
  const templates = await loadTemplates(rootDir);
  const homeContent = renderHomeContent({
    resume,
    templates,
    basePath: ""
  });
  const printContent = renderPrintContent({
    resume,
    templates,
    basePath: "../"
  });

  const homePage = await renderPage({
    layoutTemplate: templates.layout,
    pageTitle: `${resume.basics.displayName} | Resume`,
    bodyClass: "page-home",
    content: homeContent
  });

  const printPage = await renderPage({
    layoutTemplate: templates.layout,
    pageTitle: `${resume.basics.displayName} | Print Resume`,
    bodyClass: "page-print",
    content: printContent
  });

  await writePage(path.join(outputDir, "index.html"), homePage);
  await writePage(path.join(outputDir, "print", "index.html"), printPage);

  for (const project of resume.projects) {
    const projectContent = renderProjectContent({
      project,
      templates
    });
    const page = await renderPage({
      layoutTemplate: templates.layout,
      pageTitle: `${project.title} | ${resume.basics.displayName}`,
      bodyClass: "page-project",
      content: projectContent
    });

    await writePage(path.join(outputDir, "projects", project.id, "index.html"), page);
  }

  return {
    homepagePath: path.join(outputDir, "index.html"),
    printPagePath: path.join(outputDir, "print", "index.html")
  };
}
