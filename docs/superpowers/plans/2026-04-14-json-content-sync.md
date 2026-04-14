# JSON Content Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the resume content source files with the visible copy from the current JSON export while preserving repository-only build metadata.

**Architecture:** Keep the existing normalization and rendering pipeline unchanged. Update only the content files under `content/` so profile, experience, skills, and project markdown reflect the visible JSON sections, while leaving hidden JSON sections, layout metadata, and build-only branding out of the content sync.

**Tech Stack:** YAML, Markdown, Node.js content normalization scripts

---

### Task 1: Sync profile content from visible JSON fields

**Files:**
- Modify: `content/profile.yaml`
- Verify: `scripts/normalize.mjs`

- [ ] **Step 1: Replace visible profile fields**

```yaml
headline:
  primary: 前端开发工程师
  secondary: 全栈开发工程师
summary:
  short: 5 年 Web 开发经验，前端为主，具备全栈开发能力。
```

- [ ] **Step 2: Preserve repository-only metadata**

```yaml
branding:
  domain: resume.zihengzhang.com
  curl_endpoint: https://resume.zihengzhang.com/resume.json
```

- [ ] **Step 3: Verify required profile fields still exist**

Run: `npm run validate`
Expected: PASS with no missing `profile` field errors.

### Task 2: Rewrite experience, skills, and project content

**Files:**
- Modify: `content/experience.yaml`
- Modify: `content/skills.yaml`
- Modify: `content/projects/auto-pentest-platform.md`
- Modify: `content/projects/cnapp-platform.md`
- Modify: `content/projects/component-library.md`
- Modify: `content/projects/finance-review-system.md`

- [ ] **Step 1: Rewrite visible experience summaries**

```yaml
summary:
  - 负责公司前端和 Node 相关项目的迭代与维护。
  - 负责自动化攻击平台的前端开发与 Claude Agent SDK 封装。
```

- [ ] **Step 2: Rewrite visible skill groups**

```yaml
domains:
  - id: frontend
    name: 常用技术栈
```

- [ ] **Step 3: Update project markdown to match visible JSON copy only**

```md
## 背景

平台基于 Claude Code 能力，目标是让 AI 可以自主执行渗透测试流程并通过平台统一管理。
```

- [ ] **Step 4: Keep project ids compatible with existing variants**

Run: `npm run validate`
Expected: PASS with no unknown `project_refs` or `featured_project_ids`.

### Task 3: Verify the content pipeline still builds

**Files:**
- Verify: `content/profile.yaml`
- Verify: `content/experience.yaml`
- Verify: `content/skills.yaml`
- Verify: `dist/resume.json`

- [ ] **Step 1: Run validation**

Run: `npm run validate`
Expected: PASS

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS and regenerate `dist/` outputs with updated content.
