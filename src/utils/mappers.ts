import type { Pet } from "@/types/app";
import type { Phase1SeedPet } from "@/types/database";
import type { GingrPet } from "@/services/gingr";

const fallbackPetImage =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80";

export function mapSeedPetToPet(seedPet: Phase1SeedPet): Pet {
  return {
    age: seedPet.age ?? "Age not listed",
    breed: seedPet.breed ?? "Breed not listed",
    careNote: seedPet.care_note ?? "Care details will appear here as we prepare for Phase 1.",
    id: seedPet.id,
    imageUrl: seedPet.image_url ?? fallbackPetImage,
    name: seedPet.name,
    status: seedPet.status === "wellness" ? "Wellness" : "Active",
    vaccinationSummary: seedPet.vaccination_summary ?? "Vaccination status is being prepared.",
    weight: seedPet.weight ?? "Weight not listed",
  };
}

export function mapGingrPetToPet(gingrPet: GingrPet): Pet {
  return {
    age: gingrPet.age,
    breed: `${gingrPet.species} | ${gingrPet.breed}`,
    careNote: gingrPet.vaccinationSummary,
    id: gingrPet.id,
    imageUrl: gingrPet.imageUrl ?? fallbackPetImage,
    name: gingrPet.name,
    status: gingrPet.status === "Checked In" ? "Wellness" : "Active",
    vaccinationSummary: gingrPet.vaccinationSummary,
    weight: gingrPet.weight,
  };
}
