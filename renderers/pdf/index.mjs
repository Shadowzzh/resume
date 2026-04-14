import fs from "node:fs/promises";
import { access } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);

const CHROME_CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

async function resolveChromeBinary() {
  if (process.env.CHROME_BIN) {
    try {
      await access(process.env.CHROME_BIN);
      return process.env.CHROME_BIN;
    } catch {
      throw new Error(`Configured CHROME_BIN was not found: ${process.env.CHROME_BIN}`);
    }
  }

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
