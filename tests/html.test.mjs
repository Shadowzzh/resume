import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildCanonicalResume } from "../scripts/normalize.mjs";
import { renderHtmlSite } from "../renderers/html/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

test("renderHtmlSite writes a single resume entry and github pages-safe links", async () => {
  const resume = await buildCanonicalResume({
    rootDir: projectRoot,
    variantId: "frontend"
  });
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-html-"));

  try {
    const result = await renderHtmlSite({
      resume,
      rootDir: projectRoot,
      outputDir
    });

    assert.equal(result.homepagePath, path.join(outputDir, "index.html"));
    assert.equal(result.printPagePath, path.join(outputDir, "print", "index.html"));

    await assert.doesNotReject(fs.access(path.join(outputDir, "index.html")));
    await assert.doesNotReject(fs.access(path.join(outputDir, "print", "index.html")));
    await assert.rejects(fs.access(path.join(outputDir, "resume", "index.html")));

    const homepage = await fs.readFile(path.join(outputDir, "index.html"), "utf8");

    assert.match(homepage, /href="\/resume\/projects\/component-library\/"/);
    assert.match(homepage, /href="\/resume\/projects\/cnapp-platform\/"/);
    assert.doesNotMatch(homepage, /href="\/projects\//);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
