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
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { StatusBarStyle } from "expo-status-bar";
import { Alert, Linking, View } from "react-native";
import * as React from "react";

import { colors, fonts, layout, shadows, spacing } from "@/theme";
import { Button, Icon, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { LoginScreen } from "@/screens";
import { AppBootstrapProvider } from "@/utils/app-bootstrap";
import { SessionProvider, useSession } from "@/utils/session";

const tabs = [
  { name: "index", title: "Home", icon: "home" },
  { name: "reservations", title: "Reservations", icon: "calendar" },
  { name: "pets", title: "Pets", icon: "paw" },
  { name: "profile", title: "Account", icon: "user" },
  { name: "explore", title: "More", icon: "menu" },
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
    <SessionProvider>
      <AppBootstrapProvider>
        <AuthGate />
      </AppBootstrapProvider>
    </SessionProvider>
  );
}

function AuthGate() {
  const { client, isLoading, isSignedIn, signOut } = useSession();
  const statusBarStyle: StatusBarStyle = !isSignedIn ? "light" : "dark";

  if (isLoading) {
    return (
      <>
        <StatusBar animated style="light" />
        <LoadingScreen />
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <StatusBar animated style={statusBarStyle} />
        <LoginScreen />
      </>
    );
  }

  if (!client) {
    return (
      <>
        <StatusBar animated style="dark" />
        <AccessPendingScreen onSignOut={signOut} />
      </>
    );
  }

  return (
    <>
      <StatusBar animated style={statusBarStyle} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.burgundy,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: {
            fontFamily: fonts.bodySemiBold,
            fontSize: 10,
            lineHeight: 14,
          },
          tabBarStyle: {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: layout.tabBarHeight,
            paddingTop: spacing.xs,
            paddingBottom: spacing.md,
            borderTopColor: colors.divider,
            borderTopWidth: 1,
            backgroundColor: colors.surface,
            ...shadows.card,
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
          name="live-cameras"
          options={{
            href: null,
            title: "Live Cameras",
          }}
        />
        <Tabs.Screen
          name="request-reservation"
          options={{
            href: null,
            title: "Request a Reservation",
          }}
        />
        <Tabs.Screen
          name="document-upload"
          options={{
            href: null,
            title: "Upload Documents",
          }}
        />
        <Tabs.Screen
          name="pet-profile"
          options={{
            href: null,
            title: "Pet Profile",
          }}
        />
        <Tabs.Screen
          name="reservation-detail"
          options={{
            href: null,
            title: "Reservation Details",
          }}
        />
      </Tabs>
    </>
  );
}

function AccessPendingScreen({
  onSignOut,
}: {
  onSignOut: () => Promise<void>;
}) {
  const [isSwitchingAccount, setIsSwitchingAccount] = React.useState(false);
  const supportEmailUrl =
    "mailto:support@lechateaupetresort.com?subject=App%20Support%20Request";
  const defaultMessage =
    "Please use the email we have on file, or contact support if the problem continues.";

  async function handleSwitchAccount() {
    if (isSwitchingAccount) {
      return;
    }

    setIsSwitchingAccount(true);

    try {
      await onSignOut();
    } catch {
      Alert.alert(
        "Unable to switch accounts",
        "We couldn't clear this login. Check your connection and try again.",
      );
      setIsSwitchingAccount(false);
    }
  }

  return (
    <View
      style={{
        alignItems: "stretch",
        backgroundColor: colors.ivory,
        flex: 1,
        gap: spacing.lg,
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
      }}
    >
      <Text style={{ textAlign: "center" }} variant="heading">
        We couldn't verify your account.
      </Text>
      <Text style={{ textAlign: "center" }} tone="secondary" variant="body">
        {defaultMessage}
      </Text>
      <Button
        disabled={isSwitchingAccount}
        onPress={() => void handleSwitchAccount()}
        title={isSwitchingAccount ? "Switching…" : "Use a Different Email"}
        variant="secondary"
      />
      <Button
        onPress={() => {
          void Linking.openURL(supportEmailUrl);
        }}
        title="Contact Support"
        variant="ghost"
      />
    </View>
  );
}

function TabIcon({
  color,
  name,
  focused,
}: {
  color: string;
  focused: boolean;
  name: IconName;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Icon color={color} name={name} size={26} />
      <View style={{ backgroundColor: focused ? colors.burgundy : "transparent", borderRadius: 2, height: 2, width: 30 }} />
    </View>
  );
}

function LoadingScreen() {
  return (
    <Text
      tone="inverse"
      variant="body"
      style={{
        backgroundColor: colors.onyx,
        flex: 1,
        paddingTop: spacing.display,
        textAlign: "center",
      }}
    >
      Preparing your stay...
    </Text>
  );
}
