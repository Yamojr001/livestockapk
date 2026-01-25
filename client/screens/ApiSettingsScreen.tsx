import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { getApiBaseUrl, setApiBaseUrl, testApiConnection } from "@/lib/api-config";
import { BorderRadius, Spacing } from "@/constants/theme";

export default function ApiSettingsScreen() {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [apiUrl, setApiUrl] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "failed">("untested");

  useEffect(() => {
    loadApiUrl();
  }, []);

  const loadApiUrl = async () => {
    const url = await getApiBaseUrl();
    setApiUrl(url);
  };

  const handleTestConnection = async () => {
    if (!apiUrl.trim()) {
      Alert.alert("Error", "Please enter an API URL");
      return;
    }

    setIsTesting(true);
    setConnectionStatus("untested");

    try {
      await setApiBaseUrl(apiUrl.trim());
      const isConnected = await testApiConnection();
      
      if (isConnected) {
        setConnectionStatus("success");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Connection to API server successful!");
      } else {
        setConnectionStatus("failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Failed", "Could not connect to the API server. Check the URL and try again.");
      }
    } catch (error) {
      setConnectionStatus("failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to test connection");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      Alert.alert("Error", "Please enter an API URL");
      return;
    }

    setIsSaving(true);
    try {
      await setApiBaseUrl(apiUrl.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "API URL has been saved. Please log out and log in again for changes to take effect.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to save API URL");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.cardHeader}>
          <Feather name="server" size={24} color={theme.primary} />
          <ThemedText style={styles.cardTitle}>API Server Configuration</ThemedText>
        </View>

        <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
          Enter the URL of your Laravel API server hosted on Hostinger. The URL should include the full path to the API (e.g., https://yourdomain.com/api/v1)
        </ThemedText>

        <FormInput
          label="API Base URL"
          placeholder="https://yourdomain.com/api/v1"
          value={apiUrl}
          onChangeText={(text) => {
            setApiUrl(text);
            setConnectionStatus("untested");
          }}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="globe"
        />

        <View style={styles.statusRow}>
          <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
            Connection Status:
          </ThemedText>
          <View style={styles.statusBadge}>
            <Feather
              name={
                connectionStatus === "success"
                  ? "check-circle"
                  : connectionStatus === "failed"
                  ? "x-circle"
                  : "help-circle"
              }
              size={16}
              color={
                connectionStatus === "success"
                  ? theme.success
                  : connectionStatus === "failed"
                  ? theme.error
                  : theme.textSecondary
              }
            />
            <ThemedText
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === "success"
                      ? theme.success
                      : connectionStatus === "failed"
                      ? theme.error
                      : theme.textSecondary,
                },
              ]}
            >
              {connectionStatus === "success"
                ? "Connected"
                : connectionStatus === "failed"
                ? "Failed"
                : "Not Tested"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Button
            variant="secondary"
            onPress={handleTestConnection}
            disabled={isTesting || !apiUrl.trim()}
            style={styles.button}
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              "Test Connection"
            )}
          </Button>

          <Button
            onPress={handleSave}
            disabled={isSaving || !apiUrl.trim()}
            style={styles.button}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              "Save"
            )}
          </Button>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="info" size={20} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={styles.infoTitle}>Deployment Instructions</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            1. Upload the Laravel backend to your Hostinger{"\n"}
            2. Configure database in .env file{"\n"}
            3. Run migrations: php artisan migrate{"\n"}
            4. Run seeder: php artisan db:seed{"\n"}
            5. Enter your API URL above and test the connection
          </ThemedText>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
