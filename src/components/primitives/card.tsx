import { StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "../../theme";

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
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  default: {
    backgroundColor: colors.porcelain,
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  elevated: {
    backgroundColor: colors.porcelain,
    ...shadows.soft,
  },
  featured: {
    backgroundColor: colors.blackCherry,
    ...shadows.elevated,
  },
});
