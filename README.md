# Remiel-Agent

<div align="center">

**《绝区零》蕾米埃尔·丹 — Windows AI 桌面伴侣**

*基于 [Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) 二次开发*

</div>

---

## 项目说明

基于 [Playa-0v0/Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) 二次开发，将核心角色替换为《绝区零》中的 **蕾米埃尔·丹（Remielle Dan）**。

### 已完成

**角色系统**
- 角色人格完全重写 — soul.md、对话系统、风格变体（5种）、语气规则
- 绝区零世界观注入 — Worldbook 知识库（新艾利都、空洞、以太、虚狩等）
- 系统提示词深度优化 — 从 ~15,000 tokens 压缩至 ~2,500 tokens，缓存重排序后每轮有效消耗 ~1,000-2,000

**桌宠系统**
- **GIF 桌宠** — 6 张蕾米埃尔动画，lerp 平滑拖拽，单击/双击/右键互动，外观设置完全集成
- 替换旧版 120MB 第三方 EXE，轻量化

**语音功能**
- **Edge TTS** — 微软免费语音合成，5 种中文音色，自动朗读 + 语音通话已接入
- **Vosk 离线语音识别** — CPU 运行，无需联网。设置 → ASR → 本地，需下载中文模型（[vosk-model-cn-0.22](https://alphacephei.com/vosk/models)，~1.4GB）
- 阿里云 ASR 保留可用
- 语音素材: `assets/voice/` — 用户可放入参考音频用于 MiniMax/MiMo/Mossland 音色克隆

**音频系统**
- 30 首绝区零 OST 内置（.ogg），支持曲目切换、循环模式、音量调节、托盘静音

**UI/交互**
- 蕾米埃尔头像、图标、UI 品牌全面替换
- 6 个内置 GIF 表情包，支持自定义
- 系统托盘完整集成

**优化**
- Token 消耗大幅降低（每轮 ~4,000 → ~2,000）
- 提示词缓存命中率优化
- Chat 模式输出长度限制

### 待完成

- [ ] GPT-SoVITS 语音克隆（已有参考音频 `assets/voice/remiel_ref.m4a`）
- [ ] Live2D 模型替换（后续有机会实现）
- [ ] 更多语音素材
- [ ] 更多 ZZZ 角色 Worldbook 词条

---

## 快速开始

### 环境要求

- **Node.js** 24 LTS
- **npm** 10+
- Windows 10/11

### 安装运行

```bash
git clone https://github.com/yaow14981-max/Remiel-Agent.git
cd Remiel-Agent
npm install
npm run build
npm start
```

### Vosk 离线语音识别（可选）

1. 下载中文模型：[vosk-model-cn-0.22](https://alphacephei.com/vosk/models)（~1.4GB）
2. 解压到任意目录（如 `C:\vosk-model\vosk-model-cn-0.22`）
3. 设置 → ASR → 选择「本地（Vosk 离线识别）」→ 填写模型路径
4. 需 Python 3.x + `pip install vosk flask`

### 语音素材（用于音色克隆）

`assets/voice/remiel_ref.m4a` — 蕾米埃尔参考音频，可用于：
- MiniMax 音色克隆（企业认证）
- 小米 MiMo 音色克隆
- Mossland 音色克隆
- GPT-SoVITS 本地训练（需 GPU）

用户可自行放入更多参考音频到此目录。

---

## 配置

启动后右键系统托盘图标 → 设置：

1. **API 设置** — 选择模型厂商（支持 DeepSeek、OpenAI、Claude、MiniMax 等 9 家），填入 API Key。也可选「本地模型」走 Ollama/LM Studio
2. **通用设置** — 音乐开关、音量、播放模式、曲目选择
3. **TTS 设置** — Edge TTS（免费）/ MiniMax / GPT-SoVITS / MiMo / Mossland / 自定义云端
4. **ASR 设置** — 本地 Vosk（免费）/ 阿里云 / 本地（暂不可用）
5. **外观设置** — 主题、字体、桌宠置顶/显示/缩放
6. **表情包管理** — 内置和自定义表情包

---

## 免责声明

- 本项目为个人粉丝非商用同人项目，基于 [Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) 二次开发
- 「蕾米埃尔·丹」角色人设取材于米哈游旗下游戏《绝区零》，版权归米哈游所有
- GIF 桌宠素材为自制，Live2D 桌宠素材来源于 B站 UP 主 **ZanyZebra**，如有侵权请联系删除
- 严禁任何商业用途
- 联系邮箱：2963378258@qq.com

---

## 致谢

- [Playa-0v0/Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) — 原始项目框架
- B站 UP 主 ZanyZebra — 蕾米埃尔 Live2D 桌宠
- HOYO-MiX — 蕾米埃尔 EP《Two to Tango 交缠舞步》及绝区零 OST
