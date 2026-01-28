import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/lib/storage";
import { BorderRadius, Spacing } from "@/constants/theme";
import {
  formatPhoneNumber,
  printCapturedIDCard,
  generatePDFFromImage,
} from "@/lib/id-card-generator";
import type { LivestockSubmission, User } from "@/types";

const CARD_WIDTH = Math.min(Dimensions.get("window").width - 40, 400);
const CARD_HEIGHT = 240;

export default function IDCardScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const cardRef = useRef<View>(null);

  const [submissions, setSubmissions] = useState<LivestockSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<LivestockSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    const data = await storage.getSubmissions();
    setSubmissions(data);
    try {
      const u = await storage.getUsers();
      setUsers(u || []);
    } catch (e) {
      setUsers([]);
    }
    setIsLoading(false);
  };

  const combinedSearchPool: LivestockSubmission[] = [
    ...submissions,
    ...users.map((u) => ({
      id: u.id,
      farmer_name: u.full_name || u.email || "",
      contact_number: u.phone_number || "",
      farmer_image: u.user_image,
      lga: u.assigned_lga || "",
      ward: u.assigned_ward || "",
      registration_id: u.agent_code
        ? String(u.agent_code)
        : u.agent_serial_number
        ? String(u.agent_serial_number)
        : undefined,
      submission_status: "synced",
      number_of_animals: 0,
      created_by: u.id,
      created_date: u.created_date,
      farmer_id: u.id,
      gender: "",
      age: "",
      agent_name: u.full_name || "",
      association: "",
      address: u.address || "",
      farm_size: 0,
      livestock_type: "",
      registration_date: u.created_date,
      valid_until: "2025-12-31",
      _isUser: true,
      _userRole: u.user_role,
    } as LivestockSubmission & { _isUser?: boolean; _userRole?: string })),
  ];

  const filteredSubmissions = searchTerm
    ? combinedSearchPool.filter((sub) => {
        const q = searchTerm.toLowerCase();
        return (
          (!!sub.registration_id &&
            sub.registration_id.toLowerCase().includes(q)) ||
          (!!sub.farmer_name && sub.farmer_name.toLowerCase().includes(q)) ||
          (!!sub.contact_number && sub.contact_number.includes(searchTerm))
        );
      })
    : [];

  const handleSaveCard = async () => {
    if (!cardRef.current || !selectedSubmission) return;

    try {
      setIsSaving(true);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant access to save ID cards to your gallery."
        );
        return;
      }

      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "ID Card saved to gallery!");
    } catch (error) {
      console.error("Error saving card:", error);
      Alert.alert("Error", "Failed to save ID card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current || !selectedSubmission) return;

    try {
      setIsSaving(true);

      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `ID Card - ${
            selectedSubmission.registration_id || selectedSubmission.farmer_name
          }`,
        });
      } else {
        Alert.alert("Sharing not available", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error sharing card:", error);
      Alert.alert("Error", "Failed to share ID card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegeneratePDF = async () => {
    if (!cardRef.current || !selectedSubmission) return;

    try {
      setIsSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const imageUri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      const pdfUri = await generatePDFFromImage(imageUri);

      if (pdfUri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(pdfUri, {
            mimeType: "application/pdf",
            dialogTitle: `${selectedSubmission.farmer_name} - ID Card`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert(
            "Success",
            "ID Card PDF generated! Sharing is not available on this device."
          );
        }
      } else {
        throw new Error("PDF generation returned no URI");
      }
    } catch (error) {
      console.error("Error generating PDF from captured card:", error);
      Alert.alert("Error", "Failed to regenerate ID card PDF. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintCard = async () => {
    if (!cardRef.current || !selectedSubmission) return;

    try {
      setIsSaving(true);
      const imageUri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await printCapturedIDCard(imageUri);
    } catch (error) {
      console.error("Error printing card:", error);
      Alert.alert("Error", "Failed to print ID card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderSearchResult = ({ item }: { item: LivestockSubmission }) => (
    <Pressable
      onPress={() => {
        setSelectedSubmission(item);
        setSearchTerm("");
      }}
      style={[
        styles.resultItem,
        {
          backgroundColor:
            selectedSubmission?.id === item.id ? theme.primaryLight : theme.backgroundDefault,
          borderColor: selectedSubmission?.id === item.id ? theme.primary : theme.border,
        },
      ]}
    >
      <View style={styles.resultContent}>
        <ThemedText style={styles.resultName}>{item.farmer_name}</ThemedText>
        <ThemedText style={[styles.resultId, { color: theme.textSecondary }]}>
          {item.registration_id || item.farmer_id || "No ID"}
        </ThemedText>
      </View>
      <View style={[styles.resultBadge, { backgroundColor: theme.primaryLight }]}>
        <ThemedText style={[styles.resultBadgeText, { color: theme.primary }]}>
          {item.lga || "Unknown"}
        </ThemedText>
      </View>
    </Pressable>
  );

  const getQRValue = () => {
    const regId = selectedSubmission?.registration_id || selectedSubmission?.farmer_id || "";
    return `https://livestock.jigawa.gov.ng/verify/${regId}`;
  };

  const getLocation = () => {
    const ward = selectedSubmission?.ward || "";
    const lga = selectedSubmission?.lga || "";
    if (ward && lga) return `${ward}, ${lga}`;
    return ward || lga || "N/A";
  };

  const getDesignation = () => {
    const sub = selectedSubmission as any;
    if (sub?._isUser) {
      return sub._userRole === "admin" ? "Administrator" : "Field Agent";
    }
    return "Farmer";
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ThemedText style={styles.title}>ID Card Generator</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Search and generate ID cards for farmers and staff
      </ThemedText>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
        ]}
      >
        <Feather name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name, phone, or ID..."
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

      {searchTerm ? (
        <View style={styles.searchResults}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : filteredSubmissions.length === 0 ? (
            <ThemedText style={[styles.noResults, { color: theme.textSecondary }]}>
              No results found
            </ThemedText>
          ) : (
            filteredSubmissions.slice(0, 10).map((item) => (
              <View key={item.id}>{renderSearchResult({ item })}</View>
            ))
          )}
        </View>
      ) : null}

      {selectedSubmission ? (
        <View style={styles.cardSection}>
          <ThemedText style={styles.sectionTitle}>{getDesignation()} ID Card</ThemedText>

          <View
            ref={cardRef}
            collapsable={false}
            style={styles.idCard}
          >
            <View style={styles.cardHeader}>
              <ThemedText style={styles.headerTitle}>Jigawa State</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Ministry of Livestock Development
              </ThemedText>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.photoSection}>
                {selectedSubmission.farmer_image ? (
                  <Image
                    source={{ uri: selectedSubmission.farmer_image }}
                    style={styles.farmerPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Feather name="user" size={36} color="#057856" />
                  </View>
                )}
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Name</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {selectedSubmission.farmer_name || "N/A"}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Reg ID</ThemedText>
                  <ThemedText style={[styles.infoValue, styles.regIdText]}>
                    {selectedSubmission.registration_id ||
                      selectedSubmission.farmer_id ||
                      "N/A"}
                  </ThemedText>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.phoneRow}>
                    <Feather name="phone" size={12} color="#057856" />
                    <ThemedText style={styles.phoneLabel}>Phone</ThemedText>
                  </View>
                  <ThemedText style={styles.infoValue}>
                    {formatPhoneNumber(selectedSubmission.contact_number) || "N/A"}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.qrSection}>
                <QRCode
                  value={getQRValue()}
                  size={70}
                  backgroundColor="white"
                  color="#000"
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color="#FFFFFF" />
                <ThemedText style={styles.locationText}>
                  {getLocation()}
                </ThemedText>
              </View>
              <ThemedText style={styles.validText}>Valid ID</ThemedText>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleSaveCard}
              disabled={isSaving}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Feather name="download" size={16} color={theme.text} />
                  <ThemedText style={styles.actionButtonText}>Save Image</ThemedText>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleShareCard}
              disabled={isSaving}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Feather name="share-2" size={16} color={theme.text} />
                  <ThemedText style={styles.actionButtonText}>Share</ThemedText>
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleRegeneratePDF}
            disabled={isSaving}
            style={[styles.pdfButton, { backgroundColor: "#057856" }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="file-text" size={18} color="#FFFFFF" />
                <ThemedText style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                  Generate PDF ID Card
                </ThemedText>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handlePrintCard}
            disabled={isSaving}
            style={[styles.pdfButton, { backgroundColor: theme.backgroundDefault, marginTop: 8 }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Feather name="printer" size={18} color={theme.text} />
                <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>
                  Print ID Card
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={[styles.emptyState, { borderColor: theme.border }]}>
          <Feather name="credit-card" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Search and select a person to generate their ID card
          </ThemedText>
        </View>
      )}
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
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  searchResults: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  loader: {
    paddingVertical: Spacing.xl,
  },
  noResults: {
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultId: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  resultBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardSection: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
    alignSelf: "flex-start",
  },
  idCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#057856",
    elevation: 8,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 16px rgba(0,0,0,0.25)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  cardHeader: {
    backgroundColor: "#057856",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#E8F5E9",
    fontStyle: "italic",
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  photoSection: {
    width: 80,
    height: 100,
    marginRight: 14,
  },
  farmerPhoto: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  photoPlaceholder: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#057856",
    borderStyle: "dashed",
  },
  infoSection: {
    flex: 1,
    justifyContent: "center",
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: "#057856",
    fontWeight: "500",
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  regIdText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    color: "#057856",
    fontWeight: "700",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phoneLabel: {
    fontSize: 11,
    color: "#057856",
    fontWeight: "500",
  },
  qrSection: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooter: {
    backgroundColor: "#057856",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  validText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    width: "100%",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
