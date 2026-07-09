import { requireSupabase } from "@/lib/supabase";
import { getCurrentGingrPets } from "@/services/gingr";
import type { Pet } from "@/types/app";
import type {
  ClientProfile,
  Phase1SeedPet,
  ReservationRequest,
  ReservationRequestInsert,
} from "@/types/database";
import { mapGingrPetToPet, mapSeedPetToPet } from "@/utils/mappers";

export async function getCurrentClientProfile(userId: string) {
  const { data, error } = await requireSupabase()
    .from("client_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<ClientProfile>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentClientPets() {
  const { data, error } = await requireSupabase()
    .from("phase1_seed_pets")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Phase1SeedPet[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentClientPetsForApp(): Promise<Pet[]> {
  try {
    const gingrPets = await getCurrentGingrPets();

    if (gingrPets.length > 0) {
      return gingrPets.map(mapGingrPetToPet);
    }
  } catch (error) {
    console.warn("Unable to load Gingr pets; falling back to seeded pets.", error);
  }

  const seedPets = await getCurrentClientPets();
  return seedPets.map(mapSeedPetToPet);
}

export async function getReservationRequests() {
  const { data, error } = await requireSupabase()
    .from("reservation_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ReservationRequest[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createReservationRequest(request: ReservationRequestInsert) {
  const { data, error } = await requireSupabase()
    .from("reservation_requests")
    .insert({
      ...request,
      status: "submitted",
    })
    .select("*")
    .single<ReservationRequest>();

  if (error) {
    throw error;
  }

  return data;
}
