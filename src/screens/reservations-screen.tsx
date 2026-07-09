import { Image, StyleSheet, View } from "react-native";

import { ReservationCard } from "@/components/composites";
import { Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import { pets, reservations, upcomingReservation } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

export function ReservationsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Reservations" />
      <View style={styles.segmented}>
        {["Upcoming", "Past", "Canceled"].map((segment, index) => (
          <View key={segment} style={[styles.segment, index === 0 && styles.segmentActive]}>
            <Text variant="caption" tone={index === 0 ? "inverse" : "secondary"}>
              {segment}
            </Text>
          </View>
        ))}
      </View>

      <Card variant="elevated" style={styles.reservationDetailsCard}>
        <View style={styles.petRow}>
          <Image source={{ uri: pets[0].imageUrl }} style={styles.petAvatar} />
          <View style={styles.petRowCopy}>
            <Text variant="title">{upcomingReservation.dateRange}</Text>
            <Text variant="caption" tone="secondary">
              {upcomingReservation.nights}
            </Text>
            <Text variant="caption" tone="muted">
              Confirmation pending
            </Text>
          </View>
          <Icon color={colors.warmGray} name="chevron-right" size={20} />
        </View>
        <View style={styles.progressRow}>
          {["Requested", "Confirmed", "Pre-Arrival", "During Reservation"].map((step, index) => (
            <View key={step} style={styles.progressStep}>
              <View style={[styles.progressDot, index < 2 && styles.progressDotDone]}>
                {index < 2 ? <Icon color={colors.ivory} name="check" size={15} /> : null}
              </View>
              <Text variant="caption" tone="muted" style={styles.progressLabel}>
                {step}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.bringRow}>
          <View style={styles.bringIcon}>
            <Icon color={colors.blackCherry} name="calendar" size={20} />
          </View>
          <View style={styles.bringCopy}>
            <Text variant="title">What to Bring</Text>
            <Text variant="caption" tone="secondary">
              Food, medications, toys, and more.
            </Text>
          </View>
          <Icon color={colors.warmGray} name="chevron-right" size={20} />
        </View>
        <Button icon="sparkles" title="Reservation Details" />
      </Card>

      <Section title="Upcoming Requests">
        <ReservationCard reservation={reservations[1]} />
      </Section>
      <Section title="Past Reservations">
        <ReservationCard reservation={reservations[2]} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bringCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  bringIcon: {
    alignItems: "center",
    backgroundColor: colors.blush,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  bringRow: {
    alignItems: "center",
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  petAvatar: {
    borderRadius: 28,
    height: 56,
    width: 56,
  },
  petRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  petRowCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  progressDot: {
    alignItems: "center",
    backgroundColor: colors.porcelain,
    borderColor: colors.mutedGold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  progressDotDone: {
    backgroundColor: colors.mutedGold,
  },
  progressLabel: {
    textAlign: "center",
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
  reservationDetailsCard: {
    gap: spacing.lg,
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
  segmented: {
    backgroundColor: colors.parchment,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
});
