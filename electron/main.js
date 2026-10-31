/**
 * C-Cube — Processo principal do Electron (PC: Windows/macOS/Linux).
 *
 * Em produção serve a exportação estática do Next (pasta `out`) através de um
 * mini-servidor HTTP local (evita problemas de caminhos absolutos em file://).
 * Em desenvolvimento, usa CUBE_DEV_URL (ex.: http://localhost:3000).
 */
const { app, BrowserWindow, shell } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", ".next-static");
const DEV_URL = process.env.CUBE_DEV_URL || "";
const isDev = Boolean(DEV_URL);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      let filePath = path.normalize(path.join(DIST, pathname));
      if (!filePath.startsWith(DIST)) {
        res.writeHead(403);
        return res.end("Forbidden");
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // fallback SPA
        filePath = path.join(DIST, "index.html");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end("Internal error");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 720,
    minHeight: 520,
    title: "C-Cube",
    backgroundColor: "#07080d",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    await win.loadURL(DEV_URL);
  } else {
    const server = await startStaticServer();
    const port = server.address().port;
    await win.loadURL(`http://127.0.0.1:${port}/`);
  }
}

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
