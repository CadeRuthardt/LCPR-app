import * as React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { Text } from "@/components/primitives";
import { clearClientDashboardCache, preloadClientDashboardData } from "@/services/client-data";
import { colors, spacing } from "@/theme";
import { useSession } from "@/utils/session";

const logo = require("../../assets/logo.png");
const minimumWarmupMs = 900;
const maximumWarmupMs = 4200;

type AppBootstrapProviderProps = React.PropsWithChildren;

export function AppBootstrapProvider({ children }: AppBootstrapProviderProps) {
  const { isSignedIn, user } = useSession();
  const activeUserIdRef = React.useRef<string | null>(null);
  const [isWarming, setIsWarming] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn || !user?.id) {
      clearClientDashboardCache();
      activeUserIdRef.current = null;
      setIsWarming(false);
      return;
    }

    if (activeUserIdRef.current === user.id) {
      return;
    }

    let isMounted = true;
    const warmup = preloadClientDashboardData();

    activeUserIdRef.current = user.id;
    setIsWarming(true);

    Promise.all([
      wait(minimumWarmupMs),
      Promise.race([warmup, wait(maximumWarmupMs)]),
    ])
      .catch(() => {
        // Individual screens still show their own refresh state if warmup fails.
      })
      .finally(() => {
        if (isMounted) {
          setIsWarming(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, user?.id]);

  if (isWarming) {
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
            Preparing your resort details...
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
