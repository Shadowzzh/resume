import fs from "node:fs/promises";

function formatList(items) {
  return items.map((item) => `.IP \\(bu 2\n${item}`).join("\n");
}

export async function renderManPage({ resume, outputPath }) {
  const content = [
    `.TH RESUME 7 "${new Date().toISOString().slice(0, 10)}" "resume" "Resume Manual"`,
    ".SH NAME",
    `${resume.basics.displayName} \\- ${resume.basics.headline.primary}`,
    ".SH SYNOPSIS",
    "npx @zhangziheng/resume",
    ".br",
    `curl -sL ${resume.branding.curl_endpoint}`,
    ".SH DESCRIPTION",
    resume.basics.summary.long,
    ".SH EXPERIENCE",
    ...resume.experience.flatMap((item) => [
      `.SS ${item.company} / ${item.role}`,
      `${item.start} - ${item.end} / ${item.city}`,
      formatList(item.summary)
    ]),
    ".SH PROJECTS",
    ...resume.featuredProjects.flatMap((project) => [
      `.SS ${project.title}`,
      formatList(project.summary)
    ]),
    ".SH SKILLS",
    ...resume.skills.flatMap((skill) => [
      `.SS ${skill.name}`,
      `${skill.keywords.join(", ")}`
    ]),
    ".SH CONTACT",
    `Email: ${resume.basics.contact.email}`,
    ".br",
    `Phone: ${resume.basics.contact.phone}`,
    ".br",
    `Website: ${resume.basics.links.website}`
  ].join("\n");

  await fs.writeFile(outputPath, `${content}\n`, "utf8");
}
