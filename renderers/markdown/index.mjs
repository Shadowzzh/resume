function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function appendSection(lines, title, contentLines) {
  const safeContent = Array.isArray(contentLines) ? trimBlankLines(contentLines) : [];

  if (safeContent.length === 0) {
    return;
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(`## ${title}`, "", ...safeContent);
}

function formatDate(value) {
  if (value === "present") {
    return "至今";
  }

  return value;
}

function formatDateRange(start, end) {
  const values = [formatDate(start), formatDate(end)].filter(hasValue);
  return values.join(" - ");
}

function formatLocation(location = {}) {
  return [location.city, location.region, location.country].filter(hasValue).join("，");
}

function formatSlashList(items = []) {
  return items.filter(hasValue).join(" / ");
}

function trimBlankLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start] === "") {
    start += 1;
  }

  while (end > start && lines[end - 1] === "") {
    end -= 1;
  }

  return lines.slice(start, end);
}

function splitMultilineText(value) {
  if (!hasValue(value)) {
    return [];
  }

  return trimBlankLines(
    String(value)
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
  );
}

function getLinkLabel(url, fallbackLabel) {
  if (!hasValue(url)) {
    return fallbackLabel;
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");

    if (pathname) {
      return pathname;
    }

    return parsed.hostname;
  } catch {
    return fallbackLabel ?? url;
  }
}

function formatMarkdownLink(label, href) {
  return `[${label}](${href})`;
}

function renderBasicInfo(basics) {
  return [
    `- 所在地：${formatLocation(basics.location)}`,
    `- 当前状态：${basics.availability}`
  ].filter((line) => !line.endsWith("："));
}

function renderContact(basics) {
  const lines = [];

  if (hasValue(basics.contact.email)) {
    lines.push(
      `- 邮箱：${formatMarkdownLink(basics.contact.email, `mailto:${basics.contact.email}`)}`
    );
  }

  if (hasValue(basics.links.github)) {
    lines.push(
      `- GitHub：${formatMarkdownLink(
        getLinkLabel(basics.links.github, basics.links.github),
        basics.links.github
      )}`
    );
  }

  if (hasValue(basics.links.blog)) {
    lines.push(
      `- 博客：${formatMarkdownLink(
        getLinkLabel(basics.links.blog, basics.links.blog),
        basics.links.blog
      )}`
    );
  }

  return lines;
}

function renderSkills(skills = []) {
  const lines = [];

  for (const skill of skills) {
    if (!skill || !hasValue(skill.name)) {
      continue;
    }

    if (lines.length > 0) {
      lines.push("");
    }

    lines.push(`### ${skill.name}`, "");

    for (const keyword of skill.keywords ?? []) {
      if (hasValue(keyword)) {
        lines.push(`- ${keyword}`);
      }
    }
  }

  return lines;
}

function renderExperience(experience = []) {
  const lines = [];

  for (const item of experience) {
    if (!item) {
      continue;
    }

    if (lines.length > 0) {
      lines.push("");
    }

    lines.push(`### ${item.company}｜${item.role}`, "");

    if (hasValue(item.start) || hasValue(item.end)) {
      lines.push(`- 时间：${formatDateRange(item.start, item.end)}`);
    }

    for (const summaryItem of item.summary ?? []) {
      if (hasValue(summaryItem)) {
        lines.push(`- ${summaryItem}`);
      }
    }
  }

  return lines;
}

function renderFeaturedProjects(projects = []) {
  const lines = [];

  for (const project of projects.slice(0, 3)) {
    if (!project || !hasValue(project.title)) {
      continue;
    }

    if (lines.length > 0) {
      lines.push("");
    }

    lines.push(`### ${project.title}`, "");

    if (Array.isArray(project.stack) && project.stack.length > 0) {
      lines.push(`- 技术栈：${formatSlashList(project.stack)}`);
    }

    if (hasValue(project.summary?.[0])) {
      lines.push(`- ${project.summary[0]}`);
    }

    if (hasValue(project.impact?.[0])) {
      lines.push(`- ${project.impact[0]}`);
    }

    if (hasValue(project.links?.[0])) {
      lines.push(`- 链接：${formatMarkdownLink(project.links[0], project.links[0])}`);
    }
  }

  return lines;
}

function renderAccessMethods(branding = {}) {
  const lines = [];

  if (hasValue(branding.npm_package)) {
    lines.push(`- \`npx ${branding.npm_package}\``);
  }

  if (hasValue(branding.curl_endpoint)) {
    lines.push(`- \`curl -sL ${branding.curl_endpoint}\``);
  }

  if (hasValue(branding.man_endpoint)) {
    lines.push(`- \`curl -sL ${branding.man_endpoint} | man -l -\``);
  }

  return lines;
}

export function renderMarkdownResume(resume) {
  const { basics, branding } = resume;
  const lines = [`# ${basics.displayName ?? basics.name}`];
  const summaryLines = splitMultilineText(basics.summary.long);

  if (hasValue(basics.headline.primary)) {
    lines.push("", `> ${basics.headline.primary}`);
  }

  appendSection(lines, "个人摘要", summaryLines);
  appendSection(lines, "基本信息", renderBasicInfo(basics));
  appendSection(lines, "联系方式", renderContact(basics));
  appendSection(lines, "核心技能", renderSkills(resume.skills));
  appendSection(lines, "工作经历", renderExperience(resume.experience));
  appendSection(lines, "代表项目", renderFeaturedProjects(resume.featuredProjects));
  appendSection(lines, "访问方式", renderAccessMethods(branding));

  return `${lines.join("\n")}\n`;
}
