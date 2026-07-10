import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";

import {
  BackChevronButton,
  Badge,
  Button,
  Card,
  Icon,
  Screen,
  Section,
  Text,
} from "@/components/primitives";
import { DeveloperDataPanel } from "@/components/composites";
import { resortImages } from "@/data/mock-data";
import { getClientReservationDetailForApp } from "@/services/client-data";
import { colors, fonts, radius, spacing } from "@/theme";
import type { ClientReservationDetail, ReservationDetailPet } from "@/types/app";

export function ReservationDetailScreen() {
  const params = useLocalSearchParams<{ reservationIds?: string; reservationSummary?: string }>();
  const reservationIds = parseReservationIds(params.reservationIds);
  const reservationSummary = normalizeRouteParam(params.reservationSummary);
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
        <BackChevronButton onPress={returnToReservations} style={styles.backButton} />
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
          <Button
            icon="chevron-left"
            title="Reservations"
            variant="secondary"
            onPress={returnToReservations}
          />
        </Card>
      ) : null}

      {detail ? <ReservationDetailContent detail={detail} reservationSummary={reservationSummary} /> : null}
    </Screen>
  );
}

function returnToReservations() {
  router.replace("/reservations");
}

function ReservationDetailContent({
  detail,
  reservationSummary,
}: {
  detail: ClientReservationDetail;
  reservationSummary: string | null;
}) {
  const statusTone = badgeToneForStatus(detail.status);
  const formattedLocation = formatSpecificLocation(detail.location);

  return (
    <>
      <Card style={styles.heroCard}>
        <ImageBackground source={{ uri: getReservationHeroImage(detail.location) }} style={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={[styles.heroStatusLabel, statusHeroLabelStyle(detail.status)]}>
            <Text variant="label" tone="inverse" style={styles.heroStatusText}>
              {formatReservationStatus(detail.status)}
            </Text>
          </View>
          {formattedLocation ? (
            <Text variant="title" tone="inverse" style={styles.heroLocation}>
              {formattedLocation}
            </Text>
          ) : null}
        </ImageBackground>

        <View style={styles.heroPanel}>
          <View style={styles.heroCopy}>
            <Text variant="heading">{detail.dateRange}</Text>
            <Text variant="body" tone="secondary">
              {formatReservationSummary(detail, reservationSummary)}
            </Text>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.badgeRow}>
              {detail.reservationType ? (
                <Badge
                  label={formatReservationType(detail.reservationType) ?? detail.reservationType}
                  tone={badgeToneForReservationType(detail.reservationType)}
                />
              ) : null}
              <Badge label={formatReservationStatus(detail.status)} tone={statusTone} />
            </View>
            <View style={styles.checkTimes}>
              <TimeRow
                label={detail.checkInAt ? "Checked in" : "Expected check-in"}
                value={formatTimeOnly(detail.checkInAt ?? detail.startDateTimeLabel)}
                emptyValue="Time not listed"
              />
              <TimeRow
                label={detail.checkOutAt ? "Checked out" : "Expected check-out"}
                value={formatTimeOnly(detail.checkOutAt ?? detail.endDateTimeLabel)}
                emptyValue="Time not listed"
              />
            </View>
          </View>
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

      <Section title="Feeding Information">
        <Card style={styles.detailCard}>
          <FieldRow label="Feeding times" value={detail.feedingTime} />
          <FieldRow label="Feeding amount" value={detail.feedingAmount} />
          <FieldRow label="Feeding notes" value={detail.feedingNotes} />
        </Card>
      </Section>

      <Section title="Medication Information">
        <Card style={styles.detailCard}>
          {detail.petDetails.length > 0 ? (
            detail.petDetails.map((pet, index) => (
              <FieldRow
                key={`${pet.name}-medication-${index}`}
                label={pet.name}
                value={pet.medicines}
                emptyValue="No medications listed"
              />
            ))
          ) : (
            <FieldRow label="Medications" value={null} emptyValue="No medications listed" />
          )}
        </Card>
      </Section>

      <Section title="Additional Services">
        <Card style={styles.detailCard}>
          <FieldRow label="Services" value={detail.services} emptyValue="No add-ons listed" />
          <FieldRow label="Grooming notes" value={detail.groomingNotes} />
          <FieldRow
            label="Pre-check"
            value={formatBooleanStatus(detail.precheckCompleted, "Completed", "Not completed")}
          />
        </Card>
      </Section>

      <Section title="Notes">
        <Card style={styles.detailCard}>
          <FieldRow label="Reservation notes" value={detail.notes} />
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

      {detail.rawReservations && detail.rawReservations.length > 0 ? (
        <Section
          title="Developer Data"
          subtitle="Temporary raw Gingr fields for choosing what to keep."
        >
          <DeveloperDataPanel
            records={detail.rawReservations.map((reservation, index) => ({
              data: reservation,
              title: `Raw Reservation ${index + 1}`,
            }))}
            subtitle=""
          />
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
          {[pet.breed, pet.weight, formatPetAge(pet.age)].filter(Boolean).join(" | ") ||
            "Pet details"}
        </Text>
        <Text variant="caption" tone="muted">
          {pet.medicines ? `Medications: ${pet.medicines}` : "Medications not listed"}
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

function TimeRow({
  emptyValue = "Time not listed",
  label,
  value,
}: {
  emptyValue?: string;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.timeRow}>
      <Text numberOfLines={1} variant="caption" tone="muted" style={styles.timeLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} variant="caption" tone={value ? "secondary" : "muted"} style={styles.timeValue}>
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

function normalizeRouteParam(value?: string | string[]) {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  return normalizedValue?.trim() || null;
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
    .filter(
      (part) =>
        part &&
        formatReservationType(part) !== primaryType &&
        !isGenericResortName(part) &&
        !isKnownLocation(part),
    );

  return selections.join(" | ") || null;
}

function formatPetAge(age: string | null) {
  if (!age) {
    return null;
  }

  if (/\byear|month|week|day|old\b/i.test(age)) {
    return age;
  }

  const numericAge = age.match(/\d+/)?.[0];

  if (!numericAge) {
    return age;
  }

  const count = Number(numericAge);
  return `${count} year${count === 1 ? "" : "s"} old`;
}

function formatReservationSummary(
  detail: ClientReservationDetail,
  routeReservationSummary: string | null,
) {
  const type = formatReservationType(detail.reservationType);
  const stayLength = isBoardingReservation(detail.reservationType)
    ? formatNightCount(detail.nights ?? detail.unitsOfTime, detail.startDate, detail.endDate)
    : type;
  const detailType =
    routeReservationSummary ??
    detail.reservationSummary ??
    formatReservationSelections(detail.reservationType);

  return [stayLength, detailType].filter(Boolean).join(" | ") || "Reservation details";
}

function isBoardingReservation(reservationType: string | null) {
  return formatReservationType(reservationType)?.toLowerCase() === "boarding";
}

function formatNightCount(
  listedNights: string | null,
  startDate: string | null,
  endDate: string | null,
) {
  const parsedNights = listedNights?.match(/\d+/)?.[0];

  if (parsedNights) {
    const count = Number(parsedNights);
    return `${count} Night${count === 1 ? "" : "s"}`;
  }

  if (startDate && endDate) {
    const nights = Math.max(0, differenceInDays(startDate, endDate));

    if (nights > 0) {
      return `${nights} Night${nights === 1 ? "" : "s"}`;
    }
  }

  return "Boarding";
}

function differenceInDays(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getReservationHeroImage(location?: string | null) {
  const normalizedLocation = location?.trim().toLowerCase() ?? "";

  if (normalizedLocation.includes("wichita falls")) {
    return resortImages.wichitaFallsHero;
  }

  return resortImages.loginHero;
}

function formatSpecificLocation(value: string | null) {
  if (!value || isGenericResortName(value)) {
    return null;
  }

  const knownLocations = ["Amarillo", "Wichita Falls", "New Braunfels"];
  const knownLocation = knownLocations.find((location) =>
    value.toLowerCase().includes(location.toLowerCase()),
  );

  return knownLocation ?? value;
}

function isGenericResortName(value: string) {
  return /^le chateau pet resort$/i.test(value.trim());
}

function isKnownLocation(value: string) {
  return Boolean(formatSpecificLocation(value));
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

  if (normalizedStatus === "checked out" || normalizedStatus === "checked-out") {
    return "info";
  }

  if (normalizedStatus === "confirmed") {
    return "success";
  }

  if (normalizedStatus === "unconfirmed") {
    return "danger";
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

function statusHeroLabelStyle(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "confirmed" || normalizedStatus === "checked in") {
    return styles.heroStatusConfirmed;
  }

  if (normalizedStatus === "unconfirmed") {
    return styles.heroStatusUnconfirmed;
  }

  if (normalizedStatus === "checked out" || normalizedStatus === "checked-out") {
    return styles.heroStatusCheckedOut;
  }

  return null;
}

function formatBooleanStatus(value: boolean | null, trueLabel: string, falseLabel: string) {
  if (value === null) {
    return null;
  }

  return value ? trueLabel : falseLabel;
}

function formatTimeOnly(value?: string | null) {
  if (!value) {
    return null;
  }

  const timeMatch = value.match(/\b(\d{1,2})(?::(\d{2}))?\s*([AP]M)\b/i);

  if (timeMatch) {
    const [, hour, minutes, meridiem] = timeMatch;
    return `${hour}:${minutes ?? "00"} ${meridiem.toUpperCase()}`;
  }

  if (/T\d{2}:\d{2}/.test(value)) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }

  return null;
}

function formatIsoDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = parseIsoDate(value);

  if (!date) {
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
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  heroCopy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  heroImage: {
    height: 210,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  heroLocation: {
    alignSelf: "center",
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.lg,
    textAlign: "center",
    textShadowColor: colors.overlayDark,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
  },
  heroPanel: {
    alignItems: "center",
    backgroundColor: colors.porcelain,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.md,
    marginTop: -28,
    padding: spacing.xl,
  },
  heroMeta: {
    alignSelf: "stretch",
    gap: spacing.md,
  },
  checkTimes: {
    gap: spacing.sm,
  },
  timeLabel: {
    flex: 1,
  },
  timeRow: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  timeValue: {
    flexShrink: 0,
    textAlign: "right",
  },
  heroStatusCheckedOut: {
    backgroundColor: colors.statusBlue,
  },
  heroStatusConfirmed: {
    backgroundColor: colors.statusGreen,
  },
  heroStatusLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.goldenrod,
    borderRadius: radius.pill,
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  heroStatusText: {
    textTransform: "uppercase",
  },
  heroStatusUnconfirmed: {
    backgroundColor: colors.statusRed,
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
});
