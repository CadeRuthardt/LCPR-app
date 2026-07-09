import { router } from "expo-router";
import * as React from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Text } from "@/components/primitives";
import { guest, resortImages } from "@/data/mock-data";
import { colors, fonts, radius, spacing } from "@/theme";
import { getTimeOfDayGreeting } from "@/utils/greeting";

const logo = require("../../assets/logo.png");
const heroImageUrl =
  "https://i0.wp.com/lechateaupetresort.com/wp-content/uploads/2025/09/dogs-in-yard.jpg?resize=1024%2C768&ssl=1";
const releaseToRefreshThreshold = -132;

export function HomeScreen() {
  const greeting = getTimeOfDayGreeting();
  const insets = useSafeAreaInsets();
  const [showRefreshPrompt, setShowRefreshPrompt] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    setShowRefreshPrompt(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setShowRefreshPrompt(false);
    }, 500);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = event.nativeEvent.contentOffset.y;

    setShowRefreshPrompt(offsetY <= releaseToRefreshThreshold || isRefreshing);
  }

  return (
    <Screen
      backgroundColor={colors.onyx}
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      onScroll={handleScroll}
      onRefresh={handleRefresh}
      refreshing={isRefreshing}
      topSafeArea={false}
    >
      <View style={styles.refreshPromptSlot}>
        {showRefreshPrompt ? (
          <View style={styles.refreshPrompt}>
            <Icon color={colors.goldenrod} name="refresh" size={16} />
          </View>
        ) : null}
      </View>

      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} />
      </View>

      <ImageBackground
        source={{ uri: heroImageUrl }}
        imageStyle={styles.heroImage}
        resizeMode="cover"
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroCopy}>
            <Text variant="body" tone="inverse">
              {greeting},
            </Text>
            <View style={styles.nameRow}>
              <Text variant="hero" tone="inverse">
                {guest.firstName}.
              </Text>
              <Icon color={colors.goldenrod} name="paw" size={28} />
            </View>
            <Text variant="title" tone="inverse">
              Ready for their next getaway?
            </Text>
          </View>

          <View style={styles.requestPanel}>
            <View style={styles.requestIcon}>
              <Icon color={colors.goldenrod} name="calendar" size={22} />
            </View>
            <View style={styles.requestPanelCopy}>
              <Text variant="title" tone="inverse">
                No reservations booked yet
              </Text>
              <Text variant="caption" tone="inverse">
                Request a luxury boarding, daycare, or spa reservation when your pet is ready.
              </Text>
              <Button
                icon="chevron-right"
                onPress={() => router.push("/request-reservation")}
                title="Request a Reservation"
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.liveCard}>
        <View style={styles.liveCopy}>
          <Text variant="title" tone="inverse">
            Live Cameras
          </Text>
          <Text variant="caption" tone="inverse">
            See what's happening around the resort.
          </Text>
          <Text variant="caption" tone="accent" style={styles.watchNow}>
            Watch Now
          </Text>
        </View>
        <ImageBackground
          source={{ uri: resortImages.playYard }}
          imageStyle={styles.liveImage}
          resizeMode="cover"
          style={styles.livePreview}
        >
        </ImageBackground>
      </View>

      <ImageBackground
        source={{ uri: resortImages.suite }}
        imageStyle={styles.promoImage}
        resizeMode="cover"
        style={styles.promoCard}
      >
        <View style={styles.promoOverlay}>
          <Text variant="title" tone="inverse">
            Summer Spa Special
          </Text>
          <Text variant="caption" tone="inverse">
            15% off spa services this July.
          </Text>
          <Text variant="caption" tone="accent" style={styles.watchNow}>
            Explore Spa
          </Text>
        </View>
      </ImageBackground>

    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.onyx,
    gap: spacing.md,
    paddingBottom: 88,
    paddingHorizontal: spacing.md,
  },
  logoImage: {
    height: 106,
    resizeMode: "contain",
    width: 190,
  },
  logoWrap: {
    alignItems: "center",
    paddingBottom: 0,
  },
  hero: {
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 440,
    overflow: "hidden",
  },
  heroImage: {
    borderRadius: radius.xl,
  },
  heroOverlay: {
    backgroundColor: colors.overlayHero,
    flex: 1,
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroCopy: {
    gap: spacing.xxs,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  requestPanel: {
    alignItems: "flex-start",
    backgroundColor: colors.overlayBurgundy,
    borderColor: colors.goldenrod,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  requestIcon: {
    alignItems: "center",
    backgroundColor: colors.burgundyDeep,
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  requestPanelCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  refreshPrompt: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 24,
  },
  refreshPromptSlot: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
  },
  liveCard: {
    backgroundColor: colors.richMahogany,
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 118,
    overflow: "hidden",
  },
  liveCopy: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    padding: spacing.md,
  },
  livePreview: {
    flex: 1.15,
  },
  liveImage: {
    borderBottomRightRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  watchNow: {
    fontFamily: fonts.bodyBold,
  },
  promoCard: {
    borderRadius: radius.lg,
    minHeight: 118,
    overflow: "hidden",
  },
  promoImage: {
    borderRadius: radius.lg,
  },
  promoOverlay: {
    backgroundColor: colors.overlayBurgundy,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    padding: spacing.md,
  },
});
