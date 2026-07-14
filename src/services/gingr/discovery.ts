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
  | "estimate-test"
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

export type GingrInvoiceSummary = {
  date: string | null;
  id: string | null;
  ownerId: string | null;
  reservationId: string | null;
  reservationIds?: string[];
  reservationReferences?: Array<{ key: string; path: string; value: string }>;
  status: string | null;
  total: string | null;
  transactionFieldKeys?: string[];
  transactionItems?: Array<Record<string, unknown>>;
  transactionLookupError?: string | null;
};

export type CurrentGingrInvoicesResponse = {
  lookups?: Array<{
    label: string;
    matchingOwnerInvoices: GingrInvoiceSummary[];
    matchingOwnerCount?: number;
    pagesScanned?: number;
    sampleFieldKeys?: string[];
    totalReturned?: number;
  }>;
  note?: string;
  ownerId: string | null;
};

export function getGingrInvoiceReservationIds(invoice: GingrInvoiceSummary) {
  const transactionItemIds = (invoice.transactionItems ?? []).map((item) => {
    const reservationId = item.reservationId;
    return typeof reservationId === "string" || typeof reservationId === "number"
      ? String(reservationId)
      : null;
  });

  return Array.from(new Set([
    invoice.reservationId,
    ...(invoice.reservationIds ?? []),
    ...(invoice.reservationReferences ?? []).map((reference) => reference.value),
    ...transactionItemIds,
  ].filter((id): id is string => Boolean(id?.trim())).map((id) => id.trim())));
}

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
    unitPrice: string | null;
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
    modifiers: Array<{
      label: string | null;
      quantity: string | null;
      total: string | null;
      unitPrice: string | null;
    }>;
    quantity: string | null;
    subtotal: string | null;
    unitPrice: string | null;
  }>;
  remainingDue: string | null;
  subtotal: string | null;
  tax: string | null;
  totalDue: string | null;
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
  estimatesByReservation?: Record<string, GingrReservationEstimate>;
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

type AsyncValueCache<T> = {
  hasValue: boolean;
  request: Promise<T> | null;
  value: T | null;
};

function createAsyncValueCache<T>(): AsyncValueCache<T> {
  return { hasValue: false, request: null, value: null };
}

const petsCache = createAsyncValueCache<GingrPet[]>();
const ownerProfileCache = createAsyncValueCache<CurrentGingrOwnerProfileResponse | null>();
const locationCitiesCache = createAsyncValueCache<GingrLocation[]>();
const reservationsCache = createAsyncValueCache<GingrReservation[]>();
const invoicesCache = createAsyncValueCache<CurrentGingrInvoicesResponse | null>();
const requestCatalogCache = createAsyncValueCache<GingrReservationRequestCatalog | null>();
let reservationDetailCache: GingrReservationDetailResponse | null = null;
const reservationDetailRequests = new Map<string, Promise<GingrReservationDetailResponse | null>>();
let cacheGeneration = 0;

async function readThroughCache<T>(
  cache: AsyncValueCache<T>,
  loader: () => Promise<T>,
): Promise<T> {
  if (cache.hasValue) {
    return cache.value as T;
  }

  if (cache.request) {
    return cache.request;
  }

  const requestGeneration = cacheGeneration;
  const request = loader()
    .then((value) => {
      if (requestGeneration === cacheGeneration) {
        cache.value = value;
        cache.hasValue = true;
      }
      return value;
    })
    .finally(() => {
      if (cache.request === request) {
        cache.request = null;
      }
    });

  cache.request = request;
  return request;
}

export function clearGingrDiscoveryCache() {
  cacheGeneration += 1;
  for (const cache of [
    petsCache,
    ownerProfileCache,
    locationCitiesCache,
    reservationsCache,
    invoicesCache,
    requestCatalogCache,
  ]) {
    cache.hasValue = false;
    cache.request = null;
    cache.value = null;
  }

  reservationDetailCache = null;
  reservationDetailRequests.clear();
}

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
  return readThroughCache(petsCache, async () => {
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
  });
}

export async function getCurrentGingrOwnerProfile() {
  return readThroughCache(ownerProfileCache, async () => {
    const response = await runGingrDiscovery<CurrentGingrOwnerProfileResponse>({
      action: "current-owner-profile",
    });

    return response?.data ?? null;
  });
}

export function getCachedCurrentGingrOwnerProfile() {
  return ownerProfileCache.hasValue ? ownerProfileCache.value : undefined;
}

export async function linkCurrentGingrClient() {
  const response = await runGingrDiscovery<LinkCurrentClientResponse>({
    action: "link-current-client",
  });

  return response?.data ?? null;
}

export async function getGingrLocationCities() {
  return readThroughCache(locationCitiesCache, async () => {
    const response = await runGingrDiscovery<GingrLocationCitiesResponse>({
      action: "location-cities",
    });

    return response?.data?.locations ?? [];
  });
}

export function getCachedGingrLocationCities() {
  return locationCitiesCache.hasValue ? locationCitiesCache.value ?? [] : undefined;
}

export async function getCurrentGingrReservations() {
  return readThroughCache(reservationsCache, async () => {
    const response = await runGingrDiscovery<CurrentGingrReservationsResponse>({
      action: "current-reservations",
    });

    return response?.data?.reservations ?? [];
  });
}

export async function getCurrentGingrInvoices() {
  return readThroughCache(invoicesCache, async () => {
    const response = await runGingrDiscovery<CurrentGingrInvoicesResponse>({
      action: "list-invoices",
    });

    return response?.data ?? null;
  });
}

export function getCachedCurrentGingrInvoices() {
  return invoicesCache.hasValue ? invoicesCache.value : undefined;
}

export async function getGingrReservationDetail(reservationIds: string[]) {
  const normalizedIds = normalizeReservationIds(reservationIds);
  const cachedDetail = selectCachedReservationDetail(normalizedIds);

  if (cachedDetail) {
    return cachedDetail;
  }

  const key = normalizedIds.join("|");
  const existingRequest = reservationDetailRequests.get(key);

  if (existingRequest) {
    return existingRequest;
  }

  const requestGeneration = cacheGeneration;
  const request = runGingrDiscovery<GingrReservationDetailResponse>({
    action: "reservation-detail",
    reservationIds: normalizedIds,
  })
    .then((response) => {
      const detail = response?.data ?? null;
      if (detail && requestGeneration === cacheGeneration) {
        mergeReservationDetailCache(detail, normalizedIds);
      }
      return selectCachedReservationDetail(normalizedIds) ?? detail;
    })
    .finally(() => {
      if (reservationDetailRequests.get(key) === request) {
        reservationDetailRequests.delete(key);
      }
    });

  reservationDetailRequests.set(key, request);
  return request;
}

export function getCachedGingrReservationDetail(reservationIds: string[]) {
  return selectCachedReservationDetail(normalizeReservationIds(reservationIds));
}

export async function getGingrReservationRequestCatalog() {
  return readThroughCache(requestCatalogCache, async () => {
    const response = await runGingrDiscovery<GingrReservationRequestCatalog>({
      action: "request-catalog",
    });

    return response?.data ?? null;
  });
}

export function getCachedGingrReservationRequestCatalog() {
  return requestCatalogCache.hasValue ? requestCatalogCache.value : undefined;
}

function normalizeReservationIds(reservationIds: string[]) {
  return Array.from(new Set(reservationIds.map((id) => id.trim()).filter(Boolean))).sort();
}

function selectCachedReservationDetail(
  reservationIds: string[],
): GingrReservationDetailResponse | null {
  if (!reservationDetailCache || reservationIds.length === 0) {
    return null;
  }

  const requestedIds = new Set(reservationIds);
  const reservations = reservationDetailCache.reservations.filter((reservation) =>
    requestedIds.has(reservation.id),
  );

  if (reservations.length !== requestedIds.size) {
    return null;
  }

  const estimatesByReservation = Object.fromEntries(
    Object.entries(reservationDetailCache.estimatesByReservation ?? {}).filter(([id]) =>
      requestedIds.has(id),
    ),
  );

  return {
    estimate:
      reservationIds.length === 1
        ? estimatesByReservation[reservationIds[0]] ?? null
        : null,
    estimatesByReservation,
    ownerId: reservationDetailCache.ownerId,
    reservations,
  };
}

function mergeReservationDetailCache(
  detail: GingrReservationDetailResponse,
  requestedIds: string[],
) {
  const reservations = new Map(
    (reservationDetailCache?.reservations ?? []).map((reservation) => [reservation.id, reservation]),
  );

  for (const reservation of detail.reservations) {
    reservations.set(reservation.id, reservation);
  }

  reservationDetailCache = {
    estimate: null,
    estimatesByReservation: {
      ...(reservationDetailCache?.estimatesByReservation ?? {}),
      ...(detail.estimatesByReservation ?? {}),
      ...(requestedIds.length === 1 && detail.estimate
        ? { [requestedIds[0]]: detail.estimate }
        : {}),
    },
    ownerId: detail.ownerId ?? reservationDetailCache?.ownerId ?? null,
    reservations: Array.from(reservations.values()),
  };
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
