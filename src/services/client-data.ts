import { requireSupabase } from "@/lib/supabase";
import type {
  ClientProfile,
  Phase1SeedPet,
  ReservationRequest,
  ReservationRequestInsert,
} from "@/types/database";

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
