import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { AppCard, AppSection, BrandHeader, ErrorState, LoadingSkeleton } from "@/components/app";
import { DeveloperDataPanel } from "@/components/composites";
import { Icon, Screen, Text } from "@/components/primitives";
import { getCachedClientDashboardData, getCurrentClientPetForApp } from "@/services/client-data";
import { colors, fonts, radii, spacing, typography } from "@/theme";
import type { Pet, PetImmunization } from "@/types/app";
import { goBackOrReplace } from "@/utils/navigation";
import { getVaccinationStatus } from "@/utils/vaccinations";

export function PetProfileScreen() {
  const params = useLocalSearchParams<{ petId?: string }>();
  const petId = typeof params.petId === "string" ? params.petId : "";
  const cachedPet = getCachedClientDashboardData()?.pets.find((item) => item.id === petId) ?? null;
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(!cachedPet);
  const [pet, setPet] = React.useState<Pet | null>(cachedPet);

  const load = React.useCallback(() => {
    if (!petId) {
      setErrorMessage("No pet profile was selected.");
      setIsLoading(false);
      return;
    }

    setErrorMessage(null);
    setIsLoading(!getCachedClientDashboardData()?.pets.some((item) => item.id === petId));
    void getCurrentClientPetForApp(petId)
      .then((clientPet) => {
        setPet(clientPet);
        setErrorMessage(clientPet ? null : "We could not find that pet profile.");
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load pet profile.");
      })
      .finally(() => setIsLoading(false));
  }, [petId]);

  React.useEffect(load, [load]);

  return (
    <View style={styles.root}>
      <BrandHeader />
      <Screen contentStyle={styles.content} topSafeArea={false}>
        <View style={styles.navigation}>
          <Pressable
            accessibilityLabel="Back to pets"
            accessibilityRole="button"
            onPress={() => goBackOrReplace("/pets")}
            style={styles.backButton}
          >
            <Icon color={colors.burgundy} name="chevron-left" size={22} />
            <Text style={styles.backText}>Pets</Text>
          </Pressable>
          <Text style={typography.navigationTitle}>Pet Profile</Text>
          <View style={styles.navigationBalance} />
        </View>

        {isLoading ? <><LoadingSkeleton /><LoadingSkeleton /></> : null}
        {errorMessage && !isLoading ? <ErrorState message={errorMessage} onRetry={load} /> : null}
        {pet && !isLoading ? <PetProfileContent pet={pet} /> : null}
      </Screen>
    </View>
  );
}

function PetProfileContent({ pet }: { pet: Pet }) {
  const vaccinationStatus = getVaccinationStatus(pet);

  return (
    <View style={styles.profileBody}>
      <AppCard style={styles.heroCard}>
        <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
        <View style={styles.heroCopy}>
          <View style={styles.nameRow}>
            <Text style={typography.heroName}>{pet.name}</Text>
            <Icon color={colors.gold} name="paw" size={20} />
          </View>
          <Text style={typography.body}>{[pet.breed, pet.gender].filter(Boolean).join(" · ")}</Text>
          <Text style={typography.bodySecondary}>{[pet.age, pet.weight].filter(Boolean).join(" · ")}</Text>
          <View style={styles.pills}>
            <VaccinationPill status={vaccinationStatus} />
            {pet.fixed ? <View style={styles.warmPill}><Text style={styles.pillText}>{fixedLabel(pet)}</Text></View> : null}
            {pet.vip ? <View style={styles.goldPill}><Text style={styles.goldPillText}>VIP</Text></View> : null}
          </View>
        </View>
      </AppCard>

      <AppSection title="About">
        <AppCard style={styles.card}>
          <DetailRow label="Breed" value={pet.breed} />
          <DetailRow label="Age" value={pet.age} />
          <DetailRow label="Weight" value={pet.weight} />
          <DetailRow label="Birthday" value={formatIsoDate(pet.birthday)} isLast />
        </AppCard>
      </AppSection>

      <AppSection title="Vaccination Records">
        <AppCard style={styles.card}>
          <VaccinationSummary pet={pet} />
          <ImmunizationList immunizations={pet.immunizations ?? []} />
        </AppCard>
      </AppSection>

      <AppSection title="Care Information">
        <AppCard style={styles.card}>
          <InformationRow icon="utensils" label="Feeding" value={formatFeedingSummary(pet)} />
          <InformationRow icon="heart" label="Medical" value={formatMedicalSummary(pet)} />
          <InformationRow icon="info" label="Care Notes" value={formatCareSummary(pet)} />
          <InformationRow icon="user" label="Veterinarian" value={pet.vetName ?? "Not listed"} isLast />
        </AppCard>
      </AppSection>

      <AppSection title="Profile Details">
        <AppCard style={styles.card}>
          <DetailRow label="Species" value={pet.species} />
          <DetailRow label="Gender" value={pet.gender} />
          <DetailRow label="Color & markings" value={pet.colorAndMarkings} />
          <DetailRow label="Status" value={pet.status} isLast />
        </AppCard>
      </AppSection>

      {pet.rawData ? (
        <DeveloperDataPanel
          records={[{ title: "Raw Pet", data: pet.rawData }]}
          subtitle="Temporary raw Gingr pet fields for choosing what to keep."
        />
      ) : null}
    </View>
  );
}

function VaccinationPill({ status }: { status: ReturnType<typeof getVaccinationStatus> }) {
  const label = status === "current" ? "Up to date" : status === "expired" ? "Expired" : "Records needed";
  const color = status === "current" ? colors.success : status === "expired" ? colors.error : colors.warning;
  const icon = status === "current" ? "check" : status === "expired" ? "x" : "info";

  return <View style={[styles.statusPill, status === "current" ? styles.currentPill : status === "expired" ? styles.expiredPill : styles.missingPill]}><Text style={[styles.pillText, { color }]}>{label}</Text><Icon color={color} name={icon} size={12} /></View>;
}

function VaccinationSummary({ pet }: { pet: Pet }) {
  const status = getVaccinationStatus(pet);
  const title = status === "current" ? "Vaccinations are current" : status === "expired" ? "Vaccinations need renewal" : "Vaccination records needed";
  const body = status === "current"
    ? pet.nextImmunizationExpiration ? `Current through ${formatIsoDate(pet.nextImmunizationExpiration)}.` : "All listed vaccinations are current."
    : status === "expired" ? "One or more required vaccinations have expired." : "No current expiration information is available.";
  const color = status === "current" ? colors.success : status === "expired" ? colors.error : colors.warning;
  const icon = status === "current" ? "check" : status === "expired" ? "x" : "info";

  return <View style={[styles.vaccinationSummary, status === "current" ? styles.currentSummary : status === "expired" ? styles.expiredSummary : styles.missingSummary]}><View style={[styles.summaryIcon, { backgroundColor: color }]}><Icon color={colors.textInverse} name={icon} size={15} /></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{title}</Text><Text style={styles.summaryBody}>{body}</Text></View></View>;
}

function ImmunizationList({ immunizations }: { immunizations: PetImmunization[] }) {
  if (immunizations.length === 0) {
    return <Text style={typography.bodySecondary}>No vaccination records are listed.</Text>;
  }

  return <View style={styles.immunizationList}>{immunizations.map((immunization, index) => {
    const expired = isPast(immunization.expiresDate) || immunization.status?.toLowerCase().includes("expired");
    return <View key={immunization.id ?? `${immunization.name}-${index}`} style={[styles.immunizationRow, index < immunizations.length - 1 && styles.divider]}><View style={[styles.recordIcon, expired && styles.recordIconExpired]}><Icon color={expired ? colors.error : colors.burgundy} name="shield" size={17} /></View><View style={styles.recordCopy}><Text style={styles.recordName}>{immunization.name}</Text><Text selectable style={styles.recordDetail}>{formatImmunizationDetail(immunization)}</Text></View>{immunization.expiresDate ? <Icon color={expired ? colors.error : colors.success} name={expired ? "x" : "check"} size={17} /> : null}</View>;
  })}</View>;
}

function DetailRow({ isLast, label, value }: { isLast?: boolean; label: string; value?: string | null }) {
  return <View style={[styles.detailRow, !isLast && styles.divider]}><Text style={styles.detailLabel}>{label}</Text><Text selectable style={styles.detailValue}>{value || "Not listed"}</Text></View>;
}

function InformationRow({ icon, isLast, label, value }: { icon: "heart" | "info" | "user" | "utensils"; isLast?: boolean; label: string; value: string }) {
  return <View style={[styles.informationRow, !isLast && styles.divider]}><View style={styles.informationIcon}><Icon color={colors.burgundy} name={icon} size={19} /></View><View style={styles.informationCopy}><Text style={styles.informationLabel}>{label}</Text><Text selectable style={styles.informationValue}>{value}</Text></View></View>;
}

function fixedLabel(pet: Pet) {
  return pet.gender?.toLowerCase() === "female" ? "Spayed" : "Neutered";
}

function formatFeedingSummary(pet: Pet) {
  const schedules = pet.feedingSchedules ?? [];
  if (schedules.length > 0) return schedules.map((schedule) => [schedule.label, schedule.amount, schedule.instructions].filter(Boolean).join(": ")).join("; ");
  return pet.feedingNotes || pet.feedingType || pet.feedingMethod || "Not listed";
}

function formatMedicalSummary(pet: Pet) {
  return pet.medicines || pet.medicationNotes || pet.allergies || "None listed";
}

function formatCareSummary(pet: Pet) {
  return pet.notes || pet.careNote || "Not listed";
}

function formatImmunizationDetail(immunization: PetImmunization) {
  return [immunization.expiresDate ? `Expires ${formatIsoDate(immunization.expiresDate)}` : null, immunization.administeredDate ? `Given ${formatIsoDate(immunization.administeredDate)}` : null, immunization.status].filter(Boolean).join(" · ") || "No expiration listed";
}

function isPast(value?: string | null) {
  if (!value) return false;
  const date = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date ? date < today : false;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatIsoDate(value?: string | null) {
  if (!value) return null;
  const date = parseDate(value);
  return date ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : value;
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing[16], paddingTop: spacing[12] },
  navigation: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  backButton: { alignItems: "center", flexDirection: "row", minHeight: 44, width: 82 },
  backText: { color: colors.burgundy, fontFamily: fonts.bodyMedium, fontSize: 13 },
  navigationBalance: { width: 82 },
  profileBody: { gap: spacing[20] },
  heroCard: { alignItems: "center", flexDirection: "row", gap: spacing[16], padding: spacing[16] },
  petImage: { borderColor: colors.gold, borderRadius: radii.circle, borderWidth: 2, height: 112, width: 112 },
  heroCopy: { flex: 1, gap: spacing[4] },
  nameRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing[8] },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing[8], paddingTop: spacing[6] },
  statusPill: { alignItems: "center", borderRadius: 8, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 5 },
  currentPill: { backgroundColor: colors.successSoft },
  expiredPill: { backgroundColor: colors.errorSoft },
  missingPill: { backgroundColor: colors.warningSoft },
  warmPill: { backgroundColor: colors.goldSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  goldPill: { backgroundColor: colors.burgundy, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  goldPillText: { color: colors.textInverse, fontFamily: fonts.bodyMedium, fontSize: 12 },
  pillText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  card: { gap: 0, padding: spacing[16] },
  detailRow: { flexDirection: "row", gap: spacing[16], minHeight: 42, paddingVertical: spacing[10] },
  detailLabel: { color: colors.textSecondary, flex: 1, fontSize: 13 },
  detailValue: { color: colors.textPrimary, flex: 1.5, fontFamily: fonts.bodyMedium, fontSize: 13, textAlign: "right" },
  divider: { borderBottomColor: colors.divider, borderBottomWidth: 1 },
  vaccinationSummary: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: spacing[10], padding: spacing[12] },
  currentSummary: { backgroundColor: colors.successSoft },
  expiredSummary: { backgroundColor: colors.errorSoft },
  missingSummary: { backgroundColor: colors.warningSoft },
  summaryIcon: { alignItems: "center", borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  summaryCopy: { flex: 1, gap: 2 },
  summaryTitle: { fontFamily: fonts.bodySemiBold, fontSize: 13 },
  summaryBody: { color: colors.textSecondary, fontSize: 11 },
  immunizationList: { paddingTop: spacing[8] },
  immunizationRow: { alignItems: "center", flexDirection: "row", gap: spacing[10], minHeight: 58, paddingVertical: spacing[10] },
  recordIcon: { alignItems: "center", backgroundColor: colors.goldSoft, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  recordIconExpired: { backgroundColor: colors.errorSoft },
  recordCopy: { flex: 1, gap: 2 },
  recordName: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  recordDetail: { color: colors.textSecondary, fontSize: 10, lineHeight: 15 },
  informationRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing[12], minHeight: 62, paddingVertical: spacing[12] },
  informationIcon: { alignItems: "center", backgroundColor: colors.goldSoft, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  informationCopy: { flex: 1, gap: 3 },
  informationLabel: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  informationValue: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
});
