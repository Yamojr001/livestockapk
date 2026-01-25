import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from "react-native";
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
import { BorderRadius, Spacing } from "@/constants/theme";
import type { LivestockSubmission } from "@/types";

export default function DataManagementScreen() {
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

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      !searchTerm ||
      sub.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contact_number?.includes(searchTerm) ||
      sub.registration_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLGA = !filterLGA || sub.lga === filterLGA;

    return matchesSearch && matchesLGA;
  });

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

        {uniqueLGAs.length > 0 ? (
          <FlatList
            horizontal
            data={uniqueLGAs}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setFilterLGA(filterLGA === item ? null : item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterLGA === item ? theme.primaryLight : theme.backgroundDefault,
                    borderColor: filterLGA === item ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: filterLGA === item ? theme.primary : theme.text },
                  ]}
                >
                  {item}
                </ThemedText>
              </Pressable>
            )}
          />
        ) : null}

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
