import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { SubmissionCard } from "@/components/SubmissionCard";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { storage } from "@/lib/storage";
import { syncService } from "@/lib/sync-service";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AgentDashboardScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<LivestockSubmission[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [allSubmissions, pending, syncDate] = await Promise.all([
      storage.getSubmissions(),
      storage.getPendingSubmissions(),
      storage.getLastSync(),
    ]);

    const mySubmissions = allSubmissions.filter(
      (s) => s.created_by === user?.email
    );
    setSubmissions(mySubmissions);
    setPendingSubmissions(pending);
    setLastSync(syncDate);
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSync = async () => {
    if (!isOnline || pendingSubmissions.length === 0) return;

    setIsSyncing(true);
    try {
      const result = await syncService.syncPendingSubmissions();
      
      if (result.success) {
        await loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result.synced > 0) {
        await loadData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        console.warn(`Synced ${result.synced}, failed ${result.failed}`);
      } else {
        console.error("Sync failed:", result.errors);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncedCount = submissions.filter(
    (s) => s.submission_status === "synced"
  ).length;

  const cardWidth = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.greeting}>
              Welcome, {user?.full_name?.split(" ")[0] || "Agent"}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your data collection overview
            </ThemedText>
          </View>
          <Badge
            variant={isOnline ? "success" : "warning"}
            size="md"
          >
            <View style={styles.statusBadge}>
              <Feather
                name={isOnline ? "wifi" : "wifi-off"}
                size={12}
                color={isOnline ? "#065f46" : "#92400e"}
              />
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: isOnline ? "#065f46" : "#92400e",
                  marginLeft: 4,
                }}
              >
                {isOnline ? "Online" : "Offline"}
              </ThemedText>
            </View>
          </Badge>
        </View>

        {pendingSubmissions.length > 0 && isOnline ? (
          <Pressable
            onPress={handleSync}
            disabled={isSyncing}
            style={[
              styles.syncBanner,
              { backgroundColor: theme.warning, opacity: isSyncing ? 0.7 : 1 },
            ]}
          >
            <View style={styles.syncContent}>
              <Feather name="cloud-off" size={20} color="#fff" />
              <View style={styles.syncText}>
                <ThemedText style={styles.syncTitle}>
                  {pendingSubmissions.length} pending submission
                  {pendingSubmissions.length > 1 ? "s" : ""}
                </ThemedText>
                <ThemedText style={styles.syncSubtitle}>
                  Tap to sync to server
                </ThemedText>
              </View>
            </View>
            {isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Feather name="refresh-cw" size={20} color="#fff" />
            )}
          </Pressable>
        ) : null}

        {!isOnline ? (
          <View
            style={[styles.offlineBanner, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="cloud-off" size={20} color={theme.warning} />
            <View style={styles.syncText}>
              <ThemedText style={styles.offlineTitle}>
                You're offline
              </ThemedText>
              <ThemedText
                style={[styles.offlineSubtitle, { color: theme.textSecondary }]}
              >
                Data will be saved locally and synced when online
              </ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#d1fae5" }]}>
            <Feather name="file-text" size={20} color="#10b981" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Submissions
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {submissions.length}
          </ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#dbeafe" }]}>
            <Feather name="cloud" size={20} color="#3b82f6" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Synced Online
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {syncedCount}
          </ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: pendingSubmissions.length > 0 ? "#fef3c7" : "#f1f5f9" }]}>
            <Feather name="clock" size={20} color={pendingSubmissions.length > 0 ? "#f59e0b" : "#64748b"} />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Pending Sync
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {pendingSubmissions.length}
          </ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#ede9fe" }]}>
            <Feather name="map-pin" size={20} color="#8b5cf6" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Assigned LGA
          </ThemedText>
          <ThemedText style={[styles.statValue, { fontSize: 16 }]} numberOfLines={1}>
            {user?.assigned_lga?.replace(/_/g, " ") || "All"}
          </ThemedText>
        </View>
      </View>

      {lastSync ? (
        <View style={[styles.lastSyncCard, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="check-circle" size={16} color="#10b981" />
          <ThemedText style={[styles.lastSyncText, { color: theme.textSecondary }]}>
            Last sync: {format(new Date(lastSync), "PPp")}
          </ThemedText>
        </View>
      ) : null}

      <Button
        onPress={() => navigation.navigate("SubmitTab")}
        style={styles.newButton}
      >
        <View style={styles.buttonContent}>
          <Feather name="plus" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>New Submission</ThemedText>
        </View>
      </Button>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>My Submissions</ThemedText>
          {submissions.length > 0 ? (
            <Pressable onPress={() => navigation.navigate("SubmissionsTab")}>
              <ThemedText style={[styles.viewAll, { color: theme.primary }]}>
                View All
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.submissionsList}>
          {submissions.slice(0, 5).map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              showSyncStatus
            />
          ))}
          {submissions.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No submissions yet"
              message="Start collecting livestock data"
              actionLabel="New Submission"
              onAction={() => navigation.navigate("SubmitTab")}
            />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  syncContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  syncText: {
    flex: 1,
  },
  syncTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  syncSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  offlineTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  offlineSubtitle: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 110,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  lastSyncCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  lastSyncText: {
    fontSize: 13,
  },
  newButton: {
    marginBottom: Spacing.xl,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  submissionsList: {
    gap: Spacing.md,
  },
});
