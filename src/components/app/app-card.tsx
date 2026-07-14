import { StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { colors, layout, radii, shadows } from "@/theme";

type AppCardProps = PropsWithChildren<{ variant?: "default" | "warm" | "muted" | "flushRows" | "outlinedAction"; padding?: "none" | "compact" | "regular"; style?: StyleProp<ViewStyle> }>;

export function AppCard({ children, padding = "regular", style, variant = "default" }: AppCardProps) {
  return <View style={[styles.base, styles[variant], styles[padding], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, ...shadows.card },
  default: { backgroundColor: colors.surface }, warm: { backgroundColor: colors.surfaceWarm },
  muted: { backgroundColor: colors.surfaceMuted }, flushRows: { backgroundColor: colors.surface, overflow: "hidden" },
  outlinedAction: { backgroundColor: colors.surface, borderColor: colors.burgundy },
  none: { padding: 0 }, compact: { padding: layout.compactCardPadding }, regular: { padding: layout.cardPadding },
});
