import { router } from "expo-router";
import * as React from "react";
import { StyleSheet } from "react-native";

import { PetCard } from "@/components/composites";
import { Button, Screen, Section } from "@/components/primitives";
import { pets } from "@/data/mock-data";
import { colors, radius } from "@/theme";

import { ScreenHeader } from "./screen-header";

export function PetsScreen() {
  const [selectedPetIds, setSelectedPetIds] = React.useState<Set<string>>(new Set());
  const hasSelectedPets = selectedPetIds.size > 0;

  function togglePet(petId: string) {
    setSelectedPetIds((current) => {
      const next = new Set(current);

      if (next.has(petId)) {
        next.delete(petId);
      } else {
        next.add(petId);
      }

      return next;
    });
  }

  return (
    <Screen>
      <ScreenHeader title="My Pets" />
      <Section>
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            onPress={() => togglePet(pet.id)}
            pet={pet}
            selected={selectedPetIds.has(pet.id)}
          />
        ))}
        {hasSelectedPets ? (
          <Button
            icon="calendar"
            onPress={() => router.push("/request-stay")}
            title="Request a Reservation"
          />
        ) : null}
        <Button icon="plus" title="Add Another Pet" variant="ghost" style={styles.addPetButton} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addPetButton: {
    borderColor: colors.oliveBark,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 48,
  },
});
