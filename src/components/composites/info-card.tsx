import { StyleSheet } from "react-native";

import { Badge, Card, Text } from "../primitives";
import { spacing } from "../../theme";

type InfoCardProps = {
  label: string;
  title: string;
  body: string;
};

export function InfoCard({ body, label, title }: InfoCardProps) {
  return (
    <Card style={styles.card}>
      <Badge label={label} tone="attention" />
      <Text variant="title">{title}</Text>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
});
