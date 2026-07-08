import { Image, StyleSheet, View } from "react-native";

import { Badge, Card, Icon, Text } from "../primitives";
import { colors, spacing } from "../../theme";
import type { ExploreFeature } from "../../types/app";

type FeatureCardProps = {
  feature: ExploreFeature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <Image source={{ uri: feature.imageUrl }} style={styles.image} />
      <View style={styles.copy}>
        <Badge label={feature.label} tone="accent" />
        <Text variant="title">{feature.title}</Text>
        <Text variant="caption" tone="secondary">
          {feature.description}
        </Text>
      </View>
      <Icon color={colors.warmGray} name="chevron-right" size={20} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm,
  },
  image: {
    borderRadius: 16,
    height: 92,
    width: 92,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
