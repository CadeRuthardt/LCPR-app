import { Platform } from "react-native";

import { colors } from "./colors";

export const shadows = {
  none: {},
  soft: Platform.select({
    ios: {
      shadowColor: colors.shadowTint,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: "0px 8px 18px rgba(54, 8, 8, 0.08)",
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: colors.shadowTint,
      shadowOpacity: 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 16 },
    },
    android: {
      elevation: 5,
    },
    default: {
      boxShadow: "0px 14px 24px rgba(54, 8, 8, 0.14)",
    },
  }),
} as const;
