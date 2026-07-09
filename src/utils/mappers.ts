import type { Pet } from "@/types/app";
import type { Phase1SeedPet } from "@/types/database";

export function mapSeedPetToPet(seedPet: Phase1SeedPet): Pet {
  return {
    age: seedPet.age ?? "Age not listed",
    breed: seedPet.breed ?? "Breed not listed",
    careNote: seedPet.care_note ?? "Care details will appear here as we prepare for Phase 1.",
    id: seedPet.id,
    imageUrl:
      seedPet.image_url ??
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    name: seedPet.name,
    status: seedPet.status === "wellness" ? "Wellness" : "Active",
    vaccinationSummary: seedPet.vaccination_summary ?? "Vaccination status is being prepared.",
    weight: seedPet.weight ?? "Weight not listed",
  };
}
