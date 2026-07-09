import { router } from "expo-router";

type AppFallbackRoute = "/" | "/pets" | "/reservations";

const fallbackRoutes = new Set<AppFallbackRoute>(["/", "/pets", "/reservations"]);

export function goBackOrReplace(fallbackRoute: AppFallbackRoute) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackRoute);
}

export function resolveFallbackRoute(
  value: string | undefined,
  fallbackRoute: AppFallbackRoute,
): AppFallbackRoute {
  return value && fallbackRoutes.has(value as AppFallbackRoute)
    ? (value as AppFallbackRoute)
    : fallbackRoute;
}
