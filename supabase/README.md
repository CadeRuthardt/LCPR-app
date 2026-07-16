# Phase 1 Supabase Setup

Phase 1 uses Supabase for email-code authentication, persistent sessions, temporary seeded client pets, and LCPR-owned reservation requests.

## Environment

Create a new Supabase project and add these Expo public variables locally:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Restart Expo with cache clearing after adding env values:

```bash
npm run start -- --clear
```

## Auth Admission

The app calls Supabase email OTP with `shouldCreateUser: false`, so public users cannot self-register from the mobile app.

Before a client can sign in:

1. Create the user in Supabase Auth using the email on file.
2. Insert a matching `client_profiles` row using the new user's `auth.users.id`.
3. Seed temporary `phase1_seed_pets` rows for that user while Gingr reads are still deferred.

## Migration

Run `supabase/migrations/20260709000000_phase1_auth_requests.sql` in the Supabase SQL editor or through the Supabase CLI after linking the project.

The migration enables Row Level Security so clients can only read their own profile, seeded pets, and reservation requests. Clients can create reservation requests with `submitted` status, but cannot update request status.

## Gingr Discovery

The first Gingr slice uses a Supabase Edge Function named `gingr-discovery`.

This function is read-only and exists to inspect Gingr response shapes before replacing temporary seed data. Do not put Gingr credentials in Expo public env vars.

Set the server-side secrets in Supabase:

```bash
supabase secrets set GINGR_BASE_URL=https://your-subdomain.gingrapp.com
supabase secrets set GINGR_API_KEY=...
```

Deploy the function:

```bash
supabase functions deploy gingr-discovery
```

Supported discovery actions:

- `locations`
- `location-cities`
- `reservation-types`
- `services-by-type`
- `current-owner`
- `current-pets`
- `current-client-snapshot`

Client-specific lookups use the signed-in Supabase user's email.

## Reservation Request Emails

New reservation requests call the authenticated `reservation-request-notification` Edge Function.
The function reloads the customer-owned request from Supabase and emails
`support@lechateaupetresort.com` through Resend.

After verifying a sending domain in Resend, configure the server-side secrets:

```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key
supabase secrets set RESERVATION_REQUEST_FROM_EMAIL="Le Chateau Reservations <reservations@your-verified-domain>"
```

Apply migrations and deploy the function:

```bash
supabase db push
supabase functions deploy reservation-request-notification
```
