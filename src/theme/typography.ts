import { fonts } from "./fonts";

export const typography = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 52,
  },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: 21,
    lineHeight: 31,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;
