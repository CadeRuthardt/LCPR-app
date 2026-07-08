import { StyleSheet, View } from "react-native";

import { Badge, Button, Card, Text } from "../primitives";
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
          {stay.petName}'s upcoming stay
        </Text>
        <Text variant="body" tone={supportTone}>
          {stay.experience} is being prepared with the resort team.
        </Text>
      </View>
      {featured ? <Button title="View Stay Details" variant="secondary" /> : null}
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
});
