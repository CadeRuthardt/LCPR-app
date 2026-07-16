# Reservation Request Notification

This authenticated Edge Function sends newly submitted reservation requests to
`support@lechateaupetresort.com`.

It accepts only a reservation request ID, verifies the signed-in user owns the request,
reloads the request and client profile from Supabase, and uses the request ID as the
Resend idempotency key.

## Secrets

```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key
supabase secrets set RESERVATION_REQUEST_FROM_EMAIL="Le Chateau Reservations <reservations@your-verified-domain>"
```

## Deploy

```bash
supabase db push
supabase functions deploy reservation-request-notification
```
