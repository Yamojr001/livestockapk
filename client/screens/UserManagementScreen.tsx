import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ThemedText";
import { UserCard } from "@/components/UserCard";
import { EmptyState } from "@/components/EmptyState";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";
import { BorderRadius, Spacing } from "@/constants/theme";
import { getLGAs } from "@/data/lgaWardData";
import { generateAndShareUserIDCard } from "@/lib/id-card-generator";
import type { User } from "@/types";

interface Section {
  title: string;
  data: User[];
}

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "agent", label: "Agent" },
];

export default function UserManagementScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"admin" | "agent">("agent");
  const [selectedLGA, setSelectedLGA] = useState("");
  const [showLGAPicker, setShowLGAPicker] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);

  const lgaList = getLGAs();

  const loadData = useCallback(async () => {
    try {
      const response = await apiRequest<User[] | { users: User[] }>("/users", { method: "GET" });
      if (response.success && response.data) {
        const userData = Array.isArray(response.data)
          ? response.data
          : // Laravel paginator returns { current_page, data: [...], ... }
            (response.data.data || response.data.users || []);
        setUsers(userData);
        await storage.setUsers(userData);
      } else {
        const localData = await storage.getUsers();
        setUsers(localData);
      }
    } catch (error) {
      const localData = await storage.getUsers();
      setUsers(localData);
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

  const takeUserPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setFormError("Camera permission denied");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      setFormError("Failed to take photo");
    }
  };

  const pickUserImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setFormError("Gallery permission denied");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      setFormError("Failed to pick image");
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setRole("agent");
    setSelectedLGA("");
    setUserImage(null);
    setFormError("");
    setSuccessMessage("");
  };

  const handleAddUser = async () => {
    setFormError("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setFormError("Please enter full name");
      return;
    }
    if (!email.trim()) {
      setFormError("Please enter email address");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (role === "agent" && !selectedLGA) {
      setFormError("Please select LGA assignment for agent");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest(
        "/users",
        {
          method: "POST",
          body: {
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            password_confirmation: password,
            phone_number: phoneNumber.trim() || null,
            user_role: role,
            assigned_lga: role === "agent" ? selectedLGA : null,
            user_image: userImage || null,
            status: "active",
          },
        }
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMessage("User created successfully! Navigating to ID Card...");

        // If server returned the created user (may include generated agent_code),
        // update local users/storage immediately so the ID is available.
        try {
          const created = response.data;
          if (created) {
            const current = await storage.getUsers();
            const newUsers = [created, ...current.filter((u) => u.email !== created.email)];
            await storage.setUsers(newUsers);
            setUsers(newUsers);
          } else {
            // fallback to reload from server
            await loadData();
          }
        } catch (e) {
          await loadData();
        }

        setTimeout(() => {
          setShowAddModal(false);
          resetForm();
          // Navigate to IDCard tab
          navigation.navigate("IDCardTab");
        }, 500);
      } else {
        setFormError(response.error || "Failed to create user");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      setFormError("An error occurred. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      !searchTerm ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sections: Section[] = [
    {
      title: "Admins",
      data: filteredUsers.filter((u) => u.user_role === "admin"),
    },
    {
      title: "Agents",
      data: filteredUsers.filter((u) => u.user_role === "agent"),
    },
    {
      title: "Viewers",
      data: filteredUsers.filter((u) => u.user_role === "viewer"),
    },
  ].filter((s) => s.data.length > 0);

  const adminCount = users.filter((u) => u.user_role === "admin").length;
  const agentCount = users.filter((u) => u.user_role === "agent").length;
  const activeCount = users.filter((u) => u.status === "active").length;

  const renderItem = useCallback(
    ({ item }: { item: User }) => <UserCard user={item} />,
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
        <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
          {section.data.length}
        </ThemedText>
      </View>
    ),
    [theme]
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
            placeholder="Search users..."
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

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {users.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.roleAdmin }]}>
              {adminCount}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Admins
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.roleAgent }]}>
              {agentCount}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Agents
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.statValue, { color: theme.success }]}>
              {activeCount}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Active
            </ThemedText>
          </View>
        </View>
      </View>
    ),
    [theme, searchTerm, users.length, adminCount, agentCount, activeCount]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <EmptyState
        icon="users"
        title="No users found"
        message={searchTerm ? "Try a different search" : "No users registered yet"}
      />
    ),
    [searchTerm]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <SectionList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl + 80,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        SectionSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: "#10b981" }]}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <Feather name="user-plus" size={24} color="#fff" />
      </Pressable>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add New User</ThemedText>
              <Pressable
                onPress={() => setShowAddModal(false)}
                style={[styles.closeButton, { backgroundColor: theme.backgroundDefault }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {successMessage ? (
                <View style={[styles.successBanner, { backgroundColor: "#d1fae5" }]}>
                  <Feather name="check-circle" size={20} color="#10b981" />
                  <ThemedText style={[styles.successText, { color: "#10b981" }]}>
                    {successMessage}
                  </ThemedText>
                </View>
              ) : null}

              {formError ? (
                <View style={[styles.errorBanner, { backgroundColor: "#fee2e2" }]}>
                  <Feather name="alert-circle" size={20} color="#ef4444" />
                  <ThemedText style={[styles.errorText, { color: "#ef4444" }]}>
                    {formError}
                  </ThemedText>
                </View>
              ) : null}

              <FormInput
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                leftIcon="user"
              />

              <View style={[styles.imageSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 12 }]}>
                  Profile Photo
                </ThemedText>
                <View style={styles.photoPreviewContainer}>
                  {userImage ? (
                    <>
                      <Image
                        source={{ uri: userImage }}
                        style={styles.photoPreview}
                      />
                      <Pressable
                        style={[styles.removePhotoButton, { backgroundColor: "#ef4444" }]}
                        onPress={() => setUserImage(null)}
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </Pressable>
                    </>
                  ) : (
                    <View style={[styles.photoPlaceholder, { backgroundColor: theme.border }]}>
                      <Feather name="camera" size={32} color={theme.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={styles.photoActions}>
                  <Pressable
                    style={[styles.photoActionButton, { backgroundColor: theme.primary }]}
                    onPress={takeUserPhoto}
                  >
                    <Feather name="camera" size={16} color="#fff" />
                    <ThemedText style={[styles.photoActionText, { color: "#fff" }]}>
                      Take Photo
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.photoActionButton, { backgroundColor: theme.primary }]}
                    onPress={pickUserImage}
                  >
                    <Feather name="image" size={16} color="#fff" />
                    <ThemedText style={[styles.photoActionText, { color: "#fff" }]}>
                      Upload
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <FormInput
                label="Email Address"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail"
              />

              <FormInput
                label="Password"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock"
              />

              <FormInput
                label="Phone Number (Optional)"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                leftIcon="phone"
              />

              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  User Role
                </ThemedText>
                <View style={styles.roleButtons}>
                  {ROLES.map((r) => (
                    <Pressable
                      key={r.value}
                      style={[
                        styles.roleButton,
                        {
                          backgroundColor:
                            role === r.value ? "#10b981" : theme.backgroundDefault,
                          borderColor: role === r.value ? "#10b981" : theme.border,
                        },
                      ]}
                      onPress={() => {
                        setRole(r.value as "admin" | "agent");
                        Haptics.selectionAsync();
                      }}
                    >
                      <Feather
                        name={r.value === "admin" ? "shield" : "user"}
                        size={18}
                        color={role === r.value ? "#fff" : theme.text}
                      />
                      <ThemedText
                        style={[
                          styles.roleButtonText,
                          { color: role === r.value ? "#fff" : theme.text },
                        ]}
                      >
                        {r.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {role === "agent" ? (
                <View style={styles.fieldGroup}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                    LGA Assignment
                  </ThemedText>
                  <Pressable
                    style={[
                      styles.pickerButton,
                      { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                    ]}
                    onPress={() => setShowLGAPicker(!showLGAPicker)}
                  >
                    <Feather name="map-pin" size={18} color={theme.textSecondary} />
                    <ThemedText
                      style={[
                        styles.pickerText,
                        { color: selectedLGA ? theme.text : theme.textSecondary },
                      ]}
                    >
                      {selectedLGA || "Select LGA"}
                    </ThemedText>
                    <Feather
                      name={showLGAPicker ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </Pressable>

                  {showLGAPicker ? (
                    <View
                      style={[
                        styles.lgaList,
                        { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                      ]}
                    >
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                        {lgaList.map((lga) => (
                          <Pressable
                            key={lga}
                            style={[
                              styles.lgaItem,
                              selectedLGA === lga && { backgroundColor: "#d1fae5" },
                            ]}
                            onPress={() => {
                              setSelectedLGA(lga);
                              setShowLGAPicker(false);
                              Haptics.selectionAsync();
                            }}
                          >
                            <ThemedText
                              style={[
                                styles.lgaText,
                                selectedLGA === lga && { color: "#10b981", fontWeight: "600" },
                              ]}
                            >
                              {lga.replace(/_/g, " ")}
                            </ThemedText>
                            {selectedLGA === lga ? (
                              <Feather name="check" size={18} color="#10b981" />
                            ) : null}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.buttonContainer}>
                <Button
                  onPress={handleAddUser}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    "Create User"
                  )}
                </Button>
                <Pressable
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionCount: {
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 4px rgba(0,0,0,0.25)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  imageSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  removePhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  photoActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  roleButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
  },
  lgaList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  lgaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  lgaText: {
    fontSize: 14,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  submitButton: {
    marginTop: 0,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
