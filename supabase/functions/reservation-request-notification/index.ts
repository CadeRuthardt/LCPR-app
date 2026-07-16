type AuthUser = {
  email?: string;
  id: string;
};

type ReservationRequest = {
  amenity_package: string | null;
  authorized_pickup: string | null;
  created_at: string;
  end_date: string;
  end_time: string | null;
  enrichment_enabled: boolean;
  enrichment_frequency: string | null;
  experience: string;
  id: string;
  location: string | null;
  notes: string | null;
  notification_status: string;
  optional_services: string[];
  reservation_type: string | null;
  selected_pet_ids: string[];
  selected_pet_names: string[];
  spa_service: string | null;
  spa_upgrades: string[];
  start_date: string;
  start_time: string | null;
  status: string;
  suite_size: string | null;
  user_id: string;
};

type ClientProfile = {
  display_name: string;
  email: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};
const supportEmail = "support@lechateaupetresort.com";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(request);

    if ("error" in authResult) {
      return jsonResponse({ error: authResult.error }, authResult.status);
    }

  const body = (await request.json().catch(() => ({}))) as { requestId?: string };
  const requestId = body.requestId?.trim();

  if (!requestId) {
    return jsonResponse({ error: "requestId is required." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Reservation notification service is not configured." }, 500);
  }

  const reservationRequest = await getOwnedReservationRequest(
    supabaseUrl,
    serviceRoleKey,
    requestId,
    authResult.user.id,
  );

  if (!reservationRequest) {
    return jsonResponse({ error: "Reservation request not found." }, 404);
  }

  if (reservationRequest.notification_status === "sent") {
    return jsonResponse({ sent: true });
  }

  if (reservationRequest.status !== "submitted") {
    return jsonResponse({ error: "Only newly submitted requests can notify reception." }, 409);
  }

  const profile = await getClientProfile(
    supabaseUrl,
    serviceRoleKey,
    authResult.user.id,
  );
  const customerEmail = profile?.email ?? authResult.user.email ?? null;
  const customerName = profile?.display_name?.trim() || customerEmail || "Le Chateau client";
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESERVATION_REQUEST_FROM_EMAIL");

  if (!resendApiKey || !fromEmail) {
    await updateNotificationStatus(
      supabaseUrl,
      serviceRoleKey,
      requestId,
      "failed",
      "Email provider is not configured.",
    );
    return jsonResponse({ error: "Reception email is not configured." }, 500);
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: fromEmail,
      html: buildEmailHtml(reservationRequest, customerName, customerEmail),
      reply_to: customerEmail ?? undefined,
      subject: buildSubject(reservationRequest, customerName),
      text: buildEmailText(reservationRequest, customerName, customerEmail),
      to: [supportEmail],
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `reservation-request-${requestId}`,
    },
    method: "POST",
  });

  if (!emailResponse.ok) {
    const providerError = await emailResponse.text().catch(() => "Email provider request failed.");
    console.error("Unable to send reservation request email.", emailResponse.status, providerError);
    await updateNotificationStatus(
      supabaseUrl,
      serviceRoleKey,
      requestId,
      "failed",
      `Email provider returned HTTP ${emailResponse.status}.`,
    );
    return jsonResponse({ error: "Reception email could not be sent." }, 502);
  }

  await updateNotificationStatus(supabaseUrl, serviceRoleKey, requestId, "sent", null);

    return jsonResponse({ sent: true });
  } catch (error) {
    console.error("Reservation request notification failed.", error);
    return jsonResponse({ error: "Reception email could not be sent." }, 500);
  }
});

async function getAuthenticatedUser(request: Request): Promise<
  | { user: AuthUser }
  | { error: string; status: number }
> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Supabase authentication is unavailable.", status: 500 };
  }

  if (!authorization) {
    return { error: "Authentication is required.", status: 401 };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    return { error: "Invalid or expired session.", status: 401 };
  }

  const user = (await response.json()) as AuthUser;

  return user.id
    ? { user }
    : { error: "Invalid session user.", status: 401 };
}

async function getOwnedReservationRequest(
  supabaseUrl: string,
  serviceRoleKey: string,
  requestId: string,
  userId: string,
) {
  const query = new URLSearchParams({
    id: `eq.${requestId}`,
    limit: "1",
    select: "*",
    user_id: `eq.${userId}`,
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/reservation_requests?${query}`, {
    headers: serviceRoleHeaders(serviceRoleKey),
  });

  if (!response.ok) {
    throw new Error("Unable to load reservation request for notification.");
  }

  const rows = (await response.json()) as ReservationRequest[];
  return rows[0] ?? null;
}

async function getClientProfile(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
) {
  const query = new URLSearchParams({
    id: `eq.${userId}`,
    limit: "1",
    select: "display_name,email",
  });
  const response = await fetch(`${supabaseUrl}/rest/v1/client_profiles?${query}`, {
    headers: serviceRoleHeaders(serviceRoleKey),
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as ClientProfile[];
  return rows[0] ?? null;
}

async function updateNotificationStatus(
  supabaseUrl: string,
  serviceRoleKey: string,
  requestId: string,
  status: "failed" | "sent",
  error: string | null,
) {
  const query = new URLSearchParams({ id: `eq.${requestId}` });
  const response = await fetch(`${supabaseUrl}/rest/v1/reservation_requests?${query}`, {
    body: JSON.stringify({
      notification_error: error,
      notification_status: status,
      notified_at: status === "sent" ? new Date().toISOString() : null,
    }),
    headers: {
      ...serviceRoleHeaders(serviceRoleKey),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    console.error("Unable to update reservation notification status.", response.status);
  }
}

function serviceRoleHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

function buildSubject(request: ReservationRequest, customerName: string) {
  const location = request.location ? ` - ${request.location}` : "";
  return `New reservation request${location}: ${customerName}`;
}

function buildEmailHtml(
  request: ReservationRequest,
  customerName: string,
  customerEmail: string | null,
) {
  const rows = buildEmailRows(request, customerName, customerEmail)
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;font-weight:600;vertical-align:top;border-bottom:1px solid #e9e7e2">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e9e7e2">${escapeHtml(value)}</td>
      </tr>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#181818;line-height:1.5">
      <h1 style="color:#711012;font-size:24px">New reservation request</h1>
      <p>A client submitted a reservation request through the Le Chateau app.</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px">${rows}</table>
      <p style="color:#767676;font-size:13px">Request ID: ${escapeHtml(request.id)}</p>
    </div>`;
}

function buildEmailText(
  request: ReservationRequest,
  customerName: string,
  customerEmail: string | null,
) {
  const details = buildEmailRows(request, customerName, customerEmail)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  return `New reservation request\n\n${details}\n\nRequest ID: ${request.id}`;
}

function buildEmailRows(
  request: ReservationRequest,
  customerName: string,
  customerEmail: string | null,
): Array<[string, string]> {
  return [
    ["Customer", customerName],
    ["Email", customerEmail ?? "Unavailable"],
    ["Location", request.location ?? "Not selected"],
    ["Dates", `${request.start_date} ${formatTime(request.start_time)} - ${request.end_date} ${formatTime(request.end_time)}`],
    ["Request", request.experience],
    ["Pets", request.selected_pet_names.length ? request.selected_pet_names.join(", ") : request.selected_pet_ids.join(", ")],
    ["Reservation type", request.reservation_type ?? "Not selected"],
    ["Amenity package", request.amenity_package ?? "None"],
    ["Suite", request.suite_size ?? "None"],
    ["Enrichment", request.enrichment_enabled ? request.enrichment_frequency ?? "Requested" : "No"],
    ["Spa service", request.spa_service ?? "None"],
    ["Spa upgrades", request.spa_upgrades.length ? request.spa_upgrades.join(", ") : "None"],
    ["Authorized pickup", request.authorized_pickup ?? "None listed"],
    ["Notes", request.notes ?? "None"],
    ["Submitted", request.created_at],
  ];
}

function formatTime(value: string | null) {
  return value ? `at ${value}` : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}
