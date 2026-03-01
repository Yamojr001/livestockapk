import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { FormPicker } from "@/components/FormPicker";
import { imageCacheService } from "@/lib/image-cache-service";
import { getLGAs, getWards } from "@/data/lgaWardData";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StatCard } from "@/components/StatCard";
import { SubmissionCard } from "@/components/SubmissionCard";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/lib/storage";
import { Button } from "@/components/Button";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission } from "@/types";
import { Modal, ScrollView, Image } from "react-native";

const DataManagementScreen = () => {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLGA, setFilterLGA] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const data = await storage.getSubmissions();
    setSubmissions(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const [filterWard, setFilterWard] = useState<string | null>(null);
  const [filterAssociation, setFilterAssociation] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<LivestockSubmission | null>(null);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        !searchTerm ||
        sub.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contact_number?.includes(searchTerm) ||
        sub.registration_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLGA = !filterLGA || sub.lga === filterLGA;
      const matchesWard = !filterWard || sub.ward === filterWard;
      const matchesAssociation = !filterAssociation || sub.association === filterAssociation;

      const subDate = new Date(sub.created_at);
      const matchesDate = 
        (!startDate || subDate >= startDate) && 
        (!endDate || subDate <= endDate);

      return matchesSearch && matchesLGA && matchesWard && matchesAssociation && matchesDate;
    });
  }, [submissions, searchTerm, filterLGA, filterWard, filterAssociation, startDate, endDate]);

  const exportData = async () => {
    if (filteredSubmissions.length === 0) {
      Alert.alert("No Data", "No results to export.");
      return;
    }

    const header = "Registration ID,Farmer Name,LGA,Ward,Association,Animals,Created At\n";
    const rows = filteredSubmissions.map(s => 
      `${s.registration_id},${s.farmer_name},${s.lga},${s.ward},${s.association},${s.number_of_animals},${s.created_at}`
    ).join("\n");
    const csvContent = header + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livestock_export_${new Date().getTime()}.csv`;
      a.click();
      return;
    }

    const filename = `${FileSystem.documentDirectory}export_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(filename, csvContent);
    await Sharing.shareAsync(filename);
  };

  const wards = filterLGA ? getWards(filterLGA) : [];

  const totalAnimals = filteredSubmissions.reduce(
    (sum, s) => sum + (Number(s.number_of_animals) || 0),
    0
  );

  const uniqueLGAs = [...new Set(submissions.map((s) => s.lga))];
  const uniqueWards = [...new Set(filteredSubmissions.map((s) => s.ward))];
  const uniqueAssociations = [...new Set(submissions.map((s) => s.association).filter(Boolean))];

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

  const getImageUrl = async (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    
    // Local file system paths - use directly
    if (imagePath.startsWith("file:") || imagePath.startsWith("data:")) {
      return imagePath;
    }

    // Cached files - use directly
    if (imagePath.includes(FileSystem.documentDirectory || '')) {
      return imagePath;
    }

    // Already full URLs from backend (with http/https)
    if (imagePath.startsWith("http")) {
      try {
        // Try to cache the remote URL for offline access
        const cached = await imageCacheService.getCachedImage(imagePath);
        return cached || imagePath;
      } catch (e) {
        // Fallback to URL if caching fails
        return imagePath;
      }
    }

    // Relative paths - shouldn't happen now, but construct URL if needed
    if (imagePath.includes('/')) {
      // Try as-is first (could be /storage/farmers/... format)
      if (imagePath.startsWith('/')) {
        return `${imagePath}`;
      }
      return imagePath;
    }
    
    // Shouldn't reach here, but fallback
    return imagePath;
  };

  const FarmerDetailsModal = () => {
    const [imageUri, setImageUri] = useState<string | null>(null);

    useEffect(() => {
      if (selectedFarmer?.farmer_image) {
        getImageUrl(selectedFarmer.farmer_image).then(setImageUri);
      } else {
        setImageUri(null);
      }
    }, [selectedFarmer]);

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

            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.detailPhotoContainer}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
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

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.header}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search name, phone, ID..."
            placeholderTextColor={theme.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <Pressable onPress={() => setSearchTerm("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <FormPicker
              label="LGA"
              placeholder="All LGAs"
              value={filterLGA || ""}
              options={getLGAs()}
              onChange={(v) => {
                setFilterLGA(v || null);
                setFilterWard(null);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormPicker
              label="Ward"
              placeholder="All Wards"
              value={filterWard || ""}
              options={wards}
              disabled={!filterLGA}
              onChange={(v) => setFilterWard(v || null)}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <FormPicker
              label="Association"
              placeholder="All Associations"
              value={filterAssociation || ""}
              options={uniqueAssociations.map(a => ({ label: a, value: a }))}
              onChange={(v) => setFilterAssociation(v || null)}
            />
          </View>
        </View>

        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.dateFieldLabel}>Start Date</ThemedText>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  width: '100%',
                }}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
              />
            ) : (
              <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <ThemedText style={styles.dateLabel}>{startDate?.toLocaleDateString() || "Pick Date"}</ThemedText>
              </Pressable>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.dateFieldLabel}>End Date</ThemedText>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  padding: 8,
                  borderRadius: 4,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  width: '100%',
                }}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
              />
            ) : (
              <Pressable style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <ThemedText style={styles.dateLabel}>{endDate?.toLocaleDateString() || "Pick Date"}</ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {Platform.OS !== 'web' && showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            onChange={(e, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          />
        )}
        {Platform.OS !== 'web' && showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            onChange={(e, d) => { setShowEndPicker(false); if (d) setEndDate(d); }}
          />
        )}

        <Button 
          title="Export CSV" 
          onPress={exportData} 
          variant="secondary"
          style={{ marginBottom: Spacing.sm }}
        />

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {filteredSubmissions.length.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Records
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              {totalAnimals.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Animals
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
              {filterLGA ? 1 : uniqueLGAs.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              LGAs
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.roleAdmin }]}>
              {uniqueWards.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Wards
            </ThemedText>
          </View>
        </View>
      </View>
    ),
    [
      theme,
      searchTerm,
      uniqueLGAs,
      filterLGA,
      filteredSubmissions.length,
      totalAnimals,
      uniqueWards.length,
    ]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="database"
        title="No records found"
        message={searchTerm || filterLGA ? "Try adjusting your filters" : "No submissions yet"}
      />
    ),
    [searchTerm, filterLGA]
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
};

export default DataManagementScreen;

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  filterChips: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flex: 1,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
  },
  dateFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#666",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
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
    minHeight: 400, // Added minHeight to ensure content is visible
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
