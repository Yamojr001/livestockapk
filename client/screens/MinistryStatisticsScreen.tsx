import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission, User } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MinistryStatisticsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [subs, usrs] = await Promise.all([
        storage.getSubmissions(),
        storage.getUsers(),
      ]);
      setSubmissions(subs);
      setUsers(usrs);

      // Attempt to refresh from API
      const [subsRes, usersRes] = await Promise.all([
        apiRequest<LivestockSubmission[]>("/submissions", { method: "GET", requiresAuth: true }),
        apiRequest<User[]>("/users", { method: "GET", requiresAuth: true }),
      ]);

      if (subsRes.success && subsRes.data) {
        const data = Array.isArray(subsRes.data) ? subsRes.data : (subsRes.data as any).data || [];
        setSubmissions(data);
        await storage.setSubmissions(data);
      }
      if (usersRes.success && usersRes.data) {
        const data = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data as any).data || [];
        setUsers(data);
        await storage.setUsers(data);
      }
    } catch (error) {
      console.error("[STATS] Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Compute Statistics
  const totalAnimals = submissions.reduce((sum, s) => sum + (s.number_of_animals || 0), 0);
  const agentsCount = users.filter(u => u.user_role === 'agent').length;
  const lgas = new Set(submissions.map(s => s.lga)).size;
  const wards = new Set(submissions.map(s => s.ward)).size;

  const stats = [
    { label: "Total Farmers", value: submissions.length, icon: "users", color: "#3b82f6" },
    { label: "Total Livestock", value: totalAnimals, icon: "activity", color: "#10b981" },
    { label: "Field Agents", value: agentsCount, icon: "shield", color: "#f59e0b" },
    { label: "LGAs Covered", value: lgas, icon: "map-pin", color: "#8b5cf6" },
    { label: "Wards Covered", value: wards, icon: "map", color: "#ec4899" },
  ];

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
      <ThemedText style={styles.title}>System Statistics</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Detailed overview of collected livestock data
      </ThemedText>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[
              styles.statCard,
              { backgroundColor: theme.backgroundDefault, width: cardWidth }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
              <Feather name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              {stat.label}
            </ThemedText>
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
});
