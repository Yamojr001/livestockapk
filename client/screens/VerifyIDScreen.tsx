import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";
import { BorderRadius, Spacing } from "@/constants/theme";
import { formatPhoneNumber } from "@/lib/id-card-generator";
import type { LivestockSubmission } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function VerifyIDScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedFarmer, setVerifiedFarmer] = useState<LivestockSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const searchFarmer = async (regId: string) => {
    if (!regId.trim()) return;

    setIsLoading(true);
    setError(null);
    setVerifiedFarmer(null);

    try {
      const localSubmissions = await storage.getSubmissions();
      const found = localSubmissions.find(
        (s) =>
          s.registration_id?.toLowerCase() === regId.toLowerCase() ||
          s.farmer_id?.toLowerCase() === regId.toLowerCase()
      );

      if (found) {
        setVerifiedFarmer(found);
      } else {
        const response = await apiRequest(`/submissions/verify/${regId}`, {
          method: "GET",
        });

        if (response.success && response.data) {
          // Type casting to appease strict TypeScript checking for agent_id string vs string|null
          setVerifiedFarmer(response.data as LivestockSubmission);
        } else {
          setError("No farmer found with this ID. Please check and try again.");
        }
      }
    } catch (err) {
      console.error("Error verifying ID:", err);
      setError("Unable to verify ID. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchFarmer(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm("");
    setVerifiedFarmer(null);
    setError(null);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        setError("Camera permission is required to scan QR codes.");
        return;
      }
    }
    setIsScannerOpen(true);
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScannerOpen(false);
    if (data) {
      setSearchTerm(data);
      searchFarmer(data);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
    >
      <ThemedText style={styles.title}>Verify Farmer ID</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter registration ID to verify farmer
      </ThemedText>

      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Enter Registration ID..."
            placeholderTextColor={theme.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
            autoCapitalize="characters"
          />
          {searchTerm ? (
            <Pressable onPress={handleClear}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleSearch}
          disabled={isLoading || !searchTerm.trim()}
          style={[
            styles.verifyButton,
            { backgroundColor: "#057856", opacity: (!searchTerm.trim() || isLoading) ? 0.6 : 1 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#FFFFFF" />
              <ThemedText style={styles.verifyButtonText}>Verify ID</ThemedText>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={openScanner}
          disabled={isLoading}
          style={[
            styles.scanButton,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <Feather name="maximize-2" size={18} color={theme.primary} />
          <ThemedText style={[styles.scanButtonText, { color: theme.primary }]}>Scan QR</ThemedText>
        </Pressable>
      </View>

      {error ? (
        <View style={[styles.errorCard, { backgroundColor: "#FEE2E2" }]}>
          <Feather name="alert-circle" size={24} color="#DC2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : null}

      {verifiedFarmer ? (
        <View style={[styles.resultCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.verifiedBadge}>
            <Feather name="check-circle" size={20} color="#059669" />
            <ThemedText style={styles.verifiedText}>Verified Farmer</ThemedText>
          </View>

          <View style={styles.farmerDetails}>
            <View style={styles.photoContainer}>
              {verifiedFarmer.farmer_image ? (
                <Image
                  source={{ uri: verifiedFarmer.farmer_image }}
                  style={styles.farmerPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.photoPlaceholder, { backgroundColor: "#E8F5E9" }]}>
                  <Feather name="user" size={40} color="#057856" />
                </View>
              )}
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Full Name
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {verifiedFarmer.farmer_name || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Registration ID
                </ThemedText>
                <ThemedText style={[styles.detailValue, styles.regIdValue]}>
                  {verifiedFarmer.registration_id || verifiedFarmer.farmer_id || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Phone Number
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatPhoneNumber(verifiedFarmer.contact_number) || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  LGA
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {verifiedFarmer.lga || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Ward
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {verifiedFarmer.ward || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Association
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {verifiedFarmer.association || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Number of Animals
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {verifiedFarmer.number_of_animals || "N/A"}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                  Designation
                </ThemedText>
                <ThemedText style={styles.detailValue}>Farmer</ThemedText>
              </View>
            </View>
          </View>
        </View>
      ) : !error && !isLoading ? (
        <View style={[styles.emptyState, { borderColor: theme.border }]}>
          <Feather name="shield" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Enter a registration ID or scan a QR code to verify a farmer's identity
          </ThemedText>
        </View>
      ) : null}

      <Modal visible={isScannerOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.scannerModalBody}>
          <View style={[styles.modalHeader, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>Scan Farmer ID</ThemedText>
            <Pressable onPress={() => setIsScannerOpen(false)} style={styles.closeModalButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.scannerWrapper}>
            {isScannerOpen && permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            ) : (
              <View style={styles.scannerFallback}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText style={[styles.scannerFallbackText, { color: theme.textSecondary }]}>
                  Requesting camera permission...
                </ThemedText>
              </View>
            )}

            <View style={styles.scannerOverlay}>
              <View style={styles.scannerTargetBox} />
            </View>
          </View>
        </View>
      </Modal>
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
  searchRow: {
    marginBottom: Spacing.md,
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
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  verifyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  scanButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "500",
  },
  resultCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  farmerDetails: {
    flexDirection: "row",
  },
  photoContainer: {
    marginRight: Spacing.lg,
  },
  farmerPhoto: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  photoPlaceholder: {
    width: 100,
    height: 120,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#057856",
    borderStyle: "dashed",
  },
  detailsContainer: {
    flex: 1,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  regIdValue: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    color: "#057856",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  scannerModalBody: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeModalButton: {
    padding: Spacing.xs,
  },
  scannerWrapper: {
    flex: 1,
    position: "relative",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerTargetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#057856",
    backgroundColor: "transparent",
    borderRadius: BorderRadius.md,
  },
  scannerFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  scannerFallbackText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
});