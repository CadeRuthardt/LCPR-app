import { ScrollView, StyleSheet, View } from "react-native";
import type { PropsWithChildren, ReactNode } from "react";
import { BrandHeader } from "./brand-header";
import { Text } from "@/components/primitives";
import { colors, layout, spacing, typography } from "@/theme";

export function AppScreen({ children, headerAction, showBrandHeader = true, subtitle, title }: PropsWithChildren<{ headerAction?: ReactNode; showBrandHeader?: boolean; subtitle?: string; title?: string }>) {
  return <View style={styles.screen}>{showBrandHeader ? <BrandHeader /> : null}<ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
    {title ? <View style={styles.titleRow}><View style={styles.titleCopy}><Text style={typography.screenTitle}>{title}</Text>{subtitle ? <Text style={typography.bodySecondary}>{subtitle}</Text> : null}</View>{headerAction}</View> : null}{children}
  </ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { backgroundColor: colors.background, flex: 1 }, content: { alignSelf: "center", gap: layout.sectionGap, maxWidth: layout.maxContentWidth, paddingBottom: layout.bottomContentPadding, paddingHorizontal: layout.screenPaddingHorizontal, paddingTop: layout.screenPaddingTop, width: "100%" }, titleRow: { alignItems: "center", flexDirection: "row", gap: spacing[16], justifyContent: "space-between" }, titleCopy: { flex: 1, gap: spacing[6] } });
