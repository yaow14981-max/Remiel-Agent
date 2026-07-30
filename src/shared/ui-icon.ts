export const UI_ICON_PRESETS = [
  { id: "remiel-sun", label: "晴光", fileName: "remiel-sun.png", previewPath: "../icons/remiel-sun.png" },
  { id: "remiel-pink", label: "暗色", fileName: "remiel-pink.png", previewPath: "../icons/remiel-pink.png" },
] as const;

export type UiIcon = typeof UI_ICON_PRESETS[number]["id"];

export function normalizeUiIcon(value: unknown): UiIcon {
  return value === "remiel-pink" ? "remiel-pink" : "remiel-sun";
}
