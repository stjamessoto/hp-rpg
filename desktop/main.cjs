// Electron main process. Loads either the live Vite dev server (set
// ELECTRON_DEV_SERVER_URL, see dev.cjs) or the built site from ./www off
// disk — /web itself needs zero changes either way, this is purely a
// native window wrapped around the same static site. ./www is a copy of
// the root ../dist (see prepare-www.cjs), not a symlink — electron-builder
// packages files from inside the app directory, not from a parent, so the
// built site has to live inside /desktop before packaging, and this same
// path works identically whether running from source or from a packaged
// build (both put www/ next to main.cjs).
const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const devServerUrl = process.env.ELECTRON_DEV_SERVER_URL;
const iconPath = path.join(__dirname, "build", "icon.ico");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 820,
    minWidth: 480,
    minHeight: 560,
    title: "HP-RPG",
    icon: iconPath,
    backgroundColor: "#14100c", // matches web/src/style.css's --bg, avoids a white flash on load
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setMenuBarVisibility(false);

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "www", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
