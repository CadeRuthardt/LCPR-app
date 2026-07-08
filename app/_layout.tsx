import { Tabs } from "expo-router";

import { colors, radius, shadows, spacing } from "@/theme";
import { Text } from "@/components/primitives";

const tabs = [
  { name: "index", title: "Home", mark: "H" },
  { name: "pets", title: "Pets", mark: "P" },
  { name: "stays", title: "Stays", mark: "S" },
  { name: "explore", title: "Explore", mark: "E" },
  { name: "profile", title: "Profile", mark: "M" },
] as const;

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.goldenrod,
        tabBarInactiveTintColor: colors.ivory,
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "400",
        },
        tabBarStyle: {
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.md,
          height: 78,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderTopWidth: 0,
          borderRadius: radius.xl,
          backgroundColor: colors.overlayBurgundy,
          ...shadows.elevated,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Text variant="title" style={{ color, textAlign: "center" }}>
                {tab.mark}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
