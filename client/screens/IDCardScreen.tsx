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
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/lib/storage";
import { BorderRadius, Spacing } from "@/constants/theme";
import {
  formatPhoneNumber,
  formatDate,
  printCapturedIDCard,
  generatePDFFromImage,
} from "@/lib/id-card-generator";
import type { LivestockSubmission, User } from "@/types";

export default function IDCardScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const cardRef = useRef<View>(null);
  const { width: screenWidth } = Dimensions.get("window");

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

  // Combine submissions + users (mapped) into a single searchable pool.
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
    } as LivestockSubmission)),
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

      // capture as tmp file so file:// uri can be saved
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await MediaLibrary.saveToLibraryAsync(uri);
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

      // Capture card to image first, then create PDF from that image
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
            dialogTitle: `${selectedSubmission.farmer_name} - Farmer ID Card`,
            UTI: "com.adobe.pdf",
          });
        } else {
          Alert.alert(
            "Success",
            "Farmer ID Card PDF generated! Sharing is not available on this device."
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

  // Format address from village/town and LGA
  const formatAddress = (submission: LivestockSubmission) => {
    const village = submission.village || submission.ward || "";
    const lga = submission.lga || "";

    if (village && lga) {
      return `${village}, ${lga}`;
    } else if (village) {
      return village;
    } else if (lga) {
      return lga;
    }
    return "";
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
        Search and generate farmer ID cards
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
              No farmers found
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
          <ThemedText style={styles.sectionTitle}>Farmer ID Card</ThemedText>

          <View
            ref={cardRef}
            collapsable={false}
            style={[
              styles.idCard,
              {
                backgroundColor: "#057856",
              },
            ]}
          >
            {/* Quarter Circle Decoration at top-right corner */}
            <View style={styles.quarterCircle} />

            {/* Header - Jigawa State Ministry */}
            <View style={styles.cardHeader}>
              <ThemedText style={[styles.cardHeaderMain, { color: "#FFFFFF" }]}>
                Jigawa State
              </ThemedText>
              <ThemedText style={[styles.cardHeaderSub, { color: "#E8F5E9" }]}>
                Ministry of Livestock Development
              </ThemedText>
            </View>

            {/* Body Content */}
            <View style={styles.cardBody}>
              {/* Left: Rectangular Image Section */}
              <View style={styles.imageSection}>
                {selectedSubmission.farmer_image ? (
                  <Image
                    source={{ uri: selectedSubmission.farmer_image }}
                    style={styles.farmerImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="user" size={40} color="#FFFFFF" />
                    <ThemedText style={[styles.placeholderText, { color: "#E8F5E9" }]}>
                      Farmer Photo
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Right: Details Section (label/value rows with fixed label width) */}
              <View style={styles.detailsSection}>
                {/* Name */}
                <View style={styles.fieldRow}>
                  <ThemedText style={styles.fieldLabel}>Name:</ThemedText>
                  <ThemedText style={styles.fieldValue}>
                    {selectedSubmission.farmer_name || "N/A"}
                  </ThemedText>
                </View>

                {/* Reg ID */}
                <View style={styles.fieldRow}>
                  <ThemedText style={styles.fieldLabel}>Reg ID:</ThemedText>
                  <ThemedText style={[styles.fieldValue, styles.monospace]}>
                    {selectedSubmission.registration_id ||
                      selectedSubmission.farmer_id ||
                      "N/A"}
                  </ThemedText>
                </View>

                {/* Phone */}
                <View style={styles.fieldRow}>
                  <ThemedText style={styles.fieldLabel}>Phone:</ThemedText>
                  <ThemedText style={styles.fieldValue}>
                    {formatPhoneNumber(selectedSubmission.contact_number) || "N/A"}
                  </ThemedText>
                </View>

                {/* LGA */}
                <View style={styles.fieldRow}>
                  <ThemedText style={styles.fieldLabel}>LGA:</ThemedText>
                  <ThemedText style={styles.fieldValue}>
                    {selectedSubmission.lga || "N/A"}
                  </ThemedText>
                </View>

                {/* Address */}
                {formatAddress(selectedSubmission) ? (
                  <View style={styles.fieldRow}>
                    <ThemedText style={styles.fieldLabel}>Address:</ThemedText>
                    <ThemedText style={[styles.fieldValue, styles.addressText]}>
                      {formatAddress(selectedSubmission)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Footer (left: official text, right: validity) */}
            <View style={styles.cardFooterRow}>
              <ThemedText style={[styles.footerTextLeft, { color: "#E8F5E9" }]}>
                Official Livestock Farmer ID Card
              </ThemedText>
              <View style={styles.footerValidRight}>
                <Feather name="check-circle" size={14} color="#4CAF50" />
                <ThemedText style={[styles.footerTextRight, { color: "#4CAF50" }]}>
                  Valid
                </ThemedText>
              </View>
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

          <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
            Note: PDF will contain only the ID card in exact same format
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.emptyState, { borderColor: theme.border }]}>
          <Feather name="credit-card" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Search and select a farmer to generate their ID card
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
    width: Math.min(Dimensions.get("window").width - 40, 400),
    height: 260,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 6,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
    position: "relative",
  },
  quarterCircle: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1e8767",
    opacity: 0.8,
  },
  cardHeader: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  cardHeaderMain: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  cardHeaderSub: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  cardBody: {
    flex: 1,
    flexDirection: "row",
    padding: 15,
  },
  imageSection: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  farmerImage: {
    width: 90,
    height: 110,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    width: 90,
    height: 110,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  placeholderText: {
    fontSize: 9,
    marginTop: 6,
    textAlign: "center",
  },
  detailsSection: {
    flex: 1,
    paddingTop: 5,
  },

  /* UPDATED: label/value rows for uniform alignment */
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    width: 70, // fixed width to ensure uniform spacing
    fontSize: 12,
    fontWeight: "600",
    color: "#E8F5E9",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  /* keep monospace style for IDs */
  monospace: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    fontSize: 13,
  },
  addressText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#E8F5E9",
  },

  validRow: {
    marginTop: 5,
  },
  fieldLabelOld: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  fieldValueOld: {
    fontSize: 14,
    fontWeight: "500",
  },
  validBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  validText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardFooter: {
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  footerText: {
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
  },

  cardFooterRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  footerTextLeft: {
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
  },
  footerValidRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerTextRight: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 6,
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
  noteText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: Spacing.md,
    fontStyle: "italic",
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
