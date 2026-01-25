import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
  color?: string;
  backgroundColor?: string;
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = "default",
  color,
  backgroundColor,
  size = "sm",
  style,
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return { bg: "#d1fae5", text: "#065f46" };
      case "warning":
        return { bg: "#fef3c7", text: "#92400e" };
      case "error":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "info":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "outline":
        return { bg: "transparent", text: "#64748b", border: "#e2e8f0" };
      default:
        return { bg: "#f1f5f9", text: "#475569" };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        size === "sm" ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: backgroundColor || variantStyles.bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: variantStyles.border,
        },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          size === "sm" ? styles.textSm : styles.textMd,
          { color: color || variantStyles.text },
        ]}
      >
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: BorderRadius.full,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontWeight: "500",
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
});
