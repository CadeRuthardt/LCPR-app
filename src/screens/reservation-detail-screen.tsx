import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

import { Badge, Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import { getClientReservationDetailForApp } from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { ClientReservationDetail, ReservationDetailPet } from "@/types/app";

export function ReservationDetailScreen() {
  const params = useLocalSearchParams<{ reservationIds?: string }>();
  const reservationIds = parseReservationIds(params.reservationIds);
  const [detail, setDetail] = React.useState<ClientReservationDetail | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    if (reservationIds.length === 0) {
      setErrorMessage("No reservation was selected.");
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getClientReservationDetailForApp(reservationIds)
      .then((reservationDetail) => {
        if (!isMounted) {
          return;
        }

        setDetail(reservationDetail);
        setErrorMessage(
          reservationDetail ? null : "We could not find that reservation for your profile.",
        );
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load reservation details.",
          );
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
  }, [reservationIds.join("|")]);

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

      {isLoading ? (
        <Card style={styles.noticeCard}>
          <Text variant="title">Preparing reservation details...</Text>
          <Text variant="body" tone="secondary">
            We are gathering the details Gingr has available for this visit.
          </Text>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card style={styles.noticeCard}>
          <Text variant="title">We could not load this reservation.</Text>
          <Text variant="body" tone="secondary">
            {errorMessage}
          </Text>
          <Button title="Back to Reservations" variant="secondary" onPress={() => router.back()} />
        </Card>
      ) : null}

      {detail ? <ReservationDetailContent detail={detail} /> : null}
    </Screen>
  );
}

function ReservationDetailContent({ detail }: { detail: ClientReservationDetail }) {
  const statusTone = badgeToneForStatus(detail.status);

  return (
    <>
      <Card variant="elevated" style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Icon color={colors.goldenrod} name="calendar" size={26} />
        </View>
        <View style={styles.heroCopy}>
          <Text variant="heading">{detail.dateRange}</Text>
          <Text variant="body" tone="secondary">
            {[detail.location, formatReservationType(detail.reservationType)]
              .filter(Boolean)
              .join(" | ") || "Reservation details"}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {detail.reservationType ? (
            <Badge
              label={formatReservationType(detail.reservationType) ?? detail.reservationType}
              tone={badgeToneForReservationType(detail.reservationType)}
            />
          ) : null}
          <Badge label={formatReservationStatus(detail.status)} tone={statusTone} />
        </View>
      </Card>

      <Section title="Pets">
        <Card style={styles.detailCard}>
          {detail.petDetails.length > 0 ? (
            detail.petDetails.map((pet, index) => (
              <PetDetailRow key={`${pet.name}-${index}`} pet={pet} />
            ))
          ) : (
            <FieldRow label="Guests" value={detail.animalNames.join(", ")} />
          )}
        </Card>
      </Section>

      <Section title="Timing">
        <Card style={styles.detailCard}>
          <FieldRow label="Arrival" value={detail.startDateTimeLabel ?? formatIsoDate(detail.startDate)} />
          <FieldRow label="Departure" value={detail.endDateTimeLabel ?? formatIsoDate(detail.endDate)} />
          <FieldRow label="Nights" value={detail.nights ?? detail.unitsOfTime} />
          <FieldRow label="Checked in" value={detail.checkInAt} />
          <FieldRow label="Checked out" value={detail.checkOutAt} />
        </Card>
      </Section>

      <Section title="Experience">
        <Card style={styles.detailCard}>
          <FieldRow label="Location" value={detail.location} />
          <FieldRow label="Selections" value={formatReservationSelections(detail.reservationType)} />
          <FieldRow label="Services" value={detail.services} emptyValue="No add-ons listed" />
          <FieldRow
            label="Pre-check"
            value={formatBooleanStatus(detail.precheckCompleted, "Completed", "Not completed")}
          />
        </Card>
      </Section>

      <Section title="Care Notes">
        <Card style={styles.detailCard}>
          <FieldRow label="Reservation notes" value={detail.notes} />
          <FieldRow label="Feeding times" value={detail.feedingTime} />
          <FieldRow label="Feeding amount" value={detail.feedingAmount} />
          <FieldRow label="Feeding notes" value={detail.feedingNotes} />
          <FieldRow label="Grooming notes" value={detail.groomingNotes} />
        </Card>
      </Section>

      <Section title="Estimate">
        <Card style={styles.detailCard}>
          <FieldRow label="Base rate" value={detail.baseRate} />
          <FieldRow label="Final rate" value={detail.finalRate} />
          {detail.estimate?.reservations.map((estimate, index) => (
            <FieldRow
              key={`${estimate.label}-${index}`}
              label={estimate.label ?? "Estimate line"}
              value={estimate.subtotal}
            />
          ))}
          {detail.estimate?.details.map((estimate, index) => (
            <FieldRow
              key={`${estimate.label}-${index}`}
              label={estimate.label ?? "Detail"}
              value={[estimate.quantity, estimate.total].filter(Boolean).join(" | ")}
            />
          ))}
        </Card>
      </Section>

      <Section title="Location">
        <Card style={styles.detailCard}>
          <FieldRow label="Resort" value={detail.estimate?.location?.name ?? detail.location} />
          <FieldRow label="City" value={detail.estimate?.location?.city ?? detail.location} />
          <FieldRow label="Phone" value={detail.estimate?.location?.phone} />
          <FieldRow label="Email" value={detail.estimate?.location?.email} />
          <FieldRow label="Hours" value={detail.estimate?.location?.hours} />
        </Card>
      </Section>

      {detail.status.toLowerCase().includes("cancel") ? (
        <Section title="Cancellation">
          <Card style={styles.detailCard}>
            <FieldRow label="Reason" value={detail.cancellationReason} />
            <FieldRow label="Cancelled by" value={detail.cancelledBy} />
          </Card>
        </Section>
      ) : null}
    </>
  );
}

function PetDetailRow({ pet }: { pet: ReservationDetailPet }) {
  return (
    <View style={styles.petRow}>
      {pet.imageUrl ? (
        <Image source={{ uri: pet.imageUrl }} style={styles.petImage} />
      ) : (
        <View style={[styles.petImage, styles.petImageFallback]}>
          <Icon color={colors.goldenrod} name="paw" size={18} />
        </View>
      )}
      <View style={styles.petCopy}>
        <Text variant="title">{pet.name}</Text>
        <Text variant="caption" tone="secondary">
          {[pet.breed, pet.species, pet.weight].filter(Boolean).join(" | ") || "Pet details"}
        </Text>
        <Text variant="caption" tone="muted">
          {[pet.temperament, pet.allergies ? `Allergies: ${pet.allergies}` : null]
            .filter(Boolean)
            .join(" | ") || "Care notes not listed"}
        </Text>
      </View>
    </View>
  );
}

function FieldRow({
  emptyValue = "Not listed",
  label,
  value,
}: {
  emptyValue?: string;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text variant="caption" tone="muted" style={styles.fieldLabel}>
        {label}
      </Text>
      <Text selectable variant="caption" tone={value ? "secondary" : "muted"} style={styles.fieldValue}>
        {value || emptyValue}
      </Text>
    </View>
  );
}

function parseReservationIds(value?: string) {
  return (value ?? "")
    .split(",")
    .map((reservationId) => reservationId.trim())
    .filter(Boolean);
}

function formatReservationType(reservationType: string | null) {
  const normalizedType = reservationType?.trim().toLowerCase() ?? "";

  if (normalizedType.includes("daycare") || normalizedType.includes("day care")) {
    return "Daycare";
  }

  if (
    normalizedType.includes("spa") ||
    normalizedType.includes("groom") ||
    normalizedType.includes("bath")
  ) {
    return "Spa";
  }

  if (normalizedType.includes("boarding") || normalizedType.includes("lodging")) {
    return "Boarding";
  }

  return reservationType ?? null;
}

function formatReservationSelections(reservationType: string | null) {
  const primaryType = formatReservationType(reservationType);
  const selections = (reservationType ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && formatReservationType(part) !== primaryType);

  return selections.join(" | ") || null;
}

function badgeToneForReservationType(reservationType: string) {
  const normalizedType = reservationType.trim().toLowerCase();

  if (normalizedType.includes("daycare") || normalizedType.includes("day care")) {
    return "attention";
  }

  if (
    normalizedType.includes("spa") ||
    normalizedType.includes("groom") ||
    normalizedType.includes("bath")
  ) {
    return "success";
  }

  return "accent";
}

function badgeToneForStatus(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus.includes("cancel")) {
    return "calm";
  }

  if (normalizedStatus.includes("wait") || normalizedStatus.includes("pending")) {
    return "attention";
  }

  return "success";
}

function formatReservationStatus(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (["complete", "completed", "checked out", "checked-out"].includes(normalizedStatus)) {
    return "Checked Out";
  }

  return status;
}

function formatBooleanStatus(value: boolean | null, trueLabel: string, falseLabel: string) {
  if (value === null) {
    return null;
  }

  return value ? trueLabel : falseLabel;
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

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
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
    padding: spacing.xl,
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  noticeCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  petCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  petImage: {
    borderColor: colors.creamBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 66,
    width: 66,
  },
  petImageFallback: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    justifyContent: "center",
  },
  petRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
});
