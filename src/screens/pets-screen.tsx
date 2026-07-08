import { StyleSheet, View } from "react-native";

import { PetCard } from "@/components/composites";
import { Card, Screen, Section, Text } from "@/components/primitives";
import { pets } from "@/data/mock-data";
import { colors, radius, spacing } from "@/theme";

import { ScreenHeader } from "./screen-header";

export function PetsScreen() {
  return (
    <Screen>
      <ScreenHeader title="My Pets" />
      <View style={styles.addButton}>
        <Text variant="heading" tone="inverse">
          +
        </Text>
      </View>
      <Section>
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
        <Card style={styles.addPetCard}>
          <Text variant="display" tone="muted">
            +
          </Text>
          <Text variant="title">Add a Pet</Text>
          <Text variant="caption" tone="secondary">
            Add a new furry family member
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.mutedGold,
    borderRadius: radius.pill,
    height: 50,
    justifyContent: "center",
    marginTop: -64,
    width: 50,
  },
  addPetCard: {
    alignItems: "center",
    borderStyle: "dashed",
    gap: spacing.xs,
  },
});
