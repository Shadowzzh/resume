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
  assert.equal(resume.basics.headline.primary, "前端开发工程师");
  assert.equal(resume.featuredProjects[0].id, "component-library");
  assert.equal(resume.skills[0].id, "frontend");
  assert.equal(resume.experience[0].id, "qidun");
});

test("buildPublicResume redacts the phone number for public channels", async () => {
  const canonical = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const publicResume = buildPublicResume(canonical);

  assert.equal(publicResume.basics.contact.phone, "191****0712");
  assert.equal(publicResume.meta.visibility, "public");
});
