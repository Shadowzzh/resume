import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import browserSync from "browser-sync";

export const DEFAULT_WATCH_PATHS = ["content", "scripts", "renderers", "site"];
export const DEFAULT_PORT = 3000;

const THIS_FILE_PATH = fileURLToPath(import.meta.url);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getBuildWatchArgs(watchPaths = DEFAULT_WATCH_PATHS) {
  const args = [];

  for (const watchPath of watchPaths) {
    args.push(`--watch-path=${watchPath}`);
  }

  args.push("--watch-preserve-output", "scripts/build.mjs");

  return args;
}

export function createBrowserSyncOptions(rootDir, port = DEFAULT_PORT) {
  return {
    files: [path.join(rootDir, "dist", "**", "*")],
    notify: false,
    open: false,
    port,
    server: path.join(rootDir, "dist"),
    ui: false
  };
}

export function getBrowserSyncLocalUrl(server, fallbackPort = DEFAULT_PORT) {
  const urls = server.getOption?.("urls");

  if (urls && typeof urls.get === "function") {
    const localUrl = urls.get("local");

    if (localUrl) {
      return localUrl;
    }
  }

  return `http://localhost:${fallbackPort}`;
}

export async function waitForPath(targetPath, options = {}) {
  const {
    intervalMs = 200,
    processRef,
    timeoutMs = 30000
  } = options;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (processRef && (processRef.exitCode !== null || processRef.signalCode !== null)) {
      throw new Error("Build watcher exited before the initial HTML output was ready.");
    }

    try {
      await fs.access(targetPath);
      return;
    } catch {
      await sleep(intervalMs);
    }
  }

  const relativePath = path.relative(process.cwd(), targetPath) || targetPath;

  throw new Error(`Timed out waiting for ${relativePath}.`);
}

function startBuildWatcher(rootDir) {
  return spawn(process.execPath, getBuildWatchArgs(), {
    cwd: rootDir,
    stdio: "inherit"
  });
}

function startBrowserSyncServer(rootDir, port) {
  const server = browserSync.create("resume-dev-html");

  return new Promise((resolve, reject) => {
    server.init(createBrowserSyncOptions(rootDir, port), (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(server);
    });
  });
}

async function stopBuildWatcher(buildWatcher) {
  if (buildWatcher.exitCode !== null || buildWatcher.signalCode !== null) {
    return;
  }

  buildWatcher.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => {
      buildWatcher.once("close", resolve);
    }),
    sleep(2000)
  ]);

  if (buildWatcher.exitCode === null && buildWatcher.signalCode === null) {
    buildWatcher.kill("SIGKILL");
  }
}

async function main() {
  const rootDir = process.cwd();
  const port = Number.parseInt(process.env.PORT ?? "", 10) || DEFAULT_PORT;
  const initialHtmlPath = path.join(rootDir, "dist", "index.html");
  const buildWatcher = startBuildWatcher(rootDir);
  let server;
  let shuttingDown = false;

  const shutdown = async (exitCode = 0) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    if (server) {
      server.exit();
    }

    await stopBuildWatcher(buildWatcher);
    process.exit(exitCode);
  };

  buildWatcher.once("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`;
    console.error(`[dev:html] build watcher exited unexpectedly with ${reason}.`);
    void shutdown(code ?? 1);
  });

  process.once("SIGINT", () => {
    void shutdown(0);
  });

  process.once("SIGTERM", () => {
    void shutdown(0);
  });

  await waitForPath(initialHtmlPath, { processRef: buildWatcher });

  server = await startBrowserSyncServer(rootDir, port);

  console.log(`[dev:html] serving dist at ${getBrowserSyncLocalUrl(server, port)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE_PATH) {
  main().catch((error) => {
    console.error(`[dev:html] ${error.message}`);
    process.exit(1);
  });
}
