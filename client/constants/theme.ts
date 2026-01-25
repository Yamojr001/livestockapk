import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0f172a",
    textSecondary: "#64748b",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#10b981",
    link: "#10b981",
    backgroundRoot: "#f8fafc",
    backgroundDefault: "#ffffff",
    backgroundSecondary: "#f1f5f9",
    backgroundTertiary: "#e2e8f0",
    border: "#e2e8f0",
    primary: "#10b981",
    primaryLight: "#d1fae5",
    secondary: "#3b82f6",
    secondaryLight: "#dbeafe",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    roleAdmin: "#8b5cf6",
    roleAdminLight: "#ede9fe",
    roleAgent: "#f59e0b",
    roleAgentLight: "#fef3c7",
    roleViewer: "#6b7280",
    statusSynced: "#10b981",
    statusPending: "#f59e0b",
    statusOffline: "#6b7280",
  },
  dark: {
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#10b981",
    link: "#10b981",
    backgroundRoot: "#0f172a",
    backgroundDefault: "#1e293b",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    border: "#334155",
    primary: "#10b981",
    primaryLight: "#064e3b",
    secondary: "#3b82f6",
    secondaryLight: "#1e3a8a",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    roleAdmin: "#a78bfa",
    roleAdminLight: "#4c1d95",
    roleAgent: "#fbbf24",
    roleAgentLight: "#78350f",
    roleViewer: "#9ca3af",
    statusSynced: "#10b981",
    statusPending: "#f59e0b",
    statusOffline: "#6b7280",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const ChartColors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];
