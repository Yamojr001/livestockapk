import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface FormPickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: string[] | Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function FormPicker({
  label,
  placeholder = "Select...",
  value,
  options,
  onChange,
  error,
  disabled,
}: FormPickerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  // Normalize options to always have label/value structure
  const normalizedOptions = useMemo(() => {
    if (options.length === 0) return [];

    // Check if first item is already an object with label/value
    if (
      typeof options[0] === "object" &&
      "label" in options[0] &&
      "value" in options[0]
    ) {
      return options as Array<{ label: string; value: string }>;
    }

    // Convert string array to object array
    return (options as string[]).map((option) => ({
      label: option,
      value: option,
    }));
  }, [options]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    // Dismiss keyboard first on Android
    if (Platform.OS === "android") {
      Keyboard.dismiss();
    }
    setVisible(false);
  };

  const handleOpenModal = () => {
    if (!disabled) {
      Keyboard.dismiss();
      setVisible(true);
    }
  };

  const handleCloseModal = () => {
    setVisible(false);
  };

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <ThemedText style={[styles.label, { color: theme.text }]}>
          {label}
        </ThemedText>
      ) : null}
      <Pressable
        onPress={handleOpenModal}
        style={[
          styles.picker,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: error ? theme.error : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label} picker`}
      >
        <ThemedText
          style={[
            styles.pickerText,
            { color: value ? theme.text : theme.textSecondary },
          ]}
        >
          {selectedOption?.label || placeholder}
        </ThemedText>
        <Feather name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.error }]}>
          {error}
        </ThemedText>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={Platform.OS === "android"}
        hardwareAccelerated={Platform.OS === "android"}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <TouchableWithoutFeedback
            onPress={handleCloseModal}
            accessible={false}
          >
            <View style={styles.overlay}>
              <View
                style={[
                  styles.modal,
                  {
                    backgroundColor: theme.backgroundRoot,
                    paddingBottom: insets.bottom + Spacing.lg,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {label || "Select"}
                  </ThemedText>
                  <Pressable
                    onPress={handleCloseModal}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Close picker"
                  >
                    <Feather name="x" size={24} color={theme.text} />
                  </Pressable>
                </View>
                <FlatList
                  data={normalizedOptions}
                  keyExtractor={(item) => item.value}
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingBottom: insets.bottom + Spacing.xl,
                  }}
                  scrollEnabled={true}
                  nestedScrollEnabled={true}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleSelect(item.value)}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            item.value === value
                              ? theme.primaryLight
                              : "transparent",
                        },
                      ]}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: item.value === value }}
                    >
                      <ThemedText
                        style={[
                          styles.optionText,
                          item.value === value && {
                            color: theme.primary,
                            fontWeight: "600",
                          },
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                      {item.value === value ? (
                        <Feather name="check" size={18} color={theme.primary} />
                      ) : null}
                    </Pressable>
                  )}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
  },
  pickerText: {
    fontSize: 15,
    flex: 1,
  },
  error: {
    fontSize: 12,
  },
  keyboardAvoid: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: Platform.OS === "android" ? "75%" : "70%",
    minHeight: 200,
    elevation: Platform.OS === "android" ? 5 : 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
    minHeight: 48,
  },
  optionText: {
    fontSize: 15,
    flex: 1,
  },
});
