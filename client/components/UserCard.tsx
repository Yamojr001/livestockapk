import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { User } from "@/types";

interface UserCardProps {
  user: User;
  onPress?: () => void;
  onEdit?: () => void;
}

export function UserCard({ user, onPress, onEdit }: UserCardProps) {
  const { theme } = useTheme();

  const getRoleBadge = () => {
    switch (user.user_role) {
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: roleBadge.bg }]}>
          <ThemedText style={[styles.avatarText, { color: roleBadge.color }]}>
            {user.full_name?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
        <View style={styles.info}>
          <ThemedText style={styles.name}>{user.full_name}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {user.email}
          </ThemedText>
          {user.assigned_lga ? (
            <View style={styles.assignment}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.assignmentText, { color: theme.textSecondary }]}>
                {user.assigned_lga}
                {user.assigned_ward ? ` - ${user.assigned_ward}` : ""}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.right}>
          <Badge backgroundColor={roleBadge.bg} color={roleBadge.color}>
            {roleBadge.label}
          </Badge>
          <Badge variant={user.status === "active" ? "success" : "default"}>
            {user.status === "active" ? "Active" : "Inactive"}
          </Badge>
          {onEdit ? (
            <Pressable onPress={onEdit} hitSlop={8}>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  email: {
    fontSize: 13,
  },
  assignment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  assignmentText: {
    fontSize: 12,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
});
