import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";
import { renderMarkdownResume } from "../renderers/markdown/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderMarkdownResume prints a README-style public resume", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const resume = buildPublicResume(canonical);

  const output = renderMarkdownResume(resume);

  assert.match(output, /^# 张子恒\n\n> 前端开发工程师\n/m);
  assert.match(output, /## 个人摘要\n\n5 年 Web 开发经验，前端为主，具备全栈开发能力。\n常用 React、Vue、Next\.js 等技术栈，了解 Node\.js、Go等后端技术。\n熟练使用 ClaudeCode \\ Codex 调研、开发、运维等流程。\n擅长使用各种工具提高自身效率和开发体验。\n/m);
  assert.match(output, /## 基本信息\n\n- 所在地：杭州，浙江，中国\n- 当前状态：在职 \\ 在找工作机会\n/m);
  assert.match(
    output,
    /## 联系方式\n\n- 邮箱：\[shadow1746556951@gmail\.com\]\(mailto:shadow1746556951@gmail\.com\)\n- GitHub：\[Shadowzzh\]\(https:\/\/github\.com\/Shadowzzh\)\n- 博客：\[blog\.zihengzhang\.com\]\(https:\/\/blog\.zihengzhang\.com\/\)\n/m
  );
  assert.match(output, /## 核心技能\n\n### 常用技术栈\n\n- React\n- Next\.js\n- Vue 2\n- Vue 3\n/m);
  assert.match(
    output,
    /## 工作经历\n\n### 杭州奇盾｜前端开发工程师\n\n- 时间：2024-03 - 至今\n- 主要负责公司前端和 Node 相关项目的迭代和维护。\n- 负责自动化攻击平台的前端开发和 Claude Agent SDK 封装，使 Claude Code 可以被外部通过 HTTP 请求调用。\n- 参与 CNAPP 云原生应用保护平台的前端开发和维护，协助修复后端 bug。\n/m
  );
  assert.match(
    output,
    /## 代表项目\n\n### 多平台业务组件库\n\n- 技术栈：Vue \/ Dumi \/ Father\n- 负责培训平台、CMS 系统与钉钉小程序的前端业务开发和组件库开发。\n- 降低多项目重复开发成本，提升组件复用率与版本升级效率。\n- 链接：\[https:\/\/www\.busionline\.com\]\(https:\/\/www\.busionline\.com\)\n/m
  );
  assert.match(
    output,
    /## 访问方式\n\n- `npx @zhangziheng\/resume`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json`\n- `curl -sL https:\/\/resume\.zihengzhang\.com\/resume\.7 \| man -l -`\n/m
  );
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /电话/);
  assert.doesNotMatch(output, /\bundefined\b/);
  assert.doesNotMatch(output, /\bnull\b/);
});
