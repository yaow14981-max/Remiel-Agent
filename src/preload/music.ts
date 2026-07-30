import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc-channels";

export function exposeMusicApi() {
  // 本地音乐播放 API（蕾米埃尔 EP 等本地音频文件）
  contextBridge.exposeInMainWorld("localMusic", {
    play: () => ipcRenderer.send(IPC.MUSIC_LOCAL_PLAY),
    pause: () => ipcRenderer.send(IPC.MUSIC_LOCAL_PAUSE),
    toggle: () => ipcRenderer.send(IPC.MUSIC_LOCAL_TOGGLE),
    setVolume: (v: number) => ipcRenderer.send(IPC.MUSIC_LOCAL_SET_VOLUME, v),
    toggleMute: () => ipcRenderer.send(IPC.MUSIC_LOCAL_TOGGLE_MUTE),
    setTrack: (file: string) => ipcRenderer.send(IPC.MUSIC_LOCAL_SET_TRACK, file),
    setLoopMode: (mode: string) => ipcRenderer.send(IPC.MUSIC_LOCAL_SET_LOOP_MODE, mode),
    nextTrack: () => ipcRenderer.invoke(IPC.MUSIC_LOCAL_NEXT_TRACK),
    getStatus: () => ipcRenderer.invoke(IPC.MUSIC_LOCAL_STATUS),
    listTracks: () => ipcRenderer.invoke(IPC.MUSIC_LOCAL_LIST_TRACKS),
    onStatusChanged: (h: (s: unknown) => void) => {
      const listener = (_: unknown, s: unknown) => h(s);
      ipcRenderer.on("music:local-status-changed", listener);
      return () => ipcRenderer.removeListener("music:local-status-changed", listener);
    },
  });

  // 网易云音乐 API
  contextBridge.exposeInMainWorld("music", {
    getStatus: () => ipcRenderer.invoke(IPC.MUSIC_GET_STATUS),
    beginLogin: () => ipcRenderer.invoke(IPC.MUSIC_BEGIN_LOGIN),
    cancelLogin: () => ipcRenderer.invoke(IPC.MUSIC_CANCEL_LOGIN),
    logout: () => ipcRenderer.invoke(IPC.MUSIC_LOGOUT),
    getDaily: () => ipcRenderer.invoke(IPC.MUSIC_GET_DAILY),
    search: (keyword: string, limit?: number) => ipcRenderer.invoke(IPC.MUSIC_SEARCH, { keyword, limit }),
    presentTracks: (args: unknown) => ipcRenderer.invoke(IPC.MUSIC_PRESENT_TRACKS, args),
    playTrack: (trackId: string) => ipcRenderer.invoke(IPC.MUSIC_PLAY_TRACK, trackId),
    playPlaylist: (playlistId: string) => ipcRenderer.invoke(IPC.MUSIC_PLAY_PLAYLIST, playlistId),
    detectPlayer: () => ipcRenderer.invoke(IPC.MUSIC_DETECT_PLAYER),
    onStateChanged: (h: (s: unknown) => void) => {
      const listener = (_: unknown, s: unknown) => h(s);
      ipcRenderer.on(IPC.MUSIC_STATE_CHANGED, listener);
      return () => ipcRenderer.removeListener(IPC.MUSIC_STATE_CHANGED, listener);
    },
    onCard: (h: (c: unknown) => void) => {
      const listener = (_: unknown, c: unknown) => h(c);
      ipcRenderer.on(IPC.MUSIC_CARD, listener);
      return () => ipcRenderer.removeListener(IPC.MUSIC_CARD, listener);
    },
  });
}
