import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { FormInput } from "@/components/FormInput";
import { FormPicker } from "@/components/FormPicker";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { storage } from "@/lib/storage";
import { apiRequest } from "@/lib/api-config";
import { getLGAs, getWards, ASSOCIATIONS, BANKS } from "@/data/lgaWardData";
import { generateFarmerId } from "@/lib/farmer-id-generator";
import { BorderRadius, Spacing } from "@/constants/theme";

interface FormData {
  farmer_name: string;
  gender: string;
  age: string;
  contact_number: string;
  nin: string;
  bvn: string;
  vin: string;
  bank: string;
  account_number: string;
  lga: string;
  ward: string;
  association: string;
  number_of_animals: string;
  membership_status: string;
  executive_position: string;
  has_disease: string;
  disease_name: string;
  disease_description: string;
  literacy_status: string;
  comments: string;
}

interface FormErrors {
  [key: string]: string;
}

// Helper function to generate registration ID
function generateRegistrationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `JG-${timestamp.toString(36).toUpperCase()}${random}`;
}

export default function SubmissionFormScreen() {
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoLocation, setGeoLocation] = useState<string | null>(null);
  const [farmerImage, setFarmerImage] = useState<string | null>(null);
  const [previewFarmerId, setPreviewFarmerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    farmer_name: "",
    gender: "",
    age: "",
    contact_number: "",
    nin: "",
    bvn: "",
    vin: "",
    bank: "",
    account_number: "",
    lga: "",
    ward: "",
    association: "",
    number_of_animals: "",
    membership_status: "",
    executive_position: "",
    has_disease: "",
    disease_name: "",
    disease_description: "",
    literacy_status: "",
    comments: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Get current GPS location
  const getLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is required to capture GPS coordinates.",
          [{ text: "OK" }]
        );
        setIsGettingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeout: 10000,
      });
      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      setGeoLocation(coords);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      console.error("Location error:", error);
      Alert.alert(
        "Location Error",
        error.message || "Failed to get current location. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFarmerImage(imageUri);
        if (errors.image) {
          setErrors((prev) => ({ ...prev, image: "" }));
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      Alert.alert(
        "Camera Error",
        error.message || "Failed to take photo. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select images.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setFarmerImage(imageUri);
        if (errors.image) {
          setErrors((prev) => ({ ...prev, image: "" }));
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error: any) {
      console.error("Image picker error:", error);
      Alert.alert(
        "Gallery Error",
        error.message || "Failed to select image. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.farmer_name.trim()) {
      newErrors.farmer_name = "Farmer name is required";
    }
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = "Contact number is required";
    } else if (!/^(\+?234|0)[789]\d{9}$/.test(formData.contact_number.trim())) {
      newErrors.contact_number = "Please enter a valid Nigerian phone number";
    }
    if (!formData.lga) {
      newErrors.lga = "LGA is required";
    }
    if (!formData.ward) {
      newErrors.ward = "Ward is required";
    }
    if (!formData.association) {
      newErrors.association = "Association is required";
    }
    if (!formData.number_of_animals.trim()) {
      newErrors.number_of_animals = "Number of animals is required";
    } else {
      const num = parseInt(formData.number_of_animals);
      if (isNaN(num)) {
        newErrors.number_of_animals = "Must be a valid number";
      } else if (num < 1) {
        newErrors.number_of_animals = "Must be at least 1";
      } else if (num > 10000) {
        newErrors.number_of_animals = "Number seems too high. Please verify";
      }
    }

    if (formData.age.trim() && !/^\d+$/.test(formData.age)) {
      newErrors.age = "Age must be a valid number";
    }

    if (formData.nin.trim() && !/^\d{11}$/.test(formData.nin)) {
      newErrors.nin = "NIN must be 11 digits";
    }

    if (formData.bvn.trim() && !/^\d{11}$/.test(formData.bvn)) {
      newErrors.bvn = "BVN must be 11 digits";
    }

    if (formData.account_number.trim() && !/^\d{10}$/.test(formData.account_number)) {
      newErrors.account_number = "Account number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const registrationId = generateRegistrationId();
      
      // Generate unique farmer ID
      let farmerId = "";
      try {
        farmerId = await generateFarmerId({
          lga: formData.lga,
          ward: formData.ward,
          agentSerialNumber: user?.agent_serial_number || 1,
        });
      } catch (error) {
        console.warn('Could not generate farmer ID:', error);
        farmerId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Prepare submission data for server
      const submissionData = {
        farmer_id: farmerId,
        farmer_name: formData.farmer_name.trim(),
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null,
        contact_number: formData.contact_number.trim(),
        nin: formData.nin || null,
        bvn: formData.bvn || null,
        vin: formData.vin || null,
        literacy_status: formData.literacy_status || null,
        bank: formData.bank || null,
        account_number: formData.account_number || null,
        lga: formData.lga,
        ward: formData.ward,
        association: formData.association,
        number_of_animals: parseInt(formData.number_of_animals),
        membership_status: formData.membership_status || null,
        executive_position: formData.executive_position || null,
        geo_location: geoLocation || null,
        farmer_image: farmerImage || null,
        has_disease: formData.has_disease || null,
        disease_name: formData.disease_name || null,
        disease_description: formData.disease_description || null,
        comments: formData.comments || null,
        agent_serial_number: user?.agent_serial_number || null,
        created_by: user?.email || "",
      };

      console.log('Submitting data to server...');
      
      if (isOnline) {
        // Try to send directly to server
        const response = await apiRequest("/submissions", { 
          method: "POST", 
          body: submissionData 
        });
        
        console.log('Server response:', response);

        if (response.success) {
          // Successfully saved to server
          const serverData = response.data;
          
          // Save to local storage with server data
          await storage.addSubmission({
            ...submissionData,
            ...serverData,
            registration_id: serverData.registration_id || registrationId,
            submission_status: "synced",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
          console.log('Saved to local storage as synced');
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Reset form
          setFormData({
            farmer_name: "",
            gender: "",
            age: "",
            contact_number: "",
            nin: "",
            bvn: "",
            vin: "",
            bank: "",
            account_number: "",
            lga: "",
            ward: "",
            association: "",
            number_of_animals: "",
            membership_status: "",
            executive_position: "",
            has_disease: "",
            disease_name: "",
            disease_description: "",
            literacy_status: "",
            comments: "",
          });
          setGeoLocation(null);
          setFarmerImage(null);
          setPreviewFarmerId(null);

          Alert.alert(
            "Success ✅",
            "Submission saved and synced with server successfully!",
            [
              {
                text: "OK",
                onPress: () => {
                  if (user?.user_role === "agent") {
                    navigation.navigate("HomeTab");
                  }
                },
              },
            ]
          );
        } else {
          // Server error - save as pending
          console.warn('Server error, saving as pending:', response.error);
          
          await storage.addPendingSubmission({
            ...submissionData,
            registration_id: registrationId,
            submission_status: "pending",
            agent_id: user?.id || null,
            agent_name: user?.full_name || null,
            sync_error: response.error || "Unknown server error",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
          Alert.alert(
            "Saved Offline ⚠️",
            `Server error: ${response.error}. Data saved locally and will sync when back online.`,
            [
              {
                text: "OK",
                onPress: () => {
                  if (user?.user_role === "agent") {
                    navigation.navigate("HomeTab");
                  }
                },
              },
            ]
          );
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        // Offline mode - save as pending
        console.log('Device offline, saving as pending...');
        
        await storage.addPendingSubmission({
          ...submissionData,
          registration_id: registrationId,
          submission_status: "pending",
          agent_id: user?.id || null,
          agent_name: user?.full_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        
        console.log('Saved to local storage as pending');
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Reset form
        setFormData({
          farmer_name: "",
          gender: "",
          age: "",
          contact_number: "",
          nin: "",
          bvn: "",
          vin: "",
          bank: "",
          account_number: "",
          lga: "",
          ward: "",
          association: "",
          number_of_animals: "",
          membership_status: "",
          executive_position: "",
          has_disease: "",
          disease_name: "",
          disease_description: "",
          literacy_status: "",
          comments: "",
        });
        setGeoLocation(null);
        setFarmerImage(null);
        setPreviewFarmerId(null);

        Alert.alert(
          "Saved Offline 📱",
          "Data saved locally and will sync automatically when you're back online.",
          [
            {
              text: "OK",
              onPress: () => {
                if (user?.user_role === "agent") {
                  navigation.navigate("HomeTab");
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        "Error ❌",
        "Failed to save submission. Please try again.",
        [{ text: "OK" }]
      );
      
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to save submission: " + (error.message || String(error)),
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const wards = formData.lga ? getWards(formData.lga) : [];

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl + 80,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="camera" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Farmer Photo</ThemedText>
        </View>

        <View style={styles.imageContainer}>
          {farmerImage ? (
            <Pressable onPress={takePhoto} style={styles.imagePreviewContainer}>
              <Image source={{ uri: farmerImage }} style={styles.imagePreview} />
              <View style={[styles.imageOverlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
                <Feather name="camera" size={24} color="#fff" />
                <ThemedText style={styles.imageOverlayText}>Tap to retake</ThemedText>
              </View>
            </Pressable>
          ) : (
            <View style={styles.imageButtons}>
              <Pressable
                onPress={takePhoto}
                style={[styles.imageButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="camera" size={24} color="#fff" />
                <ThemedText style={styles.imageButtonText}>Take Photo</ThemedText>
              </Pressable>
              <Pressable
                onPress={pickImage}
                style={[styles.imageButton, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}
              >
                <Feather name="image" size={24} color={theme.text} />
                <ThemedText style={[styles.imageButtonText, { color: theme.text }]}>Choose from Gallery</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
        {errors.image ? (
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {errors.image}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Farmer Information</ThemedText>
        </View>

        <FormInput
          label="Farmer Name *"
          placeholder="Enter full name"
          value={formData.farmer_name}
          onChangeText={(v) => updateField("farmer_name", v)}
          error={errors.farmer_name}
          autoCapitalize="words"
          required
        />

        <FormPicker
          label="Gender"
          placeholder="Select gender"
          value={formData.gender}
          options={["Male", "Female", "Other"]}
          onChange={(v) => updateField("gender", v)}
        />

        <FormInput
          label="Age"
          placeholder="Enter age"
          value={formData.age}
          onChangeText={(v) => updateField("age", v)}
          keyboardType="number-pad"
          error={errors.age}
        />

        <FormInput
          label="Contact Number *"
          placeholder="08012345678"
          value={formData.contact_number}
          onChangeText={(v) => updateField("contact_number", v)}
          error={errors.contact_number}
          keyboardType="phone-pad"
          maxLength={11}
          required
        />

        <FormInput
          label="NIN (National ID Number)"
          placeholder="11-digit NIN"
          value={formData.nin}
          onChangeText={(v) => updateField("nin", v)}
          keyboardType="number-pad"
          maxLength={11}
          error={errors.nin}
        />

        <FormInput
          label="BVN (Bank Verification Number)"
          placeholder="11-digit BVN"
          value={formData.bvn}
          onChangeText={(v) => updateField("bvn", v)}
          keyboardType="number-pad"
          maxLength={11}
          error={errors.bvn}
        />

        <FormInput
          label="VIN (Voter ID Number)"
          placeholder="Voter ID Number"
          value={formData.vin}
          onChangeText={(v) => updateField("vin", v)}
        />

        <FormPicker
          label="Literacy Status"
          placeholder="Select literacy status"
          value={formData.literacy_status}
          options={["Literate", "Semi-Literate", "Illiterate"]}
          onChange={(v) => updateField("literacy_status", v)}
        />

        <FormPicker
          label="Bank"
          placeholder="Select bank"
          value={formData.bank}
          options={BANKS}
          onChange={(v) => updateField("bank", v)}
        />

        <FormInput
          label="Account Number"
          placeholder="10-digit account number"
          value={formData.account_number}
          onChangeText={(v) => updateField("account_number", v)}
          keyboardType="number-pad"
          maxLength={10}
          error={errors.account_number}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="map-pin" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Location</ThemedText>
        </View>

        <FormPicker
          label="LGA *"
          placeholder="Select LGA"
          value={formData.lga}
          options={getLGAs()}
          onChange={(v) => {
            updateField("lga", v);
            updateField("ward", "");
          }}
          error={errors.lga}
          required
        />

        <FormPicker
          label="Ward *"
          placeholder="Select Ward"
          value={formData.ward}
          options={wards}
          onChange={(v) => updateField("ward", v)}
          error={errors.ward}
          disabled={!formData.lga}
          required
        />

        {previewFarmerId && (
          <View
            style={[
              styles.farmerIdContainer,
              { backgroundColor: theme.backgroundElevated, borderColor: theme.primary },
            ]}
          >
            <View style={styles.farmerIdHeader}>
              <Feather name="hash" size={18} color={theme.primary} />
              <ThemedText style={[styles.farmerIdLabel, { color: theme.text }]}>
                Farmer ID
              </ThemedText>
            </View>
            <ThemedText style={[styles.farmerIdValue, { color: theme.primary }]}>
              {previewFarmerId}
            </ThemedText>
            <ThemedText style={[styles.farmerIdHint, { color: theme.textSecondary }]}>
              This ID will be assigned to all farmers registered by this agent in this ward
            </ThemedText>
          </View>
        )}

        <View style={styles.locationRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              GPS Location
            </ThemedText>
            <View
              style={[
                styles.locationDisplay,
                { 
                  backgroundColor: theme.backgroundDefault, 
                  borderColor: geoLocation ? theme.success : theme.border,
                  borderWidth: geoLocation ? 2 : 1,
                },
              ]}
            >
              <Feather
                name="navigation"
                size={16}
                color={geoLocation ? theme.success : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.locationText,
                  { color: geoLocation ? theme.text : theme.textSecondary },
                ]}
                numberOfLines={1}
              >
                {geoLocation || "Not captured"}
              </ThemedText>
            </View>
          </View>
          <Button
            onPress={getLocation}
            disabled={isGettingLocation}
            style={[
              styles.locationButton,
              { backgroundColor: geoLocation ? theme.success : theme.primary }
            ]}
          >
            {isGettingLocation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="crosshair" size={18} color="#fff" />
            )}
          </Button>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="briefcase" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Association Details</ThemedText>
        </View>

        <FormPicker
          label="Association *"
          placeholder="Select association"
          value={formData.association}
          options={ASSOCIATIONS}
          onChange={(v) => updateField("association", v)}
          error={errors.association}
          required
        />

        <FormInput
          label="Number of Animals *"
          placeholder="Enter total count"
          value={formData.number_of_animals}
          onChangeText={(v) => updateField("number_of_animals", v)}
          error={errors.number_of_animals}
          keyboardType="number-pad"
          required
        />

        <FormPicker
          label="Membership Status"
          placeholder="Select status"
          value={formData.membership_status}
          options={["Active Member", "New Member", "Associate Member", "Honorary Member"]}
          onChange={(v) => updateField("membership_status", v)}
        />

        <FormInput
          label="Executive Position (if any)"
          placeholder="e.g. Chairman, Secretary"
          value={formData.executive_position}
          onChangeText={(v) => updateField("executive_position", v)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="heart" size={18} color={theme.primary} />
          <ThemedText style={styles.sectionTitle}>Livestock Health</ThemedText>
        </View>

        <FormPicker
          label="Livestock Has Disease?"
          placeholder="Select status"
          value={formData.has_disease}
          options={["No", "Yes"]}
          onChange={(v) => {
            updateField("has_disease", v);
            if (v === "No") {
              updateField("disease_name", "");
              updateField("disease_description", "");
            }
          }}
        />

        {formData.has_disease === "Yes" ? (
          <>
            <FormInput
              label="Disease Name"
              placeholder="Name of the disease"
              value={formData.disease_name}
              onChangeText={(v) => updateField("disease_name", v)}
              autoCapitalize="words"
            />

            <FormInput
              label="Disease Description"
              placeholder="Detailed description of the disease"
              value={formData.disease_description}
              onChangeText={(v) => updateField("disease_description", v)}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />
          </>
        ) : null}

        <FormInput
          label="Comments / Notes"
          placeholder="Any additional information..."
          value={formData.comments}
          onChangeText={(v) => updateField("comments", v)}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: "top" }}
        />
      </View>

      <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
        <View style={styles.statusContainer}>
          <Feather 
            name={isOnline ? "wifi" : "wifi-off"} 
            size={16} 
            color={isOnline ? theme.success : theme.warning} 
          />
          <ThemedText style={[styles.statusText, { 
            color: isOnline ? theme.success : theme.warning 
          }]}>
            {isOnline ? "Online - Data will sync immediately" : "Offline - Data saved locally"}
          </ThemedText>
        </View>

        {errors.submit ? (
          <ThemedText style={[styles.submitError, { color: theme.error }]}>
            {errors.submit}
          </ThemedText>
        ) : null}

        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            { 
              backgroundColor: isOnline ? theme.primary : theme.warning,
              opacity: isSubmitting ? 0.7 : 1,
            }
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.buttonContent}>
              <Feather name={isOnline ? "upload" : "save"} size={20} color="#fff" />
              <ThemedText style={styles.buttonText}>
                {isOnline ? "Submit & Sync Data" : "Save Data Offline"}
              </ThemedText>
            </View>
          )}
        </Button>

        <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
          Note: All fields marked with * are required. Ensure all information is accurate before submitting.
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  imageContainer: {
    alignItems: "center",
  },
  imageButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  imageButton: {
    flex: 1,
    height: 100,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  imageButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  imagePreviewContainer: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    gap: 4,
  },
  imageOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  farmerIdContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  farmerIdHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  farmerIdLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  farmerIdValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    marginVertical: Spacing.sm,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  farmerIdHint: {
    fontSize: 11,
    fontStyle: "italic",
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitError: {
    textAlign: "center",
    marginBottom: Spacing.md,
    fontSize: 13,
    padding: Spacing.sm,
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: BorderRadius.sm,
  },
  submitButton: {
    marginTop: Spacing.md,
    height: 56,
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  noteText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
});