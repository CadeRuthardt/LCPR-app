import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { Text } from "@/components/primitives";
import { clearAppSessionData, preloadAppSessionData } from "@/services/app-preload";
import { colors, spacing } from "@/theme";
import { useSession } from "@/utils/session";

const logo = require("../../assets/logo.png");
const minimumWarmupMs = 900;

type AppBootstrapProviderProps = React.PropsWithChildren;

export function AppBootstrapProvider({ children }: AppBootstrapProviderProps) {
  const { isSignedIn, user } = useSession();
  const [warmedUserId, setWarmedUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSignedIn || !user?.id) {
      clearAppSessionData();
      setWarmedUserId(null);
      return;
    }

    if (warmedUserId === user.id) {
      return;
    }

    let isMounted = true;
    const warmup = preloadAppSessionData(user.id);

    Promise.all([
      wait(minimumWarmupMs),
      warmup,
    ])
      .catch(() => {
        // Individual screens still show their own refresh state if warmup fails.
      })
      .finally(() => {
        if (isMounted) {
          setWarmedUserId(user.id);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, user?.id, warmedUserId]);

  if (isSignedIn && user?.id && warmedUserId !== user.id) {
    return <AppBootstrapScreen />;
  }

  return <>{children}</>;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function AppBootstrapScreen() {
  return (
    <>
      <StatusBar animated style="light" />
      <View style={styles.screen}>
        <Image source={logo} resizeMode="contain" style={styles.logo} />
        <View style={styles.copy}>
          <ActivityIndicator color={colors.goldenrod} />
          <Text variant="body" tone="inverse" style={styles.message}>
            Loading your resort details...
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  copy: {
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    height: 148,
    width: 240,
  },
  message: {
    textAlign: "center",
  },
  screen: {
    alignItems: "center",
    backgroundColor: colors.onyx,
    flex: 1,
    gap: spacing.xl,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
});
