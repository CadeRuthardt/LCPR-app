export type TabKey = "home" | "pets" | "stays" | "explore" | "profile";

export type Pet = {
  id: string;
  name: string;
  breed: string;
  age: string;
  careNote: string;
  status: "Active" | "Wellness";
  vaccinationSummary: string;
  imageUrl: string;
};

export type Stay = {
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
