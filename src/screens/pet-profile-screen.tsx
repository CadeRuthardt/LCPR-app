import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

import { Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import { getCurrentClientPetForApp } from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { Pet, PetFeedingSchedule, PetMedicationSchedule } from "@/types/app";

export function PetProfileScreen() {
  const params = useLocalSearchParams<{ petId?: string }>();
  const petId = typeof params.petId === "string" ? params.petId : "";
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
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Button
          onPress={() => router.back()}
          title="Back"
          variant="ghost"
          style={styles.backButton}
        />
      </View>

      {isLoading ? <Text tone="secondary">Preparing pet profile...</Text> : null}
      {errorMessage ? <Text tone="secondary">{errorMessage}</Text> : null}

      {pet ? (
        <>
          <Card variant="elevated" style={styles.heroCard}>
            <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
            <View style={styles.heroCopy}>
              <Text variant="heading">{pet.name}</Text>
              <Text variant="body" tone="secondary">
                {pet.breed}
              </Text>
              <Text variant="caption" tone="muted">
                {pet.age} old | {pet.weight}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              {pet.vip ? <MiniBadge label="VIP" /> : null}
              {pet.fixed ? <MiniBadge label="Fixed" /> : null}
              <MiniBadge label={pet.status} />
            </View>
          </Card>

          <Section title="Profile">
            <Card style={styles.detailCard}>
              <FieldRow label="Species" value={pet.species} />
              <FieldRow label="Gender" value={pet.gender} />
              <FieldRow label="Birthday" value={formatIsoDate(pet.birthday)} />
              <FieldRow label="Color & markings" value={pet.colorAndMarkings} />
              <FieldRow label="Source" value={pet.source === "gingr" ? "Gingr" : "Phase 1 seed"} />
            </Card>
          </Section>

          <Section title="Vaccinations">
            <Card style={styles.detailCard}>
              <FieldRow label="Summary" value={pet.vaccinationSummary} />
              <FieldRow
                label="Next expiration"
                value={formatIsoDate(pet.nextImmunizationExpiration)}
              />
            </Card>
          </Section>

          <Section title="Feeding">
            <Card style={styles.detailCard}>
              <FieldRow label="Food type" value={pet.feedingType} />
              <FieldRow label="Method" value={pet.feedingMethod} />
              <FieldRow label="Notes" value={pet.feedingNotes} />
              <FeedingSchedules schedules={pet.feedingSchedules ?? []} />
            </Card>
          </Section>

          <Section title="Medications">
            <Card style={styles.detailCard}>
              <FieldRow label="Medicines" value={pet.medicines} />
              <FieldRow label="Medication notes" value={pet.medicationNotes} />
              <MedicationSchedules schedules={pet.medicationSchedules ?? []} />
            </Card>
          </Section>

          <Section title="Care Notes">
            <Card style={styles.detailCard}>
              <FieldRow label="Allergies" value={pet.allergies} />
              <FieldRow label="Profile notes" value={pet.notes} />
            </Card>
          </Section>

          <Section title="Veterinarian">
            <Card style={styles.detailCard}>
              <FieldRow label="Clinic" value={pet.vetName} />
              <FieldRow label="Phone" value={pet.vetPhone} />
            </Card>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.fieldRow}>
      <Text variant="caption" tone="muted" style={styles.fieldLabel}>
        {label}
      </Text>
      <Text selectable variant="caption" tone={value ? "secondary" : "muted"} style={styles.fieldValue}>
        {value || "Not listed"}
      </Text>
    </View>
  );
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
    alignSelf: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  content: {
    gap: spacing.lg,
  },
  detailCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  fieldLabel: {
    flex: 0.82,
  },
  fieldRow: {
    alignItems: "flex-start",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  fieldValue: {
    flex: 1.4,
    textAlign: "right",
  },
  header: {
    paddingTop: spacing.xs,
  },
  heroCard: {
    alignItems: "center",
    gap: spacing.md,
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.xs,
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
    borderWidth: 2,
    height: 140,
    width: 140,
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
