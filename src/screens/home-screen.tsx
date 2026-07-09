import { router, useFocusEffect } from "expo-router";
import * as React from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Image, ImageBackground, Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon, Screen, Text } from "@/components/primitives";
import { guest, resortImages } from "@/data/mock-data";
import {
  getCurrentClientPetsForApp,
  getCurrentClientReservationsForApp,
  getReservationRequests,
} from "@/services/client-data";
import { colors, fonts, radius, spacing } from "@/theme";
import type { ClientReservation, Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";
import { getTimeOfDayGreeting } from "@/utils/greeting";

const logo = require("../../assets/logo.png");
const heroImageUrl =
  "https://i0.wp.com/lechateaupetresort.com/wp-content/uploads/2025/09/dogs-in-yard.jpg?resize=1024%2C768&ssl=1";
const releaseToRefreshThreshold = -132;
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
      title: string;
    }
  | {
      action: "review";
      body: string;
      icon: "star";
      label: string;
      location: string | null;
      title: string;
    };

export function HomeScreen() {
  const greeting = getTimeOfDayGreeting();
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = React.useState<HomeDashboardState>({
    pastReservations: [],
    pets: [],
    requests: [],
    upcomingReservations: [],
  });
  const [showRefreshPrompt, setShowRefreshPrompt] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadHomeData = React.useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
      setShowRefreshPrompt(true);
    }

    setErrorMessage(null);

    try {
      const [requests, reservations, pets] = await Promise.all([
        getReservationRequests(),
        getCurrentClientReservationsForApp(),
        getCurrentClientPetsForApp(),
      ]);

      setDashboard({
        pastReservations: reservations.past,
        pets,
        requests,
        upcomingReservations: reservations.upcoming,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to refresh reservation status.",
      );
    } finally {
      setIsRefreshing(false);
      setShowRefreshPrompt(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const homePanel = React.useMemo(() => selectHomePanel(dashboard), [dashboard]);

  function handleRefresh() {
    void loadHomeData(true);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = event.nativeEvent.contentOffset.y;

    setShowRefreshPrompt(offsetY <= releaseToRefreshThreshold || isRefreshing);
  }

  return (
    <Screen
      backgroundColor={colors.onyx}
      contentStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      onScroll={handleScroll}
      onRefresh={handleRefresh}
      refreshing={isRefreshing}
      topSafeArea={false}
    >
      <View style={styles.refreshPromptSlot}>
        {showRefreshPrompt ? (
          <View style={styles.refreshPrompt}>
            <Icon color={colors.goldenrod} name="refresh" size={16} />
          </View>
        ) : null}
      </View>

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
                {guest.firstName}.
              </Text>
              <Icon color={colors.goldenrod} name="paw" size={28} />
            </View>
            <Text variant="title" tone="inverse">
              Ready for their next getaway?
            </Text>
          </View>

          <View style={styles.requestPanel}>
            <View style={styles.requestIcon}>
              <Icon color={colors.goldenrod} name={homePanel.icon} size={22} />
            </View>
            <View style={styles.requestPanelCopy}>
              <Text variant="title" tone="inverse">
                {homePanel.title}
              </Text>
              <Text variant="caption" tone="inverse">
                {homePanel.body}
              </Text>
              <Button
                icon="chevron-right"
                onPress={() => handleHomePanelAction(homePanel)}
                title={homePanel.label}
                variant="secondary"
              />
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

      <View style={styles.liveCard}>
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
        >
        </ImageBackground>
      </View>

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
      title: "Request needs attention",
    };
  }

  if (upcomingReservation) {
    return {
      action: "request",
      body: formatReservationPanelBody(upcomingReservation),
      icon: "check",
      label: "View Reservation",
      title: "Reservation confirmed",
    };
  }

  if (activeRequest) {
    return {
      action: "request",
      body: formatRequestPanelBody(activeRequest, dashboard.pets),
      icon: "calendar",
      label: activeRequest.status === "confirmed" ? "View Confirmation" : "View Request",
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

function handleHomePanelAction(panel: HomePanel) {
  if (panel.action === "review") {
    void Linking.openURL(buildGoogleReviewUrl(panel.location));
    return;
  }

  if (panel.title === "No reservations booked yet") {
    router.push("/request-reservation");
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
    reservation.petNames.join(", ") || "Your pet",
    reservation.dateRange,
    reservation.reservationType,
  ]
    .filter(Boolean)
    .join(" | ");
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

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function isCheckedOutReservation(reservation: ClientReservation) {
  const normalizedStatus = reservation.status.trim().toLowerCase();

  return ["checked out", "checked-out", "complete", "completed"].includes(normalizedStatus);
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
  refreshPrompt: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 24,
  },
  refreshPromptSlot: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
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
