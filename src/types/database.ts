export type ClientProfile = {
  created_at: string;
  display_name: string;
  email: string;
  gingr_client_id: string | null;
  id: string;
  updated_at: string;
};

export type Phase1SeedPet = {
  age: string | null;
  breed: string | null;
  care_note: string | null;
  created_at: string;
  id: string;
  image_url: string | null;
  name: string;
  status: "active" | "wellness";
  user_id: string;
  vaccination_summary: string | null;
  weight: string | null;
};

export type ReservationRequest = {
  amenity_package: string | null;
  authorized_pickup: string | null;
  created_at: string;
  end_date: string;
  end_time: string | null;
  enrichment_enabled: boolean;
  enrichment_frequency: string | null;
  experience: string;
  id: string;
  location: string | null;
  notes: string | null;
  optional_services: string[];
  reservation_type: string | null;
  selected_pet_ids: string[];
  spa_service: string | null;
  spa_upgrades: string[];
  start_date: string;
  start_time: string | null;
  status: "submitted" | "under_review" | "action_required" | "confirmed" | "cancelled";
  suite_size: string | null;
  updated_at: string;
  user_id: string;
};

export type ReservationRequestInsert = {
  amenity_package?: string | null;
  authorized_pickup?: string | null;
  end_date: string;
  end_time?: string | null;
  enrichment_enabled?: boolean;
  enrichment_frequency?: string | null;
  experience: string;
  location?: string | null;
  notes?: string | null;
  optional_services?: string[];
  reservation_type?: string | null;
  selected_pet_ids: string[];
  spa_service?: string | null;
  spa_upgrades?: string[];
  start_date: string;
  start_time?: string | null;
  suite_size?: string | null;
};
