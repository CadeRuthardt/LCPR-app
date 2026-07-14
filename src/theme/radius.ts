export const radii = {
  small: 8,
  button: 10,
  input: 12,
  card: 16,
  largeCard: 18,
  pill: 999,
  circle: 999,
} as const;

export const radius = {
  sm: radii.small,
  md: radii.input,
  lg: radii.card,
  xl: radii.largeCard,
  xxl: 22,
  pill: radii.pill,
} as const;
