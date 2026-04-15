import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";
import { renderCliResume } from "../renderers/cli/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderCliResume prints a full resume-oriented CLI view", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const resume = buildPublicResume(canonical);

  const output = renderCliResume(resume);

  assert.match(output, /^张子恒\n前端开发工程师\n/m);
  assert.match(output, /\[基本信息\]\n所在地\s+杭州，浙江，中国\n当前状态\s+在职 \\ 在找工作机会/);
  assert.match(output, /\[个人摘要\]\n5 年 Web 开发经验，前端为主，具备全栈开发能力。\n常用 React、Vue、Next\.js 等技术栈，了解 Node\.js、Go等后端技术。\n熟练使用 ClaudeCode \\ Codex 调研、开发、运维等流程。\n擅长使用各种工具提高自身效率和开发体验。/);
  assert.match(output, /\[联系方式\]\n邮箱\s+shadow1746556951@gmail\.com\nGitHub\s+https:\/\/github\.com\/Shadowzzh\n博客\s+https:\/\/blog\.zihengzhang\.com\//);
  assert.match(output, /\[核心技能\]\n常用技术栈\s+React \/ Next\.js \/ Vue 2 \/ Vue 3\n工具链\s+Webpack \/ Vite\nAI 工具\s+Claude Code \/ ChatGPT \/ Gemini/);
  assert.match(output, /\[工作经历\]\n2024-03 ~ 至今\s+杭州奇盾\s+前端开发工程师\n  - 主要负责公司前端和 Node 相关项目的迭代和维护。\n  - 负责自动化攻击平台的前端开发和 Claude Agent SDK 封装，使 Claude Code 可以被外部通过 HTTP 请求调用。\n  - 参与 CNAPP 云原生应用保护平台的前端开发和维护，协助修复后端 bug。/);
  assert.match(output, /2022-02 ~ 2023-10\s+杭州沃土教育\s+前端开发工程师\n  - 负责培训平台、CMS 系统与钉钉小程序的前端业务开发和组件库开发。\n  - 使用 Dumi \+ Father 搭建多平台的组件库与文档系统。\n  - 批量升级多个项目的组件库版本，并对各类 UI 组件进行二次封装。/);
  assert.match(output, /\[访问方式\]\nnpx @zhangziheng\/resume\ncurl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json\ncurl -sL https:\/\/resume\.zihengzhang\.com\/resume\.7 \| man -l -/);
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /电话/);
  assert.doesNotMatch(output, /\[项目\]/);
  assert.doesNotMatch(output, /项目经历/);
  assert.doesNotMatch(output, /\bName\b/);
  assert.doesNotMatch(output, /\bSummary\b/);
});
