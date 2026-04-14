# Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the resume site so the homepage reads like a technical portfolio landing page while the print page keeps a more professional resume layout.

**Architecture:** Keep the existing single-source resume pipeline and split the HTML rendering into two page compositions: a branded homepage and a restrained print page. Reuse shared render helpers for data formatting, then pass page-specific placeholder values into separate templates that share one layout stylesheet.

**Tech Stack:** Node.js 22, native test runner, template-based HTML renderer, Chrome-based PDF generation

---

### Task 1: Lock homepage and print-page structure with tests

**Files:**
- Modify: `tests/html.test.mjs`
- Test: `tests/html.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test("renderHtmlSite separates homepage branding from print resume layout", async () => {
  // Assert homepage contains branded hero, selected work, capability matrix,
  // and access panel sections.
  // Assert print page contains summary, experience, selected projects,
  // and does not include homepage-only section labels.
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/html.test.mjs`
Expected: FAIL because the current templates render the same section structure for both pages.

- [ ] **Step 3: Write minimal implementation**

```js
// Update HTML renderer to emit distinct homepage and print page templates,
// with page-specific placeholder values for hero, selected work, matrix,
// and print resume sections.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/html.test.mjs`
Expected: PASS for the new structural assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/html.test.mjs renderers/html/index.mjs site/templates/layout.html site/templates/home.html site/templates/print.html
git commit -m "feat: refresh resume site presentation"
```

### Task 2: Implement shared visual language and role-specific templates

**Files:**
- Modify: `renderers/html/index.mjs`
- Modify: `site/templates/layout.html`
- Create: `site/templates/home.html`
- Create: `site/templates/print.html`

- [ ] **Step 1: Add template placeholders for branded and print-specific sections**

```js
// Render homepage placeholders:
// heroLead, heroMeta, selectedWork, capabilityMatrix, experienceSnapshot, accessPanel, contactLinks
// Render print placeholders:
// summaryBlock, experienceList, projectHighlights, skillGroups, contactDetails
```

- [ ] **Step 2: Build the homepage composition**

```html
<section class="hero">...</section>
<section class="section-block">...</section>
```

- [ ] **Step 3: Build the print composition**

```html
<section class="print-header">...</section>
<section class="print-section">...</section>
```

- [ ] **Step 4: Update shared layout styles**

```css
/* Add cold technical palette, grid-based hero layout, panel system,
   and restrained print rules that remove homepage-only decoration. */
```

- [ ] **Step 5: Re-run HTML tests**

Run: `node --test tests/html.test.mjs`
Expected: PASS

### Task 3: Verify the full pipeline still works

**Files:**
- Verify: `dist/index.html`
- Verify: `dist/print/index.html`
- Verify: `dist/resume.pdf`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS with all tests green.

- [ ] **Step 2: Run validation**

Run: `npm run validate`
Expected: PASS with no schema/content errors.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS and regenerate HTML/PDF artifacts.

- [ ] **Step 4: Inspect output markers**

Run: `rg -n "Selected Work|Capability Matrix|Experience|Terminal Access|Core Summary" dist/index.html dist/print/index.html`
Expected: homepage contains branded sections and print page contains resume sections.
