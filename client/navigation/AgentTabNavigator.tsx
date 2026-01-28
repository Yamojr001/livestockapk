import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import AgentDashboardScreen from "@/screens/AgentDashboardScreen";
import SubmissionFormScreen from "@/screens/SubmissionFormScreen";
import MySubmissionsScreen from "@/screens/MySubmissionsScreen";
import AgentIDCardScreen from "@/screens/AgentIDCardScreen";
import VerifyIDScreen from "@/screens/VerifyIDScreen";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { HeaderTitle } from "@/components/HeaderTitle";

export type AgentTabParamList = {
  HomeTab: undefined;
  SubmissionsTab: undefined;
  SubmitTab: undefined;
  IDCardTab: undefined;
  VerifyTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AgentTabParamList>();

export default function AgentTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerTitleAlign: "center",
        headerTintColor: theme.text,
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={AgentDashboardScreen}
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle title="Livestock Data System" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SubmissionsTab"
        component={MySubmissionsScreen}
        options={{
          title: "My Data",
          headerTitle: "My Submissions",
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SubmitTab"
        component={SubmissionFormScreen}
        options={{
          title: "Submit",
          headerTitle: "New Submission",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? theme.primary : theme.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather
                name="plus"
                size={24}
                color={focused ? "#fff" : theme.primary}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="IDCardTab"
        component={AgentIDCardScreen}
        options={{
          title: "ID Card",
          headerTitle: "Farmer ID Cards",
          tabBarIcon: ({ color, size }) => (
            <Feather name="credit-card" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="VerifyTab"
        component={VerifyIDScreen}
        options={{
          title: "Verify",
          headerTitle: "Verify Farmer ID",
          tabBarIcon: ({ color, size }) => (
            <Feather name="shield" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
