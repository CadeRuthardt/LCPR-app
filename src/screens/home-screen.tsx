import { router } from "expo-router";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Text } from "@/components/primitives";
import { guest, pets, resortImages } from "@/data/mock-data";
import { colors, fonts, radius, spacing } from "@/theme";
import { getTimeOfDayGreeting } from "@/utils/greeting";

const logo = require("../../assets/logo.png");
const premiumHall = require("../../assets/premium-hall.png");

export function HomeScreen() {
  const featuredPet = pets[0];
  const greeting = getTimeOfDayGreeting();
  const insets = useSafeAreaInsets();

  return (
    <Screen
      backgroundColor={colors.onyx}
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      topSafeArea={false}
    >
      <ImageBackground
        source={premiumHall}
        imageStyle={styles.heroImage}
        resizeMode="cover"
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.topBar}>
            <Image source={logo} style={styles.logoImage} />
          </View>

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
                onPress={() => router.push("/request-stay")}
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
    paddingHorizontal: spacing.md,
  },
  hero: {
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 520,
    overflow: "hidden",
  },
  heroImage: {
    borderRadius: radius.xl,
  },
  heroOverlay: {
    backgroundColor: colors.overlayDeep,
    flex: 1,
    gap: spacing.lg,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  topBar: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    height: 82,
    resizeMode: "contain",
    width: 126,
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
