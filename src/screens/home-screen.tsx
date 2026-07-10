import { router, useFocusEffect } from "expo-router";
import * as React from "react";
import { Image, ImageBackground, Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Text } from "@/components/primitives";
import { resortImages } from "@/data/mock-data";
import {
  getCachedClientDashboardData,
  getCurrentClientDashboardData,
} from "@/services/client-data";
import { colors, fonts, radius, spacing } from "@/theme";
import type { ClientReservation, Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";
import { getTimeOfDayGreeting } from "@/utils/greeting";
import { useSession } from "@/utils/session";

const logo = require("../../assets/logo.png");
const heroImageUrl =
  "https://i0.wp.com/lechateaupetresort.com/wp-content/uploads/2025/09/dogs-in-yard.jpg?resize=1024%2C768&ssl=1";
const googleReviewLinks = {
  amarillo: "https://g.page/r/CSbeJJMv3RoJEBM/review",
  newBraunfels: "https://g.page/r/CZ2wF44jyrgREBM/review",
  wichitaFalls: "https://g.page/r/CX9n3JTQLtLWEBM/review",
};

type HomeDashboardState = {
  pastReservations: ClientReservation[];
  pets: Pet[];
  requests: ReservationRequest[];
  upcomingReservations: ClientReservation[];
};

type HomePanel =
  | {
      action: "request";
      body: string;
      icon: "calendar" | "check";
      label: string;
      petPreviews?: HomePanelPetPreview[];
      reservationIds?: string;
      title: string;
    }
  | {
      action: "review";
      body: string;
      icon: "star";
      label: string;
      location: string | null;
      petPreviews?: HomePanelPetPreview[];
      title: string;
    };

type HomePanelPetPreview = {
  imageUrl?: string | null;
  name: string;
};

export function HomeScreen() {
  const greeting = getTimeOfDayGreeting();
  const insets = useSafeAreaInsets();
  const { client, user } = useSession();
  const cachedDashboardData = getCachedClientDashboardData();
  const [dashboard, setDashboard] = React.useState<HomeDashboardState>({
    pastReservations: cachedDashboardData?.pastReservations ?? [],
    pets: cachedDashboardData?.pets ?? [],
    requests: cachedDashboardData?.requests ?? [],
    upcomingReservations: cachedDashboardData?.upcomingReservations ?? [],
  });
  const [isLoading, setIsLoading] = React.useState(!cachedDashboardData);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadHomeData = React.useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    }

    setErrorMessage(null);

    try {
      setDashboard(await getCurrentClientDashboardData({ force: refreshing }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to refresh reservation status.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const homePanel = React.useMemo(() => selectHomePanel(dashboard), [dashboard]);
  const firstName = React.useMemo(
    () => getFirstName(client?.display_name, client?.email ?? user?.email),
    [client?.display_name, client?.email, user?.email],
  );
  const heroStatusLine = React.useMemo(
    () => (isLoading ? "Preparing their resort details..." : formatHomeHeroStatusLine(dashboard)),
    [dashboard, isLoading],
  );

  function handleRefresh() {
    void loadHomeData(true);
  }

  return (
    <Screen
      backgroundColor={colors.onyx}
      clampBottomBounce
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      onRefresh={handleRefresh}
      refreshing={isRefreshing}
      topSafeArea={false}
    >
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logoImage} />
      </View>

      <ImageBackground
        source={{ uri: heroImageUrl }}
        imageStyle={styles.heroImage}
        resizeMode="cover"
        style={styles.hero}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.heroCopy}>
            <Text variant="body" tone="inverse">
              {greeting},
            </Text>
            <View style={styles.nameRow}>
              <Text variant="hero" tone="inverse">
                {firstName}.
              </Text>
              <Icon color={colors.goldenrod} name="paw" size={28} />
            </View>
            <Text variant="title" tone="inverse">
              {heroStatusLine}
            </Text>
          </View>

          <View style={styles.requestPanel}>
            <HomePanelVisual
              icon={isLoading ? "paw" : homePanel.icon}
              pets={isLoading ? [] : homePanel.petPreviews}
            />
            <View style={styles.requestPanelCopy}>
              <Text variant="title" tone="inverse">
                {isLoading ? "Refreshing reservation details" : homePanel.title}
              </Text>
              <Text variant="caption" tone="inverse">
                {isLoading
                  ? "We are checking your pets, requests, and Gingr reservations."
                  : homePanel.body}
              </Text>
              {!isLoading ? (
                <Button
                  icon="chevron-right"
                  onPress={() => handleHomePanelAction(homePanel)}
                  title={homePanel.label}
                  variant="secondary"
                />
              ) : null}
            </View>
          </View>
        </View>
      </ImageBackground>

      {errorMessage ? (
        <View style={styles.statusNotice}>
          <Text variant="caption" tone="inverse">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: "/live-cameras", params: { reset: Date.now() } })}
        style={({ pressed }) => [styles.liveCard, pressed && styles.pressedCard]}
      >
        <View style={styles.liveCopy}>
          <Text variant="title" tone="inverse">
            Live Cameras
          </Text>
          <Text variant="caption" tone="inverse">
            See what's happening around the resort.
          </Text>
          <Text variant="caption" tone="accent" style={styles.watchNow}>
            Watch Now
          </Text>
        </View>
        <ImageBackground
          source={{ uri: resortImages.playYard }}
          imageStyle={styles.liveImage}
          resizeMode="cover"
          style={styles.livePreview}
        />
      </Pressable>

      <ImageBackground
        source={{ uri: resortImages.suite }}
        imageStyle={styles.promoImage}
        resizeMode="cover"
        style={styles.promoCard}
      >
        <View style={styles.promoOverlay}>
          <Text variant="title" tone="inverse">
            Summer Spa Special
          </Text>
          <Text variant="caption" tone="inverse">
            15% off spa services this July.
          </Text>
          <Text variant="caption" tone="accent" style={styles.watchNow}>
            Explore Spa
          </Text>
        </View>
      </ImageBackground>

    </Screen>
  );
}

function selectHomePanel(dashboard: HomeDashboardState): HomePanel {
  const actionRequiredRequest = dashboard.requests.find(
    (request) => request.status === "action_required",
  );
  const upcomingReservation = dashboard.upcomingReservations[0];
  const activeRequest = dashboard.requests.find((request) =>
    ["submitted", "under_review", "action_required", "confirmed"].includes(request.status),
  );

  if (actionRequiredRequest) {
    return {
      action: "request",
      body: formatRequestPanelBody(actionRequiredRequest, dashboard.pets),
      icon: "calendar",
      label: "View Request",
      petPreviews: getRequestPetPreviews(actionRequiredRequest, dashboard.pets),
      title: "Request needs attention",
    };
  }

  if (upcomingReservation) {
    return {
      action: "request",
      body: formatReservationPanelBody(upcomingReservation),
      icon: "check",
      label: "View Reservation",
      petPreviews: getReservationPetPreviews(upcomingReservation, dashboard.pets),
      reservationIds: upcomingReservation.id,
      title: formatReservationPanelTitle(upcomingReservation),
    };
  }

  if (activeRequest) {
    return {
      action: "request",
      body: formatRequestPanelBody(activeRequest, dashboard.pets),
      icon: "calendar",
      label: activeRequest.status === "confirmed" ? "View Confirmation" : "View Request",
      petPreviews: getRequestPetPreviews(activeRequest, dashboard.pets),
      title: activeRequest.status === "confirmed" ? "Reservation confirmed" : "Request received",
    };
  }

  const checkedOutReservation = dashboard.pastReservations.find(
    (reservation) => isCheckedOutReservation(reservation) && isWithinLastMonth(reservation),
  );

  if (checkedOutReservation) {
    return {
      action: "review",
      body: "We hope every detail felt cared for. Share your experience with our team.",
      icon: "star",
      label: "Leave a Google Review",
      location: checkedOutReservation.location,
      petPreviews: getReservationPetPreviews(checkedOutReservation, dashboard.pets),
      title: "How did we do?",
    };
  }

  return {
    action: "request",
    body: "Request a luxury boarding, daycare, or spa reservation when your pet is ready.",
    icon: "calendar",
    label: "Request a Reservation",
    title: "No reservations booked yet",
  };
}

function HomePanelVisual({
  icon,
  pets = [],
}: {
  icon: "calendar" | "check" | "paw" | "star";
  pets?: HomePanelPetPreview[];
}) {
  const visiblePets = pets.filter((pet) => pet.imageUrl).slice(0, 2);

  if (visiblePets.length === 0) {
    return (
      <View style={styles.requestIcon}>
        <Icon color={colors.goldenrod} name={icon} size={22} />
      </View>
    );
  }

  return (
    <View style={styles.requestPetStack}>
      {visiblePets.map((pet, index) => (
        <Image
          key={`${pet.name}-${index}`}
          source={{ uri: pet.imageUrl ?? undefined }}
          style={[styles.requestPetImage, index > 0 && styles.requestPetImageOverlap]}
        />
      ))}
    </View>
  );
}

function getRequestPetPreviews(request: ReservationRequest, pets: Pet[]) {
  return request.selected_pet_ids
    .map((petId) => pets.find((pet) => pet.id === petId))
    .filter((pet): pet is Pet => Boolean(pet))
    .map((pet) => ({ imageUrl: pet.imageUrl, name: pet.name }));
}

function getReservationPetPreviews(reservation: ClientReservation, pets: Pet[]) {
  const petByName = new Map(pets.map((pet) => [normalizePetName(pet.name), pet]));

  return reservation.petNames.map((petName) => {
    const pet = petByName.get(normalizePetName(petName));

    return {
      imageUrl: pet?.imageUrl,
      name: petName,
    };
  });
}

function handleHomePanelAction(panel: HomePanel) {
  if (panel.action === "review") {
    void Linking.openURL(buildGoogleReviewUrl(panel.location));
    return;
  }

  if (panel.title === "No reservations booked yet") {
    router.push({ pathname: "/request-reservation", params: { returnTo: "/" } });
    return;
  }

  if (panel.reservationIds) {
    router.push({
      pathname: "/reservation-detail",
      params: { reservationIds: panel.reservationIds },
    });
    return;
  }

  router.push("/reservations");
}

function formatRequestPanelBody(request: ReservationRequest, pets: Pet[]) {
  const petNames = request.selected_pet_ids
    .map((petId) => pets.find((pet) => pet.id === petId)?.name)
    .filter(Boolean);
  const status = formatRequestStatus(request.status);

  return [
    status,
    petNames.length > 0 ? petNames.join(", ") : "Your pet",
    formatDateRange(request.start_date, request.end_date),
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatReservationPanelBody(reservation: ClientReservation) {
  return [
    formatPetNameList(reservation.petNames) || "Your pet",
    reservation.dateRange,
    reservation.reservationType,
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatReservationPanelTitle(reservation: ClientReservation) {
  if (isCheckedInReservation(reservation)) {
    const petSubject = formatPetSubject(reservation.petNames);

    return `${petSubject.names} ${petSubject.verb} checked in`;
  }

  return "Reservation confirmed";
}

function formatHomeHeroStatusLine(dashboard: HomeDashboardState) {
  const currentReservation = dashboard.upcomingReservations.find(isCheckedInReservation);

  if (currentReservation) {
    const petSubject = formatPetSubject(currentReservation.petNames);

    return `${petSubject.names} ${petSubject.verb} having a great time!`;
  }

  const upcomingReservation = dashboard.upcomingReservations[0];

  if (upcomingReservation) {
    const petSubject = formatPetSubject(upcomingReservation.petNames);

    return `We can't wait to see ${petSubject.names}!`;
  }

  return "Ready for their next getaway?";
}

function formatRequestStatus(status: ReservationRequest["status"]) {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "action_required") {
    return "Needs attention";
  }

  return "Requested";
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }

  return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
}

function formatDisplayDate(value: string) {
  return parseIsoDate(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getFirstName(displayName?: string | null, email?: string | null) {
  const normalizedName = displayName?.trim();

  if (normalizedName) {
    return normalizedName.split(/\s+/)[0];
  }

  const emailPrefix = email?.split("@")[0]?.trim();

  if (emailPrefix) {
    const [firstPart] = emailPrefix.split(/[._-]/).filter(Boolean);
    return firstPart ? capitalizeName(firstPart) : "friend";
  }

  return "friend";
}

function capitalizeName(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isCheckedOutReservation(reservation: ClientReservation) {
  const normalizedStatus = reservation.status.trim().toLowerCase();

  return ["checked out", "checked-out", "complete", "completed"].includes(normalizedStatus);
}

function isCheckedInReservation(reservation: ClientReservation) {
  return reservation.status.trim().toLowerCase() === "checked in";
}

function formatPetSubject(petNames: string[]) {
  const names = formatPetNameList(petNames) || "Your pet";

  return {
    names,
    verb: petNames.filter(Boolean).length === 1 || names === "Your pet" ? "is" : "are",
  };
}

function formatPetNameList(petNames: string[]) {
  const names = petNames.map((petName) => petName.trim()).filter(Boolean);

  if (names.length <= 2) {
    return names.join(" & ");
  }

  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function normalizePetName(value: string) {
  return value.trim().toLowerCase();
}

function isWithinLastMonth(reservation: ClientReservation) {
  const reservationDate = reservation.endDate ?? reservation.startDate;

  if (!reservationDate) {
    return false;
  }

  const checkoutDate = parseIsoDate(reservationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewCutoff = new Date(today);
  reviewCutoff.setMonth(today.getMonth() - 1);

  return checkoutDate >= reviewCutoff && checkoutDate <= today;
}

function buildGoogleReviewUrl(location: string | null) {
  const normalizedLocation = location?.toLowerCase() ?? "";

  if (normalizedLocation.includes("wichita")) {
    return googleReviewLinks.wichitaFalls;
  }

  if (normalizedLocation.includes("new braunfels")) {
    return googleReviewLinks.newBraunfels;
  }

  return googleReviewLinks.amarillo;
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.onyx,
    gap: spacing.md,
    paddingBottom: 88,
    paddingHorizontal: spacing.md,
  },
  logoImage: {
    height: 106,
    resizeMode: "contain",
    width: 190,
  },
  logoWrap: {
    alignItems: "center",
    paddingBottom: 0,
  },
  hero: {
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    minHeight: 440,
    overflow: "hidden",
  },
  heroImage: {
    borderRadius: radius.xl,
  },
  heroOverlay: {
    backgroundColor: colors.overlayHero,
    flex: 1,
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  heroCopy: {
    gap: spacing.xxs,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  requestPanel: {
    alignItems: "flex-start",
    backgroundColor: colors.overlayBurgundy,
    borderColor: colors.goldenrod,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.md,
  },
  requestIcon: {
    alignItems: "center",
    backgroundColor: colors.burgundyDeep,
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  requestPetImage: {
    borderColor: colors.goldenrod,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 50,
    width: 50,
  },
  requestPetImageOverlap: {
    marginLeft: -18,
  },
  requestPetStack: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 50,
  },
  requestPanelCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  statusNotice: {
    backgroundColor: colors.overlayBurgundy,
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  liveCard: {
    backgroundColor: colors.richMahogany,
    borderColor: colors.overlayIvoryStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 118,
    overflow: "hidden",
  },
  liveCopy: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    padding: spacing.md,
  },
  livePreview: {
    flex: 1.15,
  },
  pressedCard: {
    opacity: 0.86,
  },
  liveImage: {
    borderBottomRightRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  watchNow: {
    fontFamily: fonts.bodyBold,
  },
  promoCard: {
    borderRadius: radius.lg,
    minHeight: 118,
    overflow: "hidden",
  },
  promoImage: {
    borderRadius: radius.lg,
  },
  promoOverlay: {
    backgroundColor: colors.overlayBurgundy,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    padding: spacing.md,
  },
});
