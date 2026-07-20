// Dev-mode orchestrator: starts the root Vite dev server, waits for it to
// actually respond, then launches Electron pointed at it — so `npm run
// dev` in /desktop gives the same hot-reloading dev loop as `npm run dev`
// in the browser, just in a native window. `npm run start` (production
// mode) skips all of this and just loads the built dist/index.html.
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const repoRoot = path.resolve(__dirname, "..");
const devServerUrl = "http://localhost:5173";

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`Vite dev server never came up at ${url}`));
        } else {
          setTimeout(attempt, 500);
        }
      });
    };
    attempt();
  });
}

async function main() {
  console.log("[desktop] starting Vite dev server...");
  const vite = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  vite.on("exit", (code) => {
    // If Vite dies on its own, there's nothing left to show — go down with it.
    process.exit(code ?? 1);
  });

  await waitForServer(devServerUrl, 30000);
  console.log("[desktop] Vite is up, launching Electron...");

  const electronBinary = require("electron");
  const electron = spawn(electronBinary, ["."], {
    cwd: __dirname,
    stdio: "inherit",
    env: { ...process.env, ELECTRON_DEV_SERVER_URL: devServerUrl },
  });

  electron.on("exit", (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[desktop]", err);
  process.exit(1);
});
