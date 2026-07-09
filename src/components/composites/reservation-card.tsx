import { StyleSheet, View } from "react-native";

import { colors, spacing } from "../../theme";
import type { Reservation } from "../../types/app";
import { Badge, Button, Card, Icon, Text } from "../primitives";

type ReservationCardProps = {
  featured?: boolean;
  reservation: Reservation;
};

export function ReservationCard({ featured = false, reservation }: ReservationCardProps) {
  const textTone = featured ? "inverse" : "primary";
  const supportTone = featured ? "inverse" : "muted";

  return (
    <Card variant={featured ? "featured" : "default"} style={styles.card}>
      <View style={styles.header}>
        <Badge label={reservation.status} tone={featured ? "success" : "accent"} />
        <Text variant="caption" tone={supportTone}>
          {reservation.dateRange}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text variant="heading" tone={textTone}>
          {reservation.petName}'s reservation
        </Text>
        <Text variant="body" tone={supportTone}>
          {reservation.experience} · {reservation.nights}
        </Text>
      </View>
      {featured ? (
        <Button icon="calendar" title="View Reservation Details" variant="secondary" />
      ) : (
        <View style={styles.footer}>
          <Text variant="caption" tone="muted">
            View reservation
          </Text>
          <Icon color={colors.warmGray} name="chevron-right" size={18} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
