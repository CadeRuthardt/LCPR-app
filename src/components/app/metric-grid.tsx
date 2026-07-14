import { StyleSheet, View } from "react-native";
import type { IconName } from "@/components/primitives";
import { Icon, Text } from "@/components/primitives";
import { colors, spacing, typography } from "@/theme";
import { AppCard } from "./app-card";

export type Metric = { action?: string; icon: IconName; label: string; value: string };
export function MetricGrid({ items }: { items: Metric[] }) { return <AppCard style={styles.card}><View style={styles.row}>{items.map((item, index) => <View key={item.label} style={[styles.item, index > 0 && styles.divider]}><Icon color={colors.goldDark} name={item.icon} size={27} /><Text style={styles.label}>{item.label}</Text><Text style={typography.metric}>{item.value}</Text>{item.action ? <Text style={styles.action}>{item.action}</Text> : null}</View>)}</View></AppCard>; }
const styles = StyleSheet.create({ card: { paddingHorizontal: 0 }, row: { flexDirection: "row", flexWrap: "wrap" }, item: { alignItems: "center", flex: 1, gap: spacing[8], minWidth: 80, paddingHorizontal: spacing[8] }, divider: { borderLeftColor: colors.divider, borderLeftWidth: 1 }, label: { fontSize: 13, textAlign: "center" }, action: { color: colors.goldDark, fontSize: 12 } });
