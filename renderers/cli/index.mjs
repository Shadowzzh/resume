function renderProjectLine(project) {
  return `- ${project.title}: ${project.summary[0]}`;
}

export function renderCliResume(resume) {
  const lines = [
    `${resume.basics.displayName} | ${resume.basics.headline.primary}`,
    resume.basics.summary.short,
    "",
    "Access",
    `- npx @zhangziheng/resume`,
    `- curl -sL ${resume.branding.curl_endpoint}`,
    `- curl -sL ${resume.branding.man_endpoint} | man -l -`,
    "",
    "Featured Projects",
    ...resume.featuredProjects.map(renderProjectLine),
    "",
    "Contact",
    `- Email: ${resume.basics.contact.email}`,
    `- Phone: ${resume.basics.contact.phone}`,
    `- Website: ${resume.basics.links.website}`
  ];

  return `${lines.join("\n")}\n`;
}
