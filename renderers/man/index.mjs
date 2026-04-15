import fs from "node:fs/promises";

import { renderCliResume } from "../cli/index.mjs";

function escapeRoffLine(line) {
  let escaped = String(line).replaceAll("\\", "\\\\");

  if (escaped.startsWith(".") || escaped.startsWith("'")) {
    escaped = `\\&${escaped}`;
  }

  return escaped;
}

function renderPreformattedBody(resume) {
  const cliOutput = renderCliResume(resume).trimEnd();
  const lines = cliOutput.split("\n").map(escapeRoffLine);

  return [
    ".ad l",
    ".nh",
    ".SH RESUME",
    ".nf",
    ...lines,
    ".fi"
  ];
}

export async function renderManPage({ resume, outputPath }) {
  const content = [
    `.TH RESUME 7 "${new Date().toISOString().slice(0, 10)}" "resume" "Resume Manual"`,
    ".SH NAME",
    `${resume.basics.displayName} \\- ${resume.basics.headline.primary}`,
    ...renderPreformattedBody(resume)
  ].join("\n");

  await fs.writeFile(outputPath, `${content}\n`, "utf8");
}
