import { router } from "expo-router";
import * as React from "react";

import { PetCard } from "@/components/composites";
import { Screen, Section, Text } from "@/components/primitives";
import { getCurrentClientPetsForApp } from "@/services/client-data";
import type { Pet } from "@/types/app";

import { ScreenHeader } from "./screen-header";

export function PetsScreen() {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pets, setPets] = React.useState<Pet[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    getCurrentClientPetsForApp()
      .then((clientPets) => {
        if (isMounted) {
          setPets(clientPets);
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

  return (
    <Screen>
      <ScreenHeader title="My Pets" />
      <Section>
        {isLoading ? <Text tone="secondary">Preparing your pet profiles...</Text> : null}
        {errorMessage ? <Text tone="secondary">{errorMessage}</Text> : null}
        {!isLoading && !errorMessage && pets.length === 0 ? (
          <Text tone="secondary">
            Your pet profiles will appear here once we match your Le Chateau account.
          </Text>
        ) : null}
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            onPress={() =>
              router.push({
                pathname: "/pet-profile",
                params: { petId: pet.id },
              })
            }
            pet={pet}
          />
        ))}
      </Section>
    </Screen>
  );
}
