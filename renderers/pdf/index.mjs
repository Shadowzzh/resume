import fs from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

async function resolveChromeBinary() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("No supported Chrome-based browser found for PDF generation.");
}

export async function renderPdf({ inputHtmlPath, outputPath }) {
  const chromeBinary = await resolveChromeBinary();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const inputUrl = pathToFileURL(inputHtmlPath).href;
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--print-to-pdf=${outputPath}`,
    inputUrl
  ];

  try {
    await execFileAsync(chromeBinary, args);
  } catch (error) {
    const message = error.stderr || error.message;
    throw new Error(`Failed to generate PDF: ${message}`);
  }
}
