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
        "<article>",
        `<h3>${escapeHtml(item.company)} | ${escapeHtml(item.role)}</h3>`,
        `<p class="muted">${escapeHtml(item.start)} - ${escapeHtml(item.end)} | ${escapeHtml(item.city)}</p>`,
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
        "<article>",
        `<h3><a href="${href}">${escapeHtml(project.title)}</a></h3>`,
        `<p class="muted">${escapeHtml(project.stack.join(" / "))}</p>`,
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
        "<article>",
        `<h3>${escapeHtml(skill.name)}</h3>`,
        `<p>${escapeHtml(skill.narrative)}</p>`,
        `<div>${tags}</div>`,
        "</article>"
      ].join("");
    })
    .join("");
}

function renderContact(resume) {
  return [
    `<p>Email: <a href="mailto:${escapeHtml(resume.basics.contact.email)}">${escapeHtml(resume.basics.contact.email)}</a></p>`,
    `<p>Phone: ${escapeHtml(resume.basics.contact.phone)}</p>`,
    `<p>GitHub: <a href="${escapeHtml(resume.basics.links.github)}">${escapeHtml(resume.basics.links.github)}</a></p>`,
    `<p>Blog: <a href="${escapeHtml(resume.basics.links.blog)}">${escapeHtml(resume.basics.links.blog)}</a></p>`
  ].join("");
}

async function renderPage({ layoutTemplate, pageTitle, content }) {
  return replacePlaceholders(layoutTemplate, {
    pageTitle: escapeHtml(pageTitle),
    content
  });
}

async function loadTemplates(rootDir) {
  const templateDir = path.join(rootDir, "site", "templates");

  const [layout, resume, project] = await Promise.all([
    fs.readFile(path.join(templateDir, "layout.html"), "utf8"),
    fs.readFile(path.join(templateDir, "resume.html"), "utf8"),
    fs.readFile(path.join(templateDir, "project.html"), "utf8")
  ]);

  return { layout, resume, project };
}

async function writePage(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function renderResumeContent({ resume, templates, basePath }) {
  return replacePlaceholders(templates.resume, {
    eyebrow: `${escapeHtml(resume.variant.label)} / ${escapeHtml(resume.basics.location.city)}`,
    name: escapeHtml(resume.basics.displayName),
    headline: `${escapeHtml(resume.basics.headline.primary)} / ${escapeHtml(resume.basics.headline.secondary)}`,
    summary: escapeHtml(resume.basics.summary.long),
    commands: [
      "npx @zhangziheng/resume",
      `curl -sL ${resume.branding.curl_endpoint}`,
      `curl -sL ${resume.branding.man_endpoint} | man -l -`
    ]
      .map(escapeHtml)
      .join("\n"),
    experience: renderExperience(resume, basePath),
    projects: renderProjects(resume, basePath),
    skills: renderSkills(resume),
    contact: renderContact(resume)
  });
}

export async function renderHtmlSite({ resume, rootDir, outputDir }) {
  const templates = await loadTemplates(rootDir);
  const homeResumeContent = renderResumeContent({
    resume,
    templates,
    basePath: "/resume/"
  });
  const printResumeContent = renderResumeContent({
    resume,
    templates,
    basePath: "/resume/"
  });

  const homePage = await renderPage({
    layoutTemplate: templates.layout,
    pageTitle: `${resume.basics.displayName} | Resume`,
    content: homeResumeContent
  });

  const printPage = await renderPage({
    layoutTemplate: templates.layout,
    pageTitle: `${resume.basics.displayName} | Print Resume`,
    content: printResumeContent
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
      content: projectContent
    });

    await writePage(path.join(outputDir, "projects", project.id, "index.html"), page);
  }

  return {
    homepagePath: path.join(outputDir, "index.html"),
    printPagePath: path.join(outputDir, "print", "index.html")
  };
}
