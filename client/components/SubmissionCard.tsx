import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format, parseISO, isValid } from "date-fns";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission } from "@/types";

interface SubmissionCardProps {
  submission: LivestockSubmission;
  onPress?: () => void;
  showSyncStatus?: boolean;
}

export function SubmissionCard({
  submission,
  onPress,
  showSyncStatus = false,
}: SubmissionCardProps) {
  const { theme } = useTheme();

  // ✅ Safe date handling for MySQL timestamps
  const createdAt = submission.created_at
    ? parseISO(submission.created_at.replace(" ", "T"))
    : null;

  const formattedDate =
    createdAt && isValid(createdAt)
      ? format(createdAt, "MMM d, h:mm a")
      : "—";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <ThemedText style={styles.name}>
            {submission.farmer_name || "Unknown Farmer"}
          </ThemedText>

          <ThemedText
            style={[styles.association, { color: theme.textSecondary }]}
          >
            {submission.association || "—"}
          </ThemedText>
        </View>

        <View style={styles.right}>
          {submission.lga ? (
            <Badge variant="outline">{submission.lga}</Badge>
          ) : null}

          {showSyncStatus && (
            <View style={styles.syncStatus}>
              <Feather
                name={
                  submission.submission_status === "synced"
                    ? "cloud"
                    : "cloud-off"
                }
                size={14}
                color={
                  submission.submission_status === "synced"
                    ? "#10b981"
                    : "#f59e0b"
                }
              />
            </View>
          )}

          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statsRow}>
          <Feather name="users" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.statsText, { color: theme.textSecondary }]}
          >
            {submission.number_of_animals ?? 0} animals
          </ThemedText>
        </View>

        <View style={styles.statsRow}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.statsText, { color: theme.textSecondary }]}
          >
            {submission.ward || "—"}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  association: {
    fontSize: 13,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  syncStatus: {
    marginTop: 4,
  },
  date: {
    fontSize: 11,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsText: {
    fontSize: 12,
  },
});
