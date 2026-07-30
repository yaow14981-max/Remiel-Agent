// 本地音乐播放管理
// 通过 IPC 控制聊天窗口中的 Audio 元素播放本地音频文件

import { BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import { IPC } from "../shared/ipc-channels";

export type LoopMode = "single" | "list";

export interface LocalMusicState {
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTrack: string | null;
  trackPath: string | null;
  trackName: string;
  loopMode: LoopMode;
}

let chatWindow: BrowserWindow | null = null;
let state: LocalMusicState = {
  playing: false,
  muted: false,
  volume: 0.6,
  currentTrack: null,
  trackPath: null,
  trackName: "",
  loopMode: "list",
};

export function setMusicChatWindow(win: BrowserWindow | null) {
  chatWindow = win;
}

function notifyRenderer() {
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.webContents.send("music:local-status-changed", state);
  }
}

export function getMusicState(): LocalMusicState {
  return { ...state };
}

export function getMusicDir(): string {
  // 开发模式走项目目录，打包后走 resources
  const base = process.env.NODE_ENV === "development" || !require("electron").app.isPackaged
    ? require("electron").app.getAppPath()
    : process.resourcesPath;
  return path.join(base, "assets", "music");
}

export function listMusicTracks(): { file: string; name: string }[] {
  const dir = getMusicDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /\.(mp3|ogg|wav|flac|m4a|aac)$/i.test(f))
    .map((f) => ({ file: f, name: f.replace(/\.[^.]+$/, "") }));
}

export function getDefaultTrack(): string | null {
  const tracks = listMusicTracks();
  if (tracks.length === 0) return null;
  // 优先选 two-to-tango
  const preferred = tracks.find((t) => t.file.includes("two-to-tango") || t.file.includes("tango"));
  return preferred ? preferred.file : tracks[0].file;
}

export function registerLocalMusicIpc() {
  ipcMain.on(IPC.MUSIC_LOCAL_PLAY, () => {
    state.playing = true;
    notifyRenderer();
  });

  ipcMain.on(IPC.MUSIC_LOCAL_PAUSE, () => {
    state.playing = false;
    notifyRenderer();
  });

  ipcMain.on(IPC.MUSIC_LOCAL_TOGGLE, () => {
    state.playing = !state.playing;
    notifyRenderer();
  });

  ipcMain.on(IPC.MUSIC_LOCAL_SET_VOLUME, (_e, v: number) => {
    state.volume = Math.max(0, Math.min(1, v));
    notifyRenderer();
  });

  ipcMain.on(IPC.MUSIC_LOCAL_TOGGLE_MUTE, () => {
    state.muted = !state.muted;
    notifyRenderer();
  });

  ipcMain.on(IPC.MUSIC_LOCAL_SET_TRACK, (_e, file: string) => {
    const dir = getMusicDir();
    const fullPath = path.join(dir, file);
    if (fs.existsSync(fullPath)) {
      state.currentTrack = file;
      state.trackPath = fullPath;
      state.trackName = file.replace(/\.[^.]+$/, "");
      state.playing = true;
      notifyRenderer();
    }
  });

  ipcMain.handle(IPC.MUSIC_LOCAL_STATUS, () => getMusicState());

  ipcMain.handle(IPC.MUSIC_LOCAL_LIST_TRACKS, () => listMusicTracks());

  ipcMain.on(IPC.MUSIC_LOCAL_SET_LOOP_MODE, (_e, mode: LoopMode) => {
    state.loopMode = mode;
    notifyRenderer();
  });

  ipcMain.handle(IPC.MUSIC_LOCAL_NEXT_TRACK, () => {
    if (state.loopMode === "single" || !state.currentTrack) return null;
    const tracks = listMusicTracks();
    if (tracks.length <= 1) return null;
    const idx = tracks.findIndex((t) => t.file === state.currentTrack);
    const next = tracks[(idx + 1) % tracks.length];
    const dir = getMusicDir();
    state.currentTrack = next.file;
    state.trackPath = path.join(dir, next.file);
    state.trackName = next.name;
    notifyRenderer();
    return { file: next.file, path: state.trackPath, name: next.name };
  });
}

export function toggleMute(): boolean {
  state.muted = !state.muted;
  notifyRenderer();
  return state.muted;
}

export function isMusicMuted(): boolean {
  return state.muted;
}

export function autoPlayMusic() {
  if (!state.currentTrack && !state.playing) {
    const defaultTrack = getDefaultTrack();
    if (defaultTrack) {
      const dir = getMusicDir();
      state.currentTrack = defaultTrack;
      state.trackPath = path.join(dir, defaultTrack);
      state.trackName = defaultTrack.replace(/\.[^.]+$/, "");
      state.playing = true;
      notifyRenderer();
    }
  }
}
