import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { subDays, isWithinInterval } from "date-fns";
import { ThemedText } from "@/components/ThemedText";
import { SubmissionCard } from "@/components/SubmissionCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission, User } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dateRange] = useState(7);

  const loadData = useCallback(async () => {
    try {
      console.log("[DASHBOARD] Loading data...");
      console.log("[DASHBOARD] Current user:", user ? { id: user.id, email: user.email, role: user.user_role } : null);
      
      // Fetch users from API
      console.log("[DASHBOARD] Fetching /users endpoint...");
      const usersResponse = await apiRequest<User[] | { users: User[] }>("/users", {
        method: "GET",
        requiresAuth: true,
      });
      
      console.log("[DASHBOARD] /users response:", usersResponse.success ? `Success (${Array.isArray(usersResponse.data) ? usersResponse.data.length : usersResponse.data?.users?.length || 0} users)` : `Failed: ${usersResponse.error}`);
      
      if (usersResponse.success && usersResponse.data) {
        const userData = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : // Laravel paginator shape -> { data: [...] }
            (usersResponse.data.data || usersResponse.data.users || []);
        setUsers(userData);
        await storage.setUsers(userData);
      } else {
        // Fall back to local storage if API fails
        console.warn("[DASHBOARD] Failed to fetch users:", usersResponse.error);
        const localUsers = await storage.getUsers();
        console.log("[DASHBOARD] Using cached users:", localUsers.length);
        setUsers(localUsers);
      }

      // Fetch submissions from API
      console.log("[DASHBOARD] Fetching /submissions endpoint...");
      const submissionsResponse = await apiRequest<
        LivestockSubmission[] | { submissions: LivestockSubmission[] }
      >("/submissions", { method: "GET", requiresAuth: true });
      
      console.log("[DASHBOARD] /submissions response:", submissionsResponse.success ? `Success (${Array.isArray(submissionsResponse.data) ? submissionsResponse.data.length : submissionsResponse.data?.submissions?.length || 0} submissions)` : `Failed: ${submissionsResponse.error}`);
      
      if (submissionsResponse.success && submissionsResponse.data) {
        const submissionData = Array.isArray(submissionsResponse.data)
          ? submissionsResponse.data
          : // Laravel paginator -> { data: [...] }
            (submissionsResponse.data.data || submissionsResponse.data.submissions || []);
        setSubmissions(submissionData);
        await storage.setSubmissions(submissionData);
      } else {
        // Fall back to local storage if API fails
        console.warn("[DASHBOARD] Failed to fetch submissions:", submissionsResponse.error);
        const localSubmissions = await storage.getSubmissions();
        console.log("[DASHBOARD] Using cached submissions:", localSubmissions.length);
        setSubmissions(localSubmissions);
      }
    } catch (error) {
      console.error("[DASHBOARD] Error loading dashboard data:", error);
      // If API fails, use local storage
      const [storedSubmissions, storedUsers] = await Promise.all([
        storage.getSubmissions(),
        storage.getUsers(),
      ]);
      setSubmissions(storedSubmissions);
      setUsers(storedUsers);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Defensive: Only compute stats if users are loaded
  const usersLoaded = users && users.length > 0;
  const agents = usersLoaded ? users.filter((u) => u.user_role === "agent") : [];
  const activeAgents = agents.filter((u) => u.status === "active");

  const today = new Date();
  const startDate = subDays(today, dateRange);

  const recentSubmissions = submissions.filter(
    (s) =>
      s.created_date &&
      isWithinInterval(new Date(s.created_date), { start: startDate, end: today })
  );

  const previousPeriodStart = subDays(startDate, dateRange);
  const previousSubmissions = submissions.filter(
    (s) =>
      s.created_date &&
      isWithinInterval(new Date(s.created_date), {
        start: previousPeriodStart,
        end: startDate,
      })
  );

  const growthRate =
    previousSubmissions.length > 0
      ? (
          ((recentSubmissions.length - previousSubmissions.length) /
            previousSubmissions.length) *
          100
        ).toFixed(0)
      : "0";

  const byLGA = submissions.reduce<Record<string, number>>((acc, sub) => {
    acc[sub.lga] = (acc[sub.lga] || 0) + 1;
    return acc;
  }, {});

  // Compute LGAs covered based on users' assigned LGA(s).
  // Support both `assigned_lga` and legacy `assign_lga` property names,
  // and handle comma/semicolon/pipe-separated lists on a single user.
  const lgaSet = new Set<string>();
  if (usersLoaded) {
    users.forEach((u) => {
      const raw = (u.assigned_lga as any) ?? (u as any).assign_lga ?? "";
      if (!raw) return;
      const str = String(raw || "").trim();
      if (!str) return;
      const parts = str.split(/[,;|]/).map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => lgaSet.add(p));
    });
  }
  const lgasCoveredCount = lgaSet.size;

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
        <ThemedText style={styles.greeting}>
          Welcome, {user?.full_name?.split(" ")[0] || "Admin"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Livestock data collection overview
        </ThemedText>
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
          {parseFloat(growthRate) !== 0 ? (
            <View style={styles.trendRow}>
              <Feather
                name={parseFloat(growthRate) >= 0 ? "trending-up" : "trending-down"}
                size={12}
                color={parseFloat(growthRate) >= 0 ? "#10b981" : "#ef4444"}
              />
              <ThemedText
                style={[
                  styles.trendText,
                  { color: parseFloat(growthRate) >= 0 ? "#10b981" : "#ef4444" },
                ]}
              >
                {parseFloat(growthRate) >= 0 ? "+" : ""}{growthRate}%
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#dbeafe" }]}>
            <Feather name="users" size={20} color="#3b82f6" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Active Agents
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {usersLoaded ? `${activeAgents.length}/${agents.length}` : "-"}
          </ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#ede9fe" }]}>
            <Feather name="map-pin" size={20} color="#8b5cf6" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            LGAs Covered
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {usersLoaded ? lgasCoveredCount : "-"}
            <ThemedText style={[styles.statSubvalue, { color: theme.textSecondary }]}>/27</ThemedText>
          </ThemedText>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, width: cardWidth }]}>
          <View style={[styles.statIconContainer, { backgroundColor: "#fef3c7" }]}>
            <Feather name="activity" size={20} color="#f59e0b" />
          </View>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            This Week
          </ThemedText>
          <ThemedText style={styles.statValue}>
            {recentSubmissions.length}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          <View
            style={[styles.actionCard, { backgroundColor: theme.backgroundDefault }]}
            onTouchEnd={() => navigation.navigate("DataTab")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#d1fae5" }]}>
              <Feather name="database" size={24} color="#10b981" />
            </View>
            <ThemedText style={styles.actionTitle}>View Data</ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
              {submissions.length} records
            </ThemedText>
          </View>

          <View
            style={[styles.actionCard, { backgroundColor: theme.backgroundDefault }]}
            onTouchEnd={() => navigation.navigate("UsersTab")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#dbeafe" }]}>
              <Feather name="user-plus" size={24} color="#3b82f6" />
            </View>
            <ThemedText style={styles.actionTitle}>Manage Users</ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}> 
              {usersLoaded ? users.length : "-"} users
            </ThemedText>
          </View>

          <View
            style={[styles.actionCard, { backgroundColor: theme.backgroundDefault }]}
            onTouchEnd={() => navigation.navigate("ProfileTab")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#fef3c7" }]}>
              <Feather name="settings" size={24} color="#f59e0b" />
            </View>
            <ThemedText style={styles.actionTitle}>Settings</ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
              Configuration
            </ThemedText>
          </View>

          <View
            style={[styles.actionCard, { backgroundColor: theme.backgroundDefault }]}
            onTouchEnd={() => navigation.navigate("DataTab")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#ede9fe" }]}>
              <Feather name="download" size={24} color="#8b5cf6" />
            </View>
            <ThemedText style={styles.actionTitle}>Export</ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
              Download data
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Submissions</ThemedText>
        </View>
        <View style={styles.submissionsList}>
          {submissions.slice(0, 5).map((sub) => (
            <SubmissionCard key={sub.id} submission={sub} />
          ))}
          {submissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="inbox" size={40} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No submissions yet
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 120,
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
    fontSize: 28,
    fontWeight: "700",
  },
  statSubvalue: {
    fontSize: 16,
    fontWeight: "500",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
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
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  submissionsList: {
    gap: Spacing.md,
  },
  emptyCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
});
