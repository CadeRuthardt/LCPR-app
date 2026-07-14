import { colors } from "./colors";
import { fonts } from "./fonts";

export const typography = {
  screenTitle: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.burgundy },
  navigationTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.textPrimary },
  heroName: { fontFamily: fonts.display, fontSize: 27, lineHeight: 33, color: colors.burgundy },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
  cardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24, color: colors.textPrimary },
  rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  bodySecondary: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  button: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 21 },
  metric: { fontFamily: fonts.bodySemiBold, fontSize: 24, lineHeight: 30, color: colors.burgundy },
  price: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24, color: colors.burgundy },

  // Legacy semantic names retained during migration.
  hero: { fontFamily: fonts.display, fontSize: 46, lineHeight: 52 },
  heroBody: { fontFamily: fonts.body, fontSize: 21, lineHeight: 31 },
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24 },
} as const;
