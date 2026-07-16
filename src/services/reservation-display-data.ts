import type { ClientDashboardData } from "@/services/client-data";
import {
  getCurrentGingrInvoices,
  getGingrInvoiceReservationIds,
  getGingrReservationDetail,
  type GingrInvoiceSummary,
} from "@/services/gingr";
import type { ClientReservation } from "@/types/app";

export type ReservationDisplayTotals = {
  past: Record<string, string>;
  upcoming: Record<string, string>;
};

let totalsCache: ReservationDisplayTotals | null = null;
let totalsRequest: Promise<ReservationDisplayTotals> | null = null;
let totalsGeneration = 0;

export function getCachedReservationDisplayTotals() {
  return totalsCache;
}

export function clearReservationDisplayTotalsCache() {
  totalsGeneration += 1;
  totalsCache = null;
  totalsRequest = null;
}

export async function preloadReservationDisplayData(
  dashboard: ClientDashboardData,
  options: { force?: boolean } = {},
) {
  if (options.force) {
    clearReservationDisplayTotalsCache();
  }

  if (totalsCache) {
    return totalsCache;
  }

  if (totalsRequest) {
    return totalsRequest;
  }

  const requestGeneration = totalsGeneration;
  totalsRequest = Promise.all([
    getUpcomingReservationTotals(dashboard.upcomingReservations),
    getPastReservationTotals(dashboard.pastReservations, Boolean(options.force)),
  ])
    .then(([upcoming, past]) => {
      const totals = { past, upcoming };
      if (requestGeneration === totalsGeneration) {
        totalsCache = totals;
      }
      return totals;
    })
    .finally(() => {
      if (requestGeneration === totalsGeneration) {
        totalsRequest = null;
      }
    });

  return totalsRequest;
}

function isCancelledReservation(reservation: ClientReservation) {
  return reservation.status.trim().toLowerCase().includes("cancel");
}

function sumMoney(values: Array<string | null>) {
  const amounts = values
    .map((value) => Number(value?.replace(/[^0-9.-]/g, "") ?? Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (amounts.length === 0) {
    return null;
  }

  return amounts
    .reduce((sum, value) => sum + value, 0)
    .toLocaleString("en-US", { currency: "USD", style: "currency" });
}

function splitReservationIds(value: string) {
  return value.split(",").map((id) => id.trim()).filter(Boolean);
}

async function getUpcomingReservationTotals(reservations: ClientReservation[]) {
  const reservationIds = [...new Set(reservations.flatMap((reservation) => splitReservationIds(reservation.id)))];
  if (reservationIds.length === 0) return {};

  const detail = await getGingrReservationDetail(reservationIds).catch(() => null);
  const totalsById: Record<string, string | null> = {};
  for (const id of reservationIds) {
    totalsById[id] = detail?.estimatesByReservation?.[id]?.totalDue ?? null;
  }

  const missingIds = reservationIds.filter((id) => !totalsById[id]);
  const fallbackEntries = await Promise.all(missingIds.map(async (id) => {
    const fallback = await getGingrReservationDetail([id]).catch(() => null);
    return [id, fallback?.estimatesByReservation?.[id]?.totalDue ?? fallback?.estimate?.totalDue ?? null] as const;
  }));
  for (const [id, total] of fallbackEntries) totalsById[id] = total;

  const totals: Record<string, string> = {};
  for (const reservation of reservations) {
    const total = sumMoney(splitReservationIds(reservation.id).map((id) => totalsById[id] ?? null));
    if (total) totals[reservation.id] = total;
  }
  return totals;
}

async function getPastReservationTotals(reservations: ClientReservation[], force = false) {
  const completedReservations = reservations.filter((reservation) => !isCancelledReservation(reservation));
  const invoicesResponse = await getCurrentGingrInvoices({ force }).catch(() => null);
  const invoices = deduplicateInvoices(invoicesResponse?.lookups?.flatMap((lookup) => lookup.matchingOwnerInvoices) ?? []);
  const totals: Record<string, string> = {};
  for (const reservation of completedReservations) {
    const reservationIds = new Set(splitReservationIds(reservation.id));
    const matching = invoices.filter((invoice) => getGingrInvoiceReservationIds(invoice).some((id) => reservationIds.has(id)));
    const total = sumMoney(matching.map((invoice) => invoice.total));
    if (total) totals[reservation.id] = total;
  }
  return totals;
}

function deduplicateInvoices(invoices: GingrInvoiceSummary[]) {
  const unique = new Map<string, GingrInvoiceSummary>();
  for (const invoice of invoices) {
    const key = invoice.id ?? [invoice.reservationId, invoice.date, invoice.total].join("|");
    if (!unique.has(key)) unique.set(key, invoice);
  }
  return Array.from(unique.values());
}
