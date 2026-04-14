import fs from "node:fs/promises";
import path from "node:path";

import { buildCanonicalResume, buildPublicResume } from "./normalize.mjs";
import { validateAll } from "./validate.mjs";
import { renderJson } from "../renderers/json/index.mjs";
import { renderHtmlSite } from "../renderers/html/index.mjs";
import { renderManPage } from "../renderers/man/index.mjs";
import { renderCliResume } from "../renderers/cli/index.mjs";
import { renderPdf } from "../renderers/pdf/index.mjs";

async function ensureCleanDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

function shouldBuildPdf() {
  return process.env.BUILD_PDF === "true";
}

async function main() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, "dist");

  await validateAll({ rootDir, variantId: "frontend" });
  await ensureCleanDir(distDir);

  const canonicalResume = await buildCanonicalResume({
    rootDir,
    variantId: "frontend"
  });
  const publicResume = buildPublicResume(canonicalResume);

  await renderJson({
    resume: publicResume,
    outputPath: path.join(distDir, "resume.json")
  });

  const htmlResult = await renderHtmlSite({
    resume: canonicalResume,
    rootDir,
    outputDir: distDir
  });

  await renderManPage({
    resume: publicResume,
    outputPath: path.join(distDir, "resume.7")
  });

  await fs.writeFile(path.join(distDir, "resume.txt"), renderCliResume(publicResume), "utf8");
  await fs.writeFile(path.join(distDir, "CNAME"), `${canonicalResume.branding.domain}\n`, "utf8");
  await fs.writeFile(path.join(distDir, ".nojekyll"), "", "utf8");

  if (shouldBuildPdf()) {
    await renderPdf({
      inputHtmlPath: htmlResult.printPagePath,
      outputPath: path.join(distDir, "resume.pdf")
    });
  }

  console.log("Build completed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
