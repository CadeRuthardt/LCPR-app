import type { ExploreFeature, Pet, Stay } from "../types/app";

export const guest = {
  firstName: "Sarah",
  lastName: "Clark",
  email: "sarah.clark@email.com",
  welcomeNote: "We can't wait to see Bella.",
};

export const pets: Pet[] = [
  {
    id: "pet-louis",
    name: "Bella",
    breed: "Golden Retriever",
    age: "4 years",
    careNote: "Prefers a quiet evening routine and extra blanket service.",
    vaccinationSummary: "Bordetella renewal due before the next stay.",
    imageUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pet-belle",
    name: "Charlie",
    breed: "Labrador Retriever",
    age: "7 years",
    careNote: "Enjoys window perches and gentle brushing.",
    vaccinationSummary: "Records look complete for the season.",
    imageUrl:
      "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=900&q=80",
  },
];

export const upcomingStay: Stay = {
  id: "stay-preview",
  petName: "Bella",
  dateRange: "May 24 - May 28, 2025",
  experience: "Premium Collection",
  status: "Preparing",
};

export const stays: Stay[] = [
  upcomingStay,
  {
    id: "stay-request",
    petName: "Charlie",
    dateRange: "June 21 - June 25, 2025",
    experience: "Let Le Chateau Recommend",
    status: "Under Review",
  },
  {
    id: "stay-past",
    petName: "Bella",
    dateRange: "April 2 - April 6, 2025",
    experience: "Classic Collection",
    status: "Confirmed",
  },
];

export const exploreFeatures: ExploreFeature[] = [
  {
    id: "vip",
    title: "Our Resort",
    description: "Take a tour of our five-star resort experience.",
    label: "Signature",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "spa",
    title: "Services & Spa",
    description: "Pampering and wellness for every pet.",
    label: "Wellness",
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-resort",
    title: "Amenities",
    description: "Luxury comforts for a stay that feels considered.",
    label: "Resort",
    imageUrl:
      "https://images.unsplash.com/photo-1583512603866-910c8542d257?auto=format&fit=crop&w=900&q=80",
  },
];

export const resortImages = {
  homeHero:
    "https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=1200&q=85",
  stayHero:
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=85",
};
