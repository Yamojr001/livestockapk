import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  Image,
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
  const [selectedFarmer, setSelectedFarmer] = useState<LivestockSubmission | null>(null);

  const loadData = useCallback(async () => {
    const allSubmissions = await storage.getSubmissions();
    const mySubmissions = allSubmissions.filter(
      (s) => s.created_by === user?.email
    );
    setSubmissions(mySubmissions);
  }, [user?.email]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith("blob:")) {
      const regId = selectedFarmer?.registration_id || selectedFarmer?.farmer_id;
      if (regId) {
        return `https://renthousehq.com/storage/farmers/${regId}.jpg`;
      }
      return imagePath;
    }

    if (
      imagePath.startsWith("http") ||
      imagePath.startsWith("data:") ||
      imagePath.startsWith("file:")
    ) {
      return imagePath;
    }
    
    if (imagePath.includes('/')) {
        return `https://renthousehq.com/storage/${imagePath}`;
    }
    return `https://renthousehq.com/storage/farmers/${imagePath}`;
  };

  const FarmerDetailsModal = () => {
    if (!selectedFarmer) return null;

    return (
      <Modal
        visible={!!selectedFarmer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFarmer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Farmer Details</ThemedText>
              <Pressable onPress={() => setSelectedFarmer(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailPhotoContainer}>
                {getImageUrl(selectedFarmer.farmer_image) ? (
                  <Image
                    source={{ uri: getImageUrl(selectedFarmer.farmer_image)! }}
                    style={styles.detailPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.detailPhoto, styles.detailPhotoPlaceholder]}>
                    <Feather name="user" size={60} color={theme.textSecondary} />
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <DetailRow label="Full Name" value={selectedFarmer.farmer_name} />
                <DetailRow label="Registration ID" value={selectedFarmer.registration_id} />
                <DetailRow label="Phone Number" value={selectedFarmer.contact_number} />
                <DetailRow label="Gender" value={selectedFarmer.gender} />
                <DetailRow label="Age" value={selectedFarmer.age} />
                <DetailRow label="Association" value={selectedFarmer.association} />
                <DetailRow label="LGA" value={selectedFarmer.lga} />
                <DetailRow label="Ward" value={selectedFarmer.ward} />
                <DetailRow label="Address" value={selectedFarmer.address} />
                <DetailRow label="Animals" value={String(selectedFarmer.number_of_animals || 0)} />
                <DetailRow label="Date Registered" value={selectedFarmer.created_at} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const DetailRow = ({ label, value }: { label: string, value?: string }) => (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value || "N/A"}</ThemedText>
    </View>
  );

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
      <SubmissionCard 
        submission={item} 
        showSyncStatus 
        onPress={() => setSelectedFarmer(item)}
      />
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
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
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
      <FarmerDetailsModal />
    </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    paddingBottom: Spacing.xl,
  },
  detailPhotoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  detailPhoto: {
    width: 120,
    height: 150,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  detailPhotoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  detailSection: {
    gap: Spacing.md,
  },
  detailRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});
