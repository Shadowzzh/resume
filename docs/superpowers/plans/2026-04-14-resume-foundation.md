# Resume Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working scaffold for a single-source resume repo that can load YAML and Markdown content, produce canonical and public resume data, and render basic HTML, PDF, man, and CLI outputs.

**Architecture:** Keep content in `content/`, normalize it into one canonical model, derive a redacted public model, and feed renderers from the normalized data. Use Node built-ins plus one YAML parser dependency, and keep PDF generation on the local machine by driving installed Chrome in headless print mode.

**Tech Stack:** Node.js 22, `yaml`, built-in `node:test`, GitHub Actions

---

### Task 1: Repository Scaffold

**Files:**
- Create: `README.md`
- Create: `package.json`
- Create: `.gitignore`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Create: `.github/workflows/publish-npm.yml`

- [ ] Create the repository metadata and scripts.
- [ ] Define the initial automation placeholders.
- [ ] Install dependencies and verify the package manifest is valid.

### Task 2: Content Source Templates

**Files:**
- Create: `content/profile.yaml`
- Create: `content/experience.yaml`
- Create: `content/skills.yaml`
- Create: `content/variants/frontend.yaml`
- Create: `content/variants/fullstack.yaml`
- Create: `content/projects/*.md`

- [ ] Add the first real content sample based on the current resume draft.
- [ ] Ensure every `project_refs` value resolves to an existing project id.
- [ ] Keep variants focused on order and visibility only.

### Task 3: Test-First Normalization

**Files:**
- Create: `tests/normalize.test.mjs`
- Create: `schemas/canonical-resume.schema.json`
- Create: `schemas/public-resume.schema.json`
- Create: `scripts/normalize.mjs`
- Create: `scripts/validate.mjs`

- [ ] Write failing tests for canonical resume generation and public resume redaction.
- [ ] Implement minimal normalization and validation logic to satisfy the tests.
- [ ] Re-run tests until they pass cleanly.

### Task 4: Renderer Pipeline

**Files:**
- Create: `site/templates/layout.html`
- Create: `site/templates/resume.html`
- Create: `site/templates/project.html`
- Create: `renderers/json/index.mjs`
- Create: `renderers/html/index.mjs`
- Create: `renderers/man/index.mjs`
- Create: `renderers/cli/index.mjs`
- Create: `renderers/pdf/index.mjs`
- Create: `scripts/build.mjs`

- [ ] Render `dist/resume.json`, `dist/index.html`, `dist/resume/index.html`, project pages, `dist/resume.7`, and `dist/resume.txt`.
- [ ] Generate `dist/resume.pdf` from the print HTML using headless Chrome when available.
- [ ] Fail clearly if a required output cannot be generated.

### Task 5: CLI Entry

**Files:**
- Create: `bin/resume.mjs`

- [ ] Load bundled resume data from `dist/resume.json`.
- [ ] Print a readable terminal resume view with access commands.

### Task 6: Verification

**Files:**
- Modify: `README.md`

- [ ] Run `npm test`.
- [ ] Run `npm run validate`.
- [ ] Run `npm run build`.
- [ ] Confirm `dist/` contains HTML, JSON, man, text, and PDF outputs.
