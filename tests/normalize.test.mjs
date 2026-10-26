import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("buildCanonicalResume applies the fullstack variant ordering", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  assert.equal(resume.variant.id, "fullstack");
  assert.equal(resume.basics.headline.primary, "全栈工程师偏前端");
  assert.equal(resume.basics.headline.secondary, undefined);
  assert.equal(resume.featuredProjects[0].id, "auto-pentest-platform");
  assert.deepEqual(
    resume.featuredProjects.map((project) => project.id),
    [
      "auto-pentest-platform",
      "qidun-official-site",
      "security-baseline-agent",
      "mobile-pentest",
      "videodoc",
      "document-automation"
    ],
    "featured projects follow the fullstack variant order exactly"
  );
  assert.deepEqual(
    resume.skills.map((skill) => skill.id),
    ["frontend", "ai-agent", "backend", "delivery"]
  );
  const frontendDomain = resume.skills.find((skill) => skill.id === "frontend");
  assert.equal(frontendDomain.name, "前端");
  assert.equal(frontendDomain.level, "strong");
  assert.deepEqual(frontendDomain.keywords, [
    "JavaScript / TypeScript",
    "Vue 2 / Vue 3",
    "React / Next.js",
    "Vite / Webpack",
    "Monorepo",
    "组件库",
    "单元测试"
  ]);
  assert.equal(
    resume.skills.some((skill) => skill.id === "engineering"),
    false,
    "engineering is merged into the frontend domain"
  );
  assert.equal(resume.experience[0].id, "qidun");
  const [qidun, wotu, yuanhe] = resume.experience;
  assert.equal(qidun.id, "qidun", "experience ordering starts with qidun");
  assert.equal(qidun.summary.length, 4);
  assert.equal(wotu.summary.length, 2);
  assert.equal(yuanhe.summary.length, 1);
  assert.equal(qidun.company, "杭州奇盾");
  assert.equal(qidun.role, "全栈工程师偏前端");
  assert.equal(qidun.city, "杭州西湖区");
  assert.equal(qidun.start, "2024-03");
  assert.equal(qidun.end, "present");
  assert.equal(qidun.employment_type, "full-time");
  assert.deepEqual(qidun.tech_stack, [
    "React",
    "Vue 3",
    "Next.js",
    "Node.js",
    "Go",
    "Java / Spring Boot",
    "Docker"
  ]);
  assert.equal(wotu.company, "杭州沃土教育");
  assert.equal(wotu.role, "前端开发工程师");
  assert.equal(wotu.start, "2022-02");
  assert.equal(wotu.end, "2023-10");
  assert.deepEqual(wotu.tech_stack, ["Vue", "React", "钉钉小程序", "H5", "低代码"]);
  assert.equal(yuanhe.company, "苏州元和信息有限公司");
  assert.equal(yuanhe.role, "前端开发工程师");
  assert.equal(yuanhe.start, "2020-08");
  assert.equal(yuanhe.end, "2022-03");
  assert.deepEqual(yuanhe.tech_stack, ["Vue 3", "Tailwind CSS"]);
});

test("buildCanonicalResume keeps four company projects and two personal projects featured", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  const companyProjects = resume.featuredProjects.filter(
    (project) => project.company !== "个人项目"
  );
  const personalProjects = resume.featuredProjects.filter(
    (project) => project.company === "个人项目"
  );

  assert.deepEqual(
    companyProjects.map((project) => project.id),
    [
      "auto-pentest-platform",
      "qidun-official-site",
      "security-baseline-agent",
      "mobile-pentest"
    ]
  );
  assert.deepEqual(
    personalProjects.map((project) => project.id),
    ["videodoc", "document-automation"],
    "personal projects order VideoDoc before the documentation toolkit"
  );

  const projectIds = resume.projects.map((project) => project.id);
  assert.ok(projectIds.includes("lisu-official-site"), "lisu stays available as a project");
  assert.equal(
    resume.featuredProjects.some((project) => project.id === "lisu-official-site"),
    false,
    "lisu is not part of the default featured projects"
  );

  const lisu = resume.projects.find((project) => project.id === "lisu-official-site");
  assert.equal(lisu.featured, false);
});

test("official site projects only carry verified facts", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  for (const id of ["qidun-official-site", "lisu-official-site"]) {
    const project = resume.projects.find((item) => item.id === id);

    assert.ok(project, `${id} should exist`);
    assert.equal(project.start, undefined, `${id} has no confirmed start date`);
    assert.equal(project.end, undefined, `${id} has no confirmed end date`);
    assert.equal(project.status, undefined, `${id} has no confirmed release status`);
    assert.deepEqual(project.links, [], `${id} has no public link`);
    assert.match(project.body, /## 背景/, `${id} documents its background in the body`);
    assert.doesNotMatch(project.body, /\d{4}\s*[-\/年]/, `${id} invents no timeline`);
    assert.doesNotMatch(
      project.body,
      /已上线|上线后|投入生产|正式发布/,
      `${id} makes no unverified release claim`
    );
  }
});

test("approved mobile, documentation and VideoDoc copy lands in the canonical resume", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const projectById = (id) => resume.featuredProjects.find((project) => project.id === id);

  const mobile = projectById("mobile-pentest");
  const documentation = projectById("document-automation");
  const videodoc = projectById("videodoc");

  assert.ok(mobile && documentation && videodoc, "all three revised projects stay featured");

  assert.equal(mobile.title, "移动端自动化探索与接口资产梳理");
  assert.equal(documentation.title, "AI 产品文档生成工具箱");
  assert.equal(videodoc.title, "视频转图文工作台");

  assert.equal(mobile.summary.length, 2);
  assert.equal(mobile.responsibility.length, 2);
  assert.equal(mobile.impact.length, 2);
  assert.equal(documentation.summary.length, 2);
  assert.equal(videodoc.summary.length, 2);

  // APP 完整链路在 summary[0]、职责数组合集与 impact[0] 均可核查
  for (const text of [mobile.summary[0], mobile.responsibility.join("")]) {
    assert.match(text, /功能大纲/, "APP link keeps 功能大纲");
    assert.match(text, /mitmproxy/, "APP link keeps mitmproxy");
    assert.match(text, /静态分析/, "APP link keeps 静态分析");
    assert.match(text, /接口资产/, "APP link keeps 接口资产");
    assert.match(text, /拓扑/, "APP link keeps 拓扑");
  }
  assert.match(mobile.responsibility[0], /真机功能探索/);
  assert.match(mobile.responsibility[0], /页面树/);
  assert.match(mobile.responsibility[1], /MobSF/);
  assert.match(mobile.responsibility[1], /反编译/);
  assert.match(mobile.impact[0], /功能大纲/);
  assert.match(mobile.impact[0], /接口清单/);
  assert.match(mobile.impact[0], /拓扑/);

  // 文档工具的现场判断 / 稳定动作 逐字保留中文双引号
  assert.match(
    documentation.summary[1],
    /将“现场判断”与“稳定动作”分离/,
    "documentation summary keeps the approved quoted phrase verbatim"
  );
  assert.match(documentation.summary[1], /会话复用/);
  assert.match(documentation.summary[1], /临时脱敏/);
  assert.match(documentation.summary[1], /SVG 标注/);
  assert.match(documentation.summary[1], /任务状态/);
  assert.match(documentation.summary[1], /清理任务资源/);

  // VideoDoc 摘要是通用在线视频下载与图文转换，平台示例为 X（Twitter）/ YouTube / 哔哩哔哩等
  assert.match(videodoc.summary[0], /下载在线视频/, "VideoDoc summary generalizes to downloading online video");
  assert.match(videodoc.summary[0], /X（Twitter）/, "VideoDoc summary lists X (Twitter) as an example platform");
  assert.match(videodoc.summary[0], /YouTube/, "VideoDoc summary lists YouTube as an example platform");
  assert.match(videodoc.summary[0], /哔哩哔哩/, "VideoDoc summary lists Bilibili as an example platform");
  assert.match(videodoc.summary[0], /等平台/, "VideoDoc summary marks the platform list as examples");
  assert.doesNotMatch(videodoc.summary[0], /Bilibili|仅支持|只有/, "VideoDoc summary leaves the platform scope open");
  assert.match(videodoc.summary[0], /时间锚点/);
  assert.match(videodoc.summary[0], /定位原视频/);
  assert.match(videodoc.summary[1], /Flask/);
  assert.match(videodoc.summary[1], /React/);
  assert.match(videodoc.summary[1], /持久化任务状态与中间产物/);
  assert.match(videodoc.summary[1], /失败阶段重试/);
  assert.match(videodoc.summary[1], /断点续跑/);
  assert.match(videodoc.summary[1], /已完成阶段复用/);

  // VideoDoc 正文结果以正向成果收尾，不再保留免责句或绝对承诺
  assert.match(videodoc.body, /在线视频链接/, "VideoDoc body generalizes the background goal to online video links");
  assert.match(
    videodoc.body,
    /X（Twitter）、YouTube、哔哩哔哩等在线视频链接/,
    "VideoDoc body reuses the approved platform examples once"
  );
  assert.match(videodoc.body, /产出带时间锚点的图文内容，支持回看与核对。/);
  assert.doesNotMatch(videodoc.body, /仍由人工核对后使用/);
  for (const project of [mobile, documentation, videodoc]) {
    assert.doesNotMatch(project.body, /任意端点/);
    assert.doesNotMatch(project.body, /无需人工整理/);
    assert.doesNotMatch(project.body, /100% 覆盖/);
    assert.doesNotMatch(project.body, /可复现地/);
  }

  // 元数据保持原样
  assert.equal(mobile.id, "mobile-pentest");
  assert.equal(mobile.company, "杭州奇盾");
  assert.equal(mobile.featured, true);
  assert.equal(mobile.status, "completed");
  assert.equal(mobile.start, "2026-07");
  assert.equal(mobile.end, "2026-08");
  assert.equal(mobile.role, "全栈工程师偏前端");
  assert.deepEqual(mobile.category, ["AI Agent", "移动端安全"]);
  assert.deepEqual(mobile.stack, ["Mobilewright", "MCP", "adb", "mitmproxy", "MobSF"]);
  assert.deepEqual(mobile.links, []);

  assert.equal(documentation.id, "document-automation");
  assert.equal(documentation.company, "个人项目");
  assert.equal(documentation.featured, true);
  assert.equal(documentation.status, "completed");
  assert.equal(documentation.start, "2026-07");
  assert.equal(documentation.end, "2026-07");
  assert.equal(documentation.role, "独立设计与开发");
  assert.deepEqual(documentation.category, ["AI Agent", "浏览器自动化"]);
  assert.deepEqual(documentation.stack, [
    "AI Agent",
    "Node.js",
    "Playwright / CDP",
    "JavaScript",
    "Markdown"
  ]);
  assert.deepEqual(documentation.links, ["https://github.com/Shadowzzh/product-docs-toolkit"]);

  assert.equal(videodoc.id, "videodoc");
  assert.equal(videodoc.company, "个人项目");
  assert.equal(videodoc.featured, true);
  assert.equal(videodoc.status, "completed");
  assert.equal(videodoc.start, "2026-09");
  assert.equal(videodoc.end, "2026-09");
  assert.equal(videodoc.role, "独立设计与开发");
  assert.deepEqual(videodoc.category, ["AI 应用", "全栈开发"]);
  assert.deepEqual(videodoc.stack, [
    "Python / Flask",
    "React 19",
    "TypeScript",
    "Whisper",
    "DeepSeek",
    "ffmpeg",
    "yt-dlp"
  ]);
  assert.deepEqual(videodoc.links, ["https://github.com/Shadowzzh/VideoDoc"]);
});

test("buildCanonicalResume exposes AI Agent capability as a skill domain", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  assert.equal(resume.variant.label, "全栈版");
  const aiDomain = resume.skills.find((skill) => skill.id === "ai-agent");
  assert.ok(aiDomain, "ai-agent skill domain should exist");
  assert.equal(aiDomain.name, "AI Agent");
  assert.ok(aiDomain.keywords.includes("Claude Agent SDK / MCP"));
  assert.ok(aiDomain.keywords.some((keyword) => keyword.includes("移动端自动化")));
  assert.equal(resume.featuredProjects[0].id, "auto-pentest-platform");
});

test("buildPublicResume preserves the explicitly public contact fields", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const publicResume = buildPublicResume(canonical);

  assert.equal(publicResume.basics.contact.email, canonical.basics.contact.email);
  assert.equal(publicResume.basics.contact.phone, undefined);
  assert.equal(publicResume.meta.visibility, "public");
});
