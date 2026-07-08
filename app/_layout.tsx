import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from "@expo-google-fonts/playfair-display";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Tabs, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { StatusBarStyle } from "expo-status-bar";

import { colors, fonts, shadows, spacing } from "@/theme";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { LoginScreen } from "@/screens";
import { MockSessionProvider, useMockSession } from "@/utils/mock-session";

const tabs = [
  { name: "index", title: "Home", icon: "home" },
  { name: "pets", title: "Pets", icon: "paw" },
  { name: "stays", title: "Reservations", icon: "calendar" },
  { name: "explore", title: "Explore", icon: "compass" },
  { name: "profile", title: "Profile", icon: "user" },
] as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <MockSessionProvider>
      <AuthGate />
    </MockSessionProvider>
  );
}

function AuthGate() {
  const { isSignedIn } = useMockSession();
  const segments = useSegments();
  const activeRoute = segments[0] ?? "index";
  const statusBarStyle: StatusBarStyle =
    !isSignedIn || activeRoute === "index" ? "light" : "dark";

  if (!isSignedIn) {
    return (
      <>
        <StatusBar animated style={statusBarStyle} />
        <LoginScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar animated style={statusBarStyle} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.goldenrod,
          tabBarInactiveTintColor: colors.ivory,
          tabBarLabelStyle: {
            fontFamily: fonts.bodySemiBold,
            fontSize: 11,
            lineHeight: 16,
          },
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 78,
            paddingTop: spacing.xs,
            paddingBottom: spacing.md,
            borderTopWidth: 0,
            backgroundColor: colors.onyx,
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
              tabBarIcon: ({ color, focused }) => (
                <TabIcon color={color} focused={focused} name={tab.icon as IconName} />
              ),
            }}
          />
        ))}
        <Tabs.Screen
          name="request-stay"
          options={{
            href: null,
            title: "Request a Reservation",
          }}
        />
      </Tabs>
    </>
  );
}

function TabIcon({
  color,
  name,
}: {
  color: string;
  focused: boolean;
  name: IconName;
}) {
  return <Icon color={color} name={name} size={21} />;
}
