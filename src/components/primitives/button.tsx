import { Pressable, StyleSheet, View } from "react-native";
import type { PressableProps, StyleProp, ViewStyle } from "react-native";

import { colors, radius, spacing } from "../../theme";
import { Icon } from "./icon";
import type { IconName } from "./icon";
import { Text } from "./text";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  icon?: IconName;
  title: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  icon,
  title,
  variant = "primary",
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? (
          <Icon
            color={variant === "primary" ? colors.ivory : colors.blackCherry}
            name={icon}
            size={18}
          />
        ) : null}
        <Text
          variant="caption"
          tone={variant === "primary" ? "inverse" : "brand"}
          style={styles.label}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.pill,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.blackCherry,
  },
  secondary: {
    backgroundColor: colors.champagne,
  },
  ghost: {
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.48,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  label: {
    textTransform: "uppercase",
  },
});
