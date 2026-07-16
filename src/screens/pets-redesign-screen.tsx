import { router } from "expo-router";
import * as React from "react";
import { Image, Linking, Pressable, StyleSheet, View } from "react-native";
import { AppCard, AppScreen, AppSection, MenuRow, MetricGrid } from "@/components/app";
import { Icon, Text } from "@/components/primitives";
import { getCachedClientDashboardData, getCurrentClientDashboardData } from "@/services/client-data";
import { colors, fonts, radii, spacing, typography } from "@/theme";
import type { Pet } from "@/types/app";
import { getVaccinationStatus } from "@/utils/vaccinations";

export function PetsRedesignScreen() {
  const cached = getCachedClientDashboardData();
  const [pets, setPets] = React.useState<Pet[]>(cached?.pets ?? []);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { let mounted = true; getCurrentClientDashboardData().then((data) => { if (mounted) setPets(data.pets); }).catch(() => { if (mounted) setError("We couldn't load your pets. Please try again."); }); return () => { mounted = false; }; }, []);
  const dogs = pets.filter((pet) => !pet.species?.toLowerCase().includes("cat"));
  const cats = pets.filter((pet) => pet.species?.toLowerCase().includes("cat"));
  return <AppScreen title="Pets" subtitle="View and manage your pets." headerAction={<Pressable accessibilityRole="button" onPress={() => Linking.openURL("https://lechateaupetresort.com/")} style={styles.addButton}><Icon color={colors.burgundy} name="plus" size={21} /><Text style={styles.addText}>Add Pet</Text></Pressable>}>
    <MetricGrid items={[{ icon: "paw", label: "Total Pets", value: String(pets.length), action: "View all" }, { icon: "dog", label: "Dogs", value: String(dogs.length), action: "View all" }, { icon: "cat", label: "Cats", value: String(cats.length), action: "View all" }, { icon: "file", label: "Vet Records", value: String(pets.length), action: "View all" }]} />
    <AppSection title="Your Pets"><AppCard padding="none" variant="flushRows">{error ? <Text style={styles.message}>{error}</Text> : pets.length === 0 ? <Text style={styles.message}>Your matched pet profiles will appear here.</Text> : pets.map((pet, index) => <PetRow key={pet.id} pet={pet} isLast={index === pets.length - 1} />)}</AppCard></AppSection>
    <AppSection title="Pet Care Information"><AppCard padding="none" variant="flushRows"><MenuRow icon="file" title="Vet Records" subtitle="View and manage vaccination records" onPress={() => router.push("/document-upload")} /><MenuRow icon="heart" title="Care Instructions" subtitle="Feeding, medications and special needs" /><MenuRow icon="stethoscope" title="Allergies & Health" subtitle="Manage allergies and health conditions" isLast /></AppCard></AppSection>
  </AppScreen>;
}

function PetRow({ isLast, pet }: { isLast: boolean; pet: Pet }) {
  const vaccinationStatus = getVaccinationStatus(pet);
  const vaccinationLabel = vaccinationStatus === "not_required" ? "Not required" : vaccinationStatus === "current" ? "Up to date" : vaccinationStatus === "expired" ? "Expired" : "Records needed";
  const vaccinationIcon = vaccinationStatus === "current" || vaccinationStatus === "not_required" ? "check" : vaccinationStatus === "expired" ? "x" : "info";
  const vaccinationColor = vaccinationStatus === "not_required" ? colors.textSecondary : vaccinationStatus === "current" ? colors.success : vaccinationStatus === "expired" ? colors.error : colors.warning;

  return <Pressable onPress={() => router.push({ pathname: "/pet-profile", params: { petId: pet.id } })} style={[styles.petRow, !isLast && styles.divider]}><Image source={{ uri: pet.imageUrl }} style={styles.petImage} /><View style={styles.petCopy}><View style={styles.petNameRow}><Text style={styles.petName}>{pet.name}</Text><Icon color={colors.gold} name="paw" size={17} /></View><Text style={typography.bodySecondary}>{[pet.breed, pet.gender].filter(Boolean).join(" · ")}</Text><Text style={typography.bodySecondary}>{[pet.age, pet.weight].filter(Boolean).join(" · ")}</Text><View style={styles.pills}><View style={[styles.vaccinationPill, vaccinationStatus === "not_required" ? styles.neutralPill : vaccinationStatus === "current" ? styles.successPill : vaccinationStatus === "expired" ? styles.errorPill : styles.warningPill]}><Text style={[styles.pillText, { color: vaccinationColor }]}>{vaccinationLabel}</Text><Icon color={vaccinationColor} name={vaccinationIcon} size={12} /></View>{pet.fixed ? <View style={styles.warmPill}><Text style={styles.pillText}>{pet.gender?.toLowerCase() === "female" ? "Spayed" : "Neutered"}</Text></View> : null}</View></View><View style={styles.rowEnd}><Icon color={colors.icon} name="chevron-right" size={22} /></View></Pressable>;
}

const styles = StyleSheet.create({ addButton: { alignItems: "center", borderColor: colors.burgundy, borderRadius: 10, borderWidth: 1.25, flexDirection: "row", gap: spacing[8], minHeight: 52, paddingHorizontal: spacing[18] }, addText: { color: colors.burgundy, fontFamily: fonts.bodySemiBold }, petRow: { alignItems: "center", flexDirection: "row", gap: spacing[16], minHeight: 154, padding: spacing[16] }, divider: { borderBottomColor: colors.divider, borderBottomWidth: 1 }, petImage: { borderRadius: radii.circle, height: 104, width: 104 }, petCopy: { flex: 1, gap: spacing[4] }, petNameRow: { alignItems: "center", flexDirection: "row", gap: spacing[8] }, petName: { color: colors.burgundy, fontFamily: fonts.display, fontSize: 22, lineHeight: 28 }, pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing[8], marginTop: spacing[4] }, vaccinationPill: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 5 }, successPill: { backgroundColor: colors.successSoft }, errorPill: { backgroundColor: colors.errorSoft }, warningPill: { backgroundColor: colors.warningSoft }, neutralPill: { backgroundColor: colors.surfaceMuted }, warmPill: { backgroundColor: colors.goldSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }, pillText: { fontSize: 12 }, rowEnd: { alignItems: "center", alignSelf: "stretch", justifyContent: "center" }, message: { padding: spacing[20] } });
