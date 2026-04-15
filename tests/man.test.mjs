import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";
import { renderCliResume } from "../renderers/cli/index.mjs";
import { renderManPage } from "../renderers/man/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function extractPreformattedBlock(content) {
  const match = content.match(/\.nf\n([\s\S]*?)\n\.fi/);

  if (!match) {
    return null;
  }

  return match[1].replaceAll("\\\\", "\\");
}

test("renderManPage reuses the same resume body as the CLI output", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const resume = buildPublicResume(canonical);
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-man-"));
  const outputPath = path.join(outputDir, "resume.7");

  try {
    await renderManPage({
      resume,
      outputPath
    });

    const content = await fs.readFile(outputPath, "utf8");
    const cliOutput = renderCliResume(resume).trimEnd();
    const body = extractPreformattedBlock(content);

    assert.equal(body, cliOutput);
    assert.match(content, /\.SH RESUME/);
    assert.match(content, /\[基本信息\]/);
    assert.match(content, /\[个人摘要\]/);
    assert.match(content, /\[联系方式\]/);
    assert.match(content, /\[核心技能\]/);
    assert.match(content, /\[工作经历\]/);
    assert.match(content, /\[访问方式\]/);
    assert.doesNotMatch(content, /\.SH EXPERIENCE/);
    assert.doesNotMatch(content, /\.SH PROJECTS/);
    assert.doesNotMatch(content, /\.SH CONTACT/);
    assert.doesNotMatch(content, /\bnull\b/);
    assert.doesNotMatch(content, /\bundefined\b/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
