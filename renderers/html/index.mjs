import fs from "node:fs/promises";
import path from "node:path";

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

function renderMarkdownBody(markdown) {
  const lines = markdown.split("\n");
  const html = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("## ")) {
      html.push(`<h3>${escapeHtml(trimmed.slice(3))}</h3>`);
      continue;
    }

    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  return html.join("\n");
}

function joinHref(basePath, relativePath) {
  let normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;

  if (normalizedBase.startsWith("/")) {
    normalizedBase = normalizedBase.slice(1);
  }

  return new URL(relativePath, `https://resume.local/${normalizedBase}`).pathname;
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
      const summary = item.summary.map((text) => `<li>${escapeHtml(text)}</li>`).join("");

      return [
        '<article class="resume-item">',
        `<h3>${escapeHtml(item.company)} | ${escapeHtml(item.role)}</h3>`,
        `<p class="timeline-meta">${escapeHtml(item.start)} - ${escapeHtml(item.end)} | ${escapeHtml(item.city)}</p>`,
        `<ul>${summary}</ul>`,
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
      const summary = project.summary.map((text) => `<li>${escapeHtml(text)}</li>`).join("");

      return [
        '<article class="resume-item">',
        `<h3><a href="${href}">${escapeHtml(project.title)}</a></h3>`,
        `<p class="project-meta">${escapeHtml(project.stack.join(" / "))}</p>`,
        `<ul>${summary}</ul>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderSkills(resume) {
  return resume.skills
    .map((skill) => {
      const tags = skill.keywords.map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`).join("");

      return [
        '<article class="resume-item">',
        `<h3>${escapeHtml(skill.name)}</h3>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        `<div class="tag-row">${tags}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderContact(resume) {
  return [
    [
      '<article class="contact-card">',
      "<strong>邮箱</strong>",
      `<a href="mailto:${escapeHtml(resume.basics.contact.email)}">${escapeHtml(resume.basics.contact.email)}</a>`,
      "</article>"
    ].join(""),
    [
      '<article class="contact-card">',
      "<strong>电话</strong>",
      `<span>${escapeHtml(resume.basics.contact.phone)}</span>`,
      "</article>"
    ].join(""),
    [
      '<article class="contact-card">',
      "<strong>GitHub</strong>",
      `<a href="${escapeHtml(resume.basics.links.github)}">${escapeHtml(resume.basics.links.github)}</a>`,
      "</article>"
    ].join(""),
    [
      '<article class="contact-card">',
      "<strong>博客</strong>",
      `<a href="${escapeHtml(resume.basics.links.blog)}">${escapeHtml(resume.basics.links.blog)}</a>`,
      "</article>"
    ].join("")
  ].join("");
}

function renderHeroMeta(resume) {
  const items = [
    ["所在地", resume.basics.location.city],
    ["方向", "前端工程 / 工具链 / AI 协作"],
    [
      "技术栈",
      [
        resume.skills[0]?.keywords[0],
        resume.skills[0]?.keywords[1],
        resume.skills[0]?.keywords[2],
        "Node.js"
      ]
        .filter(Boolean)
        .join(", ")
    ],
    ["当前状态", resume.basics.availability]
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

function renderSelectedWork(resume, basePath = "/") {
  return resume.featuredProjects
    .map((project) => {
      const href = joinHref(basePath, `projects/${project.id}/`);
      const highlights = project.summary.map((text) => `<li>${escapeHtml(text)}</li>`).join("");

      return [
        '<article class="project-card">',
        `<p class="project-meta">${escapeHtml(project.stack.join(" / "))}</p>`,
        `<h3><a href="${href}">${escapeHtml(project.title)}</a></h3>`,
        `<p>${escapeHtml(project.company)}</p>`,
        `<ul>${highlights}</ul>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderCapabilityMatrix(resume) {
  return resume.skills
    .map((skill) => {
      const tags = skill.keywords.map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`).join("");

      return [
        '<article class="capability-card">',
        `<h3>${escapeHtml(skill.name)}</h3>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        `<div class="tag-row">${tags}</div>`,
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

      return [
        '<article class="timeline-item">',
        `<p class="timeline-meta">${escapeHtml(item.start)} - ${escapeHtml(item.end)} | ${escapeHtml(item.city)}</p>`,
        `<h3>${escapeHtml(item.company)} | ${escapeHtml(item.role)}</h3>`,
        `<p>${escapeHtml(item.summary[0])}</p>`,
        `<p>${projectLinks}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
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
    headline: `${escapeHtml(resume.basics.headline.primary)} / ${escapeHtml(resume.basics.headline.secondary)}`,
    summary: escapeHtml(resume.basics.summary.long),
    heroMeta: renderHeroMeta(resume),
    selectedWork: renderSelectedWork(resume, basePath),
    capabilityMatrix: renderCapabilityMatrix(resume),
    experienceSnapshot: renderExperienceSnapshot(resume, basePath),
    accessSummary: escapeHtml("可通过 npm 包、JSON 接口或 man 手册查看简历内容。"),
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
    headline: `${escapeHtml(resume.basics.headline.primary)} / ${escapeHtml(resume.basics.headline.secondary)}`,
    summary: `<p>${escapeHtml(resume.basics.summary.long)}</p>`,
    heroMeta: renderHeroMeta(resume),
    experience: renderExperience(resume, basePath),
    projects: renderProjects(resume, basePath),
    skills: renderSkills(resume),
    contact: renderContact(resume)
  });
}

export async function renderHtmlSite({ resume, rootDir, outputDir }) {
  const templates = await loadTemplates(rootDir);
  const homeContent = renderHomeContent({
    resume,
    templates,
    basePath: "/resume/"
  });
  const printContent = renderPrintContent({
    resume,
    templates,
    basePath: "/resume/"
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
    const projectContent = replacePlaceholders(templates.project, {
      eyebrow: escapeHtml(project.company),
      title: escapeHtml(project.title),
      summary: escapeHtml(project.summary.join(" ")),
      meta: escapeHtml(`${project.start} - ${project.end} | ${project.stack.join(" / ")}`),
      body: renderMarkdownBody(project.body)
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
