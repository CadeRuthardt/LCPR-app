import { StyleSheet, View } from "react-native";
import type { IconName } from "@/components/primitives";
import { Button, Icon, Text } from "@/components/primitives";
import { colors, spacing, typography } from "@/theme";
import { AppCard } from "./app-card";
export function EmptyState({ actionLabel, body, icon, onAction, title }: { actionLabel?: string; body: string; icon: IconName; onAction?: () => void; title: string }) { return <AppCard style={styles.card}><View style={styles.icon}><Icon color={colors.burgundy} name={icon} size={30} /></View><Text style={typography.sectionTitle}>{title}</Text><Text style={[typography.bodySecondary, styles.center]}>{body}</Text>{actionLabel ? <Button onPress={onAction} title={actionLabel} /> : null}</AppCard>; }
const styles = StyleSheet.create({ card: { alignItems: "center", gap: spacing[12] }, icon: { alignItems: "center", backgroundColor: colors.goldSoft, borderRadius: 26, height: 52, justifyContent: "center", width: 52 }, center: { textAlign: "center" } });
