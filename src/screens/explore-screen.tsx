import { ImageBackground, StyleSheet, View } from "react-native";

import { FeatureCard } from "@/components/composites";
import { Screen, Section, Text } from "@/components/primitives";
import { exploreFeatures, resortImages } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

export function ExploreScreen() {
  return (
    <Screen>
      <ScreenHeader title="Explore Le Chateau" />
      <ImageBackground
        source={{ uri: exploreFeatures[0].imageUrl }}
        imageStyle={styles.exploreHeroImage}
        resizeMode="cover"
        style={styles.exploreHero}
      >
        <View style={styles.exploreHeroOverlay}>
          <Text variant="title" tone="inverse">
            Our Resort
          </Text>
          <Text variant="caption" tone="inverse">
            Take a tour of our five-star resort.
          </Text>
        </View>
      </ImageBackground>
      <Section>
        {exploreFeatures.slice(1).map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
        <FeatureCard
          feature={{
            id: "photo-gallery",
            title: "Photo Gallery",
            description: "See our happy guests having the best time.",
            label: "Gallery",
            imageUrl: resortImages.stayHero,
          }}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  exploreHero: {
    borderRadius: radius.xl,
    height: 190,
    overflow: "hidden",
  },
  exploreHeroImage: {
    borderRadius: radius.xl,
  },
  exploreHeroOverlay: {
    backgroundColor: colors.overlayDark,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
});
