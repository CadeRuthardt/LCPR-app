import { router, useLocalSearchParams } from "expo-router";
import * as React from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  Icon,
  Screen,
  Text,
} from "@/components/primitives";
import {
  getCachedClientReservationDetailForApp,
  getClientReservationDetailForApp,
} from "@/services/client-data";
import {
  getCachedCurrentGingrInvoices,
  getCurrentGingrInvoices,
  getGingrInvoiceReservationIds,
} from "@/services/gingr";
import type { GingrInvoiceSummary } from "@/services/gingr";
import { colors, fonts, radius, spacing } from "@/theme";
import type { ClientReservationDetail, ReservationEstimate } from "@/types/app";

export function ReservationDetailScreen() {
  const params = useLocalSearchParams<{ reservationIds?: string; reservationSummary?: string }>();
  const reservationIds = parseReservationIds(params.reservationIds);
  const reservationKey = [...reservationIds].sort().join("|");
  const reservationSummary = normalizeRouteParam(params.reservationSummary);
  const initialDetail = getCachedClientReservationDetailForApp(reservationIds);
  const [detail, setDetail] = React.useState<ClientReservationDetail | null>(initialDetail);
  const [detailKey, setDetailKey] = React.useState(initialDetail ? reservationKey : "");
  const [invoiceTotals, setInvoiceTotals] = React.useState<Record<string, string>>(() =>
    buildInvoiceTotals(getCachedCurrentGingrInvoices()?.lookups?.flatMap((lookup) => lookup.matchingOwnerInvoices) ?? []),
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(!initialDetail);
  const visibleDetail = detailKey === reservationKey ? detail : initialDetail;

  React.useEffect(() => {
    let isMounted = true;
    const cachedDetail = getCachedClientReservationDetailForApp(reservationIds);

    setDetail(cachedDetail);
    setDetailKey(cachedDetail ? reservationKey : "");
    setInvoiceTotals(buildInvoiceTotals(getCachedCurrentGingrInvoices()?.lookups?.flatMap((lookup) => lookup.matchingOwnerInvoices) ?? []));
    setErrorMessage(null);
    setIsLoading(!cachedDetail);

    if (reservationIds.length === 0) {
      setErrorMessage("No reservation was selected.");
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    getClientReservationDetailForApp(reservationIds)
      .then(async (reservationDetail) => {
        if (!isMounted) {
          return;
        }

        setDetail(reservationDetail);
        setDetailKey(reservationDetail ? reservationKey : "");
        setErrorMessage(
          reservationDetail ? null : "We could not find that reservation for your profile.",
        );

        if (reservationDetail?.groupedReservations.some(isCheckedOutReservation)) {
          const invoiceResponse = await getCurrentGingrInvoices().catch(() => null);
          if (isMounted) {
            setInvoiceTotals(buildInvoiceTotals(invoiceResponse?.lookups?.flatMap((lookup) => lookup.matchingOwnerInvoices) ?? []));
          }
        } else {
          setInvoiceTotals({});
        }
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
  }, [reservationKey]);

  return (
    <Screen backgroundColor={colors.white} contentStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={returnToReservations} style={styles.headerBack}>
          <Icon color={colors.blackCherry} name="chevron-left" size={18} />
          <Text style={styles.headerBackLabel} variant="caption">Reservations</Text>
        </Pressable>
        <Text style={styles.screenTitle} variant="title">Reservation Detail</Text>
        <View style={styles.headerBalance} />
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

      {visibleDetail ? <ReservationDetailContent key={reservationKey} detail={visibleDetail} invoiceTotals={invoiceTotals} reservationSummary={reservationSummary} /> : null}
    </Screen>
  );
}

function returnToReservations() {
  router.replace("/reservations");
}

function ReservationDetailContent({
  detail,
  invoiceTotals,
  reservationSummary,
}: {
  detail: ClientReservationDetail;
  invoiceTotals: Record<string, string>;
  reservationSummary: string | null;
}) {
  const [selectedPetIndex, setSelectedPetIndex] = React.useState(0);
  const selectedPet = detail.petDetails[selectedPetIndex] ?? detail.petDetails[0];
  const selectedReservationIndex = Math.max(
    0,
    detail.groupedReservations.findIndex((reservation) =>
      reservationMatchesPet(reservation.animalNames, selectedPet?.name),
    ),
  );
  const activeReservation = detail.groupedReservations[selectedReservationIndex] ?? detail;
  const formattedLocation = formatSpecificLocation(activeReservation.location);
  const stayLength = formatNightCount(activeReservation.nights ?? activeReservation.unitsOfTime, activeReservation.startDate, activeReservation.endDate);
  const addOnServices = parseAddOnServices(activeReservation.services, activeReservation.groomingNotes);
  const petNames = detail.petDetails.map((pet) => pet.name).filter(Boolean);
  const activeEstimate =
    detail.estimatesByReservation[activeReservation.id] ??
    (detail.groupedReservations.length === 1 ? detail.estimate : null);
  const activeEstimateReservation = activeEstimate?.reservations[0] ?? null;
  const petSpecificEstimateDetails = filterEstimateDetailsForPet(
    activeEstimate?.details ?? [],
    selectedPet?.name,
  );
  const groupedEstimateTotal = sumFormattedMoney(
    Object.values(detail.estimatesByReservation).map((estimate) => estimate.totalDue),
  );
  const isCheckedOut = isCheckedOutReservation(activeReservation);
  const isConfirmed = activeReservation.status.trim().toLowerCase() === "confirmed";
  const activeDisplayedTotal = isCheckedOut
    ? invoiceTotals[activeReservation.id] ?? activeEstimate?.totalDue ?? null
    : activeEstimate?.totalDue ?? null;
  const groupedInvoiceTotal = sumFormattedMoney(
    detail.groupedReservations.map((reservation) =>
      invoiceTotals[reservation.id] ?? detail.estimatesByReservation[reservation.id]?.totalDue ?? null,
    ),
  );
  const groupedDisplayedTotal = detail.groupedReservations.every(isCheckedOutReservation)
    ? groupedInvoiceTotal
    : groupedEstimateTotal;

  function requestAdditionalService() {
    const email = activeEstimate?.location?.email ?? "support@lechateaupetresort.com";
    const subject = `Additional service request for reservation ${activeReservation.id}`;
    void Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
  }

  function viewReservationWebcam() {
    const location = activeEstimate?.location?.city ?? formattedLocation ?? activeReservation.location;

    router.push({
      pathname: "/live-cameras",
      params: location ? { location } : {},
    });
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.petSelector} horizontal showsHorizontalScrollIndicator={false}>
          {detail.petDetails.map((pet, index) => (
            <Pressable
              accessibilityRole="button"
              key={`${pet.name}-selector-${index}`}
              onPress={() => setSelectedPetIndex(index)}
              style={[styles.petSelectorItem, selectedPetIndex === index && styles.petSelectorItemActive]}
            >
              {pet.imageUrl ? <Image source={{ uri: pet.imageUrl }} style={styles.selectorPetImage} /> : <View style={[styles.selectorPetImage, styles.petImageFallback]}><Icon color={colors.goldenrod} name="paw" size={14} /></View>}
              <View style={styles.selectorPetCopy}>
                <Text style={styles.selectorPetName} variant="caption">{pet.name}</Text>
                <Text numberOfLines={1} style={styles.selectorPetMeta} variant="caption" tone="muted">{formatPetAge(pet.age) || pet.breed || "Pet"}</Text>
              </View>
              {selectedPetIndex === index ? <Icon color={colors.statusGreen} name="check" size={12} /> : null}
            </Pressable>
          ))}
      </ScrollView>

      <View style={styles.petHero}>
        {selectedPet?.imageUrl ? <Image source={{ uri: selectedPet.imageUrl }} style={styles.heroPetImage} /> : <View style={[styles.heroPetImage, styles.petImageFallback]}><Icon color={colors.goldenrod} name="paw" size={20} /></View>}
        <View style={styles.petHeroCopy}>
          <Text style={styles.petName} variant="heading">
            {selectedPet?.name ?? formatPetNameList(petNames.length > 0 ? petNames : detail.animalNames)}
          </Text>
          <Text variant="caption" tone="secondary">
            {selectedPet
              ? [selectedPet.breed, selectedPet.species, formatPetAge(selectedPet.age)].filter(Boolean).join(" · ")
              : formatReservationSummary(detail, reservationSummary)}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge,isConfirmed&&styles.statusBadgeConfirmed]}><Text style={[styles.statusBadgeText,isConfirmed&&styles.statusBadgeConfirmedText]} variant="label" tone={isConfirmed?"primary":"inverse"}>{formatReservationStatus(activeReservation.status)}</Text></View>
            {activeReservation.reservationType ? (
              <View style={styles.roomBadge}><Text style={styles.roomBadgeText} variant="label">{activeReservation.reservationSummary ?? reservationSummary ?? formatReservationSelections(activeReservation.reservationType) ?? formatReservationType(activeReservation.reservationType) ?? activeReservation.reservationType}</Text></View>
            ) : null}
          </View>
        </View>
        <View style={styles.confirmationBlock}>
          <Text variant="caption" tone="muted">Reservation</Text>
          <Text selectable variant="caption">#{activeReservation.id}</Text>
          <Pressable onPress={viewReservationWebcam} style={styles.webcamButton}>
            <Icon color={colors.mutedGold} name="camera" size={13} />
            <Text numberOfLines={1} style={styles.webcamLabel} variant="caption">View Webcam</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.stayFacts}>
        <StayFact label="Check-in" value={formatIsoDate(activeReservation.startDate)} subvalue={formatTimeOnly(activeReservation.checkInAt ?? activeReservation.startDateTimeLabel)} />
        <StayFact bordered label="Check-out" value={formatIsoDate(activeReservation.endDate)} subvalue={formatTimeOnly(activeReservation.checkOutAt ?? activeReservation.endDateTimeLabel)} />
        <StayFact label="Total stay" value={stayLength} subvalue={formattedLocation} />
      </View>

      <CompactCard icon="calendar" title="Reservation Summary">
        {activeEstimateReservation ? (
          <EstimateLine
            label={formatEstimateReservationLabel(activeEstimateReservation.label, selectedPet?.name)}
            detail={formatEstimateQuantity(activeEstimateReservation.quantity, activeEstimateReservation.unitPrice)}
            value={activeEstimateReservation.subtotal}
          />
        ) : null}
        {activeEstimateReservation?.modifiers?.map((modifier, index) => (
          <EstimateLine
            key={`${modifier.label}-${index}`}
            label={modifier.label ?? "Rate modifier"}
            detail={formatEstimateQuantity(modifier.quantity, modifier.unitPrice)}
            value={modifier.total}
          />
        ))}
        {petSpecificEstimateDetails.map((line, index) => (
          <EstimateLine
            key={`${line.label}-${index}`}
            label={line.label ?? "Service"}
            detail={formatEstimateQuantity(line.quantity, line.unitPrice)}
            value={line.total}
          />
        ))}
        {activeEstimate?.tax ? <EstimateLine label="Tax" value={activeEstimate.tax} /> : null}
        <View style={styles.totalRow}><Text variant="title">{isCheckedOut ? "Reservation Total" : "Reservation Estimate"}</Text><Text selectable style={styles.totalValue} variant="title">{activeDisplayedTotal ?? (isCheckedOut ? "Invoice unavailable" : "Estimate unavailable")}</Text></View>
      </CompactCard>

      <Card style={[styles.compactCard, styles.warmCard]}>
        <View style={styles.notesRow}>
          <Icon color={colors.goldenrod} name="star" size={20} />
          <View style={styles.notesCopy}><Text style={styles.cardTitle} variant="title">Notes</Text><Text selectable style={styles.notesText} variant="caption" tone={activeReservation.notes ? "secondary" : "muted"}>{activeReservation.notes || "No reservation notes listed."}</Text></View>
          <Pressable onPress={requestAdditionalService}><Text style={styles.editLabel} variant="caption">Edit</Text></Pressable>
        </View>
      </Card>

      <CompactCard icon="calendar" title="Reservation Details">
        <FieldRow label="Location" value={activeEstimate?.location?.city ?? formattedLocation ?? activeReservation.location} />
        <FieldRow label="Created" value={formatDateTime(activeReservation.createdAt)} />
        <FieldRow label="Created by" value={activeReservation.createdBy} />
        <FieldRow label="Last Updated" value={formatDateTime(activeReservation.confirmedAt ?? activeReservation.createdAt)} />
      </CompactCard>

      <CompactCard actionLabel={addOnServices.length > 0 ? "View All" : undefined} icon="paw" title="Add-On Services">
        {addOnServices.length > 0 ? (
          <View style={styles.servicePills}>
            {addOnServices.map((service) => (
              <View key={service} style={styles.servicePill}>
                <Icon color={colors.blackCherry} name="sparkles" size={12} />
                <Text variant="caption">{service}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Button icon="plus" onPress={requestAdditionalService} style={styles.addServiceButton} title="Add additional service" variant="secondary" />
        )}
      </CompactCard>

      <View style={styles.actionRow}>
        <Pressable style={styles.calendarButton}><Icon color={colors.ivory} name="calendar" size={17} /><Text tone="inverse" variant="caption">Add to Calendar</Text></Pressable>
        <Pressable style={styles.moreButton}><Icon color={colors.blackCherry} name="ellipsis" size={18} /></Pressable>
      </View>

      {detail.petDetails.length > 1 ? (
        <View style={styles.allPetsSection}>
          <View style={styles.allPetsHeading}>
            <Text style={styles.allPetsTitle} variant="caption">All Pets on This Reservation ({detail.petDetails.length})</Text>
            <Text style={styles.allPetsTotal} variant="caption">{detail.groupedReservations.every(isCheckedOutReservation) ? "Total" : "Estimate"}: {groupedDisplayedTotal ?? "Unavailable"}</Text>
          </View>
          <Card style={styles.allPetsCard}><View style={styles.allPetsList}>
            {detail.petDetails.map((pet, index) => (
              <Pressable key={`${pet.name}-summary-${index}`} onPress={() => setSelectedPetIndex(index)} style={styles.allPetRow}>
                {pet.imageUrl ? <Image source={{ uri: pet.imageUrl }} style={styles.allPetImage} /> : <View style={[styles.allPetImage, styles.petImageFallback]}><Icon color={colors.goldenrod} name="paw" size={14} /></View>}
                <View style={styles.allPetCopy}><Text variant="caption">{pet.name}</Text><Text numberOfLines={1} variant="caption" tone="muted">{[pet.breed, formatPetAge(pet.age)].filter(Boolean).join(" · ") || "Pet details"}</Text></View>
                <Text selectable style={styles.allPetReservationTotal} variant="caption">
                  {getPetReservationTotal(detail, invoiceTotals, pet.name)}
                </Text>
              </Pressable>
            ))}
          </View></Card>
        </View>
      ) : null}

      {detail.status.toLowerCase().includes("cancel") ? (
        <CompactCard icon="info" title="Cancellation"><FieldRow label="Reason" value={detail.cancellationReason} /><FieldRow label="Cancelled by" value={detail.cancelledBy} /></CompactCard>
      ) : null}

    </>
  );
}

function CompactCard({ actionLabel, children, icon, title, tone = "default" }: React.PropsWithChildren<{ actionLabel?: string; icon: "calendar" | "info" | "paw" | "sparkles" | "star"; title: string; tone?: "default" | "warm" }>) {
  return <Card style={[styles.compactCard, tone === "warm" && styles.warmCard]}><View style={styles.cardHeading}><Icon color={tone === "warm" ? colors.mutedGold : colors.blackCherry} name={icon} size={18} /><Text style={styles.cardTitle} variant="title">{title}</Text>{actionLabel ? <Text style={styles.cardAction} variant="caption">{actionLabel}</Text> : null}</View><View style={styles.cardBody}>{children}</View></Card>;
}

function EstimateLine({ detail, label, value }: { detail?: string | null; label: string; value?: string | null }) {
  const isCredit = value?.trim().startsWith("-");
  return <View style={styles.estimateRow}><View style={styles.estimateCopy}><Text variant="caption">{label}</Text>{detail ? <Text variant="caption" tone="muted">{detail}</Text> : null}</View><Text selectable style={isCredit ? styles.creditValue : undefined} variant="caption" tone={value ? "secondary" : "muted"}>{value || "Not listed"}</Text></View>;
}

function StayFact({ bordered = false, label, subvalue, value }: { bordered?: boolean; label: string; subvalue?: string | null; value?: string | null }) {
  return <View style={[styles.stayFact, bordered && styles.stayFactBordered]}><Text style={styles.factLabel} variant="caption" tone="muted">{label}</Text><Text selectable style={styles.factValue} variant="caption">{value || "Not listed"}</Text>{subvalue ? <Text style={styles.factSubvalue} variant="caption" tone="secondary">{subvalue}</Text> : null}</View>;
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

function formatPetNameList(names: string[]) {
  const petNames = names.filter(Boolean);

  if (petNames.length <= 2) {
    return petNames.join(" & ") || "Reservation";
  }

  return `${petNames.slice(0, -1).join(", ")} & ${petNames[petNames.length - 1]}`;
}

function parseAddOnServices(services: string | null, groomingNotes: string | null) {
  const values = [services, groomingNotes]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap((value) => value.split(/\s*(?:,|;|\n)\s*/))
    .map((value) => value.trim())
    .map((value) => value.replace(/^spa\s*\|\s*/i, ""))
    .filter((value) => value && !/^none|not listed|no add-ons?$/i.test(value));

  return [...new Set(values)];
}

function getPetReservationTotal(detail: ClientReservationDetail, invoiceTotals: Record<string, string>, petName: string) {
  const reservation = detail.groupedReservations.find((candidate) =>
    reservationMatchesPet(candidate.animalNames, petName),
  );

  if (!reservation) {
    return "Unavailable";
  }

  return isCheckedOutReservation(reservation)
    ? invoiceTotals[reservation.id] ?? detail.estimatesByReservation[reservation.id]?.totalDue ?? "Unavailable"
    : detail.estimatesByReservation[reservation.id]?.totalDue ?? "Unavailable";
}

function isCheckedOutReservation(reservation: { status: string }) {
  const status = reservation.status.trim().toLowerCase().replace(/[_-]+/g, " ");
  return status.includes("checked out") || status.includes("checkout") || status.includes("completed") || status.includes("complete");
}

function buildInvoiceTotals(invoices: GingrInvoiceSummary[]) {
  const uniqueInvoices = new Map<string, GingrInvoiceSummary>();
  for (const invoice of invoices) {
    const key = invoice.id ?? [invoice.reservationId, invoice.date, invoice.total].join("|");
    if (!uniqueInvoices.has(key)) uniqueInvoices.set(key, invoice);
  }

  const totals = new Map<string, string[]>();
  for (const invoice of uniqueInvoices.values()) {
    if (!invoice.total) continue;
    const reservationIds = getGingrInvoiceReservationIds(invoice);
    for (const reservationId of reservationIds) {
      totals.set(reservationId, [...(totals.get(reservationId) ?? []), invoice.total]);
    }
  }

  return Object.fromEntries(Array.from(totals, ([reservationId, values]) => [reservationId, sumFormattedMoney(values) ?? ""]));
}

function formatEstimateReservationLabel(label: string | null, animalName?: string) {
  if (label && !/^reservation$/i.test(label.trim())) {
    return label;
  }

  return animalName ? `Reservation for ${animalName}` : "Reservation";
}

function formatEstimateQuantity(quantity?: string | null, unitPrice?: string | null) {
  if (quantity && unitPrice) {
    return `${quantity} × ${unitPrice}`;
  }

  return quantity ? `Quantity: ${quantity}` : unitPrice;
}

function reservationMatchesPet(animalNames: string[], petName?: string) {
  if (!petName) {
    return false;
  }

  const normalizedPetName = petName.trim().toLowerCase();
  return animalNames.some((name) => name.trim().toLowerCase() === normalizedPetName);
}

function filterEstimateDetailsForPet(
  details: ReservationEstimate["details"],
  petName?: string,
) {
  if (!petName) {
    return [];
  }

  const normalizedPetName = petName.trim().toLowerCase();
  const matchedDetails = details.filter((line) =>
    line.label?.toLowerCase().includes(normalizedPetName),
  );

  return matchedDetails;
}

function sumFormattedMoney(values: Array<string | null>) {
  const amounts = values
    .map((value) => Number(value?.replace(/[^0-9.-]/g, "")))
    .filter((value) => Number.isFinite(value));

  if (amounts.length === 0) {
    return null;
  }

  return amounts.reduce((total, value) => total + value, 0).toLocaleString("en-US", {
    currency: "USD",
    style: "currency",
  });
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
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: spacing.sm },
  addPetButton: { alignItems: "center", flexDirection: "row", gap: 6, paddingHorizontal: spacing.xs },
  addPetIcon: { alignItems: "center", borderColor: colors.blackCherry, borderRadius: radius.pill, borderWidth: 1, height: 30, justifyContent: "center", width: 30 },
  addPetLabel: { color: colors.blackCherry, fontWeight: "600" },
  addServiceButton: {
    minHeight: 42,
  },
  allPetCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  allPetImage: {
    borderRadius: radius.pill,
    height: 40,
    width: 40,
  },
  allPetRow: {
    alignItems: "center",
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  allPetReservationTotal: { color: colors.blackCherry, fontFamily: fonts.bodySemiBold },
  allPetsCard: { backgroundColor: colors.white, borderRadius: radius.md, padding: 0 },
  allPetsHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xs },
  allPetsList: {
    gap: spacing.xxs,
  },
  allPetsSection: { gap: spacing.xs },
  allPetsTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  allPetsTotal: { color: colors.blackCherry, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  backButton: {
    flexShrink: 0,
  },
  badgeRow: { flexDirection: "row", gap: spacing.xs },
  cardBody: { gap: 4 },
  cardAction: { color: colors.mutedGold, marginLeft: "auto" },
  cardHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    gap: 6,
    padding: spacing.sm,
  },
  cardTitle: { flexShrink: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 19 },
  confirmationBlock: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: 2,
    maxWidth: 108,
  },
  creditValue: { color: colors.statusGreen },
  content: {
    gap: 7,
    paddingBottom: 104,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  calendarButton: { alignItems: "center", backgroundColor: colors.blackCherry, borderRadius: radius.sm, flex: 1, flexDirection: "row", gap: spacing.sm, justifyContent: "center", minHeight: 42 },
  editLabel: { color: colors.mutedGold, fontWeight: "600" },
  estimateCopy: { flex: 1 },
  estimateRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  fieldLabel: {
    flex: 1,
  },
  fieldRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  fieldValue: {
    flex: 1.2,
    textAlign: "right",
  },
  factLabel: {
    textTransform: "uppercase",
  },
  factSubvalue: {
    fontSize: 9,
    textAlign: "center",
  },
  factValue: {
    color: colors.blackCherry,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 38,
  },
  headerBack: { alignItems: "center", flexDirection: "row", gap: spacing.xs, width: 98 },
  headerBackLabel: { color: colors.blackCherry, fontSize: 13 },
  headerBalance: { width: 48 },
  heroPetImage: {
    borderColor: colors.creamBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 56,
    width: 56,
  },
  noticeCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  moreButton: { alignItems: "center", borderColor: colors.blackCherry, borderRadius: radius.sm, borderWidth: 1, justifyContent: "center", minHeight: 42, width: 48 },
  notesCopy: { flex: 1, gap: spacing.xxs },
  notesRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  notesText: { color: "#17304F", lineHeight: 18 },
  remainingRow: { flexDirection: "row", justifyContent: "space-between" },
  remainingValue: { color: colors.statusRed, fontFamily: fonts.bodySemiBold },
  petCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  petHero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  petHeroCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  petImage: {
    borderColor: colors.creamBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 54,
    width: 54,
  },
  petImageFallback: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    justifyContent: "center",
  },
  petName: {
    color: colors.blackCherry,
    fontSize: 20,
    lineHeight: 24,
  },
  petSelector: {
    backgroundColor: colors.white,
    borderColor: "#EFEDE9",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    padding: 4,
  },
  petSelectorItem: {
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderColor: "#ECE9E4",
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 108,
  },
  petSelectorItemActive: {
    borderColor: colors.blackCherry,
  },
  selectorPetCopy: {
    flexShrink: 0,
  },
  selectorPetImage: {
    borderRadius: radius.pill,
    height: 30,
    width: 30,
  },
  selectorPetMeta: { fontSize: 9, lineHeight: 11 },
  selectorPetName: { fontFamily: fonts.bodySemiBold, fontSize: 11, lineHeight: 13 },
  servicePill: {
    alignItems: "center",
    backgroundColor: "#F5F5F3",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    flex: 1,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  servicePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  petRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  screenTitle: {
    flex: 1,
    fontSize: 19,
    lineHeight: 23,
    textAlign: "center",
  },
  roomBadge: { backgroundColor: colors.parchment, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  roomBadgeText: { fontSize: 9, lineHeight: 12, textTransform: "uppercase" },
  statusBadge: { backgroundColor: colors.blackCherry, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  statusBadgeConfirmed: { backgroundColor: colors.statusGreenSoft },
  statusBadgeConfirmedText: { color: colors.statusGreen },
  statusBadgeText: { fontSize: 9, lineHeight: 12, textTransform: "uppercase" },
  stayFact: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  stayFactBordered: {
    borderColor: colors.creamBorder,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  stayFacts: {
    borderBottomColor: colors.creamBorder,
    borderBottomWidth: 1,
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingVertical: spacing.xs,
  },
  totalRow: {
    borderTopColor: colors.creamBorder,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
  },
  totalValue: {
    color: colors.blackCherry,
  },
  webcamButton: { alignItems: "center", borderColor: colors.goldenrod, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 4, marginTop: 3, paddingHorizontal: 7, paddingVertical: 5 },
  webcamLabel: { color: colors.mutedGold, fontSize: 10, lineHeight: 12 },
  warmCard: {
    backgroundColor: "#FFFDF7",
    borderColor: "#F3E5C4",
  },
});
