import { BrowserWindow, Menu, ipcMain, screen } from "electron";
import * as path from "path";
import { IPC } from "../shared/ipc-channels";

const GIF_PET_WIDTH = 400;
const GIF_PET_HEIGHT = 400;
const isDev = process.env.VITE_DEV === "1";

export interface GifPetSettings {
  getPosition: () => { x?: number; y?: number };
  savePosition: (x: number, y: number) => void;
  getZoom: () => number;
}

let win: BrowserWindow | null = null;
let settings: GifPetSettings | null = null;
let menuAlwaysOnTop = true;
let handlersSetup = false;
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;
let cachedW = GIF_PET_WIDTH;
let cachedH = GIF_PET_HEIGHT;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function debouncedSavePosition(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (win && !win.isDestroyed()) {
      const [x, y] = win.getPosition();
      try { settings?.savePosition(x, y); } catch { /* ignore */ }
    }
  }, 500);
}

function getRestoreCoords(): { x?: number; y?: number } {
  if (!settings) return {};
  const { x, y } = settings.getPosition();
  const zoom = settings.getZoom();
  const w = Math.round(GIF_PET_WIDTH * zoom);
  const h = Math.round(GIF_PET_HEIGHT * zoom);
  if (x !== undefined && y !== undefined) {
    const display = screen.getDisplayMatching({ x, y, width: w, height: h });
    const wa = display.workArea;
    const interW = Math.min(x + w, wa.x + wa.width) - Math.max(x, wa.x);
    const interH = Math.min(y + h, wa.y + wa.height) - Math.max(y, wa.y);
    if (interW >= 80 && interH >= 80) return { x, y };
  }
  return {};
}

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: "表情动作",
      submenu: [
        { label: "忙着呢", click: () => sendAction("react_1") },
        { label: "欣赏", click: () => sendAction("react_2") },
        { label: "有主意了", click: () => sendAction("react_3") },
        { label: "无辜", click: () => sendAction("react_4") },
        { label: "开心", click: () => sendAction("react_5") },
      ],
    },
    { label: "回到待机", click: () => sendAction("idle") },
    { type: "separator" },
    {
      label: "窗口置顶",
      type: "checkbox",
      checked: menuAlwaysOnTop,
      click: (mi) => {
        menuAlwaysOnTop = mi.checked;
        if (win && !win.isDestroyed()) {
          win.setAlwaysOnTop(menuAlwaysOnTop);
        }
      },
    },
    { type: "separator" },
    { label: "关闭桌宠", click: () => closeGifPetWindow() },
  ]);
}

function sendAction(action: string): void {
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC.GIF_PET_CONTEXT_MENU, action);
  }
}

export function createGifPetWindow(s: GifPetSettings): BrowserWindow {
  if (win && !win.isDestroyed()) return win;

  settings = s;
  const zoom = s.getZoom();
  const w = Math.round(GIF_PET_WIDTH * zoom);
  const h = Math.round(GIF_PET_HEIGHT * zoom);
  const { x, y } = getRestoreCoords();

  win = new BrowserWindow({
    x,
    y,
    width: w,
    height: h,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: menuAlwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, "..", "..", "preload", "preload", "gif-pet-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (x !== undefined) {
    targetX = currentX = x;
    targetY = currentY = y!;
  }
  cachedW = w;
  cachedH = h;

  if (isDev) {
    win.loadURL("http://localhost:5173/gif-pet/index.html");
  } else {
    win.loadFile(path.join(__dirname, "..", "..", "renderer", "gif-pet", "index.html"));
  }

  if (!handlersSetup) {
    handlersSetup = true;
    ipcMain.on(IPC.GIF_PET_MOVE, (_e, dx: unknown, dy: unknown) => {
      if (typeof dx === "number" && typeof dy === "number") {
        targetX += dx;
        targetY += dy;
        debouncedSavePosition();
      }
    });
  }

  // Lerp tick — smooth follow towards target
  tickTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const lerp = 0.35;
    currentX += (targetX - currentX) * lerp;
    currentY += (targetY - currentY) * lerp;
    win.setBounds({
      x: Math.round(currentX),
      y: Math.round(currentY),
      width: cachedW,
      height: cachedH,
    });
  }, 8); // ~120fps

  win.webContents.on("context-menu", () => {
    const menu = buildContextMenu();
    menu.popup({ window: win! });
  });

  win.on("moved", () => {
    if (win && !win.isDestroyed()) {
      const [wx, wy] = win.getPosition();
      targetX = currentX = wx;
      targetY = currentY = wy;
    }
  });

  win.on("resized", () => {
    if (win && !win.isDestroyed()) {
      [cachedW, cachedH] = win.getSize();
    }
  });

  win.on("closed", () => {
    if (saveTimer) clearTimeout(saveTimer);
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    win = null;
  });

  console.log("[GIF-Pet] Window created");
  return win;
}

export function applyGifPetAlwaysOnTop(onTop: boolean): void {
  menuAlwaysOnTop = onTop;
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(onTop, onTop ? "screen-saver" : "normal");
  }
}

export function applyGifPetVisible(visible: boolean): void {
  if (!visible) {
    if (win && !win.isDestroyed()) win.hide();
    return;
  }
  if (win && !win.isDestroyed()) {
    win.show();
  } else if (settings) {
    createGifPetWindow(settings);
  }
}

export function applyGifPetZoom(zoom: number): void {
  if (win && !win.isDestroyed()) {
    const [oldW, oldH] = win.getSize();
    const [x, y] = win.getPosition();
    const newW = Math.round(GIF_PET_WIDTH * zoom);
    const newH = Math.round(GIF_PET_HEIGHT * zoom);
    const dx = Math.round((newW - oldW) / 2);
    const dy = Math.round((newH - oldH) / 2);
    win.setBounds({ x: x - dx, y: y - dy, width: newW, height: newH });
    targetX = currentX = x - dx;
    targetY = currentY = y - dy;
    cachedW = newW;
    cachedH = newH;
  }
}

export function closeGifPetWindow(): void {
  if (win && !win.isDestroyed()) win.close();
}

export function isGifPetOpen(): boolean {
  return win !== null && !win.isDestroyed();
}
