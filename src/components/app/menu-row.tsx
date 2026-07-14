import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "@/components/primitives";
import type { IconName } from "@/components/primitives";
import { colors, spacing, typography } from "@/theme";

export function MenuRow({ badge, icon, isLast = false, onPress, subtitle, title }: { badge?: string; icon: IconName; isLast?: boolean; onPress?: () => void; subtitle: string; title: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>
    <View style={styles.icon}><Icon color={colors.burgundy} name={icon} size={25} /></View><View style={styles.copy}><Text style={typography.rowTitle}>{title}</Text><Text style={typography.bodySecondary}>{subtitle}</Text></View>
    {badge ? <View style={styles.badge}><Text tone="inverse" variant="caption">{badge}</Text></View> : null}<Icon color={colors.icon} name="chevron-right" size={22} />
  </Pressable>;
}
const styles = StyleSheet.create({ row: { alignItems: "center", flexDirection: "row", minHeight: 84, paddingHorizontal: 18, paddingVertical: 14 }, divider: { borderBottomColor: colors.divider, borderBottomWidth: 1 }, pressed: { backgroundColor: colors.surfaceMuted }, icon: { alignItems: "flex-start", width: 48 }, copy: { flex: 1, gap: 2 }, badge: { alignItems: "center", backgroundColor: colors.burgundy, borderRadius: 14, justifyContent: "center", marginRight: spacing[12], minHeight: 28, minWidth: 28 } });
