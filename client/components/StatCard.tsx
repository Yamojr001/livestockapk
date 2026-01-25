import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  trend?: string;
  trendUp?: boolean;
  onPress?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = "#10b981",
  iconBgColor = "#d1fae5",
  trend,
  trendUp,
  onPress,
}: StatCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.title, { color: theme.textSecondary }]}>
            {title}
          </ThemedText>
          <View style={styles.valueRow}>
            <ThemedText style={styles.value}>{value}</ThemedText>
            {subtitle ? (
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {trend ? (
            <View style={styles.trendRow}>
              <Feather
                name={trendUp ? "trending-up" : "trending-down"}
                size={14}
                color={trendUp ? "#10b981" : "#ef4444"}
              />
              <ThemedText
                style={[
                  styles.trendText,
                  { color: trendUp ? "#10b981" : "#ef4444" },
                ]}
              >
                {trend}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Feather name={icon} size={24} color={iconColor} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: "500",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
