export const fonts = {
  display: "PlayfairDisplay_700Bold",
  displayItalic: "PlayfairDisplay_700Bold_Italic",
  body: "Poppins_400Regular",
  bodyMedium: "Poppins_500Medium",
  bodySemiBold: "Poppins_600SemiBold",
  bodyBold: "Poppins_700Bold",
} as const;

export type BrandFont = keyof typeof fonts;
