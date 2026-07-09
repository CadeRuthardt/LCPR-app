import { requireSupabase } from "@/lib/supabase";

export type GingrDiscoveryAction =
  | "locations"
  | "reservation-types"
  | "services-by-type"
  | "current-owner"
  | "current-pets"
  | "current-client-snapshot";

export type GingrDiscoveryRequest = {
  action: GingrDiscoveryAction;
  locationId?: string | number;
  reservationTypeId?: string | number;
};

export type GingrDiscoveryResponse<T = unknown> = {
  action: GingrDiscoveryAction;
  data: T;
};

export type GingrPet = {
  age: string;
  birthday: string | null;
  breed: string;
  gender: string | null;
  id: string;
  imageUrl: string | null;
  name: string;
  nextImmunizationExpiration: string | null;
  source: "gingr";
  species: string;
  status: "Active" | "Checked In";
  vaccinationSummary: string;
  weight: string;
};

export type CurrentGingrPetsResponse = {
  ownerId: string | null;
  pets: GingrPet[];
};

export async function runGingrDiscovery<T = unknown>(request: GingrDiscoveryRequest) {
  const { data, error } = await requireSupabase().functions.invoke<
    GingrDiscoveryResponse<T>
  >("gingr-discovery", {
    body: request,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentGingrPets() {
  const response = await runGingrDiscovery<CurrentGingrPetsResponse>({
    action: "current-pets",
  });

  return response?.data?.pets ?? [];
}
