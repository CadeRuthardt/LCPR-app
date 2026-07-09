type DiscoveryAction =
  | "locations"
  | "location-cities"
  | "reservation-types"
  | "species"
  | "services-by-type"
  | "request-catalog"
  | "list-invoices"
  | "current-owner"
  | "current-owner-profile"
  | "current-pets"
  | "reservation-detail"
  | "current-reservations"
  | "reservation-detail-test"
  | "current-client-snapshot";

type DiscoveryRequest = {
  action?: DiscoveryAction;
  reservationTypeId?: string | number;
  locationId?: string | number;
  reservationId?: string | number;
  reservationIds?: Array<string | number>;
};

type AuthUser = {
  id: string;
  email?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sensitiveKeyPattern =
  /(api[-_]?key|authorization|bearer|card|cc_|credit|password|secret|ssn|token)/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const gingrBaseUrl = normalizeBaseUrl(Deno.env.get("GINGR_BASE_URL"));
  const gingrApiKey = Deno.env.get("GINGR_API_KEY");

  if (!gingrBaseUrl || !gingrApiKey) {
    return jsonResponse(
      {
        error:
          "Gingr discovery is not configured. Set GINGR_BASE_URL and GINGR_API_KEY as Supabase Edge Function secrets.",
      },
      500,
    );
  }

  const authResult = await getAuthenticatedUser(request);

  if ("error" in authResult) {
    return jsonResponse({ error: authResult.error }, authResult.status);
  }

  const body = (await request.json().catch(() => ({}))) as DiscoveryRequest;
  const action = body.action;

  try {
    if (action === "locations") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/get_locations"),
      });
    }

    if (action === "location-cities") {
      return jsonResponse({
        action,
        data: await buildLocationCities(gingrBaseUrl, gingrApiKey),
      });
    }

    if (action === "reservation-types") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/reservation_types"),
      });
    }

    if (action === "species") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/get_species"),
      });
    }

    if (action === "services-by-type") {
      if (!body.reservationTypeId) {
        return jsonResponse({ error: "reservationTypeId is required." }, 400);
      }

      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/get_services_by_type", {
          type_id: String(body.reservationTypeId),
          ...(body.locationId ? { location_id: String(body.locationId) } : {}),
        }),
      });
    }

    if (action === "request-catalog") {
      return jsonResponse({
        action,
        data: await buildRequestCatalog(gingrBaseUrl, gingrApiKey),
      });
    }

    if (action === "list-invoices") {
      return jsonResponse({
        action,
        data: await buildCurrentOwnerInvoices(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-owner") {
      return jsonResponse({
        action,
        data: await findOwnerByEmail(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-owner-profile") {
      return jsonResponse({
        action,
        data: await buildCurrentOwnerProfile(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-pets") {
      return jsonResponse({
        action,
        data: await buildCurrentPets(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-reservations") {
      return jsonResponse({
        action,
        data: await buildCurrentReservations(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "reservation-detail") {
      return jsonResponse({
        action,
        data: await buildReservationDetail(gingrBaseUrl, gingrApiKey, authResult.user, body),
      });
    }

    if (action === "reservation-detail-test") {
      return jsonResponse({
        action,
        data: await buildReservationDetailTest(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-client-snapshot") {
      return jsonResponse({
        action,
        data: await buildCurrentClientSnapshot(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    return jsonResponse(
      {
        error:
          "Unsupported discovery action. Use locations, location-cities, reservation-types, species, services-by-type, request-catalog, list-invoices, current-owner, current-owner-profile, current-pets, current-reservations, reservation-detail, reservation-detail-test, or current-client-snapshot.",
      },
      400,
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Gingr discovery request failed.",
      },
      502,
    );
  }
});

async function buildLocationCities(baseUrl: string, apiKey: string) {
  const response = await gingrGet(baseUrl, apiKey, "/api/v1/get_locations");
  const locations = unwrapGingrArray(response)
    .map(normalizeLocation)
    .filter((location): location is NormalizedLocation => Boolean(location));

  return {
    locations: dedupeLocationsByCity(locations),
  };
}

async function buildRequestCatalog(baseUrl: string, apiKey: string) {
  const [locationsResponse, reservationTypesResponse, speciesResponse] = await Promise.all([
    gingrGet(baseUrl, apiKey, "/api/v1/get_locations").catch(() => null),
    gingrGet(baseUrl, apiKey, "/api/v1/reservation_types").catch(() => null),
    gingrGet(baseUrl, apiKey, "/api/v1/get_species").catch(() => null),
  ]);
  const locations = unwrapGingrArray(locationsResponse)
    .map(normalizeLocation)
    .filter((location): location is NormalizedLocation => Boolean(location));
  const reservationTypes = unwrapGingrArray(reservationTypesResponse)
    .map(normalizeCatalogItem)
    .filter((item): item is NormalizedCatalogItem => Boolean(item));
  const species = unwrapGingrArray(speciesResponse)
    .map(normalizeCatalogItem)
    .filter((item): item is NormalizedCatalogItem => Boolean(item));
  const serviceGroups = await buildServiceGroups(baseUrl, apiKey, reservationTypes, locations);

  return {
    locations: dedupeLocationsByCity(locations),
    reservationTypes,
    serviceGroups,
    species,
  };
}

async function getAuthenticatedUser(request: Request): Promise<
  | { user: AuthUser }
  | {
      error: string;
      status: number;
    }
> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Supabase auth environment is not available.", status: 500 };
  }

  if (!authorization) {
    return { error: "Authentication is required.", status: 401 };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    return { error: "Invalid or expired session.", status: 401 };
  }

  const user = (await response.json()) as AuthUser;

  if (!user.id) {
    return { error: "Invalid session user.", status: 401 };
  }

  return { user };
}

type NormalizedLocation = {
  city: string;
  id: string | null;
  name: string;
};

type NormalizedCatalogItem = {
  id: string;
  name: string;
};

type NormalizedServiceGroup = {
  locationId: string | null;
  reservationTypeId: string;
  services: NormalizedCatalogItem[];
};

function normalizeLocation(value: unknown): NormalizedLocation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const location = value as Record<string, unknown>;
  const name =
    readString(location, "name") ??
    readString(location, "location_name") ??
    readString(location, "label") ??
    readString(location, "title") ??
    "";
  const city =
    normalizeCityName(
      readString(location, "city") ??
        readString(location, "location_city") ??
        readString(location, "name") ??
        readString(location, "location_name") ??
        readString(location, "label") ??
        readString(location, "title"),
    ) ?? name;

  if (!city) {
    return null;
  }

  return {
    city,
    id: readString(location, "id") ?? readString(location, "location_id"),
    name: name || city,
  };
}

function normalizeCatalogItem(value: unknown): NormalizedCatalogItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const id = readAnyString(item, [
    "id",
    "type_id",
    "reservation_type_id",
    "species_id",
    "service_id",
    "value",
  ]);
  const name = readAnyString(item, [
    "name",
    "label",
    "title",
    "reservation_type",
    "reservation_type_name",
    "species",
    "species_name",
    "service",
    "service_name",
  ]);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
  };
}

async function buildServiceGroups(
  baseUrl: string,
  apiKey: string,
  reservationTypes: NormalizedCatalogItem[],
  locations: NormalizedLocation[],
) {
  const groups: NormalizedServiceGroup[] = [];

  for (const reservationType of reservationTypes) {
    const scopedLocations = locations.length > 0 ? locations : [{ id: null }];

    for (const location of scopedLocations) {
      const response = await gingrGet(baseUrl, apiKey, "/api/v1/get_services_by_type", {
        type_id: reservationType.id,
        ...(location.id ? { location_id: location.id } : {}),
      }).catch((error) => {
        console.warn("Unable to load Gingr services for catalog.", error);
        return null;
      });

      groups.push({
        locationId: location.id ?? null,
        reservationTypeId: reservationType.id,
        services: unwrapGingrArray(response)
          .map(normalizeCatalogItem)
          .filter((item): item is NormalizedCatalogItem => Boolean(item)),
      });
    }
  }

  return groups;
}

function normalizeCityName(value: string | null) {
  if (!value) {
    return null;
  }

  const knownCities = ["Amarillo", "Wichita Falls", "New Braunfels"];
  const knownCity = knownCities.find((city) => value.toLowerCase().includes(city.toLowerCase()));

  if (knownCity) {
    return knownCity;
  }

  return value
    .replace(/^le chateau pet resort\s*[-–—:]?\s*/i, "")
    .replace(/\s*,\s*(tx|texas)$/i, "")
    .trim();
}

function dedupeLocationsByCity(locations: NormalizedLocation[]) {
  const byCity = new Map<string, NormalizedLocation>();

  for (const location of locations) {
    const key = location.city.toLowerCase();

    if (!byCity.has(key)) {
      byCity.set(key, location);
    }
  }

  return Array.from(byCity.values()).sort((a, b) => a.city.localeCompare(b.city));
}

async function buildCurrentPets(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerData = unwrapGingrData<Record<string, unknown>>(owner);
  const animals = Array.isArray(ownerData?.animals) ? ownerData.animals : [];

  return {
    ownerId: readString(ownerData, "id"),
    pets: animals.map(normalizeAnimal).filter(Boolean),
  };
}

async function buildCurrentReservations(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerId = extractFirstId(owner);

  if (!ownerId) {
    return {
      ownerId: null,
      reservations: [],
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const response = await gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", {
    id: String(ownerId),
  });
  const locations = await gingrGet(baseUrl, apiKey, "/api/v1/get_locations")
    .then((locationsResponse) =>
      unwrapGingrArray(locationsResponse)
        .map(normalizeLocation)
        .filter((location): location is NormalizedLocation => Boolean(location)),
    )
    .catch(() => []);
  const locationById = new Map(
    locations
      .filter((location) => location.id)
      .map((location) => [String(location.id), location.city]),
  );
  const reservations = unwrapGingrArray(response)
    .map((reservation) => normalizeReservation(reservation, locationById))
    .filter((reservation): reservation is NormalizedReservation => Boolean(reservation));

  return {
    ownerId: String(ownerId),
    reservations,
  };
}

async function buildReservationDetailTest(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerId = extractFirstId(owner);

  if (!ownerId) {
    return {
      ownerId: null,
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const reservationsResponse = await gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", {
    id: String(ownerId),
  });
  const rawReservations = unwrapGingrArray(reservationsResponse);
  const selectedReservation = selectReservationForDetailTest(rawReservations);
  const selectedReservationId = selectedReservation
    ? readAnyString(selectedReservation, ["r_id", "reservation_id", "id"])
    : null;

  if (!selectedReservation || !selectedReservationId) {
    return {
      ownerId: String(ownerId),
      reservationCount: rawReservations.length,
      note: "No reservation id was found for this owner.",
    };
  }

  const ownerByReservation = await gingrGet(baseUrl, apiKey, "/api/v1/owner", {
    reservation_id: selectedReservationId,
  }).then(buildDebugResponseSummary).catch(formatDebugLookupError);
  const estimate = await gingrGet(baseUrl, apiKey, "/api/v1/existing_reservation_estimate", {
    id: selectedReservationId,
  }).then(buildDebugResponseSummary).catch(formatDebugLookupError);

  return {
    ownerId: String(ownerId),
    reservationCount: rawReservations.length,
    selectedReservation: {
      id: selectedReservationId,
      normalized: normalizeReservation(selectedReservation),
      fieldKeys: readObjectKeys(selectedReservation),
      rawPreview: selectedReservation,
    },
    ownerByReservation,
    estimate,
  };
}

async function buildReservationDetail(
  baseUrl: string,
  apiKey: string,
  user: AuthUser,
  request: DiscoveryRequest,
) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerId = extractFirstId(owner);

  if (!ownerId) {
    return {
      ownerId: null,
      reservations: [],
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const requestedIds = normalizeRequestedReservationIds(request);

  if (requestedIds.length === 0) {
    throw new Error("reservationId or reservationIds is required.");
  }

  const [reservationsResponse, locations] = await Promise.all([
    gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", {
      id: String(ownerId),
    }),
    gingrGet(baseUrl, apiKey, "/api/v1/get_locations")
      .then((locationsResponse) =>
        unwrapGingrArray(locationsResponse)
          .map(normalizeLocation)
          .filter((location): location is NormalizedLocation => Boolean(location)),
      )
      .catch(() => []),
  ]);
  const rawReservations = unwrapGingrArray(reservationsResponse);
  const reservationById = new Map(
    rawReservations
      .map((reservation) => {
        if (!reservation || typeof reservation !== "object" || Array.isArray(reservation)) {
          return null;
        }

        const record = reservation as Record<string, unknown>;
        const id = readAnyString(record, ["r_id", "reservation_id", "id"]);

        return id ? ([id, record] as const) : null;
      })
      .filter((entry): entry is readonly [string, Record<string, unknown>] => Boolean(entry)),
  );
  const missingIds = requestedIds.filter((id) => !reservationById.has(id));

  if (missingIds.length > 0) {
    throw new Error(
      `One or more reservations could not be found for the signed-in client: ${missingIds.join(
        ", ",
      )}`,
    );
  }

  const locationById = new Map(
    locations
      .filter((location) => location.id)
      .map((location) => [String(location.id), location.city]),
  );
  const selectedReservations = requestedIds
    .map((id) => reservationById.get(id))
    .filter((reservation): reservation is Record<string, unknown> => Boolean(reservation));
  const estimate = await gingrGet(baseUrl, apiKey, "/api/v1/existing_reservation_estimate", {
    id: requestedIds[0],
  }).then(normalizeReservationEstimate).catch(() => null);

  return {
    ownerId: String(ownerId),
    reservations: selectedReservations.map((reservation) =>
      normalizeReservationDetail(reservation, locationById),
    ),
    estimate,
  };
}

function normalizeRequestedReservationIds(request: DiscoveryRequest) {
  const ids = [
    request.reservationId,
    ...(Array.isArray(request.reservationIds) ? request.reservationIds : []),
  ];

  return Array.from(
    new Set(
      ids
        .flatMap((id) => String(id ?? "").split(","))
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

async function buildCurrentOwnerInvoices(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerId = extractFirstId(owner);

  if (!ownerId) {
    return {
      ownerId: null,
      invoices: null,
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setFullYear(today.getFullYear() - 2);
  const toDate = new Date(today);
  toDate.setMonth(today.getMonth() + 1);

  const lookupVariants = [
    {
      label: "completedRecent",
      params: {
        complete: "true",
        closed_only: "false",
        from_date: formatIsoDateForGingr(fromDate),
        to_date: formatIsoDateForGingr(toDate),
        page: "1",
        per_page: "100",
      },
    },
    {
      label: "completedAnyDate",
      params: {
        complete: "true",
        closed_only: "false",
        page: "1",
        per_page: "100",
      },
    },
    {
      label: "estimatesRecent",
      params: {
        complete: "false",
        closed_only: "false",
        from_date: formatIsoDateForGingr(fromDate),
        to_date: formatIsoDateForGingr(toDate),
        page: "1",
        per_page: "100",
      },
    },
  ];

  const lookups = await Promise.all(
    lookupVariants.map(async (variant) => {
      const result = await findInvoicesForOwner(baseUrl, apiKey, variant.params, String(ownerId), user.email);

      return {
        label: variant.label,
        params: variant.params,
        pagesScanned: result.pagesScanned,
        totalReturned: result.totalReturned,
        matchingOwnerCount: result.matchingInvoices.length,
        matchingOwnerInvoices: result.matchingInvoices
          .map(normalizeInvoiceSummary)
          .filter(Boolean)
          .slice(0, 20),
        sampleFieldKeys: result.sampleFieldKeys,
      };
    }),
  );

  return {
    ownerId: String(ownerId),
    lookups,
    note:
      "list_invoices is a global/date-based Gingr endpoint. This diagnostic returns only signed-in owner matches plus non-sensitive counts/field keys.",
  };
}

async function buildCurrentOwnerProfile(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerData = unwrapGingrData<Record<string, unknown>>(owner);

  if (!ownerData) {
    return {
      ownerId: null,
      displayName: null,
      email: user.email ?? null,
      imageUrl: null,
      imageSourceKey: null,
      note: "No owner profile was found in Gingr.",
    };
  }

  const image = readOwnerImage(ownerData, baseUrl);
  const firstName = readString(ownerData, "first_name");
  const lastName = readString(ownerData, "last_name");

  return {
    ownerId: readString(ownerData, "id"),
    displayName: [firstName, lastName].filter(Boolean).join(" ") || null,
    email: readString(ownerData, "email") ?? user.email ?? null,
    imageUrl: image?.url ?? null,
    imageSourceKey: image?.key ?? null,
  };
}

async function buildCurrentClientSnapshot(
  baseUrl: string,
  apiKey: string,
  user: AuthUser,
) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerId = extractFirstId(owner);

  if (!ownerId) {
    return {
      owner,
      reservations: null,
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const reservations = await gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", {
    id: String(ownerId),
  });

  return {
    owner,
    reservations,
  };
}

function normalizeAnimal(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const animal = value as Record<string, unknown>;
  const id = readString(animal, "a_id") ?? readString(animal, "id");
  const name = readString(animal, "animal_name") ?? readString(animal, "name");

  if (!id || !name) {
    return null;
  }

  const birthdaySeconds = readNumber(animal, "birthday");
  const immunizationExpirationSeconds = readNumber(animal, "next_immunization_expiration");
  const checkedInReservationId = readString(animal, "checked_in_r_id");

  return {
    id,
    name,
    breed: readString(animal, "breed_name") ?? "Breed not listed",
    species: readString(animal, "species_name") ?? "Pet",
    gender: readString(animal, "gender"),
    fixed: readBoolean(animal, "fixed"),
    vip: readBoolean(animal, "vip"),
    birthday: birthdaySeconds ? secondsToIsoDate(birthdaySeconds) : null,
    age: birthdaySeconds ? formatAgeFromSeconds(birthdaySeconds) : "Age not listed",
    weight: formatWeight(readString(animal, "animal_weight") ?? readString(animal, "weight")),
    imageUrl: readString(animal, "image"),
    allergies: stripHtml(readString(animal, "allergies")),
    colorAndMarkings: readString(readRecord(animal, "form_data"), "color_and_markings_gingr"),
    feedingMethod: readString(animal, "feeding_method"),
    feedingNotes: readString(animal, "feeding_notes"),
    feedingSchedules: normalizeFeedingSchedules(readRecord(animal, "form_data")),
    feedingType: readString(animal, "feeding_type"),
    medicationNotes: normalizeMedicationNotes(animal),
    medicationSchedules: normalizeMedicationSchedules(readRecord(animal, "form_data")),
    medicines: stripHtml(readString(animal, "medicines")),
    notes: stripHtml(readString(animal, "a_notes")),
    vaccinationSummary: immunizationExpirationSeconds
      ? `Vaccinations current through ${formatDateFromSeconds(immunizationExpirationSeconds)}`
      : "Vaccination status not listed",
    nextImmunizationExpiration:
      immunizationExpirationSeconds ? secondsToIsoDate(immunizationExpirationSeconds) : null,
    status: checkedInReservationId ? "Checked In" : "Active",
    source: "gingr",
    vetName: readString(animal, "vet_name"),
    vetPhone: readString(animal, "vet_phone"),
  };
}

type NormalizedReservation = {
  animalNames: string[];
  endDate: string | null;
  id: string;
  location: string | null;
  reservationType: string | null;
  startDate: string | null;
  status: string;
};

type NormalizedReservationDetail = NormalizedReservation & {
  baseRate: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  createdBy: string | null;
  endDateTimeLabel: string | null;
  feedingAmount: string | null;
  feedingNotes: string | null;
  feedingTime: string | null;
  finalRate: string | null;
  groomingNotes: string | null;
  nights: string | null;
  notes: string | null;
  petDetails: Array<{
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
  }>;
  precheckCompleted: boolean | null;
  services: string | null;
  startDateTimeLabel: string | null;
  unitsOfTime: string | null;
};

function normalizeReservation(value: unknown, locationById = new Map<string, string>()) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const reservation = value as Record<string, unknown>;
  const id = readAnyString(reservation, ["r_id", "reservation_id", "id"]);

  if (!id) {
    return null;
  }

  return {
    id,
    animalNames: readReservationAnimalNames(reservation),
    endDate: readAnyDate(reservation, [
      "end_date",
      "checkout_date",
      "checkout_at",
      "out_date",
      "end",
    ]),
    location: readReservationLocation(reservation, locationById),
    reservationType: readAnyString(reservation, [
      "reservation_type",
      "reservation_type_name",
      "type",
      "service",
    ]),
    startDate: readAnyDate(reservation, [
      "start_date",
      "checkin_date",
      "check_in_date",
      "checkin_at",
      "in_date",
      "start",
    ]),
    status: readReservationStatus(reservation),
  };
}

function normalizeReservationDetail(
  reservation: Record<string, unknown>,
  locationById = new Map<string, string>(),
): NormalizedReservationDetail {
  const normalizedReservation = normalizeReservation(reservation, locationById);

  if (!normalizedReservation) {
    throw new Error("Unable to normalize reservation detail.");
  }

  return {
    ...normalizedReservation,
    baseRate: formatMoney(readAnyString(reservation, ["base_rate", "baseRate"])),
    cancellationReason: readAnyString(reservation, ["cancellation_reason", "cancel_reason"]),
    cancelledBy: readAnyString(reservation, ["cancelled_by_username", "canceled_by_username"]),
    checkInAt: readAnyString(reservation, ["check_in_stamp_formatted", "checkin_stamp_formatted"]),
    checkOutAt: readAnyString(reservation, [
      "check_out_stamp_formatted",
      "checkout_stamp_formatted",
    ]),
    createdBy: readAnyString(reservation, ["created_by", "created_by_username"]),
    endDateTimeLabel: readAnyString(reservation, ["end_date_formatted", "checkout_date_formatted"]),
    feedingAmount: readAnyString(reservation, ["feeding_amount", "feedingAmount"]),
    feedingNotes: readAnyString(reservation, ["feeding_notes", "feedingNotes"]),
    feedingTime: cleanCommaList(readAnyString(reservation, ["feeding_time", "feedingTime"])),
    finalRate: formatMoney(readAnyString(reservation, ["final_rate", "finalRate"])),
    groomingNotes: stripHtml(readAnyString(reservation, ["grooming_notes", "groomingNotes"])),
    nights: readAnyString(reservation, ["nights", "night_count"]),
    notes: stripHtml(readAnyString(reservation, ["r_notes", "reservation_notes", "notes"])),
    petDetails: readReservationPetDetails(reservation),
    precheckCompleted: readNullableBoolean(reservation, "is_precheck_completed"),
    services: stripHtml(readAnyString(reservation, ["services_string", "services", "service_names"])),
    startDateTimeLabel: readAnyString(reservation, [
      "start_date_formatted",
      "checkin_date_formatted",
    ]),
    unitsOfTime: readAnyString(reservation, ["units_of_time", "units"]),
  };
}

function readReservationPetDetails(reservation: Record<string, unknown>) {
  const animals = reservation.animals;

  if (Array.isArray(animals) && animals.length > 0) {
    return animals
      .map((animal) => {
        if (!animal || typeof animal !== "object" || Array.isArray(animal)) {
          return null;
        }

        return readReservationPetDetail(animal as Record<string, unknown>);
      })
      .filter((animal): animal is ReturnType<typeof readReservationPetDetail> => Boolean(animal));
  }

  const directDetail = readReservationPetDetail(reservation);

  return directDetail ? [directDetail] : [];
}

function readReservationPetDetail(record: Record<string, unknown>) {
  const name = readAnyString(record, ["animal_name", "name", "pet_name"]);

  if (!name) {
    return null;
  }

  return {
    allergies: stripHtml(readString(record, "allergies")),
    breed: readAnyString(record, ["breed_name", "breed"]),
    imageUrl: readAnyString(record, ["image", "image_url", "animal_image"]),
    medicines: stripHtml(readString(record, "medicines")),
    name,
    notes: stripHtml(readAnyString(record, ["a_notes", "animal_notes", "notes"])),
    species: readAnyString(record, ["species_name", "species"]),
    temperament: readAnyString(record, ["temperment_type", "temperament_type", "temperament"]),
    vetName: readString(record, "vet_name"),
    vetPhone: readString(record, "vet_phone"),
    weight: formatNullableWeight(readAnyString(record, ["animal_weight", "weight"])),
  };
}

function normalizeReservationEstimate(value: unknown) {
  const data = unwrapGingrData<Record<string, unknown>>(value);

  if (!data) {
    return null;
  }

  const location = readRecord(data, "location");
  const detailsValue = data.details;
  const reservationsValue = data.reservations;

  return {
    details: Array.isArray(detailsValue) ? detailsValue.map(normalizeEstimateDetail).filter(Boolean) : [],
    location: location
      ? {
          city: readString(location, "city"),
          email: readString(location, "email"),
          hours: stripHtml(readString(location, "hours")),
          name: readString(location, "name"),
          phone: readString(location, "phone"),
        }
      : null,
    reservations: Array.isArray(reservationsValue)
      ? reservationsValue.map(normalizeEstimateReservation).filter(Boolean)
      : [],
  };
}

function normalizeEstimateDetail(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const detail = value as Record<string, unknown>;

  return {
    label: readAnyString(detail, ["name", "label", "description", "item_name"]),
    quantity: readAnyString(detail, ["quantity", "qty"]),
    total: formatMoney(readAnyString(detail, ["total", "amount", "price"])),
  };
}

function normalizeEstimateReservation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const reservation = value as Record<string, unknown>;

  return {
    label: readAnyString(reservation, ["name", "type", "reservation_type"]),
    subtotal: formatMoney(readAnyString(reservation, ["subtotal", "total", "amount"])),
  };
}

function readReservationStatus(reservation: Record<string, unknown>) {
  if (readAnyString(reservation, ["cancel_stamp", "cancelled_at", "canceled_at"])) {
    return "Cancelled";
  }

  if (readAnyString(reservation, ["check_out_stamp", "checkout_stamp", "checked_out_at"])) {
    return "Checked Out";
  }

  if (readAnyString(reservation, ["check_in_stamp", "checkin_stamp", "checked_in_at"])) {
    return "Checked In";
  }

  if (readAnyString(reservation, ["wait_list_stamp", "waitlist_stamp", "wait_listed_at"])) {
    return "Wait Listed";
  }

  return readAnyString(reservation, ["status", "status_name", "reservation_status"]) ?? "Confirmed";
}

function readReservationLocation(
  reservation: Record<string, unknown>,
  locationById: Map<string, string>,
) {
  const locationId = readAnyString(reservation, ["location_id", "loc_id", "l_id"]);
  const mappedLocation = locationId ? locationById.get(locationId) : null;
  const directLocation = readAnyString(reservation, ["location_city", "city", "location_name", "location"]);

  return normalizeSpecificLocationName(directLocation) ?? mappedLocation ?? null;
}

function normalizeSpecificLocationName(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizeCityName(value);

  if (!normalized || /^le chateau pet resort$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

function selectReservationForDetailTest(rawReservations: unknown[]) {
  const reservations = rawReservations
    .filter((reservation): reservation is Record<string, unknown> =>
      Boolean(reservation && typeof reservation === "object" && !Array.isArray(reservation)),
    )
    .sort((a, b) => reservationSortValue(b) - reservationSortValue(a));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pastReservation = reservations.find((reservation) => {
    const date = readReservationEndOrStartDate(reservation);

    return date ? parseIsoDateForSort(date) < today.getTime() : false;
  });
  const checkedOutPastReservation = reservations.find((reservation) => {
    const date = readReservationEndOrStartDate(reservation);

    return Boolean(
      date &&
        parseIsoDateForSort(date) < today.getTime() &&
        readAnyString(reservation, ["check_out_stamp", "checkout_stamp", "checked_out_at"]),
    );
  });
  const activePastReservation = reservations.find((reservation) => {
    const date = readReservationEndOrStartDate(reservation);

    return Boolean(
      date &&
        parseIsoDateForSort(date) < today.getTime() &&
        !readAnyString(reservation, ["cancel_stamp", "cancelled_at", "canceled_at"]),
    );
  });

  return checkedOutPastReservation ?? activePastReservation ?? pastReservation ?? reservations[0] ?? null;
}

function reservationSortValue(reservation: Record<string, unknown>) {
  const date = readReservationEndOrStartDate(reservation);

  return date ? parseIsoDateForSort(date) : 0;
}

function readReservationEndOrStartDate(reservation: Record<string, unknown>) {
  return (
    readAnyDate(reservation, [
      "end_date",
      "checkout_date",
      "checkout_at",
      "out_date",
      "end",
    ]) ??
    readAnyDate(reservation, [
      "start_date",
      "checkin_date",
      "check_in_date",
      "checkin_at",
      "in_date",
      "start",
    ])
  );
}

function parseIsoDateForSort(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).getTime();
}

function buildDebugResponseSummary(value: unknown) {
  return {
    fieldKeys: readObjectKeys(unwrapGingrData(value) ?? value),
    preview: value,
  };
}

function formatDebugLookupError(error: unknown) {
  return {
    error: error instanceof Error ? error.message : "Gingr lookup failed.",
  };
}

function unwrapGingrData<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const data = record.data;

  if (data && typeof data === "object") {
    return data as T;
  }

  return record as T;
}

function unwrapGingrArray(value: unknown): unknown[] {
  const data = unwrapGingrData<unknown>(value);

  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as Record<string, unknown>;

  for (const key of ["locations", "location", "invoices", "invoice", "data", "items", "results"]) {
    const nestedValue = record[key];

    if (Array.isArray(nestedValue)) {
      return nestedValue;
    }
  }

  return [];
}

async function findInvoicesForOwner(
  baseUrl: string,
  apiKey: string,
  baseParams: Record<string, string>,
  ownerId: string,
  ownerEmail?: string,
) {
  const maxPages = 10;
  const matchingInvoices: unknown[] = [];
  let pagesScanned = 0;
  let totalReturned = 0;
  let sampleFieldKeys: string[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await gingrGet(baseUrl, apiKey, "/api/v1/list_invoices", {
      ...baseParams,
      page: String(page),
    });
    const invoices = unwrapGingrArray(response);

    if (invoices.length === 0) {
      break;
    }

    pagesScanned = page;
    totalReturned += invoices.length;
    sampleFieldKeys = sampleFieldKeys.length > 0 ? sampleFieldKeys : readObjectKeys(invoices[0]);
    matchingInvoices.push(
      ...invoices.filter((invoice) => invoiceMatchesOwner(invoice, ownerId, ownerEmail)),
    );

    if (matchingInvoices.length >= 20) {
      break;
    }

    const perPage = Number(baseParams.per_page);

    if (Number.isFinite(perPage) && invoices.length < perPage) {
      break;
    }
  }

  return {
    matchingInvoices,
    pagesScanned,
    sampleFieldKeys,
    totalReturned,
  };
}

function invoiceMatchesOwner(value: unknown, ownerId: string, ownerEmail?: string) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const invoice = value as Record<string, unknown>;
  const directOwnerId = readAnyString(invoice, [
    "owner_id",
    "o_id",
    "customer_id",
    "client_id",
    "user_id",
    "owner",
  ]);
  const directEmail = readAnyString(invoice, ["email", "owner_email", "customer_email", "client_email"]);

  if (directOwnerId === ownerId || (ownerEmail && directEmail === ownerEmail)) {
    return true;
  }

  const owner = readRecord(invoice, "owner") ?? readRecord(invoice, "customer") ?? readRecord(invoice, "client");
  const nestedOwnerId = owner ? readAnyString(owner, ["id", "owner_id", "o_id", "customer_id"]) : null;
  const nestedEmail = owner ? readAnyString(owner, ["email", "owner_email", "customer_email"]) : null;

  return nestedOwnerId === ownerId || Boolean(ownerEmail && nestedEmail === ownerEmail);
}

function normalizeInvoiceSummary(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const invoice = value as Record<string, unknown>;

  return {
    id: readAnyString(invoice, ["id", "invoice_id", "i_id", "transaction_id"]),
    ownerId: readAnyString(invoice, ["owner_id", "o_id", "customer_id", "client_id", "user_id"]),
    reservationId: readAnyString(invoice, ["reservation_id", "r_id"]),
    status: readAnyString(invoice, ["status", "invoice_status"]),
    date: readAnyDate(invoice, ["date", "invoice_date", "created_at", "created", "created_date"]),
    total: readAnyString(invoice, ["total", "invoice_total", "amount", "balance"]),
  };
}

function readObjectKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value as Record<string, unknown>).slice(0, 40);
}

function readOwnerImage(owner: Record<string, unknown>, baseUrl: string) {
  const imageKeys = [
    "image",
    "image_url",
    "profile_image",
    "profile_image_url",
    "profile_photo",
    "profile_photo_url",
    "owner_image",
    "owner_image_url",
    "avatar",
    "avatar_url",
    "photo",
    "photo_url",
    "picture",
    "picture_url",
  ];
  const nestedRecords = [
    owner,
    readRecord(owner, "form_data"),
    readRecord(owner, "profile"),
    readRecord(owner, "owner"),
  ].filter((record): record is Record<string, unknown> => Boolean(record));

  for (const record of nestedRecords) {
    for (const key of imageKeys) {
      const value = readString(record, key);

      if (value) {
        return {
          key,
          url: resolveGingrAssetUrl(value, baseUrl),
        };
      }
    }
  }

  return null;
}

function resolveGingrAssetUrl(value: string, baseUrl: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

function readAnyString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = readString(record, key);

    if (value) {
      return value;
    }
  }

  return null;
}

function readAnyDate(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const seconds = readNumber(record, key);

    if (seconds && seconds > 999999999) {
      return secondsToIsoDate(seconds);
    }

    const value = readString(record, key);

    if (value) {
      const isoDate = normalizeDateString(value);

      if (isoDate) {
        return isoDate;
      }
    }
  }

  return null;
}

function readReservationAnimalNames(reservation: Record<string, unknown>) {
  const directName = readAnyString(reservation, [
    "animal_name",
    "pet_name",
    "animal_names",
    "reservation_animals",
  ]);

  if (directName) {
    return directName
      .split(/,|&|\band\b/i)
      .map((name) => name.trim())
      .filter(Boolean);
  }

  const animals = reservation.animals;

  if (!Array.isArray(animals)) {
    return [];
  }

  return animals
    .map((animal) => {
      if (!animal || typeof animal !== "object") {
        return null;
      }

      return readAnyString(animal as Record<string, unknown>, ["animal_name", "name", "pet_name"]);
    })
    .filter((name): name is string => Boolean(name));
}

function normalizeDateString(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const secondsValue = Number(value);

  if (Number.isFinite(secondsValue) && secondsValue > 999999999) {
    return secondsToIsoDate(secondsValue);
  }

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function readBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return value === true || value === 1 || value === "1" || value === "true";
}

function readNullableBoolean(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value === true || value === 1 || value === "1" || value === "true";
}

function readRecord(record: Record<string, unknown> | null, key: string) {
  if (!record) {
    return null;
  }

  const value = record[key];

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeFeedingSchedules(formData: Record<string, unknown> | null) {
  const feedingSchedule = readRecord(formData, "feeding_schedule");
  const schedules = readRecord(feedingSchedule, "feedingSchedules");

  if (!schedules) {
    return [];
  }

  return Object.values(schedules)
    .map((schedule) => {
      if (!schedule || typeof schedule !== "object") {
        return null;
      }

      const scheduleRecord = schedule as Record<string, unknown>;
      const scheduleLabel = readLabel(scheduleRecord, "feedingSchedule");
      const amountLabel = readLabel(scheduleRecord, "feedingAmount");
      const unitLabel = readLabel(scheduleRecord, "feedingUnit");
      const instructions = readString(scheduleRecord, "feedingInstructions");

      return {
        label: cleanLabel(scheduleLabel) ?? "Meal",
        amount: [cleanLabel(amountLabel), cleanLabel(unitLabel)].filter(Boolean).join(" "),
        instructions,
      };
    })
    .filter(Boolean);
}

function normalizeMedicationNotes(animal: Record<string, unknown>) {
  const formData = readRecord(animal, "form_data");
  const medicationSchedule = readRecord(formData, "medication_schedule");

  return (
    readString(medicationSchedule, "medicationNotes") ??
    stripHtml(readString(animal, "medicines"))
  );
}

function normalizeMedicationSchedules(formData: Record<string, unknown> | null) {
  const medicationSchedule = readRecord(formData, "medication_schedule");
  const schedules = readRecord(medicationSchedule, "medicationSchedules");

  if (!schedules) {
    return [];
  }

  return Object.values(schedules)
    .map((schedule) => {
      if (!schedule || typeof schedule !== "object") {
        return null;
      }

      const scheduleRecord = schedule as Record<string, unknown>;
      const medicationsValue = scheduleRecord.medications;
      const medications = Array.isArray(medicationsValue) ? medicationsValue : [];

      return {
        label: cleanLabel(readLabel(scheduleRecord, "medicationSchedule")) ?? "Medication",
        medications: medications
          .map((medication) => {
            if (!medication || typeof medication !== "object") {
              return null;
            }

            const medicationRecord = medication as Record<string, unknown>;
            const type = cleanLabel(readLabel(medicationRecord, "medicationType"));
            const amount = cleanLabel(readLabel(medicationRecord, "medicationAmount"));
            const unit = cleanLabel(readLabel(medicationRecord, "medicationUnit"));
            const notes = readString(medicationRecord, "medicationNotes");
            const startDate = readString(medicationRecord, "start_date");
            const endDate = readString(medicationRecord, "end_date");

            return {
              amount: [amount, unit].filter(Boolean).join(" "),
              endDate,
              notes,
              startDate,
              type,
            };
          })
          .filter(Boolean),
      };
    })
    .filter(Boolean);
}

function readLabel(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return readString(value as Record<string, unknown>, "label");
}

function cleanLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/^\*/, "").trim() || null;
}

function stripHtml(value: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function formatWeight(value: string | null) {
  if (!value) {
    return "Weight not listed";
  }

  return value.toLowerCase().includes("lb") ? value : `${value} lbs`;
}

function formatNullableWeight(value: string | null) {
  const formattedWeight = formatWeight(value);

  return formattedWeight === "Weight not listed" ? null : formattedWeight;
}

function formatMoney(value: string | null) {
  if (!value) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return amount.toLocaleString("en-US", {
    currency: "USD",
    style: "currency",
  });
}

function cleanCommaList(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function formatAgeFromSeconds(seconds: number) {
  const birthday = new Date(seconds * 1000);
  const today = new Date();
  let years = today.getFullYear() - birthday.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());

  if (!hasBirthdayPassed) {
    years -= 1;
  }

  if (years <= 0) {
    return "Under 1 year";
  }

  return years === 1 ? "1 year" : `${years} years`;
}

function secondsToIsoDate(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function formatDateFromSeconds(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatIsoDateForGingr(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function findOwnerByEmail(baseUrl: string, apiKey: string, user: AuthUser) {
  if (!user.email) {
    throw new Error("The signed-in user does not have an email address.");
  }

  return gingrGet(baseUrl, apiKey, "/api/v1/owner", { email: user.email });
}

async function gingrGet(
  baseUrl: string,
  apiKey: string,
  path: string,
  params: Record<string, string> = {},
) {
  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return gingrRequest(url, { method: "GET" });
}

async function gingrPost(
  baseUrl: string,
  apiKey: string,
  path: string,
  body: Record<string, string>,
) {
  const formData = new URLSearchParams({ key: apiKey, ...body });

  return gingrRequest(new URL(`${baseUrl}${path}`), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
}

async function gingrRequest(url: URL, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    throw new Error(
      `Gingr returned HTTP ${response.status}: ${typeof json === "string" ? json : JSON.stringify(redact(json))}`,
    );
  }

  return redact(json);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeBaseUrl(value?: string) {
  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, "");
}

function parseJson(text: string) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : redact(nestedValue),
    ]),
  );
}

function extractFirstId(value: unknown): string | number | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(extractFirstId).find(Boolean) ?? null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.id === "string" || typeof record.id === "number") {
    return record.id;
  }

  if (typeof record.owner_id === "string" || typeof record.owner_id === "number") {
    return record.owner_id;
  }

  return Object.values(record).map(extractFirstId).find(Boolean) ?? null;
}
