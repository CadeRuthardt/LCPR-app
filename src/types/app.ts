export type TabKey = "home" | "pets" | "reservations" | "explore" | "profile";

export type Pet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  careNote: string;
  status: "Active" | "Wellness";
  vaccinationSummary: string;
  weight: string;
  imageUrl: string;
};

export type Reservation = {
  id: string;
  nights: string;
  petName: string;
  dateRange: string;
  experience: string;
  status: "Confirmed" | "Under Review" | "Preparing" | "Completed";
};

export type ExploreFeature = {
  id: string;
  title: string;
  description: string;
  label: string;
  imageUrl: string;
};
