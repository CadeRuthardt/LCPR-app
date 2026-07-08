import { ScrollView, StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, spacing } from "../../theme";

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

export function Screen({ children, contentStyle, scroll = true }: ScreenProps) {
  if (!scroll) {
    return <View style={[styles.screen, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.ivory,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.display,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
});
