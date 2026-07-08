import { Image, StyleSheet, View } from "react-native";

import { StayCard } from "@/components/composites";
import { Badge, Button, Card, Screen, Section, Text } from "@/components/primitives";
import { pets, stays, upcomingStay } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

export function StaysScreen() {
  return (
    <Screen>
      <ScreenHeader title="Stays" />
      <View style={styles.segmented}>
        {["Upcoming", "Past", "Canceled"].map((segment, index) => (
          <View key={segment} style={[styles.segment, index === 0 && styles.segmentActive]}>
            <Text variant="caption" tone={index === 0 ? "inverse" : "secondary"}>
              {segment}
            </Text>
          </View>
        ))}
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

const styles = StyleSheet.create({
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
});
