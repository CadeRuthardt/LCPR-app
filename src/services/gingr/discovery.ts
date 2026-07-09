import { requireSupabase } from "@/lib/supabase";

export type GingrDiscoveryAction =
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
  medicationNotes: string | null;
  medicationSchedules: GingrMedicationSchedule[];
  medicines: string | null;
  name: string;
  nextImmunizationExpiration: string | null;
  notes: string | null;
  source: "gingr";
  species: string;
  status: "Active" | "Checked In";
  vaccinationSummary: string;
  vetName: string | null;
  vetPhone: string | null;
  vip: boolean;
  weight: string;
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
};

export type CurrentGingrOwnerProfileResponse = {
  displayName: string | null;
  email: string | null;
  imageSourceKey: string | null;
  imageUrl: string | null;
  ownerId: string | null;
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
  endDate: string | null;
  id: string;
  location: string | null;
  reservationType: string | null;
  startDate: string | null;
  status: string;
};

export type CurrentGingrReservationsResponse = {
  ownerId: string | null;
  reservations: GingrReservation[];
};

export type GingrReservationDetailPet = {
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
  services: string | null;
  startDateTimeLabel: string | null;
  unitsOfTime: string | null;
};

export type GingrReservationDetailResponse = {
  estimate: GingrReservationEstimate | null;
  ownerId: string | null;
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

export async function getCurrentGingrOwnerProfile() {
  const response = await runGingrDiscovery<CurrentGingrOwnerProfileResponse>({
    action: "current-owner-profile",
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
