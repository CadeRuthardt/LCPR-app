import { ImageBackground, StyleSheet, View } from "react-native";

import { Icon, Screen, Text } from "@/components/primitives";
import { exploreFeatures, resortImages } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

const extraFeatures = [
  {
    id: "daycare",
    title: "Daycare",
    description: "Play. Socialize. Thrive.",
    imageUrl: resortImages.playYard,
  },
  {
    id: "team",
    title: "Meet Our Team",
    description: "The people who treat your pets like family.",
    imageUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "why",
    title: "Why Le Chateau",
    description: "Our story, values, and difference.",
    imageUrl: resortImages.homeHero,
  },
] as const;

export function ExploreScreen() {
  const items = [...exploreFeatures, ...extraFeatures];

  return (
    <Screen>
      <ScreenHeader title="Explore the Resort" />
      <View style={styles.featureList}>
        {items.map((feature) => (
          <ImageBackground
            key={feature.id}
            source={{ uri: feature.imageUrl }}
            imageStyle={styles.featureImage}
            resizeMode="cover"
            style={styles.featureCard}
          >
            <View style={styles.featureOverlay}>
              <View style={styles.featureCopy}>
                <Text variant="title" tone="inverse">
                  {feature.title}
                </Text>
                <Text variant="caption" tone="inverse">
                  {feature.description}
                </Text>
              </View>
              <Icon color={colors.goldenrod} name="chevron-right" size={18} />
            </View>
          </ImageBackground>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  featureList: {
    gap: spacing.md,
  },
  featureCard: {
    borderRadius: radius.lg,
    minHeight: 104,
    overflow: "hidden",
  },
  featureImage: {
    borderRadius: radius.lg,
  },
  featureOverlay: {
    alignItems: "center",
    backgroundColor: colors.overlayDeep,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  featureCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
