export type TabKey = "home" | "pets" | "reservations" | "explore" | "profile";

export type Pet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  allergies?: string | null;
  birthday?: string | null;
  careNote: string;
  colorAndMarkings?: string | null;
  feedingMethod?: string | null;
  feedingNotes?: string | null;
  feedingSchedules?: PetFeedingSchedule[];
  feedingType?: string | null;
  fixed?: boolean;
  gender?: string | null;
  immunizations?: PetImmunization[];
  medicationNotes?: string | null;
  medicationSchedules?: PetMedicationSchedule[];
  medicines?: string | null;
  notes?: string | null;
  nextImmunizationExpiration?: string | null;
  rawData?: Record<string, unknown>;
  source?: "seed" | "gingr";
  species?: string;
  status: "Active" | "Wellness";
  vaccinationSummary: string;
  vetName?: string | null;
  vetPhone?: string | null;
  vip?: boolean;
  weight: string;
  imageUrl: string;
};

export type PetImmunization = {
  administeredDate: string | null;
  expiresDate: string | null;
  id: string | null;
  name: string;
  rawData: unknown;
  status: string | null;
};

export type PetFeedingSchedule = {
  amount: string;
  instructions: string | null;
  label: string;
};

export type PetMedicationSchedule = {
  label: string;
  medications: Array<{
    amount: string;
    endDate: string | null;
    notes: string | null;
    startDate: string | null;
    type: string | null;
  }>;
};

export type Reservation = {
  id: string;
  nights: string;
  petName: string;
  dateRange: string;
  experience: string;
  status: "Confirmed" | "Under Review" | "Preparing" | "Completed";
};

export type ClientReservation = {
  dateRange: string;
  endDate: string | null;
  id: string;
  location: string | null;
  petNames: string[];
  reservationType: string | null;
  startDate: string | null;
  status: string;
};

export type ReservationDetailPet = {
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

export type ReservationEstimate = {
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

export type ClientReservationDetail = {
  animalNames: string[];
  baseRate: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  confirmedAt: string | null;
  createdAt: string | null;
  createdBy: string | null;
  dateRange: string;
  endDate: string | null;
  endDateTimeLabel: string | null;
  estimate: ReservationEstimate | null;
  feedingAmount: string | null;
  feedingNotes: string | null;
  feedingTime: string | null;
  finalRate: string | null;
  groomingNotes: string | null;
  id: string;
  location: string | null;
  nights: string | null;
  notes: string | null;
  petDetails: ReservationDetailPet[];
  precheckCompleted: boolean | null;
  rawReservations?: Array<Record<string, unknown>>;
  reservationType: string | null;
  services: string | null;
  startDate: string | null;
  startDateTimeLabel: string | null;
  status: string;
  unitsOfTime: string | null;
};

export type ExploreFeature = {
  id: string;
  title: string;
  description: string;
  label: string;
  imageUrl: string;
};
