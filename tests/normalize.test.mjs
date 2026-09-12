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
  assert.equal(resume.featuredProjects[1].id, "security-baseline-agent");
  assert.equal(resume.featuredProjects[2].id, "document-automation");
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

  assert.equal(resume.variant.label, "全栈版");
  assert.equal(
    resume.skills.some((skill) => skill.id === "ai"),
    false
  );
  assert.equal(resume.featuredProjects[0].id, "auto-pentest-platform");
});

test("buildPublicResume preserves the explicitly public contact fields", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "fullstack"
  });
  const publicResume = buildPublicResume(canonical);

  assert.equal(publicResume.basics.contact.phone, canonical.basics.contact.phone);
  assert.equal(publicResume.meta.visibility, "public");
});
