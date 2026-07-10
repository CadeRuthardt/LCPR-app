import { router } from "expo-router";
import * as React from "react";

import { PetCard } from "@/components/composites";
import { Screen, Section, Text } from "@/components/primitives";
import { getCachedClientDashboardData, getCurrentClientDashboardData } from "@/services/client-data";
import type { Pet } from "@/types/app";

import { ScreenHeader } from "./screen-header";

export function PetsScreen() {
  const cachedDashboardData = getCachedClientDashboardData();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(!cachedDashboardData);
  const [pets, setPets] = React.useState<Pet[]>(cachedDashboardData?.pets ?? []);

  React.useEffect(() => {
    let isMounted = true;

    getCurrentClientDashboardData()
      .then((dashboardData) => {
        if (isMounted) {
          setPets(dashboardData.pets);
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
