import { router } from "expo-router";
import { ImageBackground, Linking, Pressable, StyleSheet, View } from "react-native";

import { Icon, Screen, Text } from "@/components/primitives";
import { exploreFeatures, resortImages } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

const extraFeatures = [
  {
    id: "daycare",
    title: "Daycare",
    description: "Play. Socialize. Thrive.",
    imageUrl: "https://i0.wp.com/lechateaupetresort.com/wp-content/uploads/2025/09/dags.jpg?w=2048&ssl=1",
  },
  {
    id: "team",
    title: "Join Our Team",
    description: "Explore opportunities to care for pets like family.",
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

const featureLinks: Record<string, string> = {
  vip: "https://lechateaupetresort.com/services/",
  spa: "https://lechateaupetresort.com/services/spa",
  daycare: "https://lechateaupetresort.com/services/daycare",
  team: "https://lechateaupetresort.com/careers/",
  why: "https://lechateaupetresort.com/what-makes-us-different/",
};

export function ExploreScreen() {
  const items = [...exploreFeatures, ...extraFeatures];

  return (
    <Screen>
      <ScreenHeader title="Explore the Resort" />
      <View style={styles.featureList}>
        {items.map((feature) => (
          <Pressable
            key={feature.id}
            accessibilityRole="button"
            onPress={() => {
              if (feature.id === "cat-resort") {
                router.push({ pathname: "/live-cameras", params: { reset: Date.now() } });
                return;
              }

              const link = featureLinks[feature.id];

              if (link) {
                void Linking.openURL(link);
              }
            }}
            style={({ pressed }) => [styles.featureCard, pressed && styles.pressedCard]}
          >
            <ImageBackground
              source={{ uri: feature.imageUrl }}
              imageStyle={styles.featureImage}
              resizeMode="cover"
              style={styles.featureImageFrame}
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
          </Pressable>
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
  featureImageFrame: {
    flex: 1,
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
  pressedCard: {
    opacity: 0.86,
  },
});
