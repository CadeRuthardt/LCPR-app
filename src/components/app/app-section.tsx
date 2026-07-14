import { Pressable, StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import { Text } from "@/components/primitives";
import { colors, spacing, typography } from "@/theme";

export function AppSection({ actionLabel, children, onAction, title }: PropsWithChildren<{ actionLabel?: string; onAction?: () => void; title: string }>) {
  return <View style={styles.section}><View style={styles.header}><Text style={typography.sectionTitle}>{title}</Text>
    {actionLabel ? <Pressable onPress={onAction} style={styles.action}><Text style={styles.actionText}>{actionLabel}</Text></Pressable> : null}
  </View>{children}</View>;
}
const styles = StyleSheet.create({ section: { gap: spacing[12] }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, action: { minHeight: 44, justifyContent: "center" }, actionText: { color: colors.goldDark, fontSize: 15 } });
