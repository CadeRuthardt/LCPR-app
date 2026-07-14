import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "../../theme";
import { Text } from "./text";

type BadgeTone = "accent" | "calm" | "attention" | "success" | "danger" | "info";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

const badgeStyles: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  accent: { backgroundColor: colors.champagne, color: colors.burgundy },
  calm: { backgroundColor: colors.sage, color: colors.burgundy },
  attention: { backgroundColor: colors.blush, color: colors.burgundy },
  success: { backgroundColor: colors.statusGreenSoft, color: colors.statusGreen },
  danger: { backgroundColor: colors.statusRedSoft, color: colors.statusRed },
  info: { backgroundColor: colors.statusBlueSoft, color: colors.statusBlue },
};

export function Badge({ label, tone = "accent" }: BadgeProps) {
  return (
    <View style={[styles.badge, badgeStyles[tone]]}>
      <Text variant="label" style={[styles.label, { color: badgeStyles[tone].color }]}>
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
