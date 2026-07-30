// 内置表情包的语义描述
// 每个表情包对应一个 phrases 数组，用于 embedding 语义匹配 + 发送给 LLM

export interface StickerDescription {
  phrases: string[];
}

export const BUILT_IN_STICKER_DESCRIPTIONS: Record<string, StickerDescription> = {
  remiel_secret_draw1: { phrases: ["画画", "创作", "画点什么", "灵感来了", "开始画"] },
  remiel_secret_draw2: { phrases: ["继续画", "还没画完", "忙着呢", "别打扰我画画"] },
  remiel_admire: { phrases: ["欣赏", "好看", "不错嘛", "满意", "看看效果"] },
  remiel_idea: { phrases: ["有主意了", "想到了", "鬼点子", "计划通", "腹黑"] },
  remiel_innocent: { phrases: ["无辜", "不是我干的", "冤枉", "不关我事", "装傻", "什么都不知道"] },
  remiel_happy: { phrases: ["开心", "高兴", "太好了", "耶", "哈哈哈", "快乐"] },
};

export const BUILT_IN_STICKER_FILES: Record<string, string> = {
  remiel_secret_draw1: "remiel_secret_draw1.gif",
  remiel_secret_draw2: "remiel_secret_draw2.gif",
  remiel_admire: "remiel_admire.gif",
  remiel_idea: "remiel_idea.gif",
  remiel_innocent: "remiel_innocent.gif",
  remiel_happy: "remiel_happy.gif",
};
