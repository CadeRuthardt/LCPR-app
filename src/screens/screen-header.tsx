import { StyleSheet, View } from "react-native";

import { Text } from "@/components/primitives";
import { spacing } from "@/theme";

type ScreenHeaderProps = {
  title: string;
};

export function ScreenHeader({ title }: ScreenHeaderProps) {
  return (
    <View style={styles.screenTitleRow}>
      <Text variant="heading">{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitleRow: {
    paddingTop: spacing.xs,
  },
});
