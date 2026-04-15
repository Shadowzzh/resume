import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  DEFAULT_WATCH_PATHS,
  createBrowserSyncOptions,
  getBrowserSyncLocalUrl,
  getBuildWatchArgs,
  waitForPath
} from "../scripts/dev-html.mjs";

test("getBuildWatchArgs covers the expected source directories", () => {
  const args = getBuildWatchArgs();

  assert.deepEqual(
    args,
    [
      ...DEFAULT_WATCH_PATHS.map((watchPath) => `--watch-path=${watchPath}`),
      "--watch-preserve-output",
      "scripts/build.mjs"
    ]
  );
});

test("createBrowserSyncOptions serves dist and watches generated files", () => {
  const options = createBrowserSyncOptions("/tmp/resume", 4321);

  assert.equal(options.server, path.join("/tmp/resume", "dist"));
  assert.deepEqual(options.files, [path.join("/tmp/resume", "dist", "**", "*")]);
  assert.equal(options.port, 4321);
  assert.equal(options.open, false);
  assert.equal(options.notify, false);
  assert.equal(options.ui, false);
});

test("getBrowserSyncLocalUrl prefers the actual BrowserSync local URL", () => {
  const fakeServer = {
    getOption(key) {
      if (key !== "urls") {
        return null;
      }

      return {
        get(urlKey) {
          if (urlKey !== "local") {
            return null;
          }

          return "http://localhost:3001";
        }
      };
    }
  };

  assert.equal(getBrowserSyncLocalUrl(fakeServer, 3000), "http://localhost:3001");
});

test("waitForPath resolves when the target file appears", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-dev-html-"));
  const targetPath = path.join(tempDir, "index.html");

  try {
    setTimeout(async () => {
      await fs.writeFile(targetPath, "<html></html>", "utf8");
    }, 50);

    await assert.doesNotReject(waitForPath(targetPath, { intervalMs: 10, timeoutMs: 1000 }));
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true });
  }
});

test("waitForPath fails fast when the build watcher has already exited", async () => {
  const fakeProcess = {
    exitCode: 1,
    signalCode: null
  };

  await assert.rejects(
    waitForPath("/tmp/does-not-matter", {
      intervalMs: 10,
      processRef: fakeProcess,
      timeoutMs: 1000
    }),
    /Build watcher exited before the initial HTML output was ready\./
  );
});
