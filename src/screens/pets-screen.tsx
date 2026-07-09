import { router } from "expo-router";
import * as React from "react";

import { PetCard } from "@/components/composites";
import { Button, Screen, Section, Text } from "@/components/primitives";
import { getCurrentClientPets } from "@/services/client-data";
import type { Pet } from "@/types/app";
import { mapSeedPetToPet } from "@/utils/mappers";

import { ScreenHeader } from "./screen-header";

export function PetsScreen() {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pets, setPets] = React.useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = React.useState<Set<string>>(new Set());
  const hasSelectedPets = selectedPetIds.size > 0;

  React.useEffect(() => {
    let isMounted = true;

    getCurrentClientPets()
      .then((seedPets) => {
        if (isMounted) {
          setPets(seedPets.map(mapSeedPetToPet));
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load pets.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        {isLoading ? <Text tone="secondary">Preparing your pet profiles...</Text> : null}
        {errorMessage ? <Text tone="secondary">{errorMessage}</Text> : null}
        {!isLoading && !errorMessage && pets.length === 0 ? (
          <Text tone="secondary">
            Your pet profiles will appear here after your Phase 1 account is seeded.
          </Text>
        ) : null}
        {pets.map((pet) => {
          const isSelected = selectedPetIds.has(pet.id);

          return (
            <PetCard
              key={pet.id}
              onPress={() => togglePet(pet.id)}
              pet={pet}
              selected={isSelected}
            />
          );
        })}
        {hasSelectedPets ? (
          <Button
            icon="calendar"
            onPress={() =>
              router.push({
                pathname: "/request-reservation",
                params: { petIds: Array.from(selectedPetIds).join(",") },
              })
            }
            title="Request a Reservation"
          />
        ) : null}
      </Section>
    </Screen>
  );
}
