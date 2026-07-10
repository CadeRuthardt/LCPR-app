import { router, useFocusEffect } from "expo-router";
import * as React from "react";
import { Image, ImageBackground, Pressable, StyleSheet, View } from "react-native";

import { Badge, Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import { resortImages } from "@/data/mock-data";
import {
  cancelReservationRequest,
  getCachedClientDashboardData,
  getCurrentClientDashboardData,
} from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import { fonts } from "@/theme/fonts";
import type { ClientReservation, Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";

import { ScreenHeader } from "./screen-header";

type ReservationsState = {
  pastReservations: ClientReservation[];
  pets: Pet[];
  requests: ReservationRequest[];
  upcomingReservations: ClientReservation[];
};

const reservationTabs = ["Upcoming", "Past", "Requests"] as const;

type ReservationTab = (typeof reservationTabs)[number];

type ReservationPetPreview = {
  imageUrl?: string | null;
  name: string;
};

export function ReservationsScreen() {
  const cachedDashboardData = getCachedClientDashboardData();
  const hasInitialDashboardData = Boolean(cachedDashboardData);
  const [data, setData] = React.useState<ReservationsState>({
    pastReservations: cachedDashboardData?.pastReservations.filter(
      (reservation) => !isCancelledReservation(reservation.status),
    ) ?? [],
    pets: cachedDashboardData?.pets ?? [],
    requests: cachedDashboardData?.requests.filter(
      (request) => !isCancelledRequestStatus(request.status),
    ) ?? [],
    upcomingReservations: cachedDashboardData?.upcomingReservations.filter(
      (reservation) => !isCancelledReservation(reservation.status),
    ) ?? [],
  });
  const [activeTab, setActiveTab] = React.useState<ReservationTab>("Upcoming");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(hasInitialDashboardData);
  const [cancellingRequestId, setCancellingRequestId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(!hasInitialDashboardData);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadReservations = React.useCallback(async (refreshing = false, showInitialLoader = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else if (showInitialLoader) {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const dashboardData = await getCurrentClientDashboardData({ force: refreshing });

      setData({
        pastReservations: dashboardData.pastReservations.filter(
          (reservation) => !isCancelledReservation(reservation.status),
        ),
        pets: dashboardData.pets,
        requests: dashboardData.requests.filter((request) => !isCancelledRequestStatus(request.status)),
        upcomingReservations: dashboardData.upcomingReservations.filter(
          (reservation) => !isCancelledReservation(reservation.status),
        ),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load reservations right now.",
      );
    } finally {
      setHasLoadedOnce(true);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleCancelRequest = React.useCallback(async (requestId: string) => {
    setCancellingRequestId(requestId);
    setErrorMessage(null);

    try {
      const cancelledRequest = await cancelReservationRequest(requestId);

      setData((current) => ({
        ...current,
        requests: current.requests
          .map((request) => (request.id === requestId ? cancelledRequest : request))
          .filter((request) => !isCancelledRequestStatus(request.status)),
      }));
      setActiveTab("Requests");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to cancel this request right now.",
      );
    } finally {
      setCancellingRequestId(null);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadReservations(false, !hasLoadedOnce);
    }, [hasLoadedOnce, loadReservations]),
  );

  const petNameById = React.useMemo(() => {
    return new Map(data.pets.map((pet) => [pet.id, pet.name]));
  }, [data.pets]);
  const petByNormalizedName = React.useMemo(() => {
    return new Map(data.pets.map((pet) => [normalizePetName(pet.name), pet]));
  }, [data.pets]);

  const submittedRequests = data.requests.filter((request) =>
    ["submitted", "under_review", "action_required"].includes(request.status),
  );
  const completedRequests = data.requests.filter((request) =>
    request.status === "confirmed",
  );

  return (
    <Screen
      contentStyle={styles.content}
      onRefresh={() => loadReservations(true)}
      refreshing={isRefreshing}
    >
      <ScreenHeader title="Reservations" />

      {errorMessage ? (
        <Card style={styles.noticeCard}>
          <Text variant="title">We could not refresh reservations.</Text>
          <Text variant="body" tone="secondary">
            {errorMessage}
          </Text>
          <Button title="Try Again" variant="secondary" onPress={() => loadReservations(true)} />
        </Card>
      ) : null}

      {isLoading ? (
        <Card style={styles.noticeCard}>
          <Text variant="title">Preparing your reservation view...</Text>
          <Text variant="body" tone="secondary">
            We are checking submitted requests and Gingr reservations.
          </Text>
        </Card>
      ) : null}

      <View style={styles.segmented}>
        {reservationTabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.segment,
                isActive && styles.segmentActive,
                pressed && styles.segmentPressed,
              ]}
            >
              <Text variant="caption" tone={isActive ? "inverse" : "secondary"}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "Upcoming" ? (
        <Section title="Upcoming Reservations" subtitle="Confirmed reservations from Gingr.">
          {data.upcomingReservations.length > 0 ? (
            data.upcomingReservations.map((reservation) => (
              <GingrReservationCard
                key={reservation.id}
                petPreviews={getReservationPetPreviews(reservation.petNames, petByNormalizedName)}
                reservation={reservation}
                timing="upcoming"
              />
            ))
          ) : (
            <EmptyStateCard
              icon="calendar"
              title="No upcoming reservations"
              body="Confirmed upcoming reservations from Gingr will appear here."
              actionTitle="Request a Reservation"
              onAction={() =>
                router.push({ pathname: "/request-reservation", params: { returnTo: "/reservations" } })
              }
            />
          )}
        </Section>
      ) : null}

      {activeTab === "Past" ? (
        <Section title="Past Reservations" subtitle="A look back at completed resort visits.">
          {data.pastReservations.length > 0 ? (
            data.pastReservations.map((reservation) => (
              <GingrReservationCard
                key={reservation.id}
                petPreviews={getReservationPetPreviews(reservation.petNames, petByNormalizedName)}
                reservation={reservation}
                timing="past"
              />
            ))
          ) : (
            <EmptyStateCard
              icon="sparkles"
              title="No past reservations yet"
              body="Completed reservations will collect here once Gingr returns history for your profile."
            />
          )}
        </Section>
      ) : null}

      {activeTab === "Requests" ? (
        <Section
          title="Reservation Requests"
          subtitle="Requests sent from the app for reception to review."
        >
          {[...submittedRequests, ...completedRequests].length > 0 ? (
            [...submittedRequests, ...completedRequests].map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                pets={request.selected_pet_ids.map((petId) => ({
                  imageUrl: data.pets.find((pet) => pet.id === petId)?.imageUrl,
                  name: petNameById.get(petId) ?? "Pet",
                }))}
                isCancelling={cancellingRequestId === request.id}
                onCancel={() => {
                  void handleCancelRequest(request.id);
                }}
              />
            ))
          ) : (
            <EmptyStateCard
              icon="calendar"
              title="No submitted requests"
              body="When you request a reservation, it will appear here while our team reviews it."
              actionTitle="Request a Reservation"
              onAction={() =>
                router.push({ pathname: "/request-reservation", params: { returnTo: "/reservations" } })
              }
            />
          )}
        </Section>
      ) : null}
    </Screen>
  );
}

type RequestCardProps = {
  isCancelling?: boolean;
  onCancel?: () => void;
  pets: ReservationPetPreview[];
  request: ReservationRequest;
};

function RequestCard({ isCancelling = false, onCancel, pets, request }: RequestCardProps) {
  const canCancel = Boolean(onCancel) && isCancellableRequest(request.status);

  return (
    <Card variant="elevated" style={styles.reservationCard}>
      <ReservationCardHero label={formatRequestHeroLabel(request.status)} location={request.location} />
      <View style={styles.reservationPanel}>
        <View style={styles.reservationHeader}>
          <View style={styles.cardTitleGroup}>
            <Text variant="title">{formatDateRange(request.start_date, request.end_date)}</Text>
            <Text variant="body" tone="secondary">
              {pets.map((pet) => pet.name).join(", ") || "Pet details pending"}
            </Text>
          </View>
          {request.reservation_type ? (
            <Badge
              label={formatReservationType(request.reservation_type)}
              tone={badgeToneForReservationType(request.reservation_type)}
            />
          ) : null}
        </View>

        <Text variant="caption" tone="secondary">
          {[request.experience, request.location, formatTimeRange(request.start_time, request.end_time)]
            .filter(Boolean)
            .join(" | ")}
        </Text>

        <View style={styles.panelDivider} />

        <ReservationTimeline steps={buildRequestTimeline(request)} />

        {canCancel ? (
          <Button
            disabled={isCancelling}
            onPress={onCancel}
            title={isCancelling ? "Cancelling..." : "Cancel Request"}
            variant="secondary"
          />
        ) : null}

        {!canCancel ? (
          <Button
            icon="chevron-right"
            onPress={() =>
              router.push({ pathname: "/request-reservation", params: { returnTo: "/reservations" } })
            }
            title="Request Another Reservation"
          />
        ) : null}
      </View>
    </Card>
  );
}

type GingrReservationCardProps = {
  petPreviews: ReservationPetPreview[];
  reservation: ClientReservation;
  timing: "past" | "upcoming";
};

function GingrReservationCard({ petPreviews, reservation, timing }: GingrReservationCardProps) {
  const reservationDetail = formatReservationDetail(reservation);

  return (
    <Card style={styles.reservationCard}>
      <ReservationCardHero
        label={formatGingrReservationStatus(reservation.status)}
        location={reservation.location}
      />
      <View style={styles.reservationPanel}>
        <View style={styles.reservationHeader}>
          <View style={styles.cardTitleGroup}>
            <Text variant="title">{reservation.dateRange}</Text>
            <PetSummary pets={petPreviews} />
          </View>
          <View style={styles.badgeStack}>
            {reservation.reservationType ? (
              <Badge
                label={formatReservationType(reservation.reservationType)}
                tone={badgeToneForReservationType(reservation.reservationType)}
              />
            ) : null}
          </View>
        </View>

        <Text variant="caption" tone="secondary" style={styles.detailText}>
          {reservationDetail}
        </Text>

        <View style={styles.panelDivider} />

        <ReservationTimeline steps={buildReservationTimeline(reservation, timing)} />

        <Button
          icon="chevron-right"
          onPress={() =>
            router.push({
              pathname: "/reservation-detail",
              params: {
                reservationIds: reservation.id,
                reservationSummary:
                  reservationDetail === "Reservation details pending" ? undefined : reservationDetail,
              },
            })
          }
          title="View Reservation Details"
        />

        {timing === "past" ? (
          <Button
            onPress={() =>
              router.push({ pathname: "/request-reservation", params: { returnTo: "/reservations" } })
            }
            title="Request Another Reservation"
            variant="secondary"
          />
        ) : null}
      </View>
    </Card>
  );
}

function ReservationCardHero({ label, location }: { label: string; location?: string | null }) {
  const imageUrl = getReservationHeroImage(location);
  const formattedLocation = formatSpecificLocation(location ?? null);

  return (
    <ImageBackground source={{ uri: imageUrl }} style={styles.cardHeroImage}>
      <View style={styles.cardHeroOverlay} />
      <View style={[styles.cardHeroLabel, statusHeroLabelStyle(label)]}>
        <Text variant="label" tone="inverse" style={styles.cardHeroLabelText}>
          {label}
        </Text>
      </View>
      {formattedLocation ? (
        <Text variant="title" tone="inverse" style={styles.cardHeroLocation}>
          {formattedLocation}
        </Text>
      ) : null}
    </ImageBackground>
  );
}

function getReservationHeroImage(location?: string | null) {
  const normalizedLocation = location?.trim().toLowerCase() ?? "";

  if (normalizedLocation.includes("wichita falls")) {
    return resortImages.wichitaFallsHero;
  }

  return resortImages.loginHero;
}

type TimelineStep = {
  detail: string;
  isComplete: boolean;
  label: string;
};

function ReservationTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => (
        <View key={step.label} style={styles.timelineRow}>
          <View style={styles.timelineMarkerColumn}>
            <View
              style={[
                styles.timelineMarker,
                step.isComplete ? styles.timelineMarkerComplete : styles.timelineMarkerOpen,
              ]}
            >
              {step.isComplete ? <Icon color={colors.white} name="check" size={12} /> : null}
            </View>
            {index < steps.length - 1 ? <View style={styles.timelineLine} /> : null}
          </View>
          <View style={styles.timelineCopy}>
            <Text variant="caption" tone="primary">
              {step.label}
            </Text>
            <Text variant="caption" tone="muted">
              {step.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function PetSummary({ pets }: { pets: ReservationPetPreview[] }) {
  const petNames = pets.map((pet) => pet.name).filter(Boolean);

  return (
    <View style={styles.petSummary}>
      <PetAvatarStack pets={pets} />
      <Text variant="caption" tone="secondary" style={styles.petSummaryText}>
        {formatPetNameList(petNames) || "Pet details pending"}
      </Text>
    </View>
  );
}

function PetAvatarStack({ pets }: { pets: ReservationPetPreview[] }) {
  const visiblePets = pets.slice(0, 3);
  const overflowCount = Math.max(pets.length - visiblePets.length, 0);

  return (
    <View style={styles.petAvatarStack}>
      {visiblePets.map((pet, index) => (
        <View
          key={`${pet.name}-${index}`}
          style={[styles.petAvatarWrap, index > 0 && styles.petAvatarOverlap]}
        >
          {pet.imageUrl ? (
            <Image source={{ uri: pet.imageUrl }} style={styles.petAvatar} />
          ) : (
            <View style={[styles.petAvatar, styles.petAvatarFallback]}>
              <Icon color={colors.goldenrod} name="paw" size={13} />
            </View>
          )}
        </View>
      ))}
      {overflowCount > 0 ? (
        <View style={[styles.petAvatarWrap, styles.petAvatarOverlap]}>
          <View style={[styles.petAvatar, styles.petAvatarFallback]}>
            <Text variant="caption" tone="brand">
              +{overflowCount}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type EmptyStateCardProps = {
  actionTitle?: string;
  body: string;
  icon: "calendar" | "sparkles";
  onAction?: () => void;
  title: string;
};

function EmptyStateCard({ actionTitle, body, icon, onAction, title }: EmptyStateCardProps) {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Icon color={colors.goldenrod} name={icon} size={22} />
      </View>
      <View style={styles.emptyCopy}>
        <Text variant="title">{title}</Text>
        <Text variant="body" tone="secondary">
          {body}
        </Text>
      </View>
      {actionTitle && onAction ? (
        <Button title={actionTitle} icon="chevron-right" onPress={onAction} />
      ) : null}
    </Card>
  );
}

function buildRequestTimeline(request: ReservationRequest): TimelineStep[] {
  const statusRank = requestStatusRank(request.status);

  return [
    {
      detail: formatTimestampDate(request.created_at),
      isComplete: statusRank >= 1,
      label: "Request Submitted",
    },
    {
      detail: statusRank >= 2 ? formatTimestampDate(request.updated_at) : "Our team will review availability.",
      isComplete: statusRank >= 2,
      label: request.status === "action_required" ? "Needs Attention" : "Under Review",
    },
    {
      detail:
        request.status === "cancelled"
          ? "This request was cancelled."
          : request.status === "confirmed"
            ? "Your reservation is confirmed."
            : "We'll be in touch soon.",
      isComplete: statusRank >= 3,
      label: request.status === "cancelled" ? "Cancelled" : "Confirmation Pending",
    },
    {
      detail:
        request.status === "confirmed"
          ? "You're all set."
          : "You'll get a notification when it's confirmed.",
      isComplete: request.status === "confirmed",
      label: "Confirmed",
    },
  ];
}

function buildReservationTimeline(
  reservation: ClientReservation,
  timing: "past" | "upcoming",
): TimelineStep[] {
  const normalizedStatus = reservation.status.trim().toLowerCase();
  const isCancelled = normalizedStatus.includes("cancel");
  const isCheckedOut = ["checked out", "checked-out", "complete", "completed"].includes(
    normalizedStatus,
  );
  const isCheckedIn = normalizedStatus === "checked in" || isCheckedOut;
  const isConfirmed =
    Boolean(reservation.confirmedAt) ||
    normalizedStatus === "confirmed" ||
    normalizedStatus === "checked in" ||
    isCheckedOut;

  return [
    {
      detail: isConfirmed ? formatTimelineDateTime(reservation.confirmedAt) : "Confirmation pending",
      isComplete: isConfirmed,
      label: isCancelled
        ? "Request Cancelled"
        : isConfirmed
          ? "Reservation Confirmed"
          : "Reservation Confirmation",
    },
    {
      detail: isCheckedIn
        ? formatTimelineDateTime(reservation.checkInAt ?? reservation.startDateTimeLabel ?? reservation.startDate)
        : formatTimelineDateTime(
            reservation.startDateTimeLabel ?? reservation.startDate,
            "Arrival date pending",
          ),
      isComplete: isCheckedIn,
      label: isCheckedIn ? "Checked In" : "Expected Arrival",
    },
    {
      detail: isCheckedOut
        ? formatTimelineDateTime(reservation.checkOutAt ?? reservation.endDateTimeLabel ?? reservation.endDate)
        : formatTimelineDateTime(
            reservation.endDateTimeLabel ?? reservation.endDate,
            "Departure date pending",
          ),
      isComplete: isCheckedOut,
      label: isCheckedOut ? "Checked Out" : "Expected Departure",
    },
  ];
}

function requestStatusRank(status: ReservationRequest["status"]) {
  if (status === "submitted") {
    return 1;
  }

  if (status === "under_review" || status === "action_required") {
    return 2;
  }

  if (status === "confirmed" || status === "cancelled") {
    return 4;
  }

  return 0;
}

function formatRequestHeroLabel(status: ReservationRequest["status"]) {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Request";
}

function formatStatus(status: ReservationRequest["status"]) {
  return status.replace(/_/g, " ");
}

function badgeToneForRequest(status: ReservationRequest["status"]) {
  if (status === "action_required") {
    return "attention";
  }

  if (status === "confirmed") {
    return "success";
  }

  if (status === "cancelled") {
    return "calm";
  }

  return "accent";
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

function formatReservationType(reservationType: string) {
  const normalizedType = reservationType.trim().toLowerCase();

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

  return reservationType;
}

function formatReservationDetail(reservation: ClientReservation) {
  const reservationType = reservation.reservationType
    ? formatReservationType(reservation.reservationType)
    : null;
  const typeParts = splitReservationTypeParts(reservation.reservationType).filter((part) => {
    const formattedPart = formatReservationType(part);

    return (
      formattedPart !== reservationType &&
      !isGenericResortName(part) &&
      !isLocationDuplicate(part, reservation.location)
    );
  });
  return typeParts.length > 0 ? typeParts.join(" | ") : "Reservation details pending";
}

function splitReservationTypeParts(value: string | null) {
  return (value ?? "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
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

function isLocationDuplicate(value: string, location: string | null) {
  const formattedLocation = formatSpecificLocation(location);

  return Boolean(
    formattedLocation && value.trim().toLowerCase() === formattedLocation.toLowerCase(),
  );
}

function isCancellableRequest(status: ReservationRequest["status"]) {
  return ["submitted", "under_review", "action_required"].includes(status);
}

function isCancelledRequestStatus(status: ReservationRequest["status"]) {
  return status === "cancelled";
}

function isCancelledReservation(status: string) {
  return ["cancelled", "canceled", "cancelled reservation", "canceled reservation"].includes(
    normalizeStatus(status),
  );
}

function badgeToneForGingrReservation(status: string) {
  const normalizedStatus = normalizeStatus(status);

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

function formatGingrReservationStatus(status: string) {
  const normalizedStatus = normalizeStatus(status);

  if (["complete", "completed", "checked out", "checked-out"].includes(normalizedStatus)) {
    return "Checked Out";
  }

  return status;
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function statusHeroLabelStyle(status: string) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "confirmed") {
    return styles.cardHeroLabelConfirmed;
  }

  if (normalizedStatus === "unconfirmed") {
    return styles.cardHeroLabelUnconfirmed;
  }

  if (normalizedStatus === "checked out" || normalizedStatus === "checked-out") {
    return styles.cardHeroLabelCheckedOut;
  }

  return null;
}

function getReservationPetPreviews(
  petNames: string[],
  petByNormalizedName: Map<string, Pet>,
): ReservationPetPreview[] {
  return petNames.map((name) => {
    const pet = petByNormalizedName.get(normalizePetName(name));

    return {
      imageUrl: pet?.imageUrl,
      name,
    };
  });
}

function normalizePetName(value: string) {
  return value.trim().toLowerCase();
}

function formatPetNameList(petNames: string[]) {
  const names = petNames.map((petName) => petName.trim()).filter(Boolean);

  if (names.length <= 2) {
    return names.join(" & ");
  }

  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) {
    return "Times pending";
  }

  return `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}`;
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayTime(value: string | null) {
  if (!value) {
    return "Time pending";
  }

  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimestampDate(value: string | null) {
  if (!value) {
    return "Date pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimelineDateTime(value: string | null, fallback = "Date pending") {
  if (!value) {
    return fallback;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDisplayDate(value);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  reservationCard: {
    gap: 0,
    overflow: "hidden",
    padding: 0,
  },
  badgeStack: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  cardHeroImage: {
    height: 178,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardHeroLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.goldenrod,
    borderRadius: radius.pill,
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cardHeroLabelCheckedOut: {
    backgroundColor: colors.statusBlue,
  },
  cardHeroLabelConfirmed: {
    backgroundColor: colors.statusGreen,
  },
  cardHeroLabelText: {
    textTransform: "uppercase",
  },
  cardHeroLocation: {
    alignSelf: "center",
    fontSize: 40,
    fontFamily: fonts.display,
    lineHeight: 46,
    marginBottom: spacing.xl,
    marginHorizontal: spacing.lg,
    textAlign: "center",
    textShadowColor: colors.overlayDark,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 8,
  },
  cardHeroLabelUnconfirmed: {
    backgroundColor: colors.statusRed,
  },
  cardHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  cardTitleGroup: {
    flex: 1,
    gap: spacing.xxs,
  },
  content: {
    paddingTop: spacing.xs,
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.md,
  },
  emptyCopy: {
    alignItems: "center",
    gap: spacing.xs,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    borderRadius: radius.pill,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  noticeCard: {
    gap: spacing.md,
  },
  panelDivider: {
    backgroundColor: colors.creamBorder,
    height: 1,
  },
  petAvatar: {
    borderRadius: radius.pill,
    height: 30,
    width: 30,
  },
  petAvatarFallback: {
    alignItems: "center",
    backgroundColor: colors.champagne,
    justifyContent: "center",
  },
  petAvatarOverlap: {
    marginLeft: -10,
  },
  petAvatarStack: {
    flexDirection: "row",
    minWidth: 30,
  },
  petAvatarWrap: {
    backgroundColor: colors.ivory,
    borderColor: colors.ivory,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  petSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  petSummaryText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 21,
  },
  reservationHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  reservationPanel: {
    backgroundColor: colors.porcelain,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: spacing.lg,
    marginTop: -28,
    padding: spacing.xl,
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: spacing.md,
  },
  segmentActive: {
    backgroundColor: colors.blackCherry,
  },
  segmented: {
    backgroundColor: colors.parchment,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segmentPressed: {
    opacity: 0.78,
  },
  timeline: {
    gap: 0,
  },
  timelineCopy: {
    flex: 1,
    gap: spacing.xxs,
    paddingBottom: spacing.lg,
  },
  timelineLine: {
    backgroundColor: colors.warmGray,
    flex: 1,
    opacity: 0.55,
    width: 2,
  },
  timelineMarker: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  timelineMarkerColumn: {
    alignItems: "center",
    alignSelf: "stretch",
    width: 34,
  },
  timelineMarkerComplete: {
    backgroundColor: colors.blackCherry,
  },
  timelineMarkerOpen: {
    backgroundColor: colors.porcelain,
    borderColor: colors.warmGray,
    borderWidth: 2,
  },
  timelineRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 74,
  },
});
