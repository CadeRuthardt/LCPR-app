import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as React from "react";
import type { PropsWithChildren } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, layout } from "../../theme";

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  clampBottomBounce?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
  topSafeArea?: boolean;
}>;

export function Screen({
  backgroundColor = colors.background,
  children,
  clampBottomBounce = false,
  contentStyle,
  onScroll,
  onRefresh,
  refreshing = false,
  scroll = true,
  topSafeArea = true,
}: ScreenProps) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const screenStyle = [styles.screen, { backgroundColor }];
  const safeAreaEdges = topSafeArea ? (["top"] as const) : ([] as const);

  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ animated: false, y: 0 });
    }, []),
  );

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(event);

      if (!clampBottomBounce) {
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const maxOffsetY = Math.max(0, contentSize.height - layoutMeasurement.height);

      if (contentOffset.y > maxOffsetY + 1) {
        scrollViewRef.current?.scrollTo({ animated: false, y: maxOffsetY });
      }
    },
    [clampBottomBounce, onScroll],
  );

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
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.content, contentStyle]}
          contentInsetAdjustmentBehavior="never"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={colors.goldenrod}
              />
            ) : undefined
          }
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
    alignSelf: "center",
    gap: layout.sectionGap,
    maxWidth: layout.maxContentWidth,
    paddingBottom: layout.bottomContentPadding,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    width: "100%",
  },
  staticContent: {
    flex: 1,
  },
});
