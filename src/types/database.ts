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
  created_at: string;
  end_date: string;
  experience: string;
  id: string;
  notes: string | null;
  optional_services: string[];
  selected_pet_ids: string[];
  start_date: string;
  status: "submitted" | "under_review" | "action_required" | "confirmed" | "cancelled";
  updated_at: string;
  user_id: string;
};

export type ReservationRequestInsert = {
  end_date: string;
  experience: string;
  notes?: string | null;
  optional_services?: string[];
  selected_pet_ids: string[];
  start_date: string;
};
