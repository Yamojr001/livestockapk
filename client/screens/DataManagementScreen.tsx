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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        !searchTerm ||
        sub.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.contact_number?.includes(searchTerm) ||
        sub.registration_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLGA = !filterLGA || sub.lga === filterLGA;
      const matchesWard = !filterWard || sub.ward === filterWard;

      const subDate = new Date(sub.created_at);
      const matchesDate = 
        (!startDate || subDate >= startDate) && 
        (!endDate || subDate <= endDate);

      return matchesSearch && matchesLGA && matchesWard && matchesDate;
    });
  }, [submissions, searchTerm, filterLGA, filterWard, startDate, endDate]);

  const exportData = async () => {
    if (filteredSubmissions.length === 0) {
      Alert.alert("No Data", "No results to export.");
      return;
    }

    const header = "Registration ID,Farmer Name,LGA,Ward,Animals,Created At\n";
    const rows = filteredSubmissions.map(s => 
      `${s.registration_id},${s.farmer_name},${s.lga},${s.ward},${s.number_of_animals},${s.created_at}`
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
    (sum, s) => sum + (s.number_of_animals || 0),
    0
  );

  const uniqueLGAs = [...new Set(submissions.map((s) => s.lga))];
  const uniqueWards = [...new Set(filteredSubmissions.map((s) => s.ward))];

  const renderItem = useCallback(
    ({ item }: { item: LivestockSubmission }) => (
      <SubmissionCard submission={item} showSyncStatus />
    ),
    []
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
              label="Filter LGA"
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
              label="Filter Ward"
              placeholder="All Wards"
              value={filterWard || ""}
              options={wards}
              disabled={!filterLGA}
              onChange={(v) => setFilterWard(v || null)}
            />
          </View>
        </View>

        <View style={styles.dateRow}>
          <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
            <ThemedText style={styles.dateLabel}>Start: {startDate?.toLocaleDateString() || "Pick Date"}</ThemedText>
          </Pressable>
          <Pressable style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
            <ThemedText style={styles.dateLabel}>End: {endDate?.toLocaleDateString() || "Pick Date"}</ThemedText>
          </Pressable>
          {(startDate || endDate) && (
            <Pressable onPress={() => { setStartDate(null); setEndDate(null); }}>
              <Feather name="x-circle" size={20} color={theme.error} />
            </Pressable>
          )}
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            onChange={(e, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
          />
        )}
        {showEndPicker && (
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
});
