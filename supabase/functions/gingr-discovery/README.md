# Gingr Discovery Edge Function

This function is the first read-only Gingr boundary for Phase 1.

It exists to inspect what Gingr can safely provide before app screens depend on live Gingr data. The mobile app must not call Gingr directly.

## Secrets

Set these in Supabase, not in Expo public env:

```bash
supabase secrets set GINGR_BASE_URL=https://your-subdomain.gingrapp.com
supabase secrets set GINGR_API_KEY=your-gingr-api-key
```

## Deploy

```bash
supabase functions deploy gingr-discovery
```

## Actions

The function requires a signed-in Supabase user and supports:

- `locations`
- `reservation-types`
- `services-by-type`
- `current-owner`
- `current-client-snapshot`

`current-owner` and `current-client-snapshot` use the signed-in user's Supabase email. Do not pass arbitrary client emails from the app.

## Example

```ts
await runGingrDiscovery({ action: "current-client-snapshot" });
```

The response is redacted for common secret-like fields. Treat the output as discovery data, not permanent app storage.
