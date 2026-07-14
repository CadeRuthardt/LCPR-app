import { Platform } from "react-native";

export const shadows = {
  none: {},
  card: Platform.select({
    ios: { shadowColor: "#000000", shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 1 },
    default: { boxShadow: "0 2px 8px rgba(0,0,0,0.035)" },
  }),
  floating: Platform.select({
    ios: { shadowColor: "#000000", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: { boxShadow: "0 4px 12px rgba(0,0,0,0.07)" },
  }),
  soft: Platform.select({
    ios: { shadowColor: "#000000", shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 1 },
    default: { boxShadow: "0 2px 8px rgba(0,0,0,0.035)" },
  }),
  elevated: Platform.select({
    ios: { shadowColor: "#000000", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: { boxShadow: "0 4px 12px rgba(0,0,0,0.07)" },
  }),
} as const;
