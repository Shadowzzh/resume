#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderCliResume } from "../renderers/cli/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const resumeJsonPath = path.join(packageRoot, "dist", "resume.json");

async function main() {
  let content;

  try {
    content = await fs.readFile(resumeJsonPath, "utf8");
  } catch {
    console.error("dist/resume.json not found. Run 'npm run build' first.");
    process.exitCode = 1;
    return;
  }

  const resume = JSON.parse(content);
  process.stdout.write(renderCliResume(resume));
}

main();
