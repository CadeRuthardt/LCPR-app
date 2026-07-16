type DiscoveryAction =
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
  | "vip-camera-access"
  | "reservation-detail-test"
  | "estimate-test"
  | "current-client-snapshot";

type DiscoveryRequest = {
  action?: DiscoveryAction;
  reservationTypeId?: string | number;
  locationId?: string | number;
  reservationId?: string | number;
  reservationIds?: Array<string | number>;
  cameraLocationId?: string;
  vipAccessCode?: string;
};

type AuthUser = {
  id: string;
  email?: string;
};

type GingrClient = {
  apiKey: string;
  city: string;
  code: string;
};

type OwnerEmailMatch = {
  displayName: string | null;
  email: string | null;
  locationCity: string;
  locationCode: string;
  matchedBy: "primary_email" | "additional_owner_email";
  matchedEmail: string;
  ownerId: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sensitiveKeyPattern =
  /(api[-_]?key|authorization|bearer|card|cc_|credit|password|secret|ssn|token)/i;
const gingrRequestTimeoutMs = 8000;

type VipCameraAccessConfig = {
  camera: {
    id: string;
    title: string;
    url: string;
  };
  locationId: string;
};

const vipCameraAccessByLocationAndCode: Record<string, VipCameraAccessConfig> = {
  "amarillo:P110-CASTLE": {
    camera: {
      id: "amarillo-e110-vip",
      title: "E110 VIP",
      url: "https://idogcam.com/idogcamviewer.php?id=14230",
    },
    locationId: "amarillo",
  },
  "amarillo:P210-PAW": {
    camera: {
      id: "amarillo-e210-vip",
      title: "E210 VIP",
      url: "https://idogcam.com/idogcamviewer.php?id=1575",
    },
    locationId: "amarillo",
  },
  "amarillo:P301-CHATEAU": {
    camera: {
      id: "amarillo-e301-vip",
      title: "E301 VIP",
      url: "https://idogcam.com/idogcamviewer.php?id=1580",
    },
    locationId: "amarillo",
  },
  "wichita-falls:P110-CASTLE": {
    camera: {
      id: "wichita-falls-vip-110",
      title: "VIP 110",
      url: "https://idogcam.com/idogcamviewer.php?id=16210",
    },
    locationId: "wichita-falls",
  },
  "wichita-falls:P210-PAW": {
    camera: {
      id: "wichita-falls-vip-210",
      title: "VIP 210",
      url: "https://idogcam.com/idogcamviewer.php?id=16211",
    },
    locationId: "wichita-falls",
  },
  "wichita-falls:P310-CHATEAU": {
    camera: {
      id: "wichita-falls-vip-310",
      title: "VIP 310",
      url: "https://idogcam.com/idogcamviewer.php?id=16212",
    },
    locationId: "wichita-falls",
  },
};

function getConfiguredGingrClients(): GingrClient[] {
  const clients = [
    {
      apiKey: Deno.env.get("GINGR_API_KEY_AMA"),
      city: "Amarillo",
      code: "AMA",
    },
    {
      apiKey: Deno.env.get("GINGR_API_KEY_WF"),
      city: "Wichita Falls",
      code: "WF",
    },
    {
      apiKey: Deno.env.get("GINGR_API_KEY_NB"),
      city: "New Braunfels",
      code: "NB",
    },
    {
      apiKey: Deno.env.get("GINGR_API_KEY"),
      city: "Legacy",
      code: "LEGACY",
    },
  ];

  return clients
    .filter((client): client is GingrClient => Boolean(client.apiKey))
    .map((client) => ({
      ...client,
      apiKey: client.apiKey.trim(),
    }));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const gingrBaseUrl = normalizeBaseUrl(Deno.env.get("GINGR_BASE_URL"));
  const gingrClients = getConfiguredGingrClients();
  const primaryGingrClient = gingrClients[0];

  if (!gingrBaseUrl || !primaryGingrClient) {
    return jsonResponse(
      {
        error:
          "Gingr discovery is not configured. Set GINGR_BASE_URL and at least one location API key secret, such as GINGR_API_KEY_AMA or GINGR_API_KEY_WF.",
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
        data: await gingrGet(gingrBaseUrl, primaryGingrClient.apiKey, "/api/v1/get_locations"),
      });
    }

    if (action === "location-cities") {
      return jsonResponse({
        action,
        data: await buildLocationCities(gingrBaseUrl, primaryGingrClient.apiKey),
      });
    }

    if (action === "reservation-types") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, primaryGingrClient.apiKey, "/api/v1/reservation_types"),
      });
    }

    if (action === "species") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, primaryGingrClient.apiKey, "/api/v1/get_species"),
      });
    }

    if (action === "services-by-type") {
      if (!body.reservationTypeId) {
        return jsonResponse({ error: "reservationTypeId is required." }, 400);
      }

      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, primaryGingrClient.apiKey, "/api/v1/get_services_by_type", {
          type_id: String(body.reservationTypeId),
          ...(body.locationId ? { location_id: String(body.locationId) } : {}),
        }),
      });
    }

    if (action === "request-catalog") {
      return jsonResponse({
        action,
        data: await buildRequestCatalog(gingrBaseUrl, primaryGingrClient.apiKey),
      });
    }

    if (action === "list-invoices") {
      return jsonResponse({
        action,
        data: await buildCurrentOwnerInvoicesForClients(
          gingrBaseUrl,
          gingrClients,
          authResult.user,
        ),
      });
    }

    if (action === "report-card-files") {
      return jsonResponse({
        action,
        data: await buildReportCardFileDiscovery(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    if (action === "owner-form") {
      return jsonResponse({
        action,
        data: await buildOwnerFormDiscovery(gingrBaseUrl, primaryGingrClient.apiKey),
      });
    }

    if (action === "owner-custom-field-search") {
      return jsonResponse({
        action,
        data: await buildOwnerCustomFieldSearchDiscovery(
          gingrBaseUrl,
          primaryGingrClient.apiKey,
          authResult.user,
        ),
      });
    }

    if (action === "current-owner") {
      return jsonResponse({
        action,
        data: await findOwnerByEmail(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    if (action === "current-owner-profile") {
      return jsonResponse({
        action,
        data: await buildCurrentOwnerProfile(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    if (action === "link-current-client") {
      return jsonResponse({
        action,
        data: await linkCurrentClientProfile(gingrBaseUrl, gingrClients, authResult.user),
      });
    }

    if (action === "current-pets") {
      return jsonResponse({
        action,
        data: await buildCurrentPets(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    if (action === "current-reservations") {
      return jsonResponse({
        action,
        data: await buildCurrentReservationsForClients(gingrBaseUrl, gingrClients, authResult.user),
      });
    }

    if (action === "vip-camera-access") {
      if (!body.vipAccessCode?.trim() || !body.cameraLocationId?.trim()) {
        return jsonResponse({ error: "VIP access code and camera location are required." }, 400);
      }

      return jsonResponse({
        action,
        data: await verifyVipCameraAccess(
          gingrBaseUrl,
          gingrClients,
          authResult.user,
          body.vipAccessCode,
          body.cameraLocationId,
        ),
      });
    }

    if (action === "reservation-detail") {
      return jsonResponse({
        action,
        data: await buildReservationDetailForClients(
          gingrBaseUrl,
          gingrClients,
          authResult.user,
          body,
        ),
      });
    }

    if (action === "reservation-detail-test") {
      return jsonResponse({
        action,
        data: await buildReservationDetailTest(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    if (action === "estimate-test") {
      return jsonResponse({
        action,
        data: await buildEstimateTestForClients(gingrBaseUrl, gingrClients, authResult.user),
      });
    }

    if (action === "current-client-snapshot") {
      return jsonResponse({
        action,
        data: await buildCurrentClientSnapshot(gingrBaseUrl, primaryGingrClient.apiKey, authResult.user),
      });
    }

    return jsonResponse(
      {
        error:
          "Unsupported discovery action. Use locations, location-cities, reservation-types, species, services-by-type, request-catalog, list-invoices, report-card-files, owner-form, owner-custom-field-search, current-owner, current-owner-profile, link-current-client, current-pets, current-reservations, vip-camera-access, reservation-detail, reservation-detail-test, estimate-test, or current-client-snapshot.",
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
  const species = await gingrGet(baseUrl, apiKey, "/api/v1/get_species")
    .then((response) =>
      unwrapGingrArray(response)
        .map(normalizeCatalogItem)
        .filter((item): item is NormalizedCatalogItem => Boolean(item)),
    )
    .catch(() => []);
  const speciesIdByName = new Map(species.map((speciesItem) => [speciesItem.name.toLowerCase(), speciesItem.id]));
  const speciesIds = Array.from(
    new Set(
      animals
        .map((animal) =>
          animal && typeof animal === "object" && !Array.isArray(animal)
            ? readAnimalSpeciesId(animal as Record<string, unknown>, speciesIdByName)
            : null,
        )
        .filter((speciesId): speciesId is string => Boolean(speciesId)),
    ),
  );
  const immunizationTypeById = await buildImmunizationTypeMap(baseUrl, apiKey, speciesIds);
  const pets = await Promise.all(
    animals.map(async (animal) => {
      if (!animal || typeof animal !== "object" || Array.isArray(animal)) {
        return null;
      }

      const record = animal as Record<string, unknown>;
      const animalId = readString(record, "a_id") ?? readString(record, "id");
      const immunizations = animalId
        ? await fetchAnimalImmunizations(baseUrl, apiKey, animalId, immunizationTypeById)
        : [];

      return normalizeAnimal(record, immunizations);
    }),
  );

  return {
    ownerId: readString(ownerData, "id"),
    pets: pets.filter(Boolean),
    rawPets: animals.map(redact),
  };
}

async function buildImmunizationTypeMap(baseUrl: string, apiKey: string, speciesIds: string[]) {
  const immunizationTypeById = new Map<string, string>();

  for (const speciesId of speciesIds) {
    const response = await gingrGet(baseUrl, apiKey, "/api/v1/get_immunization_types", {
      species_id: speciesId,
    }).catch(() => null);

    for (const immunizationType of unwrapGingrArray(response)) {
      if (!immunizationType || typeof immunizationType !== "object" || Array.isArray(immunizationType)) {
        continue;
      }

      const record = immunizationType as Record<string, unknown>;
      const nestedType =
        readRecord(record, "immunization_type") ??
        readRecord(record, "required_immunization") ??
        readRecord(record, "type");
      const id =
        readAnyString(record, IMMUNIZATION_TYPE_ID_KEYS) ??
        (nestedType ? readAnyString(nestedType, IMMUNIZATION_TYPE_ID_KEYS) : null);
      const name =
        readAnyString(record, IMMUNIZATION_NAME_KEYS) ??
        (nestedType ? readAnyString(nestedType, IMMUNIZATION_NAME_KEYS) : null);

      if (id && name) {
        immunizationTypeById.set(id, name);
      }
    }
  }

  return immunizationTypeById;
}

function readAnimalSpeciesId(
  animal: Record<string, unknown>,
  speciesIdByName: Map<string, string>,
) {
  const directSpeciesId = readAnyString(animal, ["species_id", "s_id"]);

  if (directSpeciesId) {
    return directSpeciesId;
  }

  const speciesName = readAnyString(animal, ["species_name", "species", "species_label"]);

  return speciesName ? speciesIdByName.get(speciesName.toLowerCase()) ?? null : null;
}

async function fetchAnimalImmunizations(
  baseUrl: string,
  apiKey: string,
  animalId: string,
  immunizationTypeById: Map<string, string>,
) {
  const response = await gingrGet(baseUrl, apiKey, "/api/v1/get_animal_immunizations", {
    animal_id: animalId,
  }).catch(() => null);

  return unwrapGingrArray(response)
    .map((immunization) => normalizeAnimalImmunization(immunization, immunizationTypeById))
    .filter((immunization): immunization is NormalizedAnimalImmunization => Boolean(immunization));
}

async function buildCurrentReservations(
  baseUrl: string,
  apiKey: string,
  user: AuthUser,
  options: {
    includeCompanyScan?: boolean;
    includeOwnerSearch?: boolean;
    includeLocationLookup?: boolean;
  } = {},
) {
  const ownerRecords = options.includeOwnerSearch
    ? await findOwnerRecordsByEmail(baseUrl, apiKey, user)
    : [unwrapGingrData<Record<string, unknown>>(await findOwnerByEmail(baseUrl, apiKey, user))].filter(
        (ownerRecord): ownerRecord is Record<string, unknown> => Boolean(ownerRecord),
      );
  const ownerIds = Array.from(
    new Set(
      ownerRecords
        .map((ownerRecord) => extractFirstId(ownerRecord))
        .filter((ownerId): ownerId is string | number => Boolean(ownerId))
        .map(String),
    ),
  );
  const ownerId = ownerIds[0] ?? null;

  if (!ownerId) {
    return {
      ownerId: null,
      ownerIds: [],
      reservations: [],
      note: "No owner id was found in the Gingr owner response.",
    };
  }

  const locations = options.includeLocationLookup
    ? await gingrGet(baseUrl, apiKey, "/api/v1/get_locations")
        .then((locationsResponse) =>
          unwrapGingrArray(locationsResponse)
            .map(normalizeLocation)
            .filter((location): location is NormalizedLocation => Boolean(location)),
        )
        .catch(() => [])
    : [];
  const locationById = new Map(
    locations
      .filter((location) => location.id)
      .map((location) => [String(location.id), location.city]),
  );
  const reservationById = new Map<string, unknown>();
  const lookups: Array<{
    error?: string;
    label: string;
    returned: number;
    sampleLocations?: string[];
    sampleReservationIds?: string[];
    totalReturned?: number;
  }> = [];
  for (const discoveredOwnerId of ownerIds) {
    const ownerResult = await fetchReservationsByOwner(baseUrl, apiKey, discoveredOwnerId);

    for (const lookup of ownerResult.lookups) {
      lookups.push(lookup);
    }

    for (const reservation of ownerResult.reservations) {
      addReservationToMap(reservationById, reservation);
    }
  }

  if (options.includeCompanyScan) {
    const ownerEmail = user.email;
    const ownerPets = uniqueOwnerPetReferences(ownerRecords.flatMap(readOwnerPetReferences));
    const companyResult = await fetchCompanyReservationsForOwner(
      baseUrl,
      apiKey,
      ownerIds,
      ownerEmail,
      ownerPets,
      locations,
    );

    for (const lookup of companyResult.lookups) {
      lookups.push(lookup);
    }

    for (const reservation of companyResult.reservations) {
      addReservationToMap(reservationById, reservation);
    }
  }

  const rawReservations = Array.from(reservationById.values());
  const reservations = rawReservations
    .map((reservation) => normalizeReservation(reservation, locationById))
    .filter((reservation): reservation is NormalizedReservation => Boolean(reservation));

  return {
    ownerId: String(ownerId),
    ownerIds,
    reservations,
    debug: {
      lookups,
      includeCompanyScan: Boolean(options.includeCompanyScan),
      includeLocationLookup: Boolean(options.includeLocationLookup),
      includeOwnerSearch: Boolean(options.includeOwnerSearch),
      locationCounts: countReservationsByLocation(reservations),
      ownerIds,
      ownerPetReferences: uniqueOwnerPetReferences(ownerRecords.flatMap(readOwnerPetReferences)),
      rawReservationCount: rawReservations.length,
      reservationCount: reservations.length,
    },
  };
}

async function buildCurrentReservationsForClients(
  baseUrl: string,
  clients: GingrClient[],
  user: AuthUser,
) {
  const reservationByKey = new Map<string, NormalizedReservation>();
  const ownerIds = new Set<string>();
  const clientDebug: Array<{
    city: string;
    code: string;
    error?: string;
    locationCounts?: Record<string, number>;
    ownerIds?: string[];
    reservationCount: number;
  }> = [];

  const clientResults = await Promise.all(
    clients.map(async (client) => {
      const startedAt = Date.now();

      try {
        const result = await buildCurrentReservations(baseUrl, client.apiKey, user, {
          includeCompanyScan: false,
          includeLocationLookup: false,
          includeOwnerSearch: false,
        });

        return {
          client,
          durationMs: Date.now() - startedAt,
          result,
        };
      } catch (error) {
        return {
          client,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : "Gingr lookup failed.",
        };
      }
    }),
  );

  for (const clientResult of clientResults) {
    if ("error" in clientResult) {
      clientDebug.push({
        city: clientResult.client.city,
        code: clientResult.client.code,
        durationMs: clientResult.durationMs,
        error: clientResult.error,
        reservationCount: 0,
      });
      continue;
    }

    const { client, result } = clientResult;

    for (const ownerId of result.ownerIds ?? []) {
      ownerIds.add(ownerId);
    }

    for (const reservation of result.reservations) {
      const reservationWithLocation = {
        ...reservation,
        location: normalizeKnownLocation(reservation.location, client.city),
      };
      const key = buildNormalizedReservationMergeKey(reservationWithLocation, client.code);

      reservationByKey.set(key, reservationWithLocation);
    }

    clientDebug.push({
      city: client.city,
      code: client.code,
      durationMs: clientResult.durationMs,
      locationCounts: result.debug?.locationCounts,
      ownerIds: result.ownerIds ?? [],
      reservationCount: result.reservations.length,
    });
  }

  const reservations = Array.from(reservationByKey.values());

  return {
    ownerId: Array.from(ownerIds)[0] ?? null,
    ownerIds: Array.from(ownerIds),
    reservations,
    debug: {
      clients: clientDebug,
      configuredClients: clients.map((client) => ({ city: client.city, code: client.code })),
      locationCounts: countReservationsByLocation(reservations),
      reservationCount: reservations.length,
    },
  };
}

async function verifyVipCameraAccess(
  baseUrl: string,
  clients: GingrClient[],
  user: AuthUser,
  accessCode: string,
  requestedLocationId: string,
) {
  const denial = {
    allowed: false,
    message: "VIP access requires a valid suite code and an active checked-in reservation at this resort.",
  };
  const normalizedCode = accessCode.trim().toUpperCase();
  const normalizedRequestedLocationId = normalizeCameraLocationId(requestedLocationId);
  const access = vipCameraAccessByLocationAndCode[
    `${normalizedRequestedLocationId}:${normalizedCode}`
  ];

  if (!access || access.locationId !== normalizedRequestedLocationId) {
    return denial;
  }

  const currentReservations = await buildCurrentReservationsForClients(baseUrl, clients, user);
  const hasCheckedInReservation = currentReservations.reservations.some((reservation) =>
    reservation.status.trim().toLowerCase() === "checked in" &&
    normalizeCameraLocationId(reservation.location ?? "") === access.locationId
  );

  if (!hasCheckedInReservation) {
    return denial;
  }

  return {
    allowed: true,
    camera: access.camera,
  };
}

function normalizeCameraLocationId(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

  if (normalized.includes("amarillo")) {
    return "amarillo";
  }

  if (normalized.includes("wichitafalls") || normalized === "wf") {
    return "wichita-falls";
  }

  if (normalized.includes("newbraunfels") || normalized === "nb") {
    return "new-braunfels";
  }

  return normalized;
}

function normalizeKnownLocation(location: string | null, fallbackCity: string) {
  if (!location || /^legacy$/i.test(location)) {
    return fallbackCity === "Legacy" ? location : fallbackCity;
  }

  return normalizeSpecificLocationName(location) ?? location;
}

function buildNormalizedReservationMergeKey(reservation: NormalizedReservation, clientCode: string) {
  return [
    reservation.id,
    reservation.location ?? clientCode,
    reservation.startDate ?? "",
    reservation.endDate ?? "",
    reservation.reservationType ?? "",
  ].join("|");
}

async function fetchReservationsByOwner(
  baseUrl: string,
  apiKey: string,
  ownerId: string,
) {
  const today = new Date();
  const pastStart = new Date(today);
  pastStart.setFullYear(today.getFullYear() - 3);
  const futureEnd = new Date(today);
  futureEnd.setFullYear(today.getFullYear() + 2);

  const lookupBodies = [
    {
      label: "default",
      body: { id: ownerId },
    },
    {
      label: "future",
      body: {
        id: ownerId,
        restrict_to: "future",
        "params[limit]": "250",
      },
    },
    {
      label: "past",
      body: {
        id: ownerId,
        restrict_to: "past",
        "params[limit]": "250",
      },
    },
    {
      label: "dateWindow",
      body: {
        id: ownerId,
        "params[fromDate]": formatIsoDateForGingr(pastStart),
        "params[toDate]": formatIsoDateForGingr(futureEnd),
        "params[limit]": "250",
      },
    },
  ];
  const reservationById = new Map<string, unknown>();
  const lookups: Array<{
    error?: string;
    label: string;
    returned: number;
  }> = [];

  const lookupResults = await Promise.all(
    lookupBodies.map(async (lookup) => {
      try {
      const response = await gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", lookup.body);
      const reservations = unwrapGingrArray(response);

        return {
          lookup: { label: `owner:${lookup.label}`, returned: reservations.length },
          reservations,
        };
    } catch (error) {
        return {
          lookup: {
            error: error instanceof Error ? error.message : "Lookup failed.",
            label: `owner:${lookup.label}`,
            returned: 0,
          },
          reservations: [],
        };
      }
    }),
  );

  for (const lookupResult of lookupResults) {
    lookups.push(lookupResult.lookup);

    for (const reservation of lookupResult.reservations) {
      addReservationToMap(reservationById, reservation);
    }
  }

  return {
    lookups,
    reservations: Array.from(reservationById.values()),
  };
}

async function fetchCompanyReservationsForOwner(
  baseUrl: string,
  apiKey: string,
  ownerIds: string[],
  ownerEmail: string | undefined,
  ownerPets: OwnerPetReference[],
  locations: NormalizedLocation[],
) {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setFullYear(today.getFullYear() - 1);
  const toDate = new Date(today);
  toDate.setFullYear(today.getFullYear() + 1);
  const windows = buildDateWindows(fromDate, toDate, 30);
  const scopedLocations = locations.filter((location) => location.id);
  const reservationById = new Map<string, unknown>();
  const lookups: Array<{
    error?: string;
    label: string;
    returned: number;
    sampleLocations?: string[];
    sampleReservationIds?: string[];
    totalReturned?: number;
  }> = [];

  for (const window of windows) {
    const label = `company:any:${window.from}:${window.to}`;

    try {
      const response = await gingrPost(baseUrl, apiKey, "/api/v1/reservations", {
        end_date: window.to,
        start_date: window.from,
      });
      const reservations = unwrapGingrArray(response);
      const matchingReservations = reservations.filter((reservation) =>
        reservationMatchesOwner(reservation, ownerIds, ownerEmail, ownerPets),
      );

      lookups.push({
        label,
        returned: matchingReservations.length,
        sampleLocations: summarizeReservationLocations(matchingReservations),
        sampleReservationIds: summarizeReservationIds(matchingReservations),
        totalReturned: reservations.length,
      });

      for (const reservation of matchingReservations) {
        addReservationToMap(reservationById, reservation);
      }
    } catch (error) {
      lookups.push({
        error: error instanceof Error ? error.message : "Lookup failed.",
        label,
        returned: 0,
      });
    }
  }

  for (const location of scopedLocations) {
    for (const window of windows) {
      const label = `company:${location.city}:${window.from}:${window.to}`;

      try {
        const response = await gingrPost(baseUrl, apiKey, "/api/v1/reservations", {
          end_date: window.to,
          location_id: String(location.id),
          start_date: window.from,
        });
        const reservations = unwrapGingrArray(response);
        const matchingReservations = reservations.filter((reservation) =>
          reservationMatchesOwner(reservation, ownerIds, ownerEmail, ownerPets),
        );

        lookups.push({
          label,
          returned: matchingReservations.length,
          sampleLocations: summarizeReservationLocations(matchingReservations),
          sampleReservationIds: summarizeReservationIds(matchingReservations),
          totalReturned: reservations.length,
        });

        for (const reservation of matchingReservations) {
          addReservationToMap(reservationById, reservation);
        }
      } catch (error) {
        lookups.push({
          error: error instanceof Error ? error.message : "Lookup failed.",
          label,
          returned: 0,
        });
      }
    }
  }

  return {
    lookups,
    reservations: Array.from(reservationById.values()),
  };
}

function buildDateWindows(fromDate: Date, toDate: Date, daysPerWindow: number) {
  const windows: Array<{ from: string; to: string }> = [];
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    const windowStart = new Date(cursor);
    const windowEnd = new Date(cursor);
    windowEnd.setDate(windowEnd.getDate() + daysPerWindow - 1);

    if (windowEnd > toDate) {
      windowEnd.setTime(toDate.getTime());
    }

    windows.push({
      from: formatIsoDateForGingr(windowStart),
      to: formatIsoDateForGingr(windowEnd),
    });
    cursor.setDate(cursor.getDate() + daysPerWindow);
  }

  return windows;
}

function addReservationToMap(reservationById: Map<string, unknown>, reservation: unknown) {
  if (!reservation || typeof reservation !== "object" || Array.isArray(reservation)) {
    return;
  }

  const record = reservation as Record<string, unknown>;
  const reservationId = readAnyString(record, ["r_id", "reservation_id", "id"]);
  const locationId = readReservationLocationKey(record);

  if (reservationId) {
    reservationById.set([reservationId, locationId].filter(Boolean).join("|"), reservation);
  }
}

function readReservationLocationKey(reservation: Record<string, unknown>) {
  const directLocationId = readAnyString(reservation, ["location_id", "loc_id", "l_id"]);

  if (directLocationId) {
    return `location:${directLocationId}`;
  }

  const location = readRecord(reservation, "location");
  const nestedLocationId = location ? readAnyString(location, ["id", "location_id", "l_id"]) : null;

  if (nestedLocationId) {
    return `location:${nestedLocationId}`;
  }

  const locationName = readAnyString(reservation, ["location_city", "city", "location_name", "location"]);

  return locationName ? `location:${normalizeCityName(locationName)?.toLowerCase() ?? locationName.toLowerCase()}` : null;
}

function countReservationsByLocation(reservations: NormalizedReservation[]) {
  return reservations.reduce<Record<string, number>>((counts, reservation) => {
    const key = reservation.location ?? "Unknown";

    counts[key] = (counts[key] ?? 0) + 1;

    return counts;
  }, {});
}

async function findOwnerRecordsByEmail(baseUrl: string, apiKey: string, user: AuthUser) {
  const ownerByKey = new Map<string, Record<string, unknown>>();
  const directOwner = await findOwnerByEmail(baseUrl, apiKey, user).catch(() => null);

  addOwnerRecord(ownerByKey, unwrapGingrData<Record<string, unknown>>(directOwner));

  if (user.email) {
    const lookupVariants = [
      { label: "email", params: { "params[email]": user.email } },
      { label: "username", params: { "params[username]": user.email } },
      { label: "directEmail", params: { email: user.email } },
      { label: "directUsername", params: { username: user.email } },
    ];

    for (const lookup of lookupVariants) {
      const response = await gingrGet(baseUrl, apiKey, "/api/v1/owners", lookup.params).catch(() => null);
      const records = unwrapGingrArray(response);

      for (const record of records) {
        if (!record || typeof record !== "object" || Array.isArray(record)) {
          continue;
        }

        addOwnerRecord(ownerByKey, record as Record<string, unknown>);
      }
    }
  }

  return Array.from(ownerByKey.values());
}

function addOwnerRecord(
  ownerByKey: Map<string, Record<string, unknown>>,
  owner: Record<string, unknown> | null,
) {
  if (!owner) {
    return;
  }

  const id = readAnyString(owner, ["id", "owner_id", "o_id", "user_id"]);

  if (!id) {
    return;
  }

  const homeLocation = readAnyString(owner, ["home_location", "location_id", "l_id"]);
  const email = readAnyString(owner, ["email", "username"]);
  const key = [id, homeLocation, email].filter(Boolean).join("|");

  ownerByKey.set(key, owner);
}

type OwnerPetReference = {
  id: string | null;
  name: string | null;
};

function readOwnerPetReferences(ownerData: Record<string, unknown> | null) {
  const animals = Array.isArray(ownerData?.animals) ? ownerData.animals : [];

  return animals
    .map((animal) => {
      if (!animal || typeof animal !== "object" || Array.isArray(animal)) {
        return null;
      }

      const pet = animal as Record<string, unknown>;

      return {
        id: readAnyString(pet, ["a_id", "id", "animal_id", "pet_id"]),
        name: readAnyString(pet, ["animal_name", "name", "pet_name"]),
      };
    })
    .filter((pet): pet is OwnerPetReference => Boolean(pet?.id || pet?.name));
}

function uniqueOwnerPetReferences(pets: OwnerPetReference[]) {
  const petByKey = new Map<string, OwnerPetReference>();

  for (const pet of pets) {
    const key = [pet.id ?? "", pet.name?.toLowerCase() ?? ""].join("|");

    petByKey.set(key, pet);
  }

  return Array.from(petByKey.values());
}

function reservationMatchesOwner(
  value: unknown,
  ownerIds: string[],
  ownerEmail: string | undefined,
  ownerPets: OwnerPetReference[] = [],
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const reservation = value as Record<string, unknown>;
  const directOwnerId = readAnyString(reservation, ["owner_id", "o_id", "user_id"]);
  const directEmail = readAnyString(reservation, ["email", "owner_email", "username"]);
  const owner = readRecord(reservation, "owner");
  const ownerRecordId = owner ? readAnyString(owner, ["id", "owner_id", "o_id", "user_id"]) : null;
  const ownerRecordEmail = owner ? readAnyString(owner, ["email", "username"]) : null;

  if (directOwnerId && ownerIds.includes(directOwnerId)) {
    return true;
  }

  if (ownerRecordId && ownerIds.includes(ownerRecordId)) {
    return true;
  }

  if (ownerEmail && directEmail && directEmail.toLowerCase() === ownerEmail.toLowerCase()) {
    return true;
  }

  return Boolean(
    (ownerEmail && ownerRecordEmail && ownerRecordEmail.toLowerCase() === ownerEmail.toLowerCase()) ||
      reservationMatchesOwnerPet(reservation, ownerPets),
  );
}

function reservationMatchesOwnerPet(
  reservation: Record<string, unknown>,
  ownerPets: OwnerPetReference[],
) {
  if (ownerPets.length === 0) {
    return false;
  }

  const reservationPetNames = readReservationAnimalNames(reservation).map((name) =>
    normalizePetLookupValue(name),
  );
  const reservationPetIds = readReservationAnimalIds(reservation);

  return ownerPets.some((pet) => {
    const petIdMatches = Boolean(pet.id && reservationPetIds.includes(pet.id));
    const petNameMatches = Boolean(
      pet.name && reservationPetNames.includes(normalizePetLookupValue(pet.name)),
    );

    return petIdMatches || petNameMatches;
  });
}

function readReservationAnimalIds(reservation: Record<string, unknown>) {
  const directAnimalId = readAnyString(reservation, ["animal_id", "a_id", "pet_id"]);
  const animals = reservation.animals;
  const animalIds = directAnimalId ? [directAnimalId] : [];

  if (Array.isArray(animals)) {
    for (const animal of animals) {
      if (!animal || typeof animal !== "object" || Array.isArray(animal)) {
        continue;
      }

      const animalId = readAnyString(animal as Record<string, unknown>, [
        "animal_id",
        "a_id",
        "id",
        "pet_id",
      ]);

      if (animalId) {
        animalIds.push(animalId);
      }
    }
  }

  return Array.from(new Set(animalIds));
}

function normalizePetLookupValue(value: string) {
  return value.trim().toLowerCase();
}

function summarizeReservationLocations(reservations: unknown[]) {
  return Array.from(
    new Set(
      reservations
        .map((reservation) => {
          if (!reservation || typeof reservation !== "object" || Array.isArray(reservation)) {
            return null;
          }

          return readAnyString(reservation as Record<string, unknown>, [
            "location_id",
            "loc_id",
            "l_id",
            "location_city",
            "city",
            "location_name",
            "location",
          ]);
        })
        .filter((location): location is string => Boolean(location)),
    ),
  ).slice(0, 8);
}

function summarizeReservationIds(reservations: unknown[]) {
  return reservations
    .map((reservation) => {
      if (!reservation || typeof reservation !== "object" || Array.isArray(reservation)) {
        return null;
      }

      return readAnyString(reservation as Record<string, unknown>, ["r_id", "reservation_id", "id"]);
    })
    .filter((reservationId): reservationId is string => Boolean(reservationId))
    .slice(0, 10);
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
  const broadReservationDiscovery = await buildCurrentReservations(baseUrl, apiKey, user);

  return {
    ownerId: String(ownerId),
    reservationCount: rawReservations.length,
    broadReservationDiscovery: {
      ownerIds: broadReservationDiscovery.ownerIds ?? [],
      reservationCount: broadReservationDiscovery.reservations.length,
      debug: broadReservationDiscovery.debug,
    },
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

async function buildEstimateTestForClients(
  baseUrl: string,
  clients: GingrClient[],
  user: AuthUser,
) {
  const locations = await Promise.all(
    clients.map(async (client) => {
      try {
        const owner = await findOwnerByEmail(baseUrl, client.apiKey, user);
        const ownerId = extractFirstId(owner);

        if (!ownerId) {
          return {
            city: client.city,
            code: client.code,
            note: "No owner match was found for this location.",
            ownerId: null,
            estimates: [],
          };
        }

        const reservationsResponse = await gingrPost(
          baseUrl,
          client.apiKey,
          "/api/v1/reservations_by_owner",
          { id: String(ownerId) },
        );
        const rawReservations = unwrapGingrArray(reservationsResponse);
        const preferredReservation = selectReservationForDetailTest(rawReservations);
        const preferredReservationId = preferredReservation
          ? readAnyString(preferredReservation, ["r_id", "reservation_id", "id"])
          : null;
        const reservationIds = uniqueStrings([
          ...(preferredReservationId ? [preferredReservationId] : []),
          ...summarizeReservationIds(rawReservations),
        ]).slice(0, 3);
        const estimates = await Promise.all(
          reservationIds.map(async (reservationId) => {
            try {
              const rawEstimate = await gingrGet(
                baseUrl,
                client.apiKey,
                "/api/v1/existing_reservation_estimate",
                { id: reservationId },
              );
              const unwrappedEstimate = unwrapGingrData(rawEstimate) ?? rawEstimate;

              return {
                reservationId,
                responseFieldKeys: readObjectKeys(unwrappedEstimate),
                normalizedEstimate: normalizeReservationEstimate(rawEstimate),
                rawEstimate: redact(rawEstimate),
              };
            } catch (error) {
              return {
                reservationId,
                error: error instanceof Error ? error.message : "Estimate lookup failed.",
              };
            }
          }),
        );

        return {
          city: client.city,
          code: client.code,
          ownerId: String(ownerId),
          reservationCount: rawReservations.length,
          estimates,
        };
      } catch (error) {
        return {
          city: client.city,
          code: client.code,
          error: error instanceof Error ? error.message : "Estimate discovery failed.",
          estimates: [],
        };
      }
    }),
  );

  return {
    note:
      "Raw estimates are redacted. Compare each rawEstimate with normalizedEstimate to identify fields the client parser is missing.",
    locations,
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

  const locationById = new Map(
    locations
      .filter((location) => location.id)
      .map((location) => [String(location.id), location.city]),
  );
  const selectedReservations = requestedIds
    .map((id) => reservationById.get(id))
    .filter((reservation): reservation is Record<string, unknown> => Boolean(reservation));
  const estimateEntries = await Promise.all(
    selectedReservations.map(async (reservation) => {
      const reservationId = readAnyString(reservation, ["r_id", "reservation_id", "id"]);

      if (!reservationId) {
        return null;
      }

      const estimate = await gingrGet(baseUrl, apiKey, "/api/v1/existing_reservation_estimate", {
        id: reservationId,
      }).then(normalizeReservationEstimate).catch(() => null);

      return estimate ? ([reservationId, estimate] as const) : null;
    }),
  );
  const estimatesByReservation: Record<
    string,
    NonNullable<ReturnType<typeof normalizeReservationEstimate>>
  > = {};

  for (const entry of estimateEntries) {
    if (entry) {
      estimatesByReservation[entry[0]] = entry[1];
    }
  }
  const estimate = Object.values(estimatesByReservation)[0] ?? null;

  return {
    ownerId: String(ownerId),
    missingIds,
    reservations: selectedReservations.map((reservation) =>
      normalizeReservationDetail(reservation, locationById),
    ),
    rawReservations: selectedReservations.map(redact),
    estimate,
    estimatesByReservation,
  };
}

async function buildReservationDetailForClients(
  baseUrl: string,
  clients: GingrClient[],
  user: AuthUser,
  request: DiscoveryRequest,
) {
  const requestedIds = normalizeRequestedReservationIds(request);
  const detailByKey = new Map<string, NormalizedReservationDetail>();
  const rawReservations: Array<Record<string, unknown>> = [];
  const ownerIds = new Set<string>();
  const foundIds = new Set<string>();
  let estimate: ReturnType<typeof normalizeReservationEstimate> | null = null;
  const estimatesByReservation: Record<string, NonNullable<ReturnType<typeof normalizeReservationEstimate>>> = {};
  const clientDebug: Array<{
    city: string;
    code: string;
    error?: string;
    foundIds: string[];
    missingIds: string[];
    reservationCount: number;
  }> = [];

  const clientResults = await Promise.all(
    clients.map(async (client) => {
      try {
        const result = await buildReservationDetail(baseUrl, client.apiKey, user, request);

        return { client, result };
      } catch (error) {
        return {
          client,
          error: error instanceof Error ? error.message : "Reservation detail lookup failed.",
        };
      }
    }),
  );

  for (const clientResult of clientResults) {
    if ("error" in clientResult) {
      clientDebug.push({
        city: clientResult.client.city,
        code: clientResult.client.code,
        error: clientResult.error,
        foundIds: [],
        missingIds: requestedIds,
        reservationCount: 0,
      });
      continue;
    }

    const { client, result } = clientResult;

    if (result.ownerId) {
      ownerIds.add(result.ownerId);
    }

    for (const reservation of result.reservations) {
      const reservationWithLocation = {
        ...reservation,
        location: normalizeKnownLocation(reservation.location, client.city),
      };
      const key = buildNormalizedReservationMergeKey(reservationWithLocation, client.code);

      detailByKey.set(key, reservationWithLocation);
      foundIds.add(reservation.id);
    }

    rawReservations.push(...(result.rawReservations ?? []));
    estimate = estimate ?? result.estimate;
    Object.assign(estimatesByReservation, result.estimatesByReservation ?? {});

    clientDebug.push({
      city: client.city,
      code: client.code,
      foundIds: result.reservations.map((reservation) => reservation.id),
      missingIds: result.missingIds ?? [],
      reservationCount: result.reservations.length,
    });
  }

  const missingIds = requestedIds.filter((id) => !foundIds.has(id));

  if (detailByKey.size === 0 && missingIds.length > 0) {
    throw new Error(
      `One or more reservations could not be found for the signed-in client: ${missingIds.join(
        ", ",
      )}`,
    );
  }

  return {
    ownerId: Array.from(ownerIds)[0] ?? null,
    ownerIds: Array.from(ownerIds),
    reservations: Array.from(detailByKey.values()),
    rawReservations,
    estimate,
    estimatesByReservation,
    debug: {
      clients: clientDebug,
      missingIds,
      requestedIds,
    },
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

  const ownerReservationsResponse = await gingrPost(baseUrl, apiKey, "/api/v1/reservations_by_owner", {
    id: String(ownerId),
  });
  const ownerReservationIds = new Set(
    unwrapGingrArray(ownerReservationsResponse)
      .map((reservation) =>
        reservation && typeof reservation === "object" && !Array.isArray(reservation)
          ? readAnyString(reservation as Record<string, unknown>, ["r_id", "reservation_id", "id"])
          : null
      )
      .filter((reservationId): reservationId is string => Boolean(reservationId)),
  );
  const reservationMonthLookups = buildReservationMonthInvoiceLookups(ownerReservationsResponse);

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
    ...reservationMonthLookups,
  ];

  const lookups = await Promise.all(
    lookupVariants.map(async (variant) => {
      const result = await findInvoicesForOwner(
        baseUrl,
        apiKey,
        variant.params,
        String(ownerId),
        user.email,
        ownerReservationIds,
      );

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

  const invoiceIds = Array.from(new Set(
    lookups
      .flatMap((lookup) => lookup.matchingOwnerInvoices)
      .map((invoice) => invoice.id)
      .filter((id): id is string => Boolean(id)),
  ));
  const transactionDetails = new Map(
    await Promise.all(invoiceIds.map(async (invoiceId) => {
      try {
        const transaction = await gingrPost(baseUrl, apiKey, "/api/v1/transaction", { id: invoiceId });
        const settlement = collectTransactionSettlementSummary(transaction);
        return [invoiceId, {
          chargeDetails: collectTransactionChargeSummaries(transaction),
          depositsTotal: settlement.depositsTotal,
          paymentDetails: collectTransactionPaymentSummaries(transaction),
          paymentsTotal: settlement.paymentsTotal,
          remainingDue: settlement.remainingDue,
          reservationIds: collectReservationIds(transaction),
          reservationReferences: collectReservationReferences(transaction),
          transactionItems: collectTransactionItemSummaries(transaction),
          transactionFieldKeys: collectObjectKeys(transaction),
          transactionLookupError: null,
        }] as const;
      } catch (error) {
        return [invoiceId, {
          chargeDetails: [] as Array<{
            amount: string | null;
            animalName: string | null;
            description: string | null;
            id: string | null;
            quantity: string | null;
            reservationId: string | null;
          }>,
          depositsTotal: null,
          paymentDetails: [] as Array<{
            amount: string | null;
            date: string | null;
            description: string | null;
            id: string | null;
            isDeposit: boolean;
            method: string | null;
            status: string | null;
          }>,
          paymentsTotal: null,
          remainingDue: null,
          reservationIds: [] as string[],
          reservationReferences: [] as Array<{ key: string; path: string; value: string }>,
          transactionItems: [] as Array<Record<string, unknown>>,
          transactionFieldKeys: [] as string[],
          transactionLookupError: error instanceof Error ? error.message : "Transaction lookup failed.",
        }] as const;
      }
    })),
  );

  const enrichedLookups = lookups.map((lookup) => ({
    ...lookup,
    matchingOwnerInvoices: lookup.matchingOwnerInvoices.map((invoice) => ({
      ...invoice,
      ...(invoice.id ? transactionDetails.get(invoice.id) : undefined),
    })),
  }));

  return {
    ownerId: String(ownerId),
    lookups: enrichedLookups,
    note:
      "list_invoices is a global/date-based Gingr endpoint. This diagnostic returns invoices matched to the signed-in owner or their reservations, plus non-sensitive counts/field keys.",
  };
}

async function buildCurrentOwnerInvoicesForClients(
  baseUrl: string,
  clients: GingrClient[],
  user: AuthUser,
) {
  const dedicatedClients = clients.filter((client) => client.code !== "LEGACY");
  const preferredClients = dedicatedClients.length > 0 ? dedicatedClients : clients;
  const uniqueClients = Array.from(
    new Map(preferredClients.map((client) => [client.apiKey, client])).values(),
  );
  const clientResults = await Promise.all(
    uniqueClients.map(async (client) => {
      const startedAt = Date.now();

      try {
        const result = await buildCurrentOwnerInvoices(baseUrl, client.apiKey, user);
        return {
          client,
          durationMs: Date.now() - startedAt,
          result,
        };
      } catch (error) {
        return {
          client,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : "Gingr invoice lookup failed.",
        };
      }
    }),
  );
  const ownerIds = new Set<string>();
  const lookups: Array<Record<string, unknown>> = [];
  const debug: Array<Record<string, unknown>> = [];

  for (const clientResult of clientResults) {
    if ("error" in clientResult) {
      debug.push({
        city: clientResult.client.city,
        code: clientResult.client.code,
        durationMs: clientResult.durationMs,
        error: clientResult.error,
        invoiceCount: 0,
      });
      continue;
    }

    const { client, result } = clientResult;
    if (result.ownerId) {
      ownerIds.add(String(result.ownerId));
    }

    const clientLookups = Array.isArray(result.lookups) ? result.lookups : [];
    const invoiceCount = clientLookups.reduce(
      (count, lookup) => count + lookup.matchingOwnerInvoices.length,
      0,
    );

    lookups.push(...clientLookups.map((lookup) => ({
      ...lookup,
      label: `${client.code}:${lookup.label}`,
      sourceClientCode: client.code,
      sourceLocation: client.city,
    })));
    debug.push({
      city: client.city,
      code: client.code,
      durationMs: clientResult.durationMs,
      invoiceCount,
      ownerId: result.ownerId,
    });
  }

  return {
    ownerId: Array.from(ownerIds)[0] ?? null,
    ownerIds: Array.from(ownerIds),
    lookups,
    debug: {
      clients: debug,
      configuredClients: uniqueClients.map((client) => ({ city: client.city, code: client.code })),
    },
    note:
      "Invoice lookups run independently for each configured Gingr location and merge signed-in owner or reservation matches.",
  };
}

async function buildReportCardFileDiscovery(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerData = unwrapGingrData<Record<string, unknown>>(owner);
  const ownerId = extractFirstId(owner);
  const ownerEmail = user.email ?? readString(ownerData ?? {}, "email") ?? undefined;
  const animals = Array.isArray(ownerData?.animals) ? ownerData.animals : [];
  const ownerPets = animals
    .map((animal) => {
      if (!animal || typeof animal !== "object" || Array.isArray(animal)) {
        return null;
      }

      const pet = animal as Record<string, unknown>;

      return {
        id: readAnyString(pet, ["a_id", "id", "animal_id", "pet_id"]),
        name: readAnyString(pet, ["animal_name", "name", "pet_name"]),
      };
    })
    .filter((pet): pet is { id: string | null; name: string | null } => Boolean(pet?.id || pet?.name));
  const locations = await gingrGet(baseUrl, apiKey, "/api/v1/get_locations")
    .then((locationsResponse) =>
      unwrapGingrArray(locationsResponse)
        .map(normalizeLocation)
        .filter((location): location is NormalizedLocation => Boolean(location)),
    )
    .catch(() => []);
  const locationLookups = locations
    .filter((location) => location.id)
    .map((location) => ({
      label: `recent30:${location.city}`,
      params: {
        limit: "25",
        location_id: String(location.id),
        number_days: "30",
      },
    }));
  const lookupVariants = [
    {
      label: "recent7",
      params: {
        limit: "25",
        number_days: "7",
      },
    },
    {
      label: "recent30",
      params: {
        limit: "50",
        number_days: "30",
      },
    },
    {
      label: "defaultLimit",
      params: {
        limit: "25",
      },
    },
    ...locationLookups,
  ];

  const lookups = await Promise.all(
    lookupVariants.map(async (variant) => {
      const response = await gingrGet(baseUrl, apiKey, "/api/v1/report_card_files", variant.params)
        .catch((error) => ({ __error: error instanceof Error ? error.message : "Gingr lookup failed." }));

      if (response && typeof response === "object" && "__error" in response) {
        return {
          label: variant.label,
          params: variant.params,
          error: String((response as { __error: string }).__error),
        };
      }

      const files = unwrapGingrArray(response);
      const summaries = files
        .map((file) => normalizeReportCardFileSummary(file, String(ownerId ?? ""), ownerEmail, ownerPets))
        .filter((file): file is NonNullable<ReturnType<typeof normalizeReportCardFileSummary>> =>
          Boolean(file),
        );

      return {
        label: variant.label,
        params: variant.params,
        totalReturned: files.length,
        signedInOwnerMatchCount: summaries.filter((file) => file.matchesSignedInOwner).length,
        petMatchCount: summaries.filter((file) => file.matchedPetNames.length > 0).length,
        reservationReferenceCount: summaries.filter((file) => file.reservationId).length,
        sampleFieldKeys: files.length > 0 ? readObjectKeys(files[0]) : [],
        samples: summaries.slice(0, 5),
        signedInOwnerSamples: summaries.filter((file) => file.matchesSignedInOwner).slice(0, 10),
      };
    }),
  );

  return {
    ownerId: ownerId ? String(ownerId) : null,
    ownerPetCount: ownerPets.length,
    lookups,
    note:
      "report_card_files appears to be a recent-upload endpoint. Use signedInOwnerMatchCount, petMatchCount, and reservationReferenceCount to decide whether report cards can be safely shown per client.",
  };
}

async function buildOwnerFormDiscovery(baseUrl: string, apiKey: string) {
  const response = await gingrGet(baseUrl, apiKey, "/forms/get_form", {
    form: "owner_form",
  });
  const fields = extractFormFieldSummaries(response);

  return {
    form: "owner_form",
    totalFieldsFound: fields.length,
    additionalContactCandidates: fields.filter(isAdditionalContactField).slice(0, 40),
    fieldSamples: fields.slice(0, 80),
    responseFieldKeys: readObjectKeys(unwrapGingrData<Record<string, unknown>>(response) ?? {}),
    rawForm: response,
    note:
      "Use this to identify the technical field names Gingr uses for owner-form additional contact fields.",
  };
}

async function buildOwnerCustomFieldSearchDiscovery(
  baseUrl: string,
  apiKey: string,
  user: AuthUser,
) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerData = unwrapGingrData<Record<string, unknown>>(owner);
  const ownerId = ownerData ? readString(ownerData, "id") : null;
  const ownerEmail = ownerData ? readString(ownerData, "email") : user.email ?? null;
  const firstName = ownerData ? readString(ownerData, "first_name") : null;
  const lastName = ownerData ? readString(ownerData, "last_name") : null;
  const emergencyContactName = ownerData ? readString(ownerData, "emergency_contact_name") : null;
  const formResponse = await gingrGet(baseUrl, apiKey, "/forms/get_form", {
    form: "owner_form",
  }).catch((error) => ({ __error: error instanceof Error ? error.message : String(error) }));
  const candidateFieldNames = Array.from(
    new Set([
      "owner_id",
      "id",
      "email",
      "o_email",
      "additional_owner_first_name",
      "additional_owner_last_name",
      "additional_owner_cell_phone",
      "additional_owner_email",
      "emergency_contact_name",
      "emergency_contact_phone",
      ...extractFormFieldSummaries(formResponse)
        .filter(isAdditionalContactField)
        .map((field) => field.technicalName)
        .filter((fieldName): fieldName is string => Boolean(fieldName)),
    ]),
  ).slice(0, 18);
  const searchTerms = Array.from(
    new Set(
      [
        ownerId,
        ownerEmail,
        [firstName, lastName].filter(Boolean).join(" "),
        emergencyContactName,
      ].filter((term): term is string => Boolean(term)),
    ),
  ).slice(0, 4);
  const lookups = await Promise.all(
    candidateFieldNames.flatMap((fieldName) =>
      searchTerms.map(async (search) => {
        const params = {
          field_name: fieldName,
          form_id: "1",
          search,
        };

        try {
          const response = await gingrGet(baseUrl, apiKey, "/api/v1/custom_field_search", params);
          const results = unwrapGingrArray(response);

          return {
            fieldName,
            search,
            totalReturned: results.length,
            sampleFieldKeys: results.length > 0 ? readObjectKeys(results[0]) : [],
            samples: results.slice(0, 3),
          };
        } catch (error) {
          return {
            fieldName,
            search,
            ...formatDebugLookupError(error),
          };
        }
      }),
    ),
  );

  return {
    ownerId,
    ownerEmail,
    candidateFieldNames,
    searchTerms,
    matchingLookups: lookups.filter((lookup) => "totalReturned" in lookup && lookup.totalReturned > 0),
    lookups,
    note:
      "custom_field_search is search-based. If this returns no matches, we may need the exact owner-form technical field name and a value known to exist in that field.",
  };
}

type FormFieldSummary = {
  label: string | null;
  path: string;
  rawFieldKeys: string[];
  technicalName: string | null;
  type: string | null;
};

function extractFormFieldSummaries(value: unknown) {
  const fields: FormFieldSummary[] = [];
  collectFormFieldSummaries(value, "response", fields);

  return fields.slice(0, 250);
}

function collectFormFieldSummaries(value: unknown, path: string, fields: FormFieldSummary[]) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectFormFieldSummaries(item, `${path}[${index}]`, fields);
    });
    return;
  }

  const record = value as Record<string, unknown>;
  const label = readAnyString(record, [
    "label",
    "title",
    "display_name",
    "field_label",
    "question",
    "text",
  ]);
  const technicalName = readAnyString(record, [
    "field_name",
    "input_name",
    "technical_name",
    "slug",
    "key",
    "name",
    "id",
  ]);
  const type = readAnyString(record, ["type", "field_type", "input_type", "element"]);

  if (label || technicalName) {
    fields.push({
      label,
      path,
      rawFieldKeys: readObjectKeys(record),
      technicalName,
      type,
    });
  }

  for (const [key, nestedValue] of Object.entries(record)) {
    if (nestedValue && typeof nestedValue === "object") {
      collectFormFieldSummaries(nestedValue, `${path}.${key}`, fields);
    }
  }
}

function isAdditionalContactField(field: FormFieldSummary) {
  return /additional|emergency|contact|owner|phone|cell|email/i.test(
    [field.label, field.technicalName, field.path].filter(Boolean).join(" "),
  );
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
    rawOwner: redact(ownerData),
  };
}

async function linkCurrentClientProfile(baseUrl: string, clients: GingrClient[], user: AuthUser) {
  if (!user.email) {
    return {
      allowed: false,
      reason: "missing_email",
      message: "Your sign-in session does not include an email address.",
    };
  }

  const matches = await findOwnerMatchesByEmail(baseUrl, clients, user);

  if (matches.length === 0) {
    return {
      allowed: false,
      reason: "not_found",
      message:
        "We could not find this email on file with Le Chateau. Please contact our team for help accessing the app.",
    };
  }

  const uniqueOwnerIds = Array.from(new Set(matches.map((match) => match.ownerId).filter(Boolean)));

  if (uniqueOwnerIds.length > 1) {
    return {
      allowed: false,
      reason: "multiple_matches",
      message:
        "We found more than one matching client record. Please contact our team so we can connect the right profile.",
      matchedOwnerCount: uniqueOwnerIds.length,
    };
  }

  const selectedMatch = matches.find((match) => match.ownerId === uniqueOwnerIds[0]) ?? matches[0];
  const displayName = selectedMatch.displayName || user.email;
  const email = selectedMatch.email || user.email;
  const profile = await upsertClientProfile({
    displayName,
    email,
    gingrClientId: selectedMatch.ownerId,
    userId: user.id,
  });

  return {
    allowed: true,
    matchLocationCodes: Array.from(new Set(matches.map((match) => match.locationCode))),
    profile,
  };
}

async function findOwnerMatchesByEmail(baseUrl: string, clients: GingrClient[], user: AuthUser) {
  const normalizedUserEmail = normalizeEmail(user.email);

  if (!normalizedUserEmail) {
    return [];
  }

  const results = await Promise.all(
    clients.map(async (client): Promise<OwnerEmailMatch[]> => {
      const matches: OwnerEmailMatch[] = [];

      try {
        const owner = await findOwnerByEmail(baseUrl, client.apiKey, user);
        const ownerData = unwrapGingrData<Record<string, unknown>>(owner);

        if (ownerData) {
          const ownerId = readString(ownerData, "id") ?? readString(ownerData, "owner_id");
          const ownerEmail = readString(ownerData, "email") ?? user.email ?? null;

          if (ownerId && (!ownerEmail || normalizeEmail(ownerEmail) === normalizedUserEmail)) {
            const firstName = readString(ownerData, "first_name");
            const lastName = readString(ownerData, "last_name");

            matches.push({
              displayName: [firstName, lastName].filter(Boolean).join(" ") || null,
              email: ownerEmail,
              locationCity: client.city,
              locationCode: client.code,
              matchedBy: "primary_email",
              matchedEmail: user.email ?? ownerEmail ?? "",
              ownerId,
            });
          }
        }
      } catch {
        // Keep checking additional owner email fields for this location.
      }

      try {
        matches.push(...(await findOwnersByAdditionalOwnerEmail(baseUrl, client, normalizedUserEmail)));
      } catch {
        // A location-specific custom-field lookup should not block other matches.
      }

      return dedupeOwnerEmailMatches(matches);
    }),
  );

  return dedupeOwnerEmailMatches(results.flat());
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

const additionalOwnerEmailFieldNames = ["secondary_email", "additional_owner_email"];

async function findOwnersByAdditionalOwnerEmail(
  baseUrl: string,
  client: GingrClient,
  normalizedEmail: string,
): Promise<OwnerEmailMatch[]> {
  const lookupResults = await Promise.all(
    additionalOwnerEmailFieldNames.map(async (fieldName) => {
      try {
        const response = await gingrGet(baseUrl, client.apiKey, "/api/v1/custom_field_search", {
          field_name: fieldName,
          form_id: "1",
          search: normalizedEmail,
        });

        return unwrapGingrArray(response);
      } catch {
        return [];
      }
    }),
  );
  const rows = lookupResults
    .flat()
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));

  return rows
    .map((row) => {
      const matchedEmail = additionalOwnerEmailFieldNames
        .map((fieldName) => readString(row, fieldName))
        .find((email) => normalizeEmail(email) === normalizedEmail);

      if (!matchedEmail) {
        return null;
      }

      const ownerId = readAnyString(row, ["system_id", "id", "owner_id", "o_id", "user_id"]);

      if (!ownerId) {
        return null;
      }

      const firstName = readAnyString(row, ["first_name", "owner_first_name"]);
      const lastName = readAnyString(row, ["last_name", "owner_last_name"]);

      return {
        displayName: [firstName, lastName].filter(Boolean).join(" ") || null,
        email: readAnyString(row, ["email", "owner_email", "username"]) ?? matchedEmail,
        locationCity: client.city,
        locationCode: client.code,
        matchedBy: "additional_owner_email" as const,
        matchedEmail,
        ownerId,
      };
    })
    .filter((match): match is OwnerEmailMatch => Boolean(match));
}

function dedupeOwnerEmailMatches(matches: OwnerEmailMatch[]) {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key = `${match.locationCode}:${match.ownerId}:${match.matchedBy}:${normalizeEmail(match.matchedEmail)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function upsertClientProfile({
  displayName,
  email,
  gingrClientId,
  userId,
}: {
  displayName: string;
  email: string;
  gingrClientId: string;
  userId: string;
}) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment is not available for client linking.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/client_profiles?on_conflict=id`, {
    body: JSON.stringify({
      display_name: displayName,
      email,
      gingr_client_id: gingrClientId,
      id: userId,
    }),
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    method: "POST",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Unable to link client profile: ${message || response.status}`);
  }

  const profiles = (await response.json()) as unknown[];
  return Array.isArray(profiles) ? profiles[0] ?? null : profiles;
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

type NormalizedAnimalImmunization = {
  administeredDate: string | null;
  expiresDate: string | null;
  id: string | null;
  name: string;
  rawData: unknown;
  status: string | null;
};

const IMMUNIZATION_TYPE_ID_KEYS = [
  "id",
  "i_id",
  "ri_id",
  "r_i_id",
  "type_id",
  "immunization_id",
  "immunization_type_id",
  "required_id",
  "required_immunization_id",
];

const IMMUNIZATION_NAME_KEYS = [
  "name",
  "label",
  "title",
  "type",
  "type_name",
  "immunization",
  "immunization_name",
  "immunization_type",
  "immunization_type_name",
  "required_immunization",
  "required_immunization_name",
];

function normalizeAnimal(value: unknown, immunizations: NormalizedAnimalImmunization[] = []) {
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
    immunizations,
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

function normalizeAnimalImmunization(
  value: unknown,
  immunizationTypeById: Map<string, string>,
): NormalizedAnimalImmunization | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const immunization = value as Record<string, unknown>;
  const nestedType =
    readRecord(immunization, "immunization_type") ??
    readRecord(immunization, "required_immunization") ??
    readRecord(immunization, "type");
  const typeId =
    readAnyString(immunization, IMMUNIZATION_TYPE_ID_KEYS) ??
    (nestedType ? readAnyString(nestedType, IMMUNIZATION_TYPE_ID_KEYS) : null);
  const name =
    readAnyString(immunization, IMMUNIZATION_NAME_KEYS) ??
    (nestedType ? readAnyString(nestedType, IMMUNIZATION_NAME_KEYS) : null) ??
    (typeId ? immunizationTypeById.get(typeId) : null) ??
    "Immunization";

  return {
    administeredDate: readAnyDate(immunization, [
      "administered_date",
      "administered_stamp",
      "administered_at",
      "given_at",
      "given_date",
      "date_given",
      "vaccination_date",
      "created_at",
    ]),
    expiresDate: readAnyDate(immunization, [
      "expiration_date",
      "expiration_stamp",
      "expires_at",
      "expires_on",
      "expires",
      "expiration",
      "expiry",
      "expiry_date",
      "date_expires",
      "end_date",
    ]),
    id: readAnyString(immunization, ["id", "animal_immunization_id", "immunization_id"]),
    name,
    rawData: redact(immunization),
    status: readAnyString(immunization, ["status", "status_name"]),
  };
}

type NormalizedReservation = {
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

type NormalizedReservationDetail = NormalizedReservation & {
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
  petDetails: Array<{
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
  }>;
  precheckCompleted: boolean | null;
  reservationSummary: string | null;
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
    checkInAt:
      formatGingrTimestamp(readAnyString(reservation, ["check_in_stamp", "checkin_stamp"])) ??
      readAnyString(reservation, ["check_in_stamp_formatted", "checkin_stamp_formatted"]),
    checkOutAt:
      formatGingrTimestamp(readAnyString(reservation, ["check_out_stamp", "checkout_stamp"])) ??
      readAnyString(reservation, ["check_out_stamp_formatted", "checkout_stamp_formatted"]),
    confirmedAt: formatGingrTimestamp(readAnyString(reservation, ["confirmed_stamp"])),
    endDate: readAnyDate(reservation, [
      "end_date",
      "checkout_date",
      "checkout_at",
      "out_date",
      "end",
    ]),
    endDateTimeLabel: readAnyString(reservation, ["end_date_formatted", "checkout_date_formatted"]),
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
    startDateTimeLabel: readAnyString(reservation, [
      "start_date_formatted",
      "checkin_date_formatted",
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
    checkInAt: normalizedReservation.checkInAt,
    checkOutAt: normalizedReservation.checkOutAt,
    confirmedAt: normalizedReservation.confirmedAt,
    createdAt: formatGingrTimestamp(readAnyString(reservation, ["created_at"])),
    createdBy: readAnyString(reservation, ["created_by", "created_by_username"]),
    endDateTimeLabel: normalizedReservation.endDateTimeLabel,
    feedingAmount: readAnyString(reservation, ["feeding_amount", "feedingAmount"]),
    feedingNotes: readAnyString(reservation, ["feeding_notes", "feedingNotes"]),
    feedingTime: cleanCommaList(readAnyString(reservation, ["feeding_time", "feedingTime"])),
    finalRate: formatMoney(readAnyString(reservation, ["final_rate", "finalRate"])),
    groomingNotes: stripHtml(readAnyString(reservation, ["grooming_notes", "groomingNotes"])),
    nights: readAnyString(reservation, ["nights", "night_count"]),
    notes: stripHtml(readAnyString(reservation, ["r_notes", "reservation_notes", "notes"])),
    petDetails: readReservationPetDetails(reservation),
    precheckCompleted: readNullableBoolean(reservation, "is_precheck_completed"),
    reservationSummary: readReservationSummary(reservation),
    services: stripHtml(readAnyString(reservation, ["services_string", "services", "service_names"])),
    startDateTimeLabel: normalizedReservation.startDateTimeLabel,
    unitsOfTime: readAnyString(reservation, ["units_of_time", "units"]),
  };
}

function readReservationSummary(reservation: Record<string, unknown>) {
  const directSummary = readAnyString(reservation, [
    "accommodation",
    "accommodation_name",
    "accommodation_type",
    "amenity_package",
    "amenity_package_name",
    "animal_type_name",
    "boarding_package",
    "boarding_package_name",
    "lodging",
    "lodging_name",
    "package",
    "package_name",
    "rate_name",
    "reservation_label",
    "reservation_name",
    "room",
    "room_name",
    "room_type",
    "room_type_name",
    "run",
    "run_name",
    "suite",
    "suite_name",
    "suite_size",
    "unit",
    "unit_name",
  ]);

  const textSources = [
    directSummary,
    readAnyString(reservation, ["reservation_type", "reservation_type_name", "type", "service"]),
    readAnyString(reservation, ["services_string", "services", "service_names"]),
  ];

  const rawEstimate = reservation.estimate;

  if (rawEstimate && typeof rawEstimate === "object" && !Array.isArray(rawEstimate)) {
    const estimate = rawEstimate as Record<string, unknown>;
    textSources.push(readAnyString(estimate, ["label", "name", "description"]));
  }

  return cleanReservationSummaryParts(textSources);
}

function cleanReservationSummaryParts(values: Array<string | null>) {
  const parts = values
    .flatMap((value) => splitSummaryParts(stripHtml(value)))
    .map(cleanSummaryPart)
    .filter((part): part is string => Boolean(part));

  return uniqueStrings(parts).join(" ") || null;
}

function splitSummaryParts(value: string | null) {
  return (value ?? "")
    .split(/[|,/;-]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function cleanSummaryPart(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (
    !normalized ||
    isGenericReservationCategory(normalized) ||
    isGenericResortName(normalized) ||
    normalizeSpecificLocationName(normalized)
  ) {
    return null;
  }

  return normalized;
}

function isGenericReservationCategory(value: string) {
  const normalized = value.trim().toLowerCase();

  return [
    "boarding",
    "day care",
    "daycare",
    "grooming",
    "lodging",
    "reservation",
    "spa",
  ].includes(normalized);
}

function isGenericResortName(value: string) {
  return /^le chateau pet resort$/i.test(value.trim());
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
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
    age: readAnyString(record, ["animal_age", "age", "age_years", "animal_age_years"]),
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
  const reservationsValue = Array.isArray(data.reservations) ? data.reservations : [];
  const normalizedReservations = reservationsValue.map(normalizeEstimateReservation).filter(Boolean);
  const details = reservationsValue.flatMap(normalizeReservationServiceCharges);
  const subtotalAmount =
    normalizedReservations.reduce(
      (total, line) =>
        total +
        readMoneyAmount(line?.subtotal) +
        (line?.modifiers ?? []).reduce(
          (modifierTotal, modifier) => modifierTotal + readMoneyAmount(modifier?.total),
          0,
        ),
      0,
    ) +
    details.reduce((total, line) => total + readMoneyAmount(line.total), 0);
  const taxAmount = reservationsValue.reduce((total, value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return total;
    }

    return total + readMoneyAmount((value as Record<string, unknown>).tax_amount);
  }, 0);
  const totalDueAmount = subtotalAmount + taxAmount;
  const deposits = Array.isArray(data.deposits) ? data.deposits : [];
  const appliedDepositAmount = deposits.reduce((total, value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return total;
    }

    const deposit = value as Record<string, unknown>;

    if (deposit.refunded_at || deposit.forfeited_at || deposit.cancel_stamp) {
      return total;
    }

    return total + readMoneyAmount(deposit.paid_amount ?? deposit.deposit_amount);
  }, 0);

  return {
    details,
    location: location
      ? {
          city: readString(location, "city"),
          email: readString(location, "email"),
          hours: stripHtml(readString(location, "hours")),
          name: readString(location, "name"),
          phone: readString(location, "phone"),
        }
      : null,
    remainingDue: formatMoney(String(Math.max(0, totalDueAmount - appliedDepositAmount))),
    reservations: normalizedReservations,
    subtotal: formatMoney(String(subtotalAmount)),
    tax: formatMoney(String(taxAmount)),
    totalDue: formatMoney(String(totalDueAmount)),
  };
}

function normalizeReservationServiceCharges(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const reservationEstimate = value as Record<string, unknown>;
  const reservation = readRecord(reservationEstimate, "reservation");
  const animalName = reservation ? readAnyString(reservation, ["animal_name", "pet_name"]) : null;
  const services = Array.isArray(reservationEstimate.reservation_services)
    ? reservationEstimate.reservation_services
    : [];
  const groupedServices = new Map<string, { label: string; quantity: number; rate: number }>();

  for (const serviceValue of services) {
    if (!serviceValue || typeof serviceValue !== "object" || Array.isArray(serviceValue)) {
      continue;
    }

    const service = serviceValue as Record<string, unknown>;
    const type = readAnyString(service, ["type", "name", "label"]) ?? "Service";
    const rate = readMoneyAmount(service.rate ?? service.price);
    const key = `${type}|${rate}`;
    const existing = groupedServices.get(key);

    if (existing) {
      existing.quantity += 1;
    } else {
      groupedServices.set(key, { label: type, quantity: 1, rate });
    }
  }

  return Array.from(groupedServices.values()).map((service) => ({
    label: animalName ? `${service.label} for ${animalName}` : service.label,
    quantity: String(service.quantity),
    total: formatMoney(String(service.quantity * service.rate)),
    unitPrice: formatMoney(String(service.rate)),
  }));
}

function readMoneyAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function readDeepCollection(record: Record<string, unknown>, keys: string[]) {
  const value = findDeepValue(record, keys, (candidate) =>
    Array.isArray(candidate) || Boolean(candidate && typeof candidate === "object"),
  );

  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>);
  }

  return [];
}

function readDeepAnyString(record: Record<string, unknown>, keys: string[]) {
  const value = findDeepValue(record, keys, (candidate) =>
    typeof candidate === "string" || typeof candidate === "number",
  );

  return typeof value === "number" ? String(value) : typeof value === "string" ? value : null;
}

function findDeepValue(
  record: Record<string, unknown>,
  keys: string[],
  accepts: (value: unknown) => boolean,
) {
  const queue: Array<{ depth: number; value: Record<string, unknown> }> = [{ depth: 0, value: record }];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      break;
    }

    for (const key of keys) {
      const candidate = current.value[key];

      if (accepts(candidate)) {
        return candidate;
      }
    }

    if (current.depth >= 4) {
      continue;
    }

    for (const candidate of Object.values(current.value)) {
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        queue.push({ depth: current.depth + 1, value: candidate as Record<string, unknown> });
      }
    }
  }

  return null;
}

function normalizeEstimateDetail(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const detail = value as Record<string, unknown>;

  return {
    label: readDeepAnyString(detail, ["name", "label", "description", "item_name"]),
    quantity: readDeepAnyString(detail, ["quantity", "qty"]),
    total: formatMoney(readDeepAnyString(detail, ["total", "amount", "line_total", "lineTotal", "price"])),
    unitPrice: formatMoney(readDeepAnyString(detail, ["unit_price", "unitPrice", "price_each", "rate"])),
  };
}

function normalizeEstimateReservation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const reservation = value as Record<string, unknown>;
  const modifiersValue = reservation.modifiers;
  const modifiers = modifiersValue && typeof modifiersValue === "object"
    ? (Array.isArray(modifiersValue)
      ? modifiersValue
      : Object.values(modifiersValue as Record<string, unknown>))
        .map(normalizeEstimateModifier)
        .filter(Boolean)
    : [];

  const quantity = readAnyString(reservation, ["quantity", "qty", "units"]);
  const unitPrice = readAnyString(reservation, ["base_rate", "unit_price", "unitPrice", "rate"]);
  const baseCharge = readMoneyAmount(quantity) * readMoneyAmount(unitPrice);

  return {
    label: readDeepAnyString(reservation, ["name", "type", "reservation_type"]),
    modifiers,
    quantity,
    subtotal: formatMoney(String(baseCharge)),
    unitPrice: formatMoney(unitPrice),
  };
}

function normalizeEstimateModifier(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const modifier = value as Record<string, unknown>;
  const quantity = readAnyString(modifier, ["qty", "quantity"]) ?? "1";
  const unitPrice = readAnyString(modifier, ["cost", "rate", "price"]);
  const total = readMoneyAmount(unitPrice) * readMoneyAmount(quantity);

  return {
    label: readAnyString(modifier, ["label", "name", "type"]),
    quantity,
    total: formatMoney(String(total)),
    unitPrice: formatMoney(unitPrice),
  };
}

function readReservationStatus(reservation: Record<string, unknown>) {
  if (readAnyString(reservation, ["cancel_stamp"])) {
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

  if (readAnyString(reservation, ["confirmed_stamp"])) {
    return "Confirmed";
  }

  const explicitStatus = readAnyString(reservation, ["status", "status_name", "reservation_status"]);

  if (explicitStatus && !explicitStatus.trim().toLowerCase().includes("confirm")) {
    return explicitStatus;
  }

  return "Unconfirmed";
}

function formatGingrTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue > 999999999) {
    return new Date(numericValue * 1000).toISOString();
  }

  return value;
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

  for (const key of [
    "locations",
    "location",
    "reservations",
    "reservation",
    "report_card_files",
    "report_card_file",
    "files",
    "file",
    "immunizations",
    "immunization",
    "immunization_types",
    "immunization_type",
    "required_immunizations",
    "required_immunization",
    "invoices",
    "invoice",
    "data",
    "items",
    "results",
  ]) {
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
  ownerReservationIds = new Set<string>(),
) {
  const maxPages = 10;
  const matchingInvoices: unknown[] = [];
  let pagesScanned = 0;
  let totalReturned = 0;
  let sampleFieldKeys: string[] = [];

  const perPage = Number(baseParams.per_page);
  const pageSize = Number.isFinite(perPage) && perPage > 0 ? perPage : 100;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const pageOffset = 1 + pageIndex * pageSize;
    const response = await gingrGet(baseUrl, apiKey, "/api/v1/list_invoices", {
      ...baseParams,
      page: String(pageOffset),
    });
    const invoices = unwrapGingrArray(response);

    if (invoices.length === 0) {
      break;
    }

    pagesScanned = pageIndex + 1;
    totalReturned += invoices.length;
    sampleFieldKeys = sampleFieldKeys.length > 0 ? sampleFieldKeys : readObjectKeys(invoices[0]);
    matchingInvoices.push(
      ...invoices.filter((invoice) =>
        invoiceMatchesOwner(invoice, ownerId, ownerEmail) ||
        invoiceMatchesReservation(invoice, ownerReservationIds)
      ),
    );

    if (matchingInvoices.length >= 20) {
      break;
    }

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

function invoiceMatchesReservation(value: unknown, reservationIds: Set<string>) {
  if (reservationIds.size === 0) {
    return false;
  }

  return collectReservationIds(value).some((reservationId) => reservationIds.has(reservationId));
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
    date: readAnyDate(invoice, ["date", "invoice_date", "create_stamp", "created_at", "created", "created_date"]),
    total: readAnyString(invoice, ["total", "invoice_total", "amount", "balance"]),
  };
}

function buildReservationMonthInvoiceLookups(value: unknown) {
  const months = new Set<string>();
  for (const reservation of unwrapGingrArray(value)) {
    if (!reservation || typeof reservation !== "object" || Array.isArray(reservation)) continue;
    const record = reservation as Record<string, unknown>;
    for (const date of [
      readAnyDate(record, ["created_at", "create_stamp", "created_date"]),
      readAnyDate(record, ["start_date", "checkin_date", "check_in_date"]),
      readAnyDate(record, ["end_date", "checkout_date", "check_out_date"]),
    ]) {
      if (date) months.add(date.slice(0, 7));
    }
  }

  return Array.from(months)
    .sort()
    .reverse()
    .slice(0, 12)
    .map((month) => {
      const [year, monthNumber] = month.split("-").map(Number);
      const fromDate = new Date(year, monthNumber - 1, 1);
      const toDate = new Date(year, monthNumber, 0);
      return {
        label: `completedReservationMonth-${month}`,
        params: {
          complete: "true",
          closed_only: "false",
          from_date: formatIsoDateForGingr(fromDate),
          to_date: formatIsoDateForGingr(toDate),
          page: "1",
          per_page: "100",
        },
      };
    });
}

function collectReservationIds(value: unknown, depth = 0): string[] {
  if (depth > 8 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap((item) => collectReservationIds(item, depth + 1))));
  }

  const record = value as Record<string, unknown>;
  const directIds = ["reservation_id", "r_id", "booking_id"]
    .map((key) => readString(record, key))
    .filter((id): id is string => Boolean(id));
  const nestedIds = Object.values(record).flatMap((item) => collectReservationIds(item, depth + 1));
  return Array.from(new Set([...directIds, ...nestedIds]));
}

function collectObjectKeys(value: unknown, depth = 0): string[] {
  if (depth > 5 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return Array.from(new Set(value.flatMap((item) => collectObjectKeys(item, depth + 1)))).slice(0, 80);
  }

  const record = value as Record<string, unknown>;
  return Array.from(new Set([
    ...Object.keys(record),
    ...Object.values(record).flatMap((item) => collectObjectKeys(item, depth + 1)),
  ])).slice(0, 80);
}

function collectReservationReferences(value: unknown, path = "root", depth = 0): Array<{ key: string; path: string; value: string }> {
  if (depth > 8 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectReservationReferences(item, `${path}[${index}]`, depth + 1)).slice(0, 40);
  }

  const references: Array<{ key: string; path: string; value: string }> = [];
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (/reservation|booking|\br_id\b/i.test(key) && (typeof nestedValue === "string" || typeof nestedValue === "number")) {
      references.push({ key, path, value: String(nestedValue).slice(0, 160) });
    }
    references.push(...collectReservationReferences(nestedValue, `${path}.${key}`, depth + 1));
    if (references.length >= 40) break;
  }
  return references.slice(0, 40);
}

function collectTransactionItemSummaries(value: unknown, path = "root", depth = 0): Array<Record<string, unknown>> {
  if (depth > 8 || !value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const record = item as Record<string, unknown>;
      const summary = {
        amount: readAnyString(record, ["total", "amount", "price", "subtotal", "item_total"]),
        description: readAnyString(record, ["description", "name", "item_name", "label", "title", "type"]),
        fieldKeys: readObjectKeys(record),
        id: readAnyString(record, ["id", "item_id", "transaction_item_id"]),
        path: `${path}[${index}]`,
        quantity: readAnyString(record, ["quantity", "qty", "units"]),
        reservationId: readAnyString(record, ["reservation_id", "r_id", "booking_id"]),
      };
      return [summary, ...collectTransactionItemSummaries(record, `${path}[${index}]`, depth + 1)];
    }).slice(0, 60);
  }

  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, nestedValue]) => collectTransactionItemSummaries(nestedValue, `${path}.${key}`, depth + 1))
    .slice(0, 60);
}

function collectTransactionPaymentSummaries(
  value: unknown,
  path = "root",
  depth = 0,
): Array<{
  amount: string | null;
  date: string | null;
  description: string | null;
  id: string | null;
  isDeposit: boolean;
  method: string | null;
  status: string | null;
}> {
  if (depth > 8 || !value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item, index) =>
        collectTransactionPaymentSummaries(item, `${path}[${index}]`, depth + 1)
      )
      .slice(0, 40);
  }

  const record = value as Record<string, unknown>;
  const description = readAnyString(record, ["description", "payment_description", "memo", "notes"]);
  const amount = readAnyString(record, ["payment_amount", "paid_amount", "p_amount", "amount", "total"]);
  const isAggregatePayment = Boolean(
    description && /^(?:(?:total\s+)?(?:payments?|deposits?)|remaining due|balance due)$/i.test(description.trim()),
  );
  const date = readAnyDate(record, ["payment_date", "p_date", "date", "created_at", "create_stamp", "created"]);
  const id = readAnyString(record, ["payment_id", "transaction_payment_id", "p_id", "id"]);
  const status = readDeepAnyString(record, ["deposit_status", "payment_status", "status"]);
  const nestedMethod =
    readRecord(record, "payment_method") ??
    readRecord(record, "method") ??
    readRecord(record, "tender");
  const method =
    readAnyString(record, ["payment_method_name", "payment_method", "method_name", "method", "tender_name", "tender", "payment_type"]) ??
    (nestedMethod ? readAnyString(nestedMethod, ["name", "label", "type"]) : null);
  const hasPaymentSpecificField = [
    "payment_amount",
    "paid_amount",
    "p_amount",
    "payment_id",
    "transaction_payment_id",
    "p_id",
    "payment_date",
    "p_date",
    "payment_method_id",
    "payment_method_name",
  ].some((key) => record[key] !== undefined && record[key] !== null && record[key] !== "");
  const isPaymentPath = /payments?|deposits?|tenders?/i.test(path);
  const isPaymentRecord = isPaymentPath && Boolean(
    hasPaymentSpecificField ||
    method ||
    (record.amount !== undefined && amount && readMoneyAmount(amount) < 0),
  );

  if (isPaymentRecord && !isAggregatePayment && amount && (id || date || method || description)) {
    return [{
      amount: formatMoney(String(readMoneyAmount(amount))),
      date,
      description,
      id,
      isDeposit: /deposit/i.test(`${path} ${description ?? ""}`),
      method,
      status,
    }];
  }

  return Object.entries(record)
    .flatMap(([key, nestedValue]) =>
      collectTransactionPaymentSummaries(nestedValue, `${path}.${key}`, depth + 1)
    )
    .slice(0, 40);
}

function collectTransactionSettlementSummary(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { depositsTotal: null, paymentsTotal: null, remainingDue: null };
  }

  const record = value as Record<string, unknown>;
  const depositsTotal = readDeepAnyString(record, [
    "deposits_total",
    "total_deposits",
    "deposit_total",
    "deposits_paid",
  ]);
  const paymentsTotal = readDeepAnyString(record, [
    "payments_total",
    "total_payments",
    "payment_total",
    "payments_paid",
  ]);
  const remainingDue = readDeepAnyString(record, [
    "remaining_due",
    "balance_due",
    "amount_due",
  ]);

  return {
    depositsTotal: depositsTotal ? formatMoney(String(readMoneyAmount(depositsTotal))) : null,
    paymentsTotal: paymentsTotal ? formatMoney(String(readMoneyAmount(paymentsTotal))) : null,
    remainingDue: remainingDue ? formatMoney(String(readMoneyAmount(remainingDue))) : null,
  };
}

function collectTransactionChargeSummaries(
  value: unknown,
  path = "root",
  depth = 0,
): Array<{
  amount: string | null;
  animalName: string | null;
  description: string | null;
  id: string | null;
  quantity: string | null;
  reservationId: string | null;
}> {
  if (depth > 8 || !value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item, index) =>
        collectTransactionChargeSummaries(item, `${path}[${index}]`, depth + 1)
      )
      .slice(0, 60);
  }

  const record = value as Record<string, unknown>;
  const isChargePath = /items?|charges?|line[_-]?items?/i.test(path) &&
    !/payments?|deposits?|tenders?/i.test(path);
  const description = readAnyString(record, [
    "item_description",
    "description",
    "item_name",
    "name",
    "label",
    "title",
    "type",
  ]);
  const amount = readAnyString(record, ["total", "amount", "price", "subtotal", "item_total"]);

  if (isChargePath && description && amount) {
    const reservationId =
      readAnyString(record, ["reservation_id", "r_id", "booking_id"]) ??
      collectReservationIds(record)[0] ??
      null;

    return [{
      amount: formatMoney(String(readMoneyAmount(amount))),
      animalName: stripHtml(readDeepAnyString(record, ["animal_name", "pet_name"])),
      description: stripHtml(description),
      id: readAnyString(record, ["transaction_item_id", "item_id", "id"]),
      quantity: readAnyString(record, ["quantity", "qty", "units"]),
      reservationId,
    }];
  }

  return Object.entries(record)
    .flatMap(([key, nestedValue]) =>
      collectTransactionChargeSummaries(nestedValue, `${path}.${key}`, depth + 1)
    )
    .slice(0, 60);
}

function normalizeReportCardFileSummary(
  value: unknown,
  ownerId: string,
  ownerEmail: string | undefined,
  ownerPets: Array<{ id: string | null; name: string | null }>,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const file = value as Record<string, unknown>;
  const directOwnerId = readAnyString(file, [
    "owner_id",
    "o_id",
    "customer_id",
    "client_id",
    "user_id",
    "owner",
  ]);
  const directOwnerEmail = readAnyString(file, [
    "email",
    "owner_email",
    "customer_email",
    "client_email",
  ]);
  const animalId = readAnyString(file, ["animal_id", "a_id", "pet_id"]);
  const petName = readAnyString(file, ["animal_name", "pet_name"]);
  const owner = readRecord(file, "owner") ?? readRecord(file, "customer") ?? readRecord(file, "client");
  const animal = readRecord(file, "animal") ?? readRecord(file, "pet");
  const nestedOwnerId = owner ? readAnyString(owner, ["id", "owner_id", "o_id", "customer_id"]) : null;
  const nestedOwnerEmail = owner ? readAnyString(owner, ["email", "owner_email", "customer_email"]) : null;
  const nestedAnimalId = animal ? readAnyString(animal, ["id", "animal_id", "a_id", "pet_id"]) : null;
  const nestedPetName = animal ? readAnyString(animal, ["name", "animal_name", "pet_name"]) : null;
  const matchedPetNames = ownerPets
    .filter((pet) => {
      const petIdMatches = Boolean(pet.id && (pet.id === animalId || pet.id === nestedAnimalId));
      const petNameMatches = Boolean(
        pet.name &&
          [petName, nestedPetName].some(
            (candidate) => candidate?.toLowerCase() === pet.name?.toLowerCase(),
          ),
      );

      return petIdMatches || petNameMatches;
    })
    .map((pet) => pet.name ?? pet.id)
    .filter((pet): pet is string => Boolean(pet));
  const matchesSignedInOwner =
    Boolean(ownerId && [directOwnerId, nestedOwnerId].includes(ownerId)) ||
    Boolean(
      ownerEmail &&
        [directOwnerEmail, nestedOwnerEmail].some(
          (candidate) => candidate?.toLowerCase() === ownerEmail.toLowerCase(),
        ),
    ) ||
    matchedPetNames.length > 0;

  return {
    id: readAnyString(file, ["id", "file_id", "report_card_file_id", "rc_file_id"]),
    animalId: animalId ?? nestedAnimalId,
    createdAt: readAnyString(file, ["created_at", "create_stamp", "uploaded_at", "upload_date"]),
    fileName: readAnyString(file, ["file_name", "filename", "name", "title"]),
    fileType: readAnyString(file, ["file_type", "mime_type", "type", "extension"]),
    fileUrl: readAnyString(file, ["file_url", "url", "download_url", "public_url", "path", "file"]),
    locationId: readAnyString(file, ["location_id", "l_id"]),
    matchedPetNames,
    matchesSignedInOwner,
    ownerId: directOwnerId ?? nestedOwnerId,
    petName: petName ?? nestedPetName,
    reservationId: readAnyString(file, ["reservation_id", "r_id", "booking_id"]),
    rawFieldKeys: readObjectKeys(file),
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

  const decoded = value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");

  return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), gingrRequestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    const json = parseJson(text);

    if (!response.ok) {
      throw new Error(
        `Gingr returned HTTP ${response.status}: ${typeof json === "string" ? json : JSON.stringify(redact(json))}`,
      );
    }

    return redact(json);
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`Gingr request timed out after ${gingrRequestTimeoutMs / 1000} seconds.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

function isAbortError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: unknown }).name === "AbortError",
  );
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
