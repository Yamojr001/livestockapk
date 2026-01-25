import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SubmissionCard } from "@/components/SubmissionCard";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission } from "@/types";

type FilterType = "all" | "synced" | "pending";

export default function MySubmissionsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadData = useCallback(async () => {
    const allSubmissions = await storage.getSubmissions();
    const mySubmissions = allSubmissions.filter(
      (s) => s.created_by === user?.email
    );
    setSubmissions(mySubmissions);
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "all") return true;
    return sub.submission_status === filter;
  });

  const syncedCount = submissions.filter(
    (s) => s.submission_status === "synced"
  ).length;
  const pendingCount = submissions.filter(
    (s) => s.submission_status === "pending"
  ).length;

  const renderItem = useCallback(
    ({ item }: { item: LivestockSubmission }) => (
      <SubmissionCard submission={item} showSyncStatus />
    ),
    []
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setFilter("all")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "all" ? theme.primaryLight : theme.backgroundDefault,
                borderColor: filter === "all" ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === "all" ? theme.primary : theme.text },
              ]}
            >
              All ({submissions.length})
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setFilter("synced")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "synced" ? "#d1fae5" : theme.backgroundDefault,
                borderColor: filter === "synced" ? "#10b981" : theme.border,
              },
            ]}
          >
            <Feather
              name="cloud"
              size={14}
              color={filter === "synced" ? "#10b981" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === "synced" ? "#10b981" : theme.text },
              ]}
            >
              Synced ({syncedCount})
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setFilter("pending")}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === "pending" ? "#fef3c7" : theme.backgroundDefault,
                borderColor: filter === "pending" ? "#f59e0b" : theme.border,
              },
            ]}
          >
            <Feather
              name="cloud-off"
              size={14}
              color={filter === "pending" ? "#f59e0b" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.filterText,
                { color: filter === "pending" ? "#f59e0b" : theme.text },
              ]}
            >
              Pending ({pendingCount})
            </ThemedText>
          </Pressable>
        </View>
      </View>
    ),
    [theme, filter, submissions.length, syncedCount, pendingCount]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="file-text"
        title="No submissions"
        message={
          filter === "all"
            ? "Start collecting livestock data"
            : `No ${filter} submissions`
        }
      />
    ),
    [filter]
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={filteredSubmissions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
