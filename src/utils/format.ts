export function joinWithComma(items: string[]) {
  return items.filter(Boolean).join(", ");
}
