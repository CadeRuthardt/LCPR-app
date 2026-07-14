import { StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, layout, radii, shadows } from "../../theme";

type CardVariant = "default" | "elevated" | "featured";

type CardProps = PropsWithChildren<{
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, variant = "default", style }: CardProps) {
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    padding: layout.cardPadding,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
  },
  featured: {
    backgroundColor: colors.blackCherry,
    ...shadows.elevated,
  },
});
