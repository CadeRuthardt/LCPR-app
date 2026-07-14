import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { Icon, Text } from "@/components/primitives";
import { colors, spacing } from "@/theme";

const logo = require("../../../assets/logonopaw.png");

export function BrandHeader({ compact = false, leftAction, unreadCount = 0 }: { compact?: boolean; leftAction?: ReactNode; unreadCount?: number }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.header, { paddingTop: insets.top }]}>
    <View style={[styles.row, compact && styles.rowCompact]}><View style={[styles.balance, compact && styles.balanceCompact]}>{leftAction}</View><Image accessibilityLabel="Le Chateau Pet Resort" source={logo} style={[styles.logo, compact && styles.logoCompact]} />
      <View style={[styles.balance, compact && styles.balanceCompact]}><Pressable accessibilityLabel="Notifications" accessibilityRole="button" style={[styles.bell, compact && styles.bellCompact]}>
        <Icon color={colors.burgundy} name="bell" size={compact ? 18 : 21} />
        {unreadCount > 0 ? <View style={styles.badge}><Text style={styles.badgeText} tone="inverse" variant="caption">{Math.min(unreadCount, 9)}</Text></View> : null}
      </Pressable></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.surface, borderBottomColor: colors.divider, borderBottomWidth: 1 },
  row: { alignItems: "center", flexDirection: "row", height: 72, justifyContent: "space-between", paddingHorizontal: spacing[20] },
  rowCompact: { height: 54, paddingHorizontal: spacing[12] },
  balance: { height: 42, width: 42 },
  balanceCompact: { alignItems: "center", height: 36, justifyContent: "center", width: 72 },
  logo: { height: 62, resizeMode: "contain", width: 220 },
  logoCompact: { height: 44, width: 150 },
  bell: { alignItems: "center", borderColor: colors.burgundy, borderRadius: 22, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  bellCompact: { height: 34, width: 34 },
  badge: { alignItems: "center", backgroundColor: colors.error, borderRadius: 9, height: 18, justifyContent: "center", position: "absolute", right: -4, top: -5, width: 18 },
  badgeText: { fontSize: 10, lineHeight: 12 },
});
