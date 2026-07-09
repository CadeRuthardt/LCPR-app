import { Image, Pressable, StyleSheet, View } from "react-native";

import { Icon, Text } from "../primitives";
import { colors, radius, spacing } from "../../theme";
import type { Pet } from "../../types/app";

type PetCardProps = {
  onPress?: () => void;
  pet: Pet;
  selected?: boolean;
};

export function PetCard({ onPress, pet, selected = false }: PetCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={{ uri: pet.imageUrl }} style={styles.avatar} />
      <View style={styles.copy}>
        <Text variant="title">{pet.name}</Text>
        <Text variant="caption" tone="secondary">
          {pet.breed}
        </Text>
        <Text variant="caption" tone="secondary">
          {pet.age} old | {pet.weight}
        </Text>
      </View>
      <View style={[styles.selectCircle, selected && styles.selectCircleActive]}>
        {selected ? <Icon color={colors.ivory} name="check" size={13} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.porcelain,
    borderColor: colors.creamBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 94,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardPressed: {
    opacity: 0.82,
  },
  avatar: {
    borderRadius: radius.pill,
    height: 66,
    width: 66,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  selectCircle: {
    alignItems: "center",
    borderColor: colors.warmGray,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  selectCircleActive: {
    backgroundColor: colors.blackCherry,
    borderColor: colors.blackCherry,
  },
});
