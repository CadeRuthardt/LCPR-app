import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../../theme";

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  topSafeArea?: boolean;
}>;

export function Screen({
  backgroundColor = colors.ivory,
  children,
  contentStyle,
  scroll = true,
  topSafeArea = true,
}: ScreenProps) {
  const screenStyle = [styles.screen, { backgroundColor }];
  const safeAreaEdges = topSafeArea ? (["top"] as const) : ([] as const);

  if (!scroll) {
    return (
      <SafeAreaView edges={safeAreaEdges} style={screenStyle}>
        <View style={[styles.staticContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={safeAreaEdges} style={screenStyle}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.content, contentStyle]}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.screen}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: 116,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  staticContent: {
    flex: 1,
  },
});
