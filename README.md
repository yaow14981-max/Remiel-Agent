# Remiel-Agent

<div align="center">

**《绝区零》蕾米埃尔·丹 — Windows AI 桌面伴侣**

*基于 [Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) 二次开发*

</div>

---

## 项目说明

本项目基于 [Playa-0v0/Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent)（崩坏：星穹铁道 昔涟 AI 桌面 Agent）进行二次开发，将核心角色替换为《绝区零》中的 **蕾米埃尔·丹（Remielle Dan）**，并进行了以下改造：

### 已完成

- **角色人格完全重写** — soul.md、对话系统、风格变体、语气规则全部针对蕾米埃尔的狡黠戏谑性格重新设计
- **绝区零世界观注入** — Worldbook 知识库替换为 ZZZ 世界观（新艾利都、空洞、以太、虚狩、达识结社等）
- **UI 品牌重塑** — 窗口标题、设置界面、状态栏、版本标签等全部从昔涟改为蕾米埃尔
- **蕾米埃尔头像与图标** — 聊天窗、侧边栏、通话界面、系统托盘图标全部替换
- **本地背景音乐** — 内置蕾米埃尔 EP《Two to Tango 交缠舞步》，支持曲目切换、列表循环/单曲循环、音量调节、托盘静音
- **内置表情包** — 6 个蕾米埃尔主题 GIF 表情，支持用户自行添加和触发词匹配
- **蕾米桌宠集成** — 随应用启动/退出的独立桌面宠物（来源：B站 UP 主 ZanyZebra，需单独下载）
- **Token 优化** — soul.md 压缩 60%，Worldbook 常驻条目清零，整体 system prompt 从 ~15,000 tokens 降至 ~9,000
- **免责声明更新** — 标注原作者、版权归属、非商用声明

### 待完成

- [ ] GPT-SoVITS 语音克隆（已有蕾米埃尔参考音频）
- [ ] Live2D 模型替换（当前使用替代方案）
- [ ] 更多蕾米埃尔表情包内置
- [ ] 音乐曲目持久化存储
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

### 桌宠安装（可选）

蕾米桌宠为独立程序，需单独下载（来源：B站 UP 主 **ZanyZebra**）。下载后将文件夹放置于 `remiel-pet/` 目录下，应用启动时会自动拉起。

---

## 配置

启动后右键系统托盘图标 → 设置：

1. **API 设置** — 选择模型厂商（支持 DeepSeek、OpenAI、Claude 等），填入 API Key
2. **通用设置** — 音乐开关、音量、播放模式、曲目选择
3. **表情包发送** — 管理内置和自定义表情包
4. **外观设置** — 主题、字体、桌面图标

---

## 免责声明

- 本项目为个人粉丝非商用同人项目，基于 [Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) 二次开发
- 「蕾米埃尔·丹」角色人设取材于米哈游旗下游戏《绝区零》，版权归米哈游所有
- 蕾米桌宠素材来源于 B站 UP 主 **ZanyZebra**，如有侵权请联系删除
- 严禁任何商业用途
- 联系邮箱：2963378258@qq.com

---

## 致谢

- [Playa-0v0/Cyrene-Agent](https://github.com/Playa-0v0/Cyrene-Agent) — 原始项目框架
- B站 UP 主 ZanyZebra — 蕾米埃尔桌宠
- HOYO-MiX — 蕾米埃尔 EP《Two to Tango 交缠舞步》
