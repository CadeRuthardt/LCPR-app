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
import { Linking, View } from "react-native";

import { colors, fonts, shadows, spacing } from "@/theme";
import { Button, Icon, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { LoginScreen } from "@/screens";
import { AppBootstrapProvider } from "@/utils/app-bootstrap";
import { SessionProvider, useSession } from "@/utils/session";

const tabs = [
  { name: "index", title: "Home", icon: "home" },
  { name: "pets", title: "Pets", icon: "paw" },
  { name: "reservations", title: "Reservations", icon: "calendar" },
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
    <SessionProvider>
      <AppBootstrapProvider>
        <AuthGate />
      </AppBootstrapProvider>
    </SessionProvider>
  );
}

function AuthGate() {
  const { client, isLoading, isSignedIn, signOut } = useSession();
  const segments = useSegments();
  const activeRoute = segments[0] ?? "index";
  const statusBarStyle: StatusBarStyle =
    !isSignedIn || activeRoute === "index" || activeRoute === "profile" || activeRoute === "pet-profile"
      ? "light"
      : "dark";

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
  const supportEmailUrl =
    "mailto:support@lechateaupetresort.com?subject=App%20Support%20Request";
  const defaultMessage =
    "Please use the email we have on file, or contact support if the problem continues.";

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
      <Button onPress={onSignOut} title="Use a Different Email" variant="secondary" />
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
}: {
  color: string;
  focused: boolean;
  name: IconName;
}) {
  return <Icon color={color} name={name} size={21} />;
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
