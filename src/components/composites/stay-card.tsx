import { StyleSheet, View } from "react-native";

import { Badge, Button, Card, Icon, Text } from "../primitives";
import { colors } from "../../theme";
import { spacing } from "../../theme";
import type { Stay } from "../../types/app";

type StayCardProps = {
  stay: Stay;
  featured?: boolean;
};

export function StayCard({ featured = false, stay }: StayCardProps) {
  const textTone = featured ? "inverse" : "primary";
  const supportTone = featured ? "inverse" : "muted";

  return (
    <Card variant={featured ? "featured" : "default"} style={styles.card}>
      <View style={styles.header}>
        <Badge label={stay.status} tone={featured ? "success" : "accent"} />
        <Text variant="caption" tone={supportTone}>
          {stay.dateRange}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text variant="heading" tone={textTone}>
          {stay.petName}'s reservation
        </Text>
        <Text variant="body" tone={supportTone}>
          {stay.experience} · {stay.nights}
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
});
