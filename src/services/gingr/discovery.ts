import { requireSupabase, supabaseConfig } from "@/lib/supabase";

export type GingrDiscoveryAction =
  | "locations"
  | "location-cities"
  | "reservation-types"
  | "species"
  | "services-by-type"
  | "request-catalog"
  | "list-invoices"
  | "report-card-files"
  | "owner-form"
  | "owner-custom-field-search"
  | "current-owner"
  | "current-owner-profile"
  | "current-pets"
  | "link-current-client"
  | "reservation-detail"
  | "current-reservations"
  | "reservation-detail-test"
  | "current-client-snapshot";

export type GingrDiscoveryRequest = {
  action: GingrDiscoveryAction;
  locationId?: string | number;
  reservationId?: string | number;
  reservationIds?: Array<string | number>;
  reservationTypeId?: string | number;
};

export type GingrDiscoveryResponse<T = unknown> = {
  action: GingrDiscoveryAction;
  data: T;
};

export type GingrPet = {
  age: string;
  allergies: string | null;
  birthday: string | null;
  breed: string;
  colorAndMarkings: string | null;
  feedingMethod: string | null;
  feedingNotes: string | null;
  feedingSchedules: GingrFeedingSchedule[];
  feedingType: string | null;
  fixed: boolean;
  gender: string | null;
  id: string;
  imageUrl: string | null;
  immunizations: GingrPetImmunization[];
  medicationNotes: string | null;
  medicationSchedules: GingrMedicationSchedule[];
  medicines: string | null;
  name: string;
  nextImmunizationExpiration: string | null;
  notes: string | null;
  rawData?: Record<string, unknown>;
  source: "gingr";
  species: string;
  status: "Active" | "Checked In";
  vaccinationSummary: string;
  vetName: string | null;
  vetPhone: string | null;
  vip: boolean;
  weight: string;
};

export type GingrPetImmunization = {
  administeredDate: string | null;
  expiresDate: string | null;
  id: string | null;
  name: string;
  rawData: unknown;
  status: string | null;
};

export type GingrFeedingSchedule = {
  amount: string;
  instructions: string | null;
  label: string;
};

export type GingrMedicationSchedule = {
  label: string;
  medications: Array<{
    amount: string;
    endDate: string | null;
    notes: string | null;
    startDate: string | null;
    type: string | null;
  }>;
};

export type CurrentGingrPetsResponse = {
  ownerId: string | null;
  pets: GingrPet[];
  rawPets?: Array<Record<string, unknown>>;
};

export type CurrentGingrOwnerProfileResponse = {
  displayName: string | null;
  email: string | null;
  imageSourceKey: string | null;
  imageUrl: string | null;
  ownerId: string | null;
  rawOwner?: Record<string, unknown>;
};

export type LinkCurrentClientResponse = {
  allowed: boolean;
  message?: string;
  profile?: {
    created_at: string;
    display_name: string;
    email: string;
    gingr_client_id: string | null;
    id: string;
    updated_at: string;
  };
  reason?: "missing_email" | "multiple_matches" | "not_found";
};

export type GingrLocation = {
  city: string;
  id: string | null;
  name: string;
};

export type GingrLocationCitiesResponse = {
  locations: GingrLocation[];
};

export type GingrReservation = {
  animalNames: string[];
  checkInAt: string | null;
  checkOutAt: string | null;
  confirmedAt: string | null;
  endDate: string | null;
  endDateTimeLabel: string | null;
  id: string;
  location: string | null;
  reservationType: string | null;
  startDate: string | null;
  startDateTimeLabel: string | null;
  status: string;
};

export type CurrentGingrReservationsResponse = {
  ownerId: string | null;
  reservations: GingrReservation[];
};

export type GingrReservationDetailPet = {
  age: string | null;
  allergies: string | null;
  breed: string | null;
  imageUrl: string | null;
  medicines: string | null;
  name: string;
  notes: string | null;
  species: string | null;
  temperament: string | null;
  vetName: string | null;
  vetPhone: string | null;
  weight: string | null;
};

export type GingrReservationEstimate = {
  details: Array<{
    label: string | null;
    quantity: string | null;
    total: string | null;
  }>;
  location: {
    city: string | null;
    email: string | null;
    hours: string | null;
    name: string | null;
    phone: string | null;
  } | null;
  reservations: Array<{
    label: string | null;
    subtotal: string | null;
  }>;
};

export type GingrReservationDetail = GingrReservation & {
  baseRate: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  confirmedAt: string | null;
  createdAt: string | null;
  createdBy: string | null;
  endDateTimeLabel: string | null;
  feedingAmount: string | null;
  feedingNotes: string | null;
  feedingTime: string | null;
  finalRate: string | null;
  groomingNotes: string | null;
  nights: string | null;
  notes: string | null;
  petDetails: GingrReservationDetailPet[];
  precheckCompleted: boolean | null;
  reservationSummary: string | null;
  services: string | null;
  startDateTimeLabel: string | null;
  unitsOfTime: string | null;
};

export type GingrReservationDetailResponse = {
  estimate: GingrReservationEstimate | null;
  ownerId: string | null;
  rawReservations?: Array<Record<string, unknown>>;
  reservations: GingrReservationDetail[];
};

export type GingrCatalogItem = {
  id: string;
  name: string;
};

export type GingrServiceGroup = {
  locationId: string | null;
  reservationTypeId: string;
  services: GingrCatalogItem[];
};

export type GingrReservationRequestCatalog = {
  locations: GingrLocation[];
  reservationTypes: GingrCatalogItem[];
  serviceGroups: GingrServiceGroup[];
  species: GingrCatalogItem[];
};

const gingrDiscoveryTimeoutMs = 35000;

export async function runGingrDiscovery<T = unknown>(request: GingrDiscoveryRequest) {
  const supabase = requireSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Please sign in again before checking Gingr.");
  }

  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error("Supabase is not configured for Gingr discovery.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), gingrDiscoveryTimeoutMs);

  try {
    const response = await fetch(`${supabaseConfig.url}/functions/v1/gingr-discovery`, {
      body: JSON.stringify(request),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: supabaseConfig.publishableKey,
      },
      method: "POST",
      signal: controller.signal,
    });
    const responseText = await response.text();
    const responseJson = parseResponseJson(responseText);

    if (!response.ok) {
      const errorMessage =
        readErrorMessage(responseJson) || `Gingr discovery failed with HTTP ${response.status}.`;

      throw new Error(errorMessage);
    }

    return responseJson as GingrDiscoveryResponse<T>;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(
        `Gingr discovery did not respond within ${Math.round(gingrDiscoveryTimeoutMs / 1000)} seconds.`,
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getCurrentGingrPets() {
  const response = await runGingrDiscovery<CurrentGingrPetsResponse>({
    action: "current-pets",
  });

  const pets = response?.data?.pets ?? [];
  const rawPetById = new Map(
    (response?.data?.rawPets ?? [])
      .map((rawPet) => {
        const id = readRawString(rawPet, ["a_id", "id"]);

        return id ? ([id, rawPet] as const) : null;
      })
      .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry)),
  );

  return pets.map((pet) => ({
    ...pet,
    rawData: rawPetById.get(pet.id),
  }));
}

export async function getCurrentGingrOwnerProfile() {
  const response = await runGingrDiscovery<CurrentGingrOwnerProfileResponse>({
    action: "current-owner-profile",
  });

  return response?.data ?? null;
}

export async function linkCurrentGingrClient() {
  const response = await runGingrDiscovery<LinkCurrentClientResponse>({
    action: "link-current-client",
  });

  return response?.data ?? null;
}

export async function getGingrLocationCities() {
  const response = await runGingrDiscovery<GingrLocationCitiesResponse>({
    action: "location-cities",
  });

  return response?.data?.locations ?? [];
}

export async function getCurrentGingrReservations() {
  const response = await runGingrDiscovery<CurrentGingrReservationsResponse>({
    action: "current-reservations",
  });

  return response?.data?.reservations ?? [];
}

export async function getGingrReservationDetail(reservationIds: string[]) {
  const response = await runGingrDiscovery<GingrReservationDetailResponse>({
    action: "reservation-detail",
    reservationIds,
  });

  return response?.data ?? null;
}

export async function getGingrReservationRequestCatalog() {
  const response = await runGingrDiscovery<GingrReservationRequestCatalog>({
    action: "request-catalog",
  });

  return response?.data ?? null;
}

function readRawString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function parseResponseJson(value: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function readErrorMessage(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return typeof value === "string" ? value : null;
  }

  const record = value as Record<string, unknown>;

  return typeof record.error === "string"
    ? record.error
    : typeof record.message === "string"
      ? record.message
      : null;
}

function isAbortError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: unknown }).name === "AbortError",
  );
}
