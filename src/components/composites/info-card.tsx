import { StyleSheet, View } from "react-native";

import { Badge, Card, Icon, Text } from "../primitives";
import { colors, spacing } from "../../theme";

type InfoCardProps = {
  label: string;
  title: string;
  body: string;
};

export function InfoCard({ body, label, title }: InfoCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconMark}>
        <Icon color={colors.ivory} name="shield" size={22} />
      </View>
      <View style={styles.copy}>
        <Badge label={label} tone="attention" />
        <Text variant="title">{title}</Text>
        <Text variant="body" tone="secondary">
          {body}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  iconMark: {
    alignItems: "center",
    backgroundColor: colors.mutedGold,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
