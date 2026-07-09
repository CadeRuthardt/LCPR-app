type DiscoveryAction =
  | "locations"
  | "reservation-types"
  | "services-by-type"
  | "current-owner"
  | "current-pets"
  | "current-client-snapshot";

type DiscoveryRequest = {
  action?: DiscoveryAction;
  reservationTypeId?: string | number;
  locationId?: string | number;
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

    if (action === "reservation-types") {
      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/reservation_types"),
      });
    }

    if (action === "services-by-type") {
      if (!body.reservationTypeId) {
        return jsonResponse({ error: "reservationTypeId is required." }, 400);
      }

      return jsonResponse({
        action,
        data: await gingrGet(gingrBaseUrl, gingrApiKey, "/api/v1/get_services_by_type", {
          reservation_type_id: String(body.reservationTypeId),
          ...(body.locationId ? { location_id: String(body.locationId) } : {}),
        }),
      });
    }

    if (action === "current-owner") {
      return jsonResponse({
        action,
        data: await findOwnerByEmail(gingrBaseUrl, gingrApiKey, authResult.user),
      });
    }

    if (action === "current-pets") {
      return jsonResponse({
        action,
        data: await buildCurrentPets(gingrBaseUrl, gingrApiKey, authResult.user),
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
          "Unsupported discovery action. Use locations, reservation-types, services-by-type, current-owner, current-pets, or current-client-snapshot.",
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

async function buildCurrentPets(baseUrl: string, apiKey: string, user: AuthUser) {
  const owner = await findOwnerByEmail(baseUrl, apiKey, user);
  const ownerData = unwrapGingrData<Record<string, unknown>>(owner);
  const animals = Array.isArray(ownerData?.animals) ? ownerData.animals : [];

  return {
    ownerId: readString(ownerData, "id"),
    pets: animals.map(normalizeAnimal).filter(Boolean),
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
    owner_id: String(ownerId),
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
    birthday: birthdaySeconds ? secondsToIsoDate(birthdaySeconds) : null,
    age: birthdaySeconds ? formatAgeFromSeconds(birthdaySeconds) : "Age not listed",
    weight: formatWeight(readString(animal, "animal_weight") ?? readString(animal, "weight")),
    imageUrl: readString(animal, "image"),
    vaccinationSummary: immunizationExpirationSeconds
      ? `Vaccinations current through ${formatDateFromSeconds(immunizationExpirationSeconds)}`
      : "Vaccination status not listed",
    nextImmunizationExpiration:
      immunizationExpirationSeconds ? secondsToIsoDate(immunizationExpirationSeconds) : null,
    status: checkedInReservationId ? "Checked In" : "Active",
    source: "gingr",
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

function formatWeight(value: string | null) {
  if (!value) {
    return "Weight not listed";
  }

  return value.toLowerCase().includes("lb") ? value : `${value} lbs`;
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
