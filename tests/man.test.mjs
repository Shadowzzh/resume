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
    variantId: "fullstack"
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
    assert.match(content, /\[专业技能\]/);
    assert.match(content, /\[工作经历\]/);
    assert.match(content, /\[访问方式\]/);
    assert.match(content, /企业安全产品官网建设与迭代/);
    assert.match(content, /设计声明式 YAML 规则及采集执行框架/);
    assert.match(content, /移动端自动化探索与接口资产梳理/);
    assert.match(content, /功能大纲/);
    assert.match(content, /mitmproxy/);
    assert.match(content, /静态分析/);
    assert.match(content, /拓扑/);
    assert.match(content, /视频转图文工作台/);
    // man 渲染的是 CLI 输出：在 VideoDoc 段内校验通用在线视频下载与平台示例
    const manVideodocSection = content.slice(
      content.indexOf("视频转图文工作台"),
      content.indexOf("AI 产品文档生成工具箱")
    );
    assert.match(manVideodocSection, /下载在线视频/);
    assert.match(manVideodocSection, /X（Twitter）/);
    assert.match(manVideodocSection, /哔哩哔哩/);
    assert.match(manVideodocSection, /等平台/);
    assert.match(content, /AI 产品文档生成工具箱/);
    assert.match(content, /将“现场判断”与“稳定动作”分离/);
    assert.ok(
      content.indexOf("视频转图文工作台") < content.indexOf("AI 产品文档生成工具箱"),
      "man page keeps VideoDoc before the documentation toolkit"
    );
    assert.doesNotMatch(content, /浏览器自动化生成产品文档/);
    assert.doesNotMatch(content, /移动端自动化信息采集与攻击面梳理/);
    assert.doesNotMatch(content, /内容驱动企业官网/);
    assert.doesNotMatch(content, /\.SH EXPERIENCE/);
    assert.doesNotMatch(content, /\.SH PROJECTS/);
    assert.doesNotMatch(content, /\.SH CONTACT/);
    assert.doesNotMatch(content, /\bnull\b/);
    assert.doesNotMatch(content, /\bundefined\b/);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
