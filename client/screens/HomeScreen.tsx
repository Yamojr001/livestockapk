import React, { useState, useEffect, useCallback } from "react";
import { FlatList, View, StyleSheet, Modal, ScrollView, Image, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { SubmissionCard } from "@/components/SubmissionCard";
import { storage } from "@/lib/storage";
import type { LivestockSubmission } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<LivestockSubmission | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await storage.getSubmissions();
    // Sort by created_at descending and take top 5
    const recent = data.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5);
    setSubmissions(recent);
  }, []);

  useEffect(() => {
    loadData();
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

  const DetailRow = ({ label, value }: { label: string, value?: any }) => (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value || "N/A"}</ThemedText>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={submissions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubmissionCard 
            submission={item} 
            showSyncStatus 
            onPress={() => setSelectedFarmer(item)}
          />
        )}
        ListHeaderComponent={() => (
          <ThemedText style={styles.sectionTitle}>Recent Registrations</ThemedText>
        )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
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
