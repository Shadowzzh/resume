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
  return `${escapeHtml(start)} - ${escapeHtml(formatPeriodValue(end))}`;
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

function formatPeriodValue(value) {
  if (value === "present") {
    return "至今";
  }

  return value;
}

function renderInlinePills(items, className) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return "";
  }

  return safeItems
    .map((item) => `<span class="${className}">${escapeHtml(item)}</span>`)
    .join("");
}

function renderSummaryParagraphs(summary) {
  return String(summary ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(
      (item) =>
        `<p class="max-w-3xl text-base leading-8 text-zinc-600 md:text-lg md:leading-8">${escapeHtml(item)}</p>`
    )
    .join("");
}

function findSkill(resume, skillId) {
  return resume.skills.find((item) => item.id === skillId) ?? null;
}

function renderHeroPills(resume) {
  const topKeywords = [];

  for (const skill of resume.skills) {
    for (const keyword of skill.keywords ?? []) {
      if (!topKeywords.includes(keyword)) {
        topKeywords.push(keyword);
      }

      if (topKeywords.length >= 6) {
        break;
      }
    }

    if (topKeywords.length >= 6) {
      break;
    }
  }

  return renderInlinePills(
    topKeywords,
    "inline-flex min-h-10 items-center rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-700"
  );
}

function renderQuickFacts(resume) {
  const years = getYearsOfExperience(resume);
  const facts = [
    ["经验年限", years ?? "5 年+"],
    ["所在地", `${resume.basics.location.city} · ${resume.basics.location.region}`],
    ["当前状态", resume.basics.availability],
    ["职业重心", "前端主导 / 服务端协作 / 部署交付"]
  ];

  return facts
    .map(([label, value]) => {
      return [
        '<article class="rounded-[24px] border border-zinc-200 bg-zinc-50/90 p-5 shadow-sm shadow-zinc-950/5">',
        `<p class="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">${escapeHtml(label)}</p>`,
        `<p class="text-base font-semibold leading-7 text-zinc-900">${escapeHtml(value)}</p>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderStrengthCards(resume) {
  const frontend = findSkill(resume, "frontend");
  const backend = findSkill(resume, "backend");
  const delivery = findSkill(resume, "delivery");
  const engineering = findSkill(resume, "engineering");
  const cards = [
    {
      label: "Value 01",
      title: "前端主导交付",
      description:
        frontend?.narrative ??
        "熟练使用 React、Next.js 与 Vue，能承担平台型与中后台前端交付。",
      tags: frontend?.keywords?.slice(0, 4) ?? ["React", "Next.js", "Vue 2", "Vue 3"]
    },
    {
      label: "Value 02",
      title: "服务端与交付协作",
      description: [
        backend?.narrative ?? "具备 Go 工具开发经验，可参与 Java 服务维护和接口联调。",
        delivery?.narrative ?? "具备 Docker、Nginx 和 Linux 环境下的部署交付经验。"
      ].join(" "),
      tags: [
        ...(backend?.keywords ?? ["Go", "Java / Spring Boot"]),
        ...((delivery?.keywords ?? ["Docker", "Nginx"]).slice(0, 2))
      ]
    },
    {
      label: "Value 03",
      title: "前端工程化与质量",
      description:
        engineering?.narrative ??
        "具备构建配置、Monorepo、组件库和自动化测试实践。",
      tags: engineering?.keywords ?? ["Vite / Webpack", "Monorepo", "组件库", "单元测试"]
    }
  ];

  return cards
    .map((item) => {
      return [
        '<article class="flex h-full flex-col gap-5 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">',
        `<p class="font-mono text-[11px] uppercase tracking-[0.28em] text-blue-700">${escapeHtml(item.label)}</p>`,
        `<div class="space-y-3"><h3 class="text-xl font-semibold tracking-[-0.03em] text-zinc-950">${escapeHtml(item.title)}</h3>`,
        `<p class="text-sm leading-7 text-zinc-600">${escapeHtml(item.description)}</p></div>`,
        `<div class="mt-auto flex flex-wrap gap-2">${renderInlinePills(
          item.tags,
          "inline-flex min-h-9 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700"
        )}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function orderFeaturedProjects(projects) {
  return [...projects];
}

function renderFeaturedProjectCards(resume, basePath = "/") {
  return orderFeaturedProjects(resume.featuredProjects)
    .map((project) => {
      const href = joinHref(basePath, `projects/${project.id}/`);
      const problem = project.problem?.[0] ?? "围绕业务平台的稳定交付与功能迭代推进。";
      const solution = project.summary?.[0] ?? "结合现有系统能力设计并落地实现。";
      const result = project.impact?.[0] ?? "完成目标能力交付并支撑后续迭代。";
      const categories = project.category?.slice(0, 2) ?? [];

      return [
        '<article class="flex h-full flex-col rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1">',
        `<div class="mb-5 flex flex-wrap items-center gap-2">${renderInlinePills(
          categories,
          "inline-flex min-h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700"
        )}</div>`,
        `<div class="space-y-4"><div class="space-y-2"><p class="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">${escapeHtml(
          `${project.company} / ${project.role}`
        )}</p>`,
        `<h3 class="text-[1.35rem] font-semibold tracking-[-0.035em] text-zinc-950"><a class="text-inherit hover:text-blue-700" href="${href}">${escapeHtml(project.title)}</a></h3></div>`,
        `<div class="flex flex-wrap gap-2">${renderInlinePills(
          project.stack,
          "inline-flex min-h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700"
        )}</div></div>`,
        '<div class="mt-6 space-y-4 border-t border-zinc-100 pt-6">',
        `<div><p class="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">问题</p><p class="text-sm leading-7 text-zinc-600">${escapeHtml(problem)}</p></div>`,
        `<div><p class="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">负责内容</p><p class="text-sm leading-7 text-zinc-600">${escapeHtml(solution)}</p></div>`,
        `<div><p class="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">结果</p><p class="text-sm leading-7 text-zinc-600">${escapeHtml(result)}</p></div>`,
        "</div>",
        `<div class="mt-6"><a class="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:border-blue-700 hover:text-blue-700" href="${href}">查看项目详情</a></div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderExperienceTimeline(resume, basePath = "/") {
  return resume.experience
    .map((item) => {
      const projectLinks = item.projects
        .map((project) => {
          const href = joinHref(basePath, `projects/${project.id}/`);
          return `<a class="text-sm font-medium text-blue-700 hover:text-blue-900" href="${href}">${escapeHtml(project.title)}</a>`;
        })
        .join('<span class="text-zinc-300">/</span>');
      const leadPoint = item.summary[0] ?? "";

      return [
        '<article class="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">',
        '<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">',
        '<div class="space-y-3">',
        `<p class="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">${escapeHtml(
          `${formatPeriod(item.start, item.end)} / ${item.city}`
        )}</p>`,
        `<h3 class="text-xl font-semibold tracking-[-0.03em] text-zinc-950">${escapeHtml(item.company)} / ${escapeHtml(item.role)}</h3>`,
        `<p class="max-w-3xl text-sm leading-7 text-zinc-600">${escapeHtml(leadPoint)}</p>`,
        "</div>",
        `<div class="flex flex-wrap gap-2 lg:max-w-sm">${renderInlinePills(
          item.tech_stack?.slice(0, 4) ?? [],
          "inline-flex min-h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700"
        )}</div>`,
        "</div>",
        `<div class="mt-5 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">${projectLinks}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderSkillSections(resume) {
  return resume.skills
    .map((skill) => {
      return [
        '<article class="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">',
        `<p class="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">${escapeHtml(
          skill.level === "strong" ? "核心能力" : "扩展能力"
        )}</p>`,
        `<h3 class="text-xl font-semibold tracking-[-0.03em] text-zinc-950">${escapeHtml(skill.name)}</h3>`,
        `<p class="mt-3 text-sm leading-7 text-zinc-600">${escapeHtml(skill.narrative)}</p>`,
        `<div class="mt-5 flex flex-wrap gap-2">${renderInlinePills(
          skill.keywords,
          "inline-flex min-h-8 items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-700"
        )}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderHomeResources(resume, basePath = "/") {
  const resources = [
    {
      label: "打印版简历",
      description: "适合 PDF 导出或面试前快速通读完整履历。",
      href: joinHref(basePath, "print/")
    },
    {
      label: "公开 JSON",
      description: "方便程序化读取简历内容和后续集成。",
      href: resume.branding.curl_endpoint
    },
    {
      label: "GitHub",
      description: "查看代码、公开项目记录和持续输出。",
      href: resume.basics.links.github
    },
    {
      label: "博客",
      description: "查看技术文章与长期沉淀内容。",
      href: resume.basics.links.blog
    }
  ];

  return resources
    .filter((item) => hasValue(item.href))
    .map((item) => {
      return [
        '<article class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">',
        `<p class="mb-2 text-base font-semibold text-white">${escapeHtml(item.label)}</p>`,
        `<p class="text-sm leading-7 text-zinc-300">${escapeHtml(item.description)}</p>`,
        `<a class="mt-4 inline-flex min-h-10 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-blue-300 hover:text-blue-200" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderHomeContact(resume) {
  const items = [];

  if (hasValue(resume.basics.contact.email)) {
    const email = escapeHtml(resume.basics.contact.email);
    items.push(["邮箱", `<a class="text-zinc-50 hover:text-blue-200" href="mailto:${email}">${email}</a>`]);
  }

  if (hasValue(resume.basics.links.github)) {
    const github = escapeHtml(resume.basics.links.github);
    items.push(["GitHub", `<a class="text-zinc-50 hover:text-blue-200" href="${github}">${github}</a>`]);
  }

  if (hasValue(resume.basics.links.blog)) {
    const blog = escapeHtml(resume.basics.links.blog);
    items.push(["博客", `<a class="text-zinc-50 hover:text-blue-200" href="${blog}">${blog}</a>`]);
  }

  return items
    .map(([label, value]) => {
      return [
        '<article class="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">',
        `<p class="mb-2 font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-400">${escapeHtml(label)}</p>`,
        `<div class="break-all text-sm font-medium leading-7 text-zinc-50">${value}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function shortenUrl(url) {
  return String(url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function renderIconSvg(iconId) {
  if (iconId === "location") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 4.42 5.38 11.03 6.01 11.8a1.25 1.25 0 001.98 0C13.62 20.03 19 13.42 19 9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg>';
  }

  if (iconId === "status") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6c-1.1 0-2 .9-2 2v16l4-3h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm4 4v9h-2V6h2zm2 0h2v9h-2V6z"/></svg>';
  }

  if (iconId === "email") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>';
  }

  if (iconId === "phone") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>';
  }

  if (iconId === "github") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>';
  }

  if (iconId === "blog") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 9h-3.08a15.8 15.8 0 00-1.14-5.01A8.03 8.03 0 0118.93 11zM12 4c.88 1.27 1.63 3.31 1.84 5.99h-3.68C10.37 7.31 11.12 5.27 12 4zM9.29 5.99A15.8 15.8 0 008.15 11H5.07a8.03 8.03 0 014.22-5.01zM5.07 13h3.08c.14 1.82.53 3.62 1.14 5.01A8.03 8.03 0 015.07 13zm6.93 7c-.88-1.27-1.63-3.31-1.84-5.99h3.68c-.21 2.68-.96 4.72-1.84 5.99zm2.71-1.99c.61-1.39 1-3.19 1.14-5.01h3.08a8.03 8.03 0 01-4.22 5.01z"/></svg>';
  }

  if (iconId === "project") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
  }

  return "";
}

function renderHeaderSummary(summary) {
  return String(summary ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");
}

function renderContactStrip(resume) {
  const items = [];

  if (hasValue(resume.basics.location.city)) {
    const locationParts = [resume.basics.location.city, resume.basics.location.region].filter(Boolean);
    items.push({
      icon: "location",
      label: "所在地",
      text: locationParts.join(" · ")
    });
  }

  if (hasValue(resume.basics.availability)) {
    items.push({
      icon: "status",
      label: "当前状态",
      text: resume.basics.availability
    });
  }

  if (hasValue(resume.basics.contact.email)) {
    items.push({
      icon: "email",
      label: "邮箱",
      text: resume.basics.contact.email,
      href: `mailto:${resume.basics.contact.email}`
    });
  }

  if (hasValue(resume.basics.contact.phone)) {
    items.push({
      icon: "phone",
      label: "电话",
      text: resume.basics.contact.phone,
      href: `tel:${resume.basics.contact.phone}`
    });
  }

  if (hasValue(resume.basics.links.github)) {
    items.push({
      icon: "github",
      label: "GitHub",
      text: shortenUrl(resume.basics.links.github),
      href: resume.basics.links.github
    });
  }

  if (hasValue(resume.basics.links.blog)) {
    items.push({
      icon: "blog",
      label: "博客",
      text: shortenUrl(resume.basics.links.blog),
      href: resume.basics.links.blog
    });
  }

  return items
    .map((item) => {
      const content = hasValue(item.href)
        ? `<a href="${escapeHtml(item.href)}"><span class="contact-label-v5">${escapeHtml(item.label)}</span>${escapeHtml(
            item.text
          )}</a>`
        : `<span><span class="contact-label-v5">${escapeHtml(item.label)}</span>${escapeHtml(item.text)}</span>`;

      return [
        '<div class="contact-item-v5">',
        renderIconSvg(item.icon),
        content,
        "</div>"
      ].join("");
    })
    .join("");
}

function renderSkillRowsV5(resume) {
  return resume.skills
    .map((skill) => {
      return [
        '<div class="tech-item-v5">',
        `<div class="tech-label-v5">${escapeHtml(skill.name)}</div>`,
        `<div class="tech-content-v5">${escapeHtml(skill.narrative)}</div>`,
        "</div>"
      ].join("");
    })
    .join("");
}

function joinProjectBullet(items, emptyText) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return emptyText;
  }

  const sentences = safeItems
    .slice(0, 2)
    .map((item) => String(item).replace(/[。；;]+$/u, ""));

  return `${sentences.join("；")}。`;
}

function renderProjectCardsV5(projects) {
  return orderFeaturedProjects(projects)
    .map((project) => {
      const sections = parseMarkdownSections(project.body ?? "");
      const background = sections.get("背景")?.[0] ?? project.summary?.[0] ?? "围绕既定业务场景推进项目落地。";
      const responsibility = joinProjectBullet(project.responsibility, "承担核心实现与协作落地工作。");
      const result = joinProjectBullet(project.impact, "完成目标能力交付并支撑后续迭代。");
      const stack = project.stack.map((item) => escapeHtml(item)).join(", ");

      return [
        '<article class="project-card-v5">',
        '<div class="project-header-v5">',
        renderIconSvg("project"),
        `<span class="project-title-v5">${escapeHtml(project.title)}</span>`,
        '<span class="project-meta-v5">',
        `<span class="project-owner-v5">${escapeHtml(project.company)}</span>`,
        "</span>",
        "</div>",
        '<div class="project-body-v5">',
        `<div class="project-tech-v5">技术栈：${stack}</div>`,
        '<ul class="point-list-v5">',
        `<li><span class="list-label-v5">[项目背景]</span> ${escapeHtml(background)}</li>`,
        `<li><span class="list-label-v5">[负责内容]</span> ${escapeHtml(responsibility)}</li>`,
        `<li><span class="list-label-v5">[项目结果]</span> ${escapeHtml(result)}</li>`,
        "</ul>",
        "</div>",
        "</article>"
      ].join("");
    })
    .join("");
}

function renderPersonalProjectCardsV5(projects) {
  return orderFeaturedProjects(projects)
    .map((project) => {
      const highlights = Array.isArray(project.summary)
        ? project.summary.filter(Boolean).map((item) => escapeHtml(String(item)))
        : [];
      const stack = project.stack.map((item) => escapeHtml(item)).join(", ");
      const links = Array.isArray(project.links)
        ? project.links.filter(Boolean).map((url) => escapeHtml(String(url)))
        : [];

      return [
        '<article class="project-card-v5">',
        '<div class="project-header-v5">',
        renderIconSvg("project"),
        `<span class="project-title-v5">${escapeHtml(project.title)}</span>`,
        '<span class="project-meta-v5">',
        `<span class="project-owner-v5">${escapeHtml(project.company)}</span>`,
        "</span>",
        "</div>",
        '<div class="project-body-v5">',
        `<div class="project-tech-v5">技术栈：${stack}</div>`,
        links.length > 0
          ? `<div class="project-links-v5">${links
              .map(
                (url) =>
                  `<a class="project-link-v5" href="${url}" target="_blank" rel="noopener">GitHub ↗</a>`
              )
              .join("")}</div>`
          : "",
        '<ul class="point-list-v5">',
        highlights.map((item) => `<li>${item}</li>`).join(""),
        "</ul>",
        "</div>",
        "</article>"
      ].join("");
    })
    .join("");
}

function renderPersonalProjectSectionV5(projects) {
  const personalProjects = projects.filter((project) => project.company === "个人项目");

  if (personalProjects.length === 0) {
    return "";
  }

  return [
    '<section class="project-section-v5">',
    '<div class="section-title-v5">个人项目</div>',
    '<div class="project-list-v5">',
    renderPersonalProjectCardsV5(personalProjects),
    "</div>",
    "</section>"
  ].join("");
}

function renderExperienceListV5(resume, basePath = "/") {
  return resume.experience
    .map((item) => {
      let highlightLimit = 1;

      if (item.id === "qidun") {
        highlightLimit = 4;
      } else if (item.id === "wotu") {
        highlightLimit = 2;
      }

      const highlights = item.summary.slice(0, highlightLimit);
      const projectLinks = item.projects
        .map((project) => escapeHtml(project.title))
        .join('<span class="experience-separator-v5">/</span>');
      return [
        '<article class="experience-item-v5">',
        '<div class="experience-header-v5">',
        '<div>',
        `<h3>${escapeHtml(item.company)} · ${escapeHtml(item.role)}</h3>`,
        `<p>${escapeHtml(item.city)}</p>`,
        "</div>",
        `<span class="experience-period-v5">${formatPeriod(item.start, item.end)}</span>`,
        "</div>",
        renderList(highlights, "point-list-v5 experience-highlights-v5"),
        renderList(item.summary, "point-list-v5 experience-details-print-v5"),
        `<div class="experience-footer-v5"><span>${escapeHtml((item.tech_stack ?? []).join(" · "))}</span><span class="experience-projects-v5">${projectLinks}</span></div>`,
        "</article>"
      ].join("");
    })
    .join("");
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
      label: "查看项目",
      href: "#projects",
      className:
        "inline-flex min-h-12 items-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
    },
    {
      label: "联系我",
      href: "#contact",
      className:
        "inline-flex min-h-12 items-center rounded-full border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:border-blue-700 hover:text-blue-700"
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
    working: "扩展能力"
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
        `<p class="project-meta">${escapeHtml(project.company)} / ${escapeHtml(project.role)}</p>`,
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
        .map((project) => escapeHtml(project.title))
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
      const isPersonal = project.company === "个人项目";
      const responsibility = joinProjectBullet(project.responsibility, "承担核心实现与协作落地工作。");
      const result = project.impact?.[0] ?? "";
      const summaryItems = Array.isArray(project.summary)
        ? project.summary.filter(Boolean)
        : [];

      const rows = isPersonal
        ? summaryItems.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")
        : `<li><strong>负责：</strong>${escapeHtml(responsibility)}</li><li><strong>结果：</strong>${escapeHtml(result)}</li>`;

      return [
        '<article class="resume-item">',
        `<h3>${escapeHtml(project.title)}</h3>`,
        `<p class="project-meta">${escapeHtml(project.company)} / ${escapeHtml(project.stack.join(" / "))}</p>`,
        `<ul class="print-project-points">${rows}</ul>`,
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
        "</article>"
      ].join("");
    })
    .join("");
}

async function renderPage({ layoutTemplate, pageTitle, bodyClass, content, basePath = "" }) {
  return replacePlaceholders(layoutTemplate, {
    pageTitle: escapeHtml(pageTitle),
    bodyClass: escapeHtml(bodyClass),
    basePath,
    content
  });
}

async function loadTemplates(rootDir) {
  const templateDir = path.join(rootDir, "site", "templates");
  const [layout, home, print] = await Promise.all([
    fs.readFile(path.join(templateDir, "layout.html"), "utf8"),
    fs.readFile(path.join(templateDir, "home.html"), "utf8"),
    fs.readFile(path.join(templateDir, "print.html"), "utf8")
  ]);

  return { layout, home, print };
}

async function writePage(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function renderHomeContent({ resume, templates, basePath }) {
  const headlineParts = [resume.basics.headline.primary];

  if (resume.basics.headline.secondary) {
    headlineParts.push(resume.basics.headline.secondary);
  }

  const jobTitle = headlineParts.join(" / ");
  const companyProjects = resume.featuredProjects.filter(
    (project) => project.company !== "个人项目"
  );

  return replacePlaceholders(templates.home, {
    name: escapeHtml(resume.basics.displayName),
    jobTitle: escapeHtml(jobTitle),
    summary: renderHeaderSummary(resume.basics.summary.long),
    contactStrip: renderContactStrip(resume),
    skillRows: renderSkillRowsV5(resume),
    experienceList: renderExperienceListV5(resume, basePath),
    projectCards: renderProjectCardsV5(companyProjects),
    personalProjectSection: renderPersonalProjectSectionV5(resume.featuredProjects)
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
    basePath: "",
    content: homeContent
  });

  const printPage = await renderPage({
    layoutTemplate: templates.layout,
    pageTitle: `${resume.basics.displayName} | Print Resume`,
    bodyClass: "page-print",
    basePath: "../",
    content: printContent
  });

  await writePage(path.join(outputDir, "index.html"), homePage);
  await writePage(path.join(outputDir, "print", "index.html"), printPage);

  return {
    homepagePath: path.join(outputDir, "index.html"),
    printPagePath: path.join(outputDir, "print", "index.html")
  };
}
