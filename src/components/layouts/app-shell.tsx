import { useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { FeatureCard, InfoCard, PetCard, StayCard } from "../composites";
import { Badge, Button, Card, Screen, Section, Text } from "../primitives";
import { colors, radius, shadows, spacing } from "../../theme";
import {
  exploreFeatures,
  guest,
  pets,
  resortImages,
  stays,
  upcomingStay,
} from "../../data/mock-data";
import type { TabKey } from "../../types/app";

const tabs: Array<{ key: TabKey; label: string; mark: string }> = [
  { key: "home", label: "Home", mark: "H" },
  { key: "pets", label: "Pets", mark: "P" },
  { key: "stays", label: "Stays", mark: "S" },
  { key: "explore", label: "Explore", mark: "E" },
  { key: "profile", label: "Profile", mark: "M" },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const content = useMemo(() => renderTab(activeTab), [activeTab]);

  return (
    <View style={styles.safeArea}>
      <StatusBar style={activeTab === "home" || activeTab === "profile" ? "light" : "dark"} />
      <View style={styles.app}>
        {content}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const selected = tab.key === activeTab;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tab}
              >
                <Text
                  variant="title"
                  tone={selected ? "accent" : "inverse"}
                  style={styles.tabMarkText}
                >
                  {tab.mark}
                </Text>
                <Text variant="caption" tone={selected ? "accent" : "inverse"}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function renderTab(tab: TabKey) {
  switch (tab) {
    case "pets":
      return <PetsScreen />;
    case "stays":
      return <StaysScreen />;
    case "explore":
      return <ExploreScreen />;
    case "profile":
      return <ProfileScreen />;
    case "home":
    default:
      return <HomeScreen />;
  }
}

function HomeScreen() {
  const featuredPet = pets[0];

  return (
    <Screen contentStyle={styles.homeContent}>
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

function PetsScreen() {
  return (
    <Screen>
      <ScreenHeader title="My Pets" />
      <View style={styles.addButton}>
        <Text variant="heading" tone="inverse">
          +
        </Text>
      </View>
      <Section>
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
        <Card style={styles.addPetCard}>
          <Text variant="display" tone="muted">
            +
          </Text>
          <Text variant="title">Add a Pet</Text>
          <Text variant="caption" tone="secondary">
            Add a new furry family member
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

function StaysScreen() {
  return (
    <Screen>
      <ScreenHeader title="Stays" />
      <View style={styles.segmented}>
        <View style={[styles.segment, styles.segmentActive]}>
          <Text variant="caption" tone="inverse">
            Upcoming
          </Text>
        </View>
        <View style={styles.segment}>
          <Text variant="caption" tone="secondary">
            Past
          </Text>
        </View>
        <View style={styles.segment}>
          <Text variant="caption" tone="secondary">
            Canceled
          </Text>
        </View>
      </View>

      <Card variant="elevated" style={styles.stayDetailsCard}>
        <View style={styles.petRow}>
          <Image source={{ uri: pets[0].imageUrl }} style={styles.petAvatar} />
          <View style={styles.petRowCopy}>
            <Text variant="title">{upcomingStay.dateRange}</Text>
            <Text variant="caption" tone="secondary">
              4 nights
            </Text>
            <Text variant="caption" tone="muted">
              Confirmation pending
            </Text>
          </View>
          <Text variant="title" tone="muted">
            {">"}
          </Text>
        </View>
        <View style={styles.progressRow}>
          {["Requested", "Confirmed", "Pre-Arrival", "During Stay"].map((step, index) => (
            <View key={step} style={styles.progressStep}>
              <View style={[styles.progressDot, index < 2 && styles.progressDotDone]} />
              <Text variant="caption" tone="muted" style={styles.progressLabel}>
                {step}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.bringRow}>
          <Badge label="What to Bring" tone="attention" />
          <Text variant="caption" tone="secondary">
            Food, medications, toys, and more.
          </Text>
        </View>
        <Button title="Stay Details" />
      </Card>

      <Section title="Upcoming Requests">
        <StayCard stay={stays[1]} />
      </Section>
      <Section title="Past Stays">
        <StayCard stay={stays[2]} />
      </Section>
    </Screen>
  );
}

function ExploreScreen() {
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

function ProfileScreen() {
  return (
    <Screen contentStyle={styles.profileContent}>
      <View style={styles.profileHero}>
        <Text variant="display" tone="accent" style={styles.profileMonogram}>
          SC
        </Text>
        <Text variant="heading" tone="inverse">
          {guest.firstName} {guest.lastName}
        </Text>
        <Text variant="caption" tone="inverse">
          {guest.email}
        </Text>
      </View>
      <Section title="Account">
        {["Personal Information", "Payment Methods", "Notifications", "Privacy & Security"].map(
          (item) => (
            <ProfileRow key={item} label={item} />
          ),
        )}
      </Section>
      <Section title="Support">
        {["Help Center", "Contact Us", "About Le Chateau"].map((item) => (
          <ProfileRow key={item} label={item} />
        ))}
      </Section>
      <Button title="Log Out" variant="secondary" />
    </Screen>
  );
}

function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.screenTitleRow}>
      <Text variant="heading">{title}</Text>
    </View>
  );
}

function ProfileRow({ label }: { label: string }) {
  return (
    <View style={styles.profileRow}>
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      <Text variant="title" tone="muted">
        {">"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.ivory,
    flex: 1,
  },
  app: {
    flex: 1,
  },
  homeContent: {
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
    borderRadius: radius.pill,
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
    borderRadius: radius.md,
  },
  previewLabel: {
    textAlign: "center",
  },
  addButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.mutedGold,
    borderRadius: radius.pill,
    height: 50,
    justifyContent: "center",
    marginTop: -64,
    width: 50,
  },
  addPetCard: {
    alignItems: "center",
    borderStyle: "dashed",
    gap: spacing.xs,
  },
  segmented: {
    backgroundColor: colors.parchment,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.md,
  },
  segmentActive: {
    backgroundColor: colors.blackCherry,
  },
  stayDetailsCard: {
    gap: spacing.lg,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  progressDot: {
    backgroundColor: colors.porcelain,
    borderColor: colors.mutedGold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 28,
    width: 28,
  },
  progressDotDone: {
    backgroundColor: colors.mutedGold,
  },
  progressLabel: {
    textAlign: "center",
  },
  bringRow: {
    gap: spacing.xs,
  },
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
    justifyContent: "flex-end",
    gap: spacing.xs,
    padding: spacing.lg,
  },
  profileContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.burgundyDeep,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.display,
  },
  profileMonogram: {
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 104,
    lineHeight: 98,
    overflow: "hidden",
    textAlign: "center",
    width: 104,
  },
  profileRow: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  screenTitleRow: {
    paddingTop: spacing.xl,
  },
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.overlayBurgundy,
    borderRadius: radius.xl,
    bottom: spacing.md,
    flexDirection: "row",
    gap: spacing.xs,
    left: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: spacing.md,
    ...shadows.elevated,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xxs,
    minHeight: 58,
    justifyContent: "center",
  },
  tabMarkText: {
    textAlign: "center",
  },
});
