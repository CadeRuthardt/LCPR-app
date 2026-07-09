import { requireSupabase } from "@/lib/supabase";

export type GingrDiscoveryAction =
  | "locations"
  | "reservation-types"
  | "services-by-type"
  | "current-owner"
  | "current-client-snapshot";

export type GingrDiscoveryRequest = {
  action: GingrDiscoveryAction;
  locationId?: string | number;
  reservationTypeId?: string | number;
};

export type GingrDiscoveryResponse<T = unknown> = {
  action: GingrDiscoveryAction;
  data: T;
};

export async function runGingrDiscovery<T = unknown>(request: GingrDiscoveryRequest) {
  const { data, error } = await requireSupabase().functions.invoke<
    GingrDiscoveryResponse<T>
  >("gingr-discovery", {
    body: request,
  });

  if (error) {
    throw error;
  }

  return data;
}
