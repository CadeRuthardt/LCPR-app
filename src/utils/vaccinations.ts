import type { Pet, PetImmunization } from "@/types/app";

export type VaccinationStatus = "current" | "expired" | "missing" | "not_required";

export function requiresVaccinationRecords(pet: Pet) {
  const species = pet.species?.trim().toLowerCase();

  if (species) {
    return ["cat", "dog", "canine", "feline"].includes(species);
  }

  const breedPrefix = pet.breed.split("|")[0]?.trim().toLowerCase();
  return ["cat", "dog", "canine", "feline"].includes(breedPrefix);
}

export function getVaccinationStatus(pet: Pet, now = new Date()): VaccinationStatus {
  if (!requiresVaccinationRecords(pet)) {
    return "not_required";
  }

  const today = startOfDay(now);
  const immunizations = pet.immunizations ?? [];
  const latestRecords = latestRecordForEachVaccination(immunizations);

  if (latestRecords.some((record) => isExpired(record, today))) {
    return "expired";
  }

  const datedRecords = latestRecords.filter((record) => Boolean(parseDate(record.expiresDate)));
  if (latestRecords.length > 0 && datedRecords.length === latestRecords.length) {
    return "current";
  }

  const nextExpiration = parseDate(pet.nextImmunizationExpiration);
  if (nextExpiration) {
    return nextExpiration >= today ? "current" : "expired";
  }

  return "missing";
}

export function hasCurrentVaccinations(pet: Pet, now = new Date()) {
  return getVaccinationStatus(pet, now) === "current";
}

export function meetsVaccinationRequirements(pet: Pet, now = new Date()) {
  const status = getVaccinationStatus(pet, now);
  return status === "current" || status === "not_required";
}

function isExpired(record: PetImmunization, today: Date) {
  if (record.status?.trim().toLowerCase().includes("expired")) {
    return true;
  }

  const expiration = parseDate(record.expiresDate);
  return expiration ? expiration < today : false;
}

function latestRecordForEachVaccination(records: PetImmunization[]) {
  const latestByName = new Map<string, PetImmunization>();

  for (const record of records) {
    const key = record.name.trim().toLowerCase();
    const existing = latestByName.get(key);
    const existingExpiration = parseDate(existing?.expiresDate)?.getTime() ?? Number.MIN_SAFE_INTEGER;
    const nextExpiration = parseDate(record.expiresDate)?.getTime() ?? Number.MIN_SAFE_INTEGER;

    if (!existing || nextExpiration >= existingExpiration) {
      latestByName.set(key, record);
    }
  }

  return Array.from(latestByName.values());
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
