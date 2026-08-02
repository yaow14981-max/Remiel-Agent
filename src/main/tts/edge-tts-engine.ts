// Microsoft Edge TTS 引擎 (免费)
// WebSocket 协议，兼容 2025 年新 API (Sec-MS-GEC 令牌)
// 参考：rany2/edge-tts Python 库 v7.x

import { WebSocket } from "ws";
import { randomUUID, createHash } from "crypto";

export interface EdgeTtsOptions {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: string;
  timeoutMs?: number;
  debugLog?: (entry: Record<string, unknown>) => void;
}

export interface EdgeTtsResult {
  audio: Buffer;
  format: "mp3";
}

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_VERSION = "140.0.3485.14";
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_VERSION}`;
const WIN_EPOCH = 11644473600; // seconds between 1601-01-01 and 1970-01-01
const WS_URL = `wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1`;
const DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural";
const DEFAULT_TIMEOUT = 15000;

function generateSecMsGec(): string {
  // Windows file time in 100-ns ticks, rounded to nearest 5 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  const ticks = nowSec + WIN_EPOCH;
  const roundedTicks = ticks - (ticks % 300); // round to 5 min
  const fileTimeTicks = roundedTicks * 10_000_000; // seconds → 100-ns ticks
  const hash = createHash("sha256")
    .update(`${fileTimeTicks}${TRUSTED_CLIENT_TOKEN}`)
    .digest("hex")
    .toUpperCase();
  return hash;
}

export async function synthesize(opts: EdgeTtsOptions): Promise<EdgeTtsResult> {
  const voice = opts.voice ?? DEFAULT_VOICE;
  const speed = opts.speed ?? 1;
  const pitch = opts.pitch ?? "+0Hz";
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;
  const requestId = randomUUID();
  const connectionId = randomUUID();
  const startedAt = Date.now();

  const log = (entry: Record<string, unknown>) => {
    try { opts.debugLog?.({ requestId, ts: new Date().toISOString(), ...entry }); } catch { /* ignore */ }
  };

  if (!opts.text) throw new Error("缺少合成文本");

  const secMsGec = generateSecMsGec();
  const url = `${WS_URL}?Ocp-Apim-Subscription-Key=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectionId}`;

  log({ phase: "connect.begin", voice, speed, pitch, textLen: opts.text.length });

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      handshakeTimeout: 5000,
      headers: {
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_VERSION} Safari/537.36 Edg/${CHROMIUM_VERSION}`,
      },
    });
    const chunks: Buffer[] = [];
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        log({ phase: "timeout", ms: timeoutMs });
        ws.close();
        reject(new Error(`Edge TTS 合成超时（${timeoutMs}ms）`));
      }
    }, timeoutMs);

    ws.on("open", () => {
      log({ phase: "ws.open" });
      const config = {
        context: {
          synthesis: {
            audio: {
              metadataoptions: {
                sentenceBoundaryEnabled: false,
                wordBoundaryEnabled: false,
              },
              outputFormat: "audio-24khz-48kbitrate-mono-mp3",
            },
          },
        },
      };

      const configMsg = `X-RequestId:${requestId}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify(config)}`;
      log({ phase: "send.config", msgLen: configMsg.length });
      ws.send(configMsg);

      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">` +
        `<voice name="${voice}">` +
        `<prosody rate="${speed}" pitch="${pitch}">` +
        opts.text +
        `</prosody></voice></speak>`;

      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      log({ phase: "send.ssml", msgLen: ssmlMsg.length });
      ws.send(ssmlMsg);
    });

    ws.on("message", (data: Buffer) => {
      if (data.length < 2) return;

      // Text frames: start with "X-RequestId:" or "Path:"
      const preview = data.subarray(0, Math.min(200, data.length)).toString("utf-8");

      if (preview.includes("Path:turn.end")) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          ws.close(1000);
          const audio = Buffer.concat(chunks);
          if (audio.length === 0) {
            reject(new Error("Edge TTS 返回空音频"));
          } else {
            resolve({ audio, format: "mp3" });
          }
        }
        return;
      }

      // Text frames (JSON responses) — skip, not audio
      if (preview.startsWith("X-RequestId:") || preview.startsWith("Path:")) {
        return;
      }

      // Binary frame: 2-byte header length (big-endian) + header + audio data
      const headerLen = data.readUInt16BE(0);
      const audioStart = 2 + headerLen;
      if (audioStart < data.length) {
        chunks.push(data.subarray(audioStart));
      }
    });

    ws.on("error", (err) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        log({ phase: "error", error: err.message, durationMs: Date.now() - startedAt });
        reject(new Error(`Edge TTS 连接失败: ${err.message}`));
      }
    });

    ws.on("close", (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);

      // If we already have audio data, resolve even on non-1000 codes
      if (chunks.length > 0) {
        const audio = Buffer.concat(chunks);
        resolve({ audio, format: "mp3" });
        return;
      }

      reject(new Error(`Edge TTS 连接关闭 (code=${code})，未收到音频`));
    });
  });
}
