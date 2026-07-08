import { StyleSheet, View } from "react-native";
import type { PropsWithChildren, ReactNode } from "react";

import { spacing } from "../../theme";
import { Text } from "./text";

type SectionProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}>;

export function Section({ action, children, subtitle, title }: SectionProps) {
  return (
    <View style={styles.section}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.copy}>
            {title ? <Text variant="title">{title}</Text> : null}
            {subtitle ? (
              <Text variant="caption" tone="muted" style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  header: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xxs,
  },
});
