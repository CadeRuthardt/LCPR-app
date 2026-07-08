import { Text as NativeText, StyleSheet } from "react-native";
import type { TextProps as NativeTextProps } from "react-native";

import { colors, typography } from "../../theme";

type TextVariant = keyof typeof typography;
type TextTone = "primary" | "secondary" | "muted" | "inverse" | "accent" | "brand";

type TextProps = NativeTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

const toneStyles: Record<TextTone, { color: string }> = {
  primary: { color: colors.richMahogany },
  secondary: { color: colors.graphite },
  muted: { color: colors.warmGray },
  inverse: { color: colors.ivory },
  accent: { color: colors.goldenrod },
  brand: { color: colors.blackCherry },
};

export function Text({
  children,
  style,
  tone = "primary",
  variant = "body",
  ...props
}: TextProps) {
  return (
    <NativeText
      {...props}
      style={[styles.base, typography[variant], toneStyles[tone], style]}
    >
      {children}
    </NativeText>
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});
