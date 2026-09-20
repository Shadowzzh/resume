function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function appendSection(lines, title, contentLines) {
  if (contentLines.length === 0) {
    return;
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(`[${title}]`, ...contentLines);
}

function formatDate(value) {
  if (value === "present") {
    return "至今";
  }

  return value;
}

function formatCompactDateRange(start, end) {
  const values = [formatDate(start), formatDate(end)].filter(hasValue);
  return values.join(" ~ ");
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

function getDisplayWidth(value) {
  return Array.from(String(value)).reduce((width, char) => {
    const codePoint = char.codePointAt(0);

    if (!codePoint) {
      return width;
    }

    if (codePoint > 255) {
      return width + 2;
    }

    return width + 1;
  }, 0);
}

function padText(value, targetWidth) {
  const text = String(value);
  const padding = targetWidth - getDisplayWidth(text);

  if (padding <= 0) {
    return text;
  }

  return `${text}${" ".repeat(padding)}`;
}

function renderKeyValueRows(items = []) {
  const safeItems = items.filter(([label, value]) => hasValue(label) && hasValue(value));

  if (safeItems.length === 0) {
    return [];
  }

  const labelWidth = Math.max(...safeItems.map(([label]) => getDisplayWidth(label))) + 2;

  return safeItems.map(([label, value]) => `${padText(label, labelWidth)}${value}`);
}

function renderSkills(skills = []) {
  return renderKeyValueRows(
    skills.map((skill) => [
      skill.name,
      skill.narrative
    ])
  );
}

function renderExperience(experience = []) {
  const safeExperience = experience.filter(Boolean);

  if (safeExperience.length === 0) {
    return [];
  }

  const formattedItems = safeExperience.map((item) => ({
    period: formatCompactDateRange(item.start, item.end),
    company: item.company,
    role: item.role,
    summary: (item.summary ?? []).filter(hasValue).slice(0, 3)
  }));
  const periodWidth = Math.max(...formattedItems.map((item) => getDisplayWidth(item.period))) + 2;
  const companyWidth = Math.max(...formattedItems.map((item) => getDisplayWidth(item.company))) + 2;
  const lines = [];

  for (const item of formattedItems) {
    if (lines.length > 0) {
      lines.push("");
    }

    lines.push(
      `${padText(item.period, periodWidth)}${padText(item.company, companyWidth)}${item.role}`
    );

    for (const summaryItem of item.summary) {
      lines.push(`  - ${summaryItem}`);
    }
  }

  return lines;
}

function renderProjects(projects = [], { personal = false } = {}) {
  const lines = [];

  for (const project of projects) {
    if (!project || !hasValue(project.title)) {
      continue;
    }

    const stack = Array.isArray(project.stack) ? formatSlashList(project.stack) : "";
    lines.push(hasValue(stack) ? `- ${project.title}（${stack}）` : `- ${project.title}`);

    const summaryItems = Array.isArray(project.summary)
      ? project.summary.filter((item) => hasValue(item))
      : [];
    const highlights = personal ? summaryItems : summaryItems.slice(0, 1);

    for (const item of highlights) {
      lines.push(`  - ${item}`);
    }

    if (!personal && hasValue(project.impact?.[0])) {
      lines.push(`  - ${project.impact[0]}`);
    }

    if (hasValue(project.links?.[0])) {
      lines.push(`  链接：${project.links[0]}`);
    }
  }

  return lines;
}

function renderAccessMethods(branding = {}) {
  const commands = [];

  if (hasValue(branding.npm_package)) {
    commands.push(`npx ${branding.npm_package}`);
  }

  if (hasValue(branding.curl_endpoint)) {
    commands.push(`curl -sL ${branding.curl_endpoint}`);
  }

  if (hasValue(branding.man_endpoint)) {
    commands.push(`curl -sL ${branding.man_endpoint} | man -l -`);
  }

  return commands;
}

export function renderCliResume(resume) {
  const { basics, branding } = resume;
  const lines = [];
  const location = formatLocation(basics.location);
  const summaryLines = splitMultilineText(basics.summary.long);
  const basicInfoLines = renderKeyValueRows([
    ["所在地", location],
    ["当前状态", basics.availability]
  ]);
  const contactLines = renderKeyValueRows([
    ["邮箱", basics.contact.email],
    ["电话", basics.contact.phone],
    ["GitHub", basics.links.github],
    ["博客", basics.links.blog]
  ]);
  const featuredProjects = Array.isArray(resume.featuredProjects) ? resume.featuredProjects : [];
  const companyProjects = featuredProjects.filter(
    (project) => project.company !== "个人项目"
  );
  const personalProjects = featuredProjects.filter(
    (project) => project.company === "个人项目"
  );

  lines.push(basics.displayName ?? basics.name);

  if (hasValue(basics.headline.primary)) {
    lines.push(basics.headline.primary);
  }

  appendSection(lines, "基本信息", basicInfoLines);
  appendSection(lines, "个人摘要", summaryLines);
  appendSection(lines, "联系方式", contactLines);
  appendSection(lines, "专业技能", renderSkills(resume.skills));
  appendSection(lines, "工作经历", renderExperience(resume.experience));
  appendSection(lines, "代表项目", renderProjects(companyProjects));
  appendSection(lines, "个人项目", renderProjects(personalProjects, { personal: true }));
  appendSection(lines, "访问方式", renderAccessMethods(branding));

  return `${lines.join("\n")}\n`;
}
