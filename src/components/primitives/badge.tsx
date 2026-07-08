import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../../theme";
import { Text } from "./text";

type BadgeTone = "accent" | "calm" | "attention" | "success";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

const badgeStyles: Record<BadgeTone, { backgroundColor: string }> = {
  accent: { backgroundColor: colors.champagne },
  calm: { backgroundColor: colors.sage },
  attention: { backgroundColor: colors.blush },
  success: { backgroundColor: colors.parchment },
};

export function Badge({ label, tone = "accent" }: BadgeProps) {
  return (
    <View style={[styles.badge, badgeStyles[tone]]}>
      <Text variant="label" tone="brand" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    textTransform: "uppercase",
  },
});
