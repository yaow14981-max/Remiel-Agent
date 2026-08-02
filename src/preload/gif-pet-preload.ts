import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc-channels";

const api = {
  moveBy: (dx: number, dy: number) =>
    ipcRenderer.send(IPC.GIF_PET_MOVE, dx, dy),
  onContextMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) =>
      callback(action);
    ipcRenderer.on(IPC.GIF_PET_CONTEXT_MENU, handler);
    return () => {
      ipcRenderer.removeListener(IPC.GIF_PET_CONTEXT_MENU, handler);
    };
  },
};

contextBridge.exposeInMainWorld("gifPet", api);
