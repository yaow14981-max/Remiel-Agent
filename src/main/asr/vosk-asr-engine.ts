// Vosk 离线语音识别引擎
// 通过本地 Python HTTP 服务桥接（避免 Node.js 原生编译问题）
// 启动服务：python scripts/vosk-server.py <模型目录>

import * as path from "path";
import * as fs from "fs";
import { spawn, type ChildProcess } from "child_process";

const VOSK_PORT = 2700;
const VOSK_URL = `http://127.0.0.1:${VOSK_PORT}`;

let serverProcess: ChildProcess | null = null;

export function isVoskInstalled(): boolean {
  return true; // Python-based, always available after pip install
}

/** 启动 Python Vosk 服务 */
export function startVoskServer(modelPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (serverProcess) {
      // Already running — check health
      fetch(`${VOSK_URL}/health`).then(r => r.json()).then((d: any) => {
        if (d.ok) resolve();
        else { serverProcess = null; startVoskServer(modelPath).then(resolve).catch(reject); }
      }).catch(() => { serverProcess = null; startVoskServer(modelPath).then(resolve).catch(reject); });
      return;
    }
    const scriptPath = path.join(__dirname, "..", "..", "..", "..", "scripts", "vosk-server.py");
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`Vosk 服务脚本未找到: ${scriptPath}`));
      return;
    }
    console.log("[Vosk] 启动 Python 服务, modelPath:", modelPath);
    const proc = spawn("python", [scriptPath, modelPath, String(VOSK_PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    proc.stdout?.on("data", (d: Buffer) => console.log("[Vosk server]", d.toString().trim()));
    proc.stderr?.on("data", (d: Buffer) => console.warn("[Vosk server]", d.toString().trim()));
    proc.on("error", (err) => reject(new Error(`Vosk 服务启动失败: ${err.message}`)));
    proc.on("exit", (code) => {
      if (code !== 0 && code !== null) console.warn("[Vosk] 服务退出, code:", code);
      serverProcess = null;
    });
    // Poll until ready
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      fetch(`${VOSK_URL}/health`).then(r => r.json()).then((d: any) => {
        if (d.ok) { clearInterval(check); serverProcess = proc; resolve(); }
      }).catch(() => {
        if (attempts > 30) { clearInterval(check); proc.kill(); reject(new Error("Vosk 服务启动超时")); }
      });
    }, 1000);
  });
}

export function stopVoskServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

export interface VoskAsrOptions {
  modelPath: string;
  sampleRate?: number;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
}

export class VoskAsrStream {
  private modelPath: string;
  private onPartial?: (text: string) => void;
  private onFinal?: (text: string) => void;
  private started = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private silenceTimer: ReturnType<typeof setInterval> | null = null;
  private lastSent = 0;
  private accumulator: Buffer[] = [];

  constructor(opts: VoskAsrOptions) {
    this.modelPath = opts.modelPath;
    this.onPartial = opts.onPartial;
    this.onFinal = opts.onFinal;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.accumulator = [];
    this.lastSent = Date.now();
    // Flush accumulated audio every 200ms
    this.pollTimer = setInterval(() => this.flush(), 200);
    // Force-final: if no audio for 2s, flush remaining and force a final result
    this.silenceTimer = setInterval(() => {
      if (Date.now() - this.lastSent > 2000 && this.accumulator.length > 0) {
        this.flush().catch(() => {});
      }
    }, 500);
  }

  sendAudio(pcm: Buffer): void {
    if (!this.started) return;
    this.accumulator.push(pcm);
    this.lastSent = Date.now();
  }

  private async flush(): Promise<void> {
    if (this.accumulator.length === 0) return;
    const combined = Buffer.concat(this.accumulator);
    this.accumulator = [];
    try {
      const resp = await fetch(`${VOSK_URL}/recognize`, {
        method: "POST",
        body: combined,
      });
      const data: any = await resp.json();
      if (data.error) { console.warn("[Vosk] 识别错误:", data.error); return; }
      if (data.final) { console.log("[Vosk] final:", data.final); this.onFinal?.(data.final); }
      else if (data.partial) { console.log("[Vosk] partial:", data.partial); this.onPartial?.(data.partial); }
    } catch { /* ignore */ }
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    if (this.silenceTimer) { clearInterval(this.silenceTimer); this.silenceTimer = null; }
    // Flush remaining and force final
    this.flush().then(() => {
      fetch(`${VOSK_URL}/recognize`, { method: "POST", body: Buffer.alloc(0) }).then(async r => {
        const data: any = await r.json();
        if (data.partial && this.onFinal) { console.log("[Vosk] force final:", data.partial); this.onFinal(data.partial); }
      }).catch(() => {});
    }).catch(() => {});
    fetch(`${VOSK_URL}/reset`, { method: "POST" }).catch(() => {});
  }

  destroy(): void {
    this.stop();
  }
}

let modelPathGetter: (() => string) | null = null;

export function setVoskModelPath(getter: () => string): void {
  modelPathGetter = getter;
}

export function getVoskConfig(): { engine: string; modelPath: string } | null {
  const modelPath = modelPathGetter?.();
  if (!modelPath || !fs.existsSync(path.join(modelPath, "am"))) {
    return null;
  }
  return { engine: "local", modelPath };
}

export async function ensureVoskReady(): Promise<void> {
  const modelPath = modelPathGetter?.();
  if (!modelPath) throw new Error("Vosk 模型路径未配置");
  await startVoskServer(modelPath);
}
