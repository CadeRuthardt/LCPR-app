import { useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackChevronButton, Card, Icon, Screen, Text } from "@/components/primitives";
import { DeveloperDataPanel } from "@/components/composites";
import { getCurrentClientPetForApp } from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { Pet, PetFeedingSchedule, PetImmunization, PetMedicationSchedule } from "@/types/app";
import { goBackOrReplace } from "@/utils/navigation";

export function PetProfileScreen() {
  const params = useLocalSearchParams<{ petId?: string }>();
  const petId = typeof params.petId === "string" ? params.petId : "";
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pet, setPet] = React.useState<Pet | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    if (!petId) {
      setErrorMessage("No pet profile was selected.");
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getCurrentClientPetForApp(petId)
      .then((clientPet) => {
        if (!isMounted) {
          return;
        }

        setPet(clientPet);
        setErrorMessage(clientPet ? null : "We could not find that pet profile.");
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load pet profile.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [petId]);

  return (
    <Screen backgroundColor={colors.ivory} contentStyle={styles.content} topSafeArea={false}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <BackChevronButton
          color="light"
          onPress={() => goBackOrReplace("/pets")}
          style={[styles.backButton, { top: insets.top + spacing.md }]}
        />
        <Text variant="heading" tone="inverse" style={styles.headerTitle}>
          {pet?.name ?? "Pet Profile"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.messageWrap}>
          <Text tone="secondary">Preparing pet profile...</Text>
        </View>
      ) : null}
      {errorMessage ? (
        <View style={styles.messageWrap}>
          <Text tone="secondary">{errorMessage}</Text>
        </View>
      ) : null}

      {pet ? (
        <View style={styles.profileBody}>
          <View style={styles.portraitWrap}>
            <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
          </View>

          <View style={styles.badgeRow}>
            {pet.vip ? <MiniBadge label="VIP" /> : null}
            {pet.fixed ? <MiniBadge label="Fixed" /> : null}
            <MiniBadge label={pet.status} />
          </View>

          <Card variant="elevated" style={styles.summaryCard}>
            <FieldRow label="Breed" value={pet.breed} />
            <FieldRow label="Age" value={pet.age} />
            <FieldRow label="Weight" value={pet.weight} />
            <FieldRow label="Birthday" value={formatIsoDate(pet.birthday)} />
          </Card>

          <Card variant="elevated" style={styles.menuCard}>
            <MenuRow
              icon="shield"
              title="Vaccination Records"
              value={formatVaccinationStatus(pet)}
            />
            <MenuRow
              icon="utensils"
              title="Feeding Instructions"
              value={formatFeedingSummary(pet)}
            />
            <MenuRow icon="heart" title="Medical Notes" value={formatMedicalSummary(pet)} />
            <MenuRow icon="info" title="Care Notes" value={formatCareSummary(pet)} />
            <MenuRow icon="user" title="Veterinarian" value={pet.vetName ?? "Not listed"} />
          </Card>

          <Card variant="elevated" style={styles.detailCard}>
            <Text variant="title">Vaccination Records</Text>
            <ImmunizationList immunizations={pet.immunizations ?? []} />
          </Card>

          <Card variant="elevated" style={styles.detailCard}>
            <Text variant="title">Profile Details</Text>
            <FieldRow label="Species" value={pet.species} />
            <FieldRow label="Gender" value={pet.gender} />
            <FieldRow label="Color & markings" value={pet.colorAndMarkings} />
            <FieldRow label="Source" value={pet.source === "gingr" ? "Gingr" : "Phase 1 seed"} />
          </Card>

          {pet.rawData ? (
            <DeveloperDataPanel
              records={[{ title: "Raw Pet", data: pet.rawData }]}
              subtitle="Temporary raw Gingr pet fields for choosing what to keep."
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.fieldRow}>
      <Text variant="body" tone="secondary" style={styles.fieldLabel}>
        {label}
      </Text>
      <Text selectable variant="body" tone={value ? "secondary" : "muted"} style={styles.fieldValue}>
        {value || "Not listed"}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  value,
}: {
  icon: "heart" | "info" | "shield" | "user" | "utensils";
  title: string;
  value?: string | null;
}) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.menuRow, pressed && styles.pressedRow]}>
      <View style={styles.menuIcon}>
        <Icon color={colors.blackCherry} name={icon} size={18} />
      </View>
      <Text variant="body" tone="primary" style={styles.menuTitle}>
        {title}
      </Text>
      {value ? (
        <Text variant="caption" tone="accent" style={styles.menuValue}>
          {value}
        </Text>
      ) : null}
      <Icon color={colors.blackCherry} name="chevron-right" size={16} />
    </Pressable>
  );
}

function formatVaccinationStatus(pet: Pet) {
  if (pet.immunizations && pet.immunizations.length > 0) {
    return `${pet.immunizations.length} record${pet.immunizations.length === 1 ? "" : "s"}`;
  }

  return pet.nextImmunizationExpiration ? "Up to date" : pet.vaccinationSummary || "Not listed";
}

function ImmunizationList({ immunizations }: { immunizations: PetImmunization[] }) {
  if (immunizations.length === 0) {
    return <FieldRow label="Records" value={null} />;
  }

  return (
    <View style={styles.immunizationList}>
      {immunizations.map((immunization, index) => (
        <View key={immunization.id ?? `${immunization.name}-${index}`} style={styles.immunizationRow}>
          <View style={styles.immunizationIcon}>
            <Icon color={colors.goldenrod} name="shield" size={15} />
          </View>
          <View style={styles.immunizationCopy}>
            <Text variant="caption" tone="primary">
              {immunization.name}
            </Text>
            <Text selectable variant="caption" tone="secondary">
              {formatImmunizationDetail(immunization)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatImmunizationDetail(immunization: PetImmunization) {
  const parts = [
    immunization.expiresDate ? `Expires ${formatIsoDate(immunization.expiresDate)}` : null,
    immunization.administeredDate ? `Given ${formatIsoDate(immunization.administeredDate)}` : null,
    immunization.status,
  ].filter(Boolean);

  return parts.join(" | ") || "No expiration listed";
}

function formatFeedingSummary(pet: Pet) {
  if (pet.feedingSchedules && pet.feedingSchedules.length > 0) {
    return `${pet.feedingSchedules.length} schedule${pet.feedingSchedules.length === 1 ? "" : "s"}`;
  }

  return pet.feedingType || pet.feedingMethod || "Not listed";
}

function formatMedicalSummary(pet: Pet) {
  return pet.medicines || pet.medicationNotes || pet.allergies || "None";
}

function formatCareSummary(pet: Pet) {
  return pet.notes || pet.careNote || "Not listed";
}

function FeedingSchedules({ schedules }: { schedules: PetFeedingSchedule[] }) {
  if (schedules.length === 0) {
    return <FieldRow label="Schedule" value={null} />;
  }

  return (
    <View style={styles.scheduleList}>
      {schedules.map((schedule) => (
        <View key={`${schedule.label}-${schedule.instructions}`} style={styles.scheduleItem}>
          <View style={styles.scheduleIcon}>
            <Icon color={colors.goldenrod} name="utensils" size={14} />
          </View>
          <View style={styles.scheduleCopy}>
            <Text variant="caption" tone="primary">
              {schedule.label}
            </Text>
            <Text selectable variant="caption" tone="secondary">
              {[schedule.amount, schedule.instructions].filter(Boolean).join(" | ") || "Not listed"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MedicationSchedules({ schedules }: { schedules: PetMedicationSchedule[] }) {
  if (schedules.length === 0) {
    return <FieldRow label="Schedule" value={null} />;
  }

  return (
    <View style={styles.scheduleList}>
      {schedules.map((schedule) => (
        <View key={schedule.label} style={styles.medicationGroup}>
          <Text variant="caption" tone="primary">
            {schedule.label}
          </Text>
          {schedule.medications.map((medication, index) => (
            <Text
              key={`${schedule.label}-${medication.type}-${index}`}
              selectable
              variant="caption"
              tone="secondary"
            >
              {[
                medication.type,
                medication.amount,
                medication.notes,
                formatMedicationDates(medication.startDate, medication.endDate),
              ]
                .filter(Boolean)
                .join(" | ") || "Not listed"}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function MiniBadge({ label }: { label: string }) {
  return (
    <View style={styles.miniBadge}>
      <Text variant="caption" tone="brand">
        {label}
      </Text>
    </View>
  );
}

function formatIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMedicationDates(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return `${formatIsoDate(startDate)} - ${formatIsoDate(endDate)}`;
  }

  return startDate ? `Starts ${formatIsoDate(startDate)}` : `Ends ${formatIsoDate(endDate)}`;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    left: spacing.lg,
    position: "absolute",
    width: 44,
  },
  badgeRow: {
    justifyContent: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  content: {
    gap: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  detailCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  fieldLabel: {
    flex: 1,
    fontWeight: "700",
  },
  fieldRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
  fieldValue: {
    flex: 1.25,
  },
  header: {
    alignItems: "flex-start",
    backgroundColor: colors.blackCherry,
    minHeight: 238,
    paddingHorizontal: spacing.xl,
  },
  headerTitle: {
    alignSelf: "center",
  },
  immunizationCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  immunizationIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  immunizationList: {
    gap: spacing.sm,
  },
  immunizationRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  menuCard: {
    gap: 0,
    padding: 0,
  },
  menuIcon: {
    alignItems: "center",
    width: 34,
  },
  menuRow: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
  },
  menuTitle: {
    flex: 1,
  },
  menuValue: {
    maxWidth: 130,
    textAlign: "right",
  },
  messageWrap: {
    padding: spacing.xl,
  },
  medicationGroup: {
    gap: spacing.xs,
  },
  miniBadge: {
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  petImage: {
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 190,
    width: 190,
  },
  portraitWrap: {
    alignItems: "center",
    marginTop: -96,
  },
  pressedRow: {
    opacity: 0.72,
  },
  profileBody: {
    gap: spacing.xl,
    paddingBottom: 116,
    paddingHorizontal: spacing.xl,
  },
  rawCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  rawHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  summaryCard: {
    gap: spacing.md,
    padding: spacing.xl,
  },
  scheduleCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  scheduleIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  scheduleItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  scheduleList: {
    gap: spacing.sm,
  },
});
