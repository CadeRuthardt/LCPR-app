import { router, useFocusEffect } from "expo-router";
import * as React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { Badge, Button, Card, Icon, Screen, Section, Text } from "@/components/primitives";
import {
  cancelReservationRequest,
  getCurrentClientPetsForApp,
  getCurrentClientReservationsForApp,
  getReservationRequests,
} from "@/services/client-data";
import { colors, radius, spacing } from "@/theme";
import type { ClientReservation, Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";

import { ScreenHeader } from "./screen-header";

type ReservationsState = {
  pastReservations: ClientReservation[];
  pets: Pet[];
  requests: ReservationRequest[];
  upcomingReservations: ClientReservation[];
};

const reservationTabs = ["Requested", "Upcoming", "Past"] as const;

type ReservationTab = (typeof reservationTabs)[number];

type ReservationPetPreview = {
  imageUrl?: string | null;
  name: string;
};

export function ReservationsScreen() {
  const [data, setData] = React.useState<ReservationsState>({
    pastReservations: [],
    pets: [],
    requests: [],
    upcomingReservations: [],
  });
  const [activeTab, setActiveTab] = React.useState<ReservationTab>("Requested");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const [cancellingRequestId, setCancellingRequestId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadReservations = React.useCallback(async (refreshing = false, showInitialLoader = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else if (showInitialLoader) {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const [requests, reservations, pets] = await Promise.all([
        getReservationRequests(),
        getCurrentClientReservationsForApp(),
        getCurrentClientPetsForApp(),
      ]);

      setData({
        pastReservations: reservations.past,
        pets,
        requests,
        upcomingReservations: reservations.upcoming,
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
        requests: current.requests.map((request) =>
          request.id === requestId ? cancelledRequest : request,
        ),
      }));
      setActiveTab("Past");
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
    ["confirmed", "cancelled"].includes(request.status),
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

      {activeTab === "Requested" ? (
        <Section
          title="Submitted Requests"
          subtitle="Requests sent from the app for reception to review."
        >
          {submittedRequests.length > 0 ? (
            submittedRequests.map((request) => (
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
              onAction={() => router.push("/request-reservation")}
            />
          )}
        </Section>
      ) : null}

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
            />
          )}
        </Section>
      ) : null}

      {activeTab === "Past" ? (
        <>
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

          {completedRequests.length > 0 ? (
            <Section title="Reviewed App Requests">
              {completedRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  pets={request.selected_pet_ids.map((petId) => ({
                    imageUrl: data.pets.find((pet) => pet.id === petId)?.imageUrl,
                    name: petNameById.get(petId) ?? "Pet",
                  }))}
                />
              ))}
            </Section>
          ) : null}
        </>
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
    <Card variant="elevated" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text variant="title">{formatDateRange(request.start_date, request.end_date)}</Text>
          <PetSummary pets={pets} location={request.location ?? "Location pending"} />
        </View>
        <View style={styles.badgeStack}>
          {request.reservation_type ? (
            <Badge
              label={formatReservationType(request.reservation_type)}
              tone={badgeToneForReservationType(request.reservation_type)}
            />
          ) : null}
          <Badge label={formatStatus(request.status)} tone={badgeToneForRequest(request.status)} />
        </View>
      </View>

      <View style={styles.detailRow}>
        <Icon color={colors.goldenrod} name="calendar" size={18} />
        <Text variant="caption" tone="secondary" style={styles.detailText}>
          {formatTimeRange(request.start_time, request.end_time)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Icon color={colors.goldenrod} name="sparkles" size={18} />
        <Text variant="caption" tone="secondary" style={styles.detailText}>
          {request.experience}
        </Text>
      </View>

      {canCancel ? (
        <Button
          disabled={isCancelling}
          onPress={onCancel}
          title={isCancelling ? "Cancelling..." : "Cancel Request"}
          variant="secondary"
        />
      ) : null}
    </Card>
  );
}

type GingrReservationCardProps = {
  petPreviews: ReservationPetPreview[];
  reservation: ClientReservation;
  timing: "past" | "upcoming";
};

function GingrReservationCard({ petPreviews, reservation, timing }: GingrReservationCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: "/reservation-detail",
          params: { reservationIds: reservation.id },
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
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
            <Badge
              label={formatGingrReservationStatus(reservation.status)}
              tone={badgeToneForGingrReservation(reservation.status)}
            />
          </View>
        </View>

        <View style={styles.detailRow}>
          <Icon color={colors.goldenrod} name="sparkles" size={18} />
          <Text variant="caption" tone="secondary" style={styles.detailText}>
            {formatReservationDetail(reservation)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

function PetSummary({
  location,
  pets,
}: {
  location?: string;
  pets: ReservationPetPreview[];
}) {
  const petNames = pets.map((pet) => pet.name).filter(Boolean);

  return (
    <View style={styles.petSummary}>
      <PetAvatarStack pets={pets} />
      <Text variant="caption" tone="secondary" style={styles.petSummaryText}>
        {[petNames.join(", ") || "Pet details pending", location].filter(Boolean).join(" | ")}
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
  const location = formatSpecificLocation(reservation.location);
  const detailParts = location ? [...typeParts, location] : typeParts;

  return detailParts.length > 0 ? detailParts.join(" | ") : "Reservation details pending";
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

function badgeToneForGingrReservation(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus.includes("cancel")) {
    return "calm";
  }

  if (normalizedStatus.includes("wait") || normalizedStatus.includes("pending")) {
    return "attention";
  }

  return "success";
}

function formatGingrReservationStatus(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (["complete", "completed", "checked out", "checked-out"].includes(normalizedStatus)) {
    return "Checked Out";
  }

  return status;
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

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  badgeStack: {
    alignItems: "flex-end",
    gap: spacing.xs,
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
});
