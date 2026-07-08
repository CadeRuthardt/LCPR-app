import { Image, ImageBackground, StyleSheet, View } from "react-native";

import { FeatureCard, InfoCard } from "@/components/composites";
import { Button, Card, Screen, Section, Text } from "@/components/primitives";
import { exploreFeatures, guest, pets, resortImages } from "@/data/mock-data";
import { colors, spacing } from "@/theme";

export function HomeScreen() {
  const featuredPet = pets[0];

  return (
    <Screen contentStyle={styles.content}>
      <ImageBackground
        source={{ uri: resortImages.homeHero }}
        imageStyle={styles.homeHeroImage}
        resizeMode="cover"
        style={styles.homeHero}
      >
        <View style={styles.homeHeroOverlay}>
          <View style={styles.homeTopBar}>
            <View>
              <Text variant="caption" tone="accent" style={styles.logoCrown}>
                LE CHATEAU
              </Text>
              <Text variant="label" tone="inverse" style={styles.logoSubline}>
                PET RESORT
              </Text>
            </View>
            <View style={styles.notificationDot} />
          </View>
          <View style={styles.heroGreeting}>
            <Text variant="title" tone="inverse">
              Good morning,
            </Text>
            <Text variant="display" tone="inverse">
              {guest.firstName}
            </Text>
            <Text variant="caption" tone="inverse">
              {guest.welcomeNote}
            </Text>
          </View>
        </View>
      </ImageBackground>

      <Card variant="elevated" style={styles.upcomingCard}>
        <View style={styles.cardHeaderRow}>
          <Text variant="label" tone="muted" style={styles.eyebrow}>
            Upcoming Stay
          </Text>
          <Text variant="title" tone="muted">
            {">"}
          </Text>
        </View>
        <View style={styles.petRow}>
          <Image source={{ uri: featuredPet.imageUrl }} style={styles.petAvatar} />
          <View style={styles.petRowCopy}>
            <Text variant="title">{featuredPet.name}</Text>
            <Text variant="caption" tone="muted">
              {featuredPet.breed}
            </Text>
          </View>
          <Text variant="title" tone="muted">
            {">"}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text variant="caption" tone="secondary">
            May 24 - May 28
          </Text>
          <Text variant="caption" tone="secondary">
            4 nights
          </Text>
        </View>
        <Button title="Request a Stay" />
      </Card>

      <Section
        title="Explore Le Chateau"
        action={
          <Text variant="caption" tone="accent">
            View all
          </Text>
        }
      >
        <View style={styles.explorePreviewRow}>
          {exploreFeatures.map((feature) => (
            <View key={feature.id} style={styles.previewTile}>
              <Image source={{ uri: feature.imageUrl }} style={styles.previewImage} />
              <Text variant="caption" tone="muted" style={styles.previewLabel}>
                {feature.title}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <InfoCard
        label="Reminder"
        title="Vaccination Reminder"
        body="Bella's Bordetella vaccine is due before her next stay."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  homeHero: {
    borderRadius: 30,
    height: 420,
    overflow: "hidden",
  },
  homeHeroImage: {
    borderRadius: 30,
  },
  homeHeroOverlay: {
    backgroundColor: colors.overlayDeep,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
  },
  homeTopBar: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
  },
  logoCrown: {
    letterSpacing: 1.6,
  },
  logoSubline: {
    letterSpacing: 2.8,
  },
  notificationDot: {
    backgroundColor: colors.goldenrod,
    borderColor: colors.ivory,
    borderRadius: 999,
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  heroGreeting: {
    gap: spacing.xs,
  },
  upcomingCard: {
    gap: spacing.md,
    marginTop: -86,
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    textTransform: "uppercase",
  },
  petRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  petAvatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  petRowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  explorePreviewRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  previewTile: {
    flex: 1,
    gap: spacing.xs,
  },
  previewImage: {
    aspectRatio: 1,
    borderRadius: 16,
  },
  previewLabel: {
    textAlign: "center",
  },
});
