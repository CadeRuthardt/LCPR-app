import type { ExploreFeature, Pet, Reservation } from "../types/app";

export const guest = {
  firstName: "Cade",
  lastName: "Ruthardt",
  email: "cade@example.com",
  welcomeNote: "Baelfire's next reservation",
};

export const pets: Pet[] = [
  {
    id: "pet-louis",
    name: "Baelfire",
    breed: "Golden Retriever",
    age: "4 years",
    careNote: "Playful, social, and happiest with a little extra outdoor time.",
    status: "Active",
    vaccinationSummary: "Records are up to date for the season.",
    weight: "68 lbs",
    imageUrl:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pet-belle",
    name: "Moe",
    breed: "Domestic Longhair",
    age: "3 years",
    careNote: "Enjoys quiet suites, window perches, and gentle brushing.",
    status: "Active",
    vaccinationSummary: "Records look complete for the season.",
    weight: "12 lbs",
    imageUrl:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pet-luna",
    name: "Luna",
    breed: "Ragdoll",
    age: "2 years",
    careNote: "Prefers calm spaces and a familiar blanket from home.",
    status: "Active",
    vaccinationSummary: "Rabies renewal is due before the next reservation.",
    weight: "10 lbs",
    imageUrl:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80",
  },
];

export const upcomingReservation: Reservation = {
  id: "reservation-preview",
  petName: "Baelfire",
  dateRange: "July 18 - July 22, 2025",
  nights: "4 nights",
  experience: "Premium Collection",
  status: "Confirmed",
};

export const reservations: Reservation[] = [
  upcomingReservation,
  {
    id: "reservation-request",
    petName: "Moe",
    dateRange: "August 8 - August 12, 2025",
    nights: "4 nights",
    experience: "Let Le Chateau Recommend",
    status: "Under Review",
  },
  {
    id: "reservation-past",
    petName: "Baelfire",
    dateRange: "April 2 - April 6, 2025",
    nights: "4 nights",
    experience: "Classic Collection",
    status: "Completed",
  },
];

export const exploreFeatures: ExploreFeature[] = [
  {
    id: "vip",
    title: "Accommodations",
    description: "Luxury suites for every pup and personality.",
    label: "Suites",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "spa",
    title: "Spa & Boutique",
    description: "Pampering, products, and a whole lot of love.",
    label: "Wellness",
    imageUrl:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-resort",
    title: "Live Resort Cameras",
    description: "See what's happening around the resort.",
    label: "Live",
    imageUrl:
      "https://images.unsplash.com/photo-1583512603866-910c8542d257?auto=format&fit=crop&w=900&q=80",
  },
];

export const resortImages = {
  homeHero:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  loginHero:
    "https://lechateaupetresort.com/wp-content/uploads/2025/10/amarillo.webp",
  stayHero:
    "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=85",
  playYard:
    "https://lechateaupetresort.com/wp-content/uploads/2025/10/Group-zoom-scaled.jpeg",
  suite:
    "https://lechateaupetresort.com/wp-content/uploads/2025/09/Dog-spa-4.jpg",
};
