import { StyleSheet, TextInput } from "react-native";
import type { TextInputProps } from "react-native";

import { colors, radius, spacing, typography } from "../../theme";

type TextFieldProps = TextInputProps;

export function TextField({ style, ...props }: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor={colors.warmGray}
      selectionColor={colors.blackCherry}
      {...props}
      style={[styles.field, style]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.richMahogany,
  },
});
