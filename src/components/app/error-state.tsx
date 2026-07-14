import { StyleSheet, View } from "react-native";
import { Button, Icon, Text } from "@/components/primitives";
import { colors, spacing, typography } from "@/theme";
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <View style={styles.card}><Icon color={colors.error} name="info" size={22} /><View style={styles.copy}><Text style={typography.cardTitle}>Something went wrong</Text><Text style={typography.bodySecondary}>{message}</Text></View>{onRetry ? <Button onPress={onRetry} title="Retry" variant="secondary" /> : null}</View>; }
const styles = StyleSheet.create({ card: { alignItems: "center", backgroundColor: colors.errorSoft, borderColor: colors.error, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: spacing[12], padding: spacing[14] }, copy: { flex: 1, gap: spacing[2] } });
