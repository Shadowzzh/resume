import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume, buildPublicResume } from "../scripts/normalize.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("buildCanonicalResume applies the frontend variant ordering", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });

  assert.equal(resume.variant.id, "frontend");
  assert.equal(resume.basics.headline.primary, "高级前端工程师");
  assert.equal(resume.basics.headline.secondary, "AI 应用与工程化");
  assert.equal(resume.featuredProjects[0].id, "auto-pentest-platform");
  assert.equal(resume.featuredProjects[1].id, "document-automation");
  assert.equal(resume.featuredProjects[2].id, "cnapp-platform");
  assert.equal(resume.featuredProjects[3].id, "component-library");
  assert.deepEqual(
    resume.skills.map((skill) => skill.id),
    ["frontend", "engineering", "backend", "delivery"]
  );
  assert.equal(resume.experience[0].id, "qidun");
});

test("buildCanonicalResume keeps AI positioning in projects instead of a skill category", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });

  assert.equal(resume.variant.label, "AI 应用版");
  assert.deepEqual(
    resume.skills.map((skill) => skill.id),
    ["frontend", "engineering", "backend", "delivery"]
  );
  assert.equal(resume.featuredProjects[0].id, "auto-pentest-platform");
});

test("buildPublicResume preserves the explicitly public contact fields", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const publicResume = buildPublicResume(canonical);

  assert.equal(publicResume.basics.contact.phone, canonical.basics.contact.phone);
  assert.equal(publicResume.meta.visibility, "public");
});
