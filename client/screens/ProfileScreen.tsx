import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Modal, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/Badge";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { storage } from "@/lib/storage";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();

  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadSyncInfo();
  }, []);

  const loadSyncInfo = async () => {
    const [syncDate, pending] = await Promise.all([
      storage.getLastSync(),
      storage.getPendingSubmissions(),
    ]);
    setLastSync(syncDate);
    setPendingCount(pending.length);
  };

  const handleLogout = () => {
    console.log("Logout button pressed");
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log("Logout confirmed");
    setIsLoggingOut(true);
    try {
      console.log("Calling logout function");
      await logout();
      console.log("Logout completed");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Logout error:", error);
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadge = () => {
    switch (user?.user_role) {
      case "admin":
        return { color: "#7c3aed", bg: "#ede9fe", label: "Admin" };
      case "agent":
        return { color: "#d97706", bg: "#fef3c7", label: "Agent" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", label: "Viewer" };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: roleBadge.bg }]}>
          <ThemedText style={[styles.avatarText, { color: roleBadge.color }]}>
            {user?.full_name?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <ThemedText style={styles.name}>{user?.full_name || "User"}</ThemedText>
        <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
          {user?.email}
        </ThemedText>
        <Badge backgroundColor={roleBadge.bg} color={roleBadge.color} size="md">
          {roleBadge.label}
        </Badge>
      </View>

      <View
        style={[styles.syncCard, { backgroundColor: theme.backgroundDefault }]}
      >
        <View style={styles.syncHeader}>
          <Feather
            name={isOnline ? "cloud" : "cloud-off"}
            size={20}
            color={isOnline ? theme.success : theme.warning}
          />
          <ThemedText style={styles.syncTitle}>Sync Status</ThemedText>
        </View>
        <View style={styles.syncContent}>
          <View style={styles.syncRow}>
            <ThemedText style={[styles.syncLabel, { color: theme.textSecondary }]}>
              Connection
            </ThemedText>
            <Badge variant={isOnline ? "success" : "warning"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </View>
          <View style={styles.syncRow}>
            <ThemedText style={[styles.syncLabel, { color: theme.textSecondary }]}>
              Pending Submissions
            </ThemedText>
            <ThemedText
              style={[
                styles.syncValue,
                { color: pendingCount > 0 ? theme.warning : theme.text },
              ]}
            >
              {pendingCount}
            </ThemedText>
          </View>
          <View style={styles.syncRow}>
            <ThemedText style={[styles.syncLabel, { color: theme.textSecondary }]}>
              Last Sync
            </ThemedText>
            <ThemedText style={styles.syncValue}>
              {lastSync ? format(new Date(lastSync), "PPp") : "Never"}
            </ThemedText>
          </View>
        </View>
      </View>

      {user?.assigned_lga ? (
        <View
          style={[styles.assignmentCard, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.syncHeader}>
            <Feather name="map-pin" size={20} color={theme.primary} />
            <ThemedText style={styles.syncTitle}>Assignment</ThemedText>
          </View>
          <View style={styles.syncContent}>
            <View style={styles.syncRow}>
              <ThemedText style={[styles.syncLabel, { color: theme.textSecondary }]}>
                LGA
              </ThemedText>
              <ThemedText style={styles.syncValue}>{user.assigned_lga}</ThemedText>
            </View>
            {user.assigned_ward ? (
              <View style={styles.syncRow}>
                <ThemedText style={[styles.syncLabel, { color: theme.textSecondary }]}>
                  Ward
                </ThemedText>
                <ThemedText style={styles.syncValue}>
                  {user.assigned_ward}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.menuSection}>
        <ThemedText style={styles.menuTitle}>Account</ThemedText>

        <Pressable
          onPress={() => navigation.navigate("ChangePassword")}
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="lock" size={20} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Change Password</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      {user?.user_role === "admin" ? (
        <View style={styles.menuSection}>
          <ThemedText style={styles.menuTitle}>Admin Settings</ThemedText>

          <Pressable
            onPress={() => navigation.navigate("ApiSettings")}
            style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
          >
            <View style={styles.menuItemLeft}>
              <Feather name="server" size={20} color={theme.text} />
              <ThemedText style={styles.menuItemText}>API Settings</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.menuSection}>
        <ThemedText style={styles.menuTitle}>Support</ThemedText>

        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="help-circle" size={20} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Help & Support</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="info" size={20} color={theme.text} />
            <ThemedText style={styles.menuItemText}>About</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.menuSection}>
        <Pressable
          onPress={() => {
            console.log("Logout button pressed - direct test");
            handleLogout();
          }}
          style={[styles.menuItem, { backgroundColor: theme.backgroundDefault }]}
        >
          <View style={styles.menuItemLeft}>
            <Feather name="log-out" size={20} color={theme.error} />
            <ThemedText style={[styles.menuItemText, { color: theme.error }]}>
              Logout
            </ThemedText>
          </View>
        </Pressable>
      </View>

      <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
        Version 1.0.0
      </ThemedText>
    </KeyboardAwareScrollViewCompat>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <Feather name="alert-circle" size={24} color={theme.error} />
              <ThemedText style={styles.modalTitle}>Logout</ThemedText>
            </View>

            <ThemedText style={[styles.modalMessage, { color: theme.text }]}>
              Are you sure you want to logout?
            </ThemedText>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: theme.border },
                ]}
              >
                <ThemedText style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={confirmLogout}
                disabled={isLoggingOut}
                style={[styles.modalButton, { backgroundColor: theme.error }]}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>
                    Logout
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
  },
  syncCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  syncHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  syncContent: {
    gap: Spacing.md,
  },
  syncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncLabel: {
    fontSize: 14,
  },
  syncValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  assignmentCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  menuSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    color: "#64748b",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minWidth: 280,
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
