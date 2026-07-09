import { requireSupabase } from "@/lib/supabase";
import {
  getCurrentGingrOwnerProfile,
  getCurrentGingrPets,
  getCurrentGingrReservations,
  getGingrReservationDetail,
} from "@/services/gingr";
import type { ClientReservation, ClientReservationDetail, Pet } from "@/types/app";
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

export async function getCurrentClientPetForApp(petId: string): Promise<Pet | null> {
  const pets = await getCurrentClientPetsForApp();

  return pets.find((pet) => pet.id === petId) ?? null;
}

export async function getCurrentClientOwnerProfileForApp() {
  try {
    return await getCurrentGingrOwnerProfile();
  } catch (error) {
    console.warn("Unable to load Gingr owner profile.", error);
    return null;
  }
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

export async function getCurrentClientReservationsForApp() {
  try {
    const gingrReservations = await getCurrentGingrReservations();
    const mappedReservations = gingrReservations.map(mapGingrReservationToClientReservation);

    return splitReservationsByDate(mappedReservations);
  } catch (error) {
    console.warn("Unable to load Gingr reservations.", error);
  }

  return {
    upcoming: [] as ClientReservation[],
    past: [] as ClientReservation[],
  };
}

export async function getClientReservationDetailForApp(
  reservationIds: string[],
): Promise<ClientReservationDetail | null> {
  const detail = await getGingrReservationDetail(reservationIds);

  if (!detail || detail.reservations.length === 0) {
    return null;
  }

  const primaryReservation = detail.reservations[0];

  return {
    ...primaryReservation,
    animalNames: uniquePetNames(detail.reservations.flatMap((reservation) => reservation.animalNames)),
    dateRange: formatReservationDateRange(primaryReservation.startDate, primaryReservation.endDate),
    estimate: detail.estimate,
    id: detail.reservations.map((reservation) => reservation.id).join(","),
    petDetails: detail.reservations.flatMap((reservation) => reservation.petDetails),
    rawReservations: detail.rawReservations,
  };
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
    throw new Error(formatSupabaseError(error));
  }

  return data;
}

export async function cancelReservationRequest(requestId: string) {
  const { data, error } = await requireSupabase()
    .from("reservation_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .in("status", ["submitted", "under_review", "action_required"])
    .select("*")
    .single<ReservationRequest>();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data;
}

function formatSupabaseError(error: {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message?: string;
}) {
  return [error.message, error.details, error.hint, error.code ? `Code: ${error.code}` : null]
    .filter(Boolean)
    .join(" ");
}

function mapGingrReservationToClientReservation(reservation: {
  animalNames: string[];
  endDate: string | null;
  id: string;
  location: string | null;
  reservationType: string | null;
  startDate: string | null;
  status: string;
}): ClientReservation {
  return {
    dateRange: formatReservationDateRange(reservation.startDate, reservation.endDate),
    endDate: reservation.endDate,
    id: reservation.id,
    location: reservation.location,
    petNames: reservation.animalNames,
    reservationType: reservation.reservationType,
    startDate: reservation.startDate,
    status: reservation.status,
  };
}

function splitReservationsByDate(reservations: ClientReservation[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: ClientReservation[] = [];
  const past: ClientReservation[] = [];

  for (const reservation of reservations) {
    const start = reservation.startDate ? parseIsoDate(reservation.startDate) : null;

    if (!start || start >= today) {
      upcoming.push(reservation);
    } else {
      past.push(reservation);
    }
  }

  return {
    upcoming: groupReservationsByStay(upcoming).sort(compareReservationsAscending),
    past: groupReservationsByStay(past).sort(compareReservationsDescending),
  };
}

function groupReservationsByStay(reservations: ClientReservation[]) {
  const reservationGroups = new Map<string, ClientReservation>();

  for (const reservation of reservations) {
    const key = [
      reservation.startDate ?? "",
      reservation.endDate ?? "",
      reservation.location ?? "",
      reservation.reservationType ?? "",
      normalizeStatusForGrouping(reservation.status),
    ].join("|");
    const existing = reservationGroups.get(key);

    if (!existing) {
      reservationGroups.set(key, {
        ...reservation,
        petNames: uniquePetNames(reservation.petNames),
      });
      continue;
    }

    reservationGroups.set(key, {
      ...existing,
      id: `${existing.id},${reservation.id}`,
      petNames: uniquePetNames([...existing.petNames, ...reservation.petNames]),
    });
  }

  return Array.from(reservationGroups.values());
}

function normalizeStatusForGrouping(status: string) {
  return status.trim().toLowerCase();
}

function uniquePetNames(petNames: string[]) {
  return Array.from(new Set(petNames.map((petName) => petName.trim()).filter(Boolean)));
}

function compareReservationsAscending(a: ClientReservation, b: ClientReservation) {
  return dateSortValue(a.startDate) - dateSortValue(b.startDate);
}

function compareReservationsDescending(a: ClientReservation, b: ClientReservation) {
  return dateSortValue(b.startDate) - dateSortValue(a.startDate);
}

function dateSortValue(value: string | null) {
  return value ? parseIsoDate(value).getTime() : Number.MAX_SAFE_INTEGER;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatReservationDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "Dates not listed";
  }

  if (!endDate || startDate === endDate) {
    return formatDisplayDate(startDate ?? endDate);
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

function formatDisplayDate(value: string | null) {
  if (!value) {
    return "Date not listed";
  }

  return parseIsoDate(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
