import { ImageBackground, StyleSheet, View } from "react-native";

import { Badge, Text } from "../primitives";
import { colors, spacing } from "../../theme";
import type { Pet } from "../../types/app";

type PetCardProps = {
  pet: Pet;
};

export function PetCard({ pet }: PetCardProps) {
  return (
    <ImageBackground
      source={{ uri: pet.imageUrl }}
      imageStyle={styles.image}
      resizeMode="cover"
      style={styles.card}
    >
      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <Badge label="Favorite" tone="accent" />
          <Badge label="Active" tone="calm" />
        </View>
        <View style={styles.copy}>
          <Text variant="heading" tone="inverse">
            {pet.name}
          </Text>
          <Text variant="caption" tone="inverse">
            {pet.breed}
          </Text>
          <Text variant="caption" tone="inverse">
            {pet.careNote}
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    height: 260,
    overflow: "hidden",
  },
  image: {
    borderRadius: 24,
  },
  overlay: {
    backgroundColor: colors.overlayDark,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  copy: {
    gap: spacing.xs,
  },
});
