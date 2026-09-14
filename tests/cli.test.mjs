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
    variantId: "fullstack"
  });
  const resume = buildPublicResume(canonical);

  const output = renderCliResume(resume);
  const skillsStart = output.indexOf("[专业技能]");
  const experienceStart = output.indexOf("[工作经历]", skillsStart);
  const skillsSection = output.slice(skillsStart, experienceStart);

  assert.match(output, /^张子恒\n全栈工程师偏前端\n/m);
  assert.match(output, /\[基本信息\]\n所在地\s+杭州，浙江，中国\n当前状态\s+寻找新的工作机会/);
  assert.match(output, /\[个人摘要\]\n6 年\+ Web 开发经验，长期做企业级业务系统的前端，从 ERP、CMS、内容管理这类后台，到前台展示页面、小程序、H5。/);
  assert.match(output, /近年转向 AI Agent 应用与全栈：用 Node\.js 做过自动化渗透平台的任务服务，用 Go 独立交付过跨 Linux\/Windows 的基线检测工具/);
  assert.match(output, /平时也喜欢软硬件 DIY：用树莓派、NAS、开发机等多台异构 Linux 主机自建服务/);
  assert.match(output, /日常用 AI Agent 管理运维这套机器群，把配置、排障、复盘沉淀成可复用的技能库/);
  assert.match(output, /端到端跑通从开发、测试到容器化部署的完整链路/);
  assert.match(output, /\[联系方式\]\n邮箱\s+shadow1746556951@gmail\.com\n电话\s+\d{11}\nGitHub\s+https:\/\/github\.com\/Shadowzzh\n博客\s+https:\/\/blog\.zihengzhang\.com\//);
  assert.match(output, /\[专业技能\]\n前端开发\s+长期使用 JavaScript \/ TypeScript，熟练掌握 Vue 2 \/ Vue 3、React 与 Next\.js/);
  assert.match(output, /前端工程化\s+具备 Vite \/ Webpack 项目的构建与升级经验/);
  assert.match(output, /服务端与工具\s+具备 Go 跨平台检测工具开发与发布经验/);
  assert.match(output, /部署与交付\s+具备 Docker 容器化、Nginx 配置与 Linux \/ Shell 实践/);
  assert.match(output, /熟悉常见网络与部署方案，能够独立完成服务部署、版本发布、日志诊断和故障排查/);
  assert.doesNotMatch(skillsSection, /Pinia|Vue Query|Vue Router|Zod|Dumi|Father/);
  assert.match(output, /\[工作经历\]\n2024-03 ~ 至今\s+杭州奇盾\s+全栈工程师偏前端\n  - 负责公司前端项目建设与迭代，覆盖 Vue、React、Next\.js 技术栈/);
  assert.match(output, /随着自动化渗透测试业务发展，职责扩展至全栈交付/);
  assert.match(output, /使用 Go 开发跨平台基线检测工具，完成 Linux、Windows 主机安全基线检查与测试验证。/);
  assert.match(output, /2022-02 ~ 2023-10\s+杭州沃土教育\s+前端开发工程师\n  - 使用 Vue、React 开发培训平台、CMS 系统、钉钉小程序、H5 页面及营销活动低代码平台。/);
  assert.doesNotMatch(output, /Dumi|Father/);
  assert.match(output, /\[访问方式\]\nnpx @zhangziheng\/resume\ncurl -sL https:\/\/resume\.zihengzhang\.com\/resume\.json\ncurl -sL https:\/\/resume\.zihengzhang\.com\/resume\.7 \| man -l -/);
  assert.doesNotMatch(output, /全栈开发工程师/);
  assert.doesNotMatch(output, /Java 17|systemd|GitHub Actions|Go 安全客户端/);
  assert.doesNotMatch(output, /\[项目\]/);
  assert.doesNotMatch(output, /项目经历/);
  assert.doesNotMatch(output, /\bName\b/);
  assert.doesNotMatch(output, /\bSummary\b/);
});
