import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import DataManagementScreen from "@/screens/DataManagementScreen";
import IDCardScreen from "@/screens/IDCardScreen";
import VerifyIDScreen from "@/screens/VerifyIDScreen";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import MinistryStatisticsScreen from "@/screens/MinistryStatisticsScreen";
import { useTheme } from "@/hooks/useTheme";
import { HeaderTitle } from "@/components/HeaderTitle";

export type MinistryTabParamList = {
  HomeTab: undefined;
  DataTab: undefined;
  IDCardTab: undefined;
  VerifyTab: undefined;
  StatisticsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MinistryTabParamList>();

export default function MinistryTabNavigator() {
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
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          headerTitle: () => <HeaderTitle title="Ministry Dashboard" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DataTab"
        component={DataManagementScreen}
        options={{
          title: "Data",
          headerTitle: "Submissions",
          tabBarIcon: ({ color, size }) => (
            <Feather name="database" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="IDCardTab"
        component={IDCardScreen}
        options={{
          title: "ID Card",
          headerTitle: "ID Card Generator",
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
        name="StatisticsTab"
        component={MinistryStatisticsScreen}
        options={{
          title: "Stats",
          headerTitle: "System Statistics",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
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
