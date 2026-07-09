import { Pressable, StyleSheet } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { colors, radius } from "@/theme";
import { Icon } from "./icon";

type BackChevronButtonProps = PressableProps & {
  color?: "dark" | "light";
  style?: StyleProp<ViewStyle>;
};

export function BackChevronButton({
  accessibilityLabel = "Back",
  color = "dark",
  style,
  ...props
}: BackChevronButtonProps) {
  const iconColor = color === "light" ? colors.ivory : colors.blackCherry;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Icon color={iconColor} name="chevron-left" size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pressed: {
    opacity: 0.72,
  },
});
