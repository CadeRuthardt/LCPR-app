import {
  clearClientDashboardCache,
  getCurrentClientDashboardData,
  getCurrentClientOwnerProfileForApp,
} from "@/services/client-data";
import {
  clearGingrDiscoveryCache,
  getGingrLocationCities,
  getGingrReservationDetail,
  getGingrReservationRequestCatalog,
} from "@/services/gingr";
import {
  clearReservationDisplayTotalsCache,
  preloadReservationDisplayData,
} from "@/services/reservation-display-data";

let activeSessionKey: string | null = null;
let preloadRequest: Promise<void> | null = null;

export function clearAppSessionData() {
  activeSessionKey = null;
  preloadRequest = null;
  clearClientDashboardCache();
  clearGingrDiscoveryCache();
  clearReservationDisplayTotalsCache();
}

export function preloadAppSessionData(sessionKey: string) {
  if (activeSessionKey === sessionKey && preloadRequest) {
    return preloadRequest;
  }

  if (activeSessionKey !== sessionKey) {
    clearAppSessionData();
    activeSessionKey = sessionKey;
  }

  preloadRequest = preloadAllAppData();
  return preloadRequest;
}

async function preloadAllAppData() {
  const dashboardPromise = getCurrentClientDashboardData({ force: true });

  await Promise.allSettled([
    getCurrentClientOwnerProfileForApp(),
    getGingrLocationCities(),
    getGingrReservationRequestCatalog(),
  ]);

  const dashboard = await dashboardPromise;
  const reservationIds = Array.from(new Set(
    [...dashboard.upcomingReservations, ...dashboard.pastReservations]
      .flatMap((reservation) => reservation.id.split(","))
      .map((id) => id.trim())
      .filter(Boolean),
  ));

  if (reservationIds.length > 0) {
    await getGingrReservationDetail(reservationIds).catch(() => null);
  }

  await preloadReservationDisplayData(dashboard).catch(() => null);
}
