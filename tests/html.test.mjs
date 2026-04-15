import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume } from "../scripts/normalize.mjs";
import { renderHtmlSite } from "../renderers/html/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderHtmlSite writes relative internal links that work at root and nested paths", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    const result = await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    assert.equal(result.homepagePath, path.join(outputDir, "index.html"));
    assert.equal(result.printPagePath, path.join(outputDir, "print", "index.html"));

    await assert.doesNotReject(fs.access(path.join(outputDir, "index.html")));
    await assert.doesNotReject(fs.access(path.join(outputDir, "print", "index.html")));
    await assert.rejects(fs.access(path.join(outputDir, "resume", "index.html")));

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");

    assert.match(homepage, /href="print\/"/);
    assert.match(homepage, /href="projects\/component-library\/"/);
    assert.match(homepage, /href="projects\/cnapp-platform\/"/);
    assert.doesNotMatch(homepage, /href="\/resume\//);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite uses the new screening-first information hierarchy", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");
    const printPage = await fs.readFile(path.join(outputDir, "print", "index.html"), "utf8");

    assert.match(homepage, /打印版简历/);
    assert.match(homepage, /核心能力/);
    assert.match(homepage, /代表项目/);
    assert.match(homepage, /工作经历/);
    assert.match(homepage, /补充资料/);
    assert.match(homepage, /常用技术栈/);
    assert.match(homepage, /工具链/);
    assert.match(homepage, /AI 工具/);
    assert.match(homepage, /后端与全栈协作/);
    assert.match(homepage, /5 年 Web 开发经验，前端为主，具备全栈开发能力。/);
    assert.match(homepage, /常用 React、Vue、Next\.js 等技术栈，了解 Node\.js、Go等后端技术。/);
    assert.match(homepage, /熟练使用 ClaudeCode \\ Codex 调研、开发、运维等流程。/);
    assert.match(homepage, /擅长使用各种工具提高自身效率和开发体验。/);
    assert.match(homepage, /所在地/);
    assert.match(homepage, /当前状态/);
    assert.match(homepage, /邮箱/);
    assert.match(homepage, /博客/);
    assert.doesNotMatch(homepage, /电话/);
    assert.doesNotMatch(homepage, /\bundefined\b/);
    assert.doesNotMatch(homepage, /\bnull\b/);
    assert.doesNotMatch(homepage, /技能矩阵/);
    assert.doesNotMatch(homepage, /经历概览/);
    assert.doesNotMatch(homepage, /访问方式/);
    assert.match(homepage, /@media \(max-width: 820px\)[\s\S]*\.hero-meta[\s\S]*order:\s*-1/);

    assert.match(printPage, /个人摘要/);
    assert.match(printPage, /核心能力/);
    assert.match(printPage, /工作经历/);
    assert.match(printPage, /项目/);
    assert.match(printPage, /联系方式/);
    assert.match(printPage, /主要负责公司前端和 Node 相关项目的迭代和维护。/);
    assert.match(printPage, /负责培训平台、CMS 系统与钉钉小程序的前端业务开发和组件库开发。/);
    assert.match(printPage, /使用 Dumi \+ Father 搭建多平台的组件库与文档系统。/);
    assert.match(printPage, /使用 Vue 3 \+ Tailwind CSS 构建 UI，并支撑系统迭代维护。/);
    assert.doesNotMatch(printPage, /电话/);
    assert.doesNotMatch(printPage, /\bundefined\b/);
    assert.doesNotMatch(printPage, /\bnull\b/);
    assert.doesNotMatch(printPage, /项目经验/);
    assert.doesNotMatch(printPage, /专业技能/);
    assert.doesNotMatch(printPage, /访问方式/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});

test("renderHtmlSite turns project pages into structured case-study pages", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    const projectPage = await fs.readFile(
      path.join(outputDir, "projects", "component-library", "index.html"),
      "utf8"
    );

    assert.match(projectPage, /项目概览/);
    assert.match(projectPage, /项目背景/);
    assert.match(projectPage, /核心问题/);
    assert.match(projectPage, /解决方案/);
    assert.match(projectPage, /我负责的部分/);
    assert.match(projectPage, /项目结果/);
    assert.match(projectPage, /https:\/\/www\.busionline\.com/);
    assert.doesNotMatch(projectPage, /<h2>Details<\/h2>/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
