

# Backend Architecture

## Purpose

The LCPR Backend powers the Le Chateau mobile app and future client-facing digital experiences.

It should act as an orchestration layer between the mobile app, Gingr, and LCPR-owned services.

It should not become a second kennel management system.

---

# Core Responsibility

The backend has three jobs:

1. Protect vendor credentials and private integrations.
2. Normalize external data into stable app-facing models.
3. Own client-experience features that do not belong in Gingr.

---

# High-Level Architecture

```text
Mobile App
    │
    ▼
LCPR Backend API
    │
    ├── Gingr Service (read-only)
    ├── Reservation Request Service
    ├── Notification Service
    ├── Media Service
    ├── Camera Service
    ├── Marketing Content Service
    └── Analytics Service
```

The mobile app should only communicate with the LCPR Backend.

The backend communicates with Gingr and other vendors.

---

# Recommended Stack

## API Layer

Use one of the following:

- Next.js API routes / route handlers
- Supabase Edge Functions

Preferred starting point:

- Next.js API routes if this shares infrastructure with the existing intranet
- Supabase Edge Functions if lightweight backend functions are enough

## Database

Supabase Postgres.

Use the database only for LCPR-owned data.

Do not store duplicate Gingr records as permanent data.

## Storage

Supabase Storage.

Use for:

- Stay photos
- Temporary vaccination uploads
- Marketing images
- App content media

## Authentication

Supabase Auth or custom auth layer.

Long-term goal:

Clients authenticate with Le Chateau, not directly with Gingr.

The backend maps Le Chateau users to Gingr client records.

---

# Service Boundaries

## Gingr Service

Responsible for reading Gingr-owned data.

Examples:

- Clients
- Pets
- Reservations
- Vaccinations
- Feeding instructions
- Medication notes
- Deposits
- Payments

Rules:

- Read only.
- Never expose raw Gingr responses directly to the mobile app.
- Normalize Gingr data into app-facing models.
- Cache briefly when needed, but treat Gingr as authoritative.

### Phase 1 Discovery Implementation

The first implementation should be a Supabase Edge Function named `gingr-discovery`.

Responsibilities:

- Store `GINGR_BASE_URL` and `GINGR_API_KEY` as Supabase secrets.
- Require a valid Supabase session before any Gingr call.
- Support a small allowlist of read-only discovery actions.
- Use the signed-in user's email for client lookup.
- Return redacted discovery responses for inspection.

This function should not become the final normalized API. It is a controlled bridge for learning the Gingr response shapes before replacing temporary seeded pets and reservation placeholders.

## Reservation Request Service

Owns reservation requests before they become Gingr reservations.

Responsibilities:

- Create request
- Track request status
- Display request in reception queue
- Store requested dates, pets, preferences, and notes
- Mark request entered into Gingr
- Archive request after Gingr reservation exists

Once the Gingr reservation exists, the app should display reservation details from Gingr.

## Notification Service

Responsible for push, SMS, and email orchestration.

Rules:

- Staff should trigger one action.
- Backend decides delivery method.
- Store notification logs.
- Respect client preferences.

Channels:

- Push notifications
- SMS
- Email

## Media Service

Owns experience media not managed by Gingr.

Examples:

- Daily stay photos
- Stay timeline media
- Marketing images

Rules:

- Media should be attached to a client, pet, stay, or marketing placement.
- Avoid storing operational records in media metadata.

## Camera Service

Controls camera access rules.

Responsibilities:

- Determine whether a client can view cameras
- Map active stays to allowed camera groups
- Hide cameras when no active stay exists

Rules:

- Do not expose camera credentials to the mobile app.
- Backend should generate secure viewing access if needed.

## Marketing Content Service

Owns app content that is not stored in Gingr.

Examples:

- Explore content
- Promotions
- App banners
- Service descriptions
- FAQs
- Resort announcements

## Analytics Service

Tracks app usage and product behavior.

Examples:

- Screen views
- Reservation request starts
- Reservation request submissions
- Camera opens
- Push notification opens

Analytics should not become operational recordkeeping.

---

# Data Ownership Rules

## Do Store

- Reservation requests
- Notification tokens
- Notification preferences
- Notification logs
- App settings
- Feature flags
- Marketing content
- Stay photos
- Temporary upload files
- Analytics events
- Camera access metadata

## Do Not Store Permanently

- Pet profile data from Gingr
- Vaccination records from Gingr
- Feeding notes from Gingr
- Medication notes from Gingr
- Reservation details from Gingr
- Payment records from Gingr
- Deposit status from Gingr

Temporary caching is acceptable if clearly treated as cache.

---

# Caching Strategy

Use cache only to improve speed and reliability.

Cache examples:

- Pet summaries
- Upcoming reservation summaries
- Vaccination status
- Explore content

Rules:

- Cached Gingr data must be refreshable.
- The app should not rely on cached data as the permanent truth.
- Prefer short TTLs for operational data.
- Prefer longer TTLs for static marketing content.

---

# Security Rules

- Never expose Gingr API keys to the mobile app.
- Never expose SMS/email provider keys to the mobile app.
- Never expose camera credentials to the mobile app.
- Use server-side authorization checks for every client-owned resource.
- A user should only see their own pets, reservations, photos, and documents.
- Use signed URLs for private files when needed.

---

# Staff Workflow Principle

The backend should reduce staff workload.

It should not add another inbox or another place to manage duplicate records.

Preferred model:

```text
Staff performs one action
      ↓
Backend handles storage, notifications, and logging
      ↓
Client receives update in the right channel
```

---

# Future Backend Modules

Potential future modules:

- Loyalty
- Referral tracking
- Digital check-in
- AI concierge
- Waitlist management
- Suite recommendation engine
- Automated vaccine reminders
- Payment links
- Review requests

Each future module should follow the same source-of-truth rules.

---

# Non-Negotiable Rules

1. The backend is an orchestration layer, not a replacement for Gingr.
2. Gingr-owned data should not be permanently duplicated.
3. The mobile app never talks directly to Gingr.
4. Vendor credentials never reach the client.
5. Every service should have a clear ownership boundary.
6. Backend decisions should reduce staff workload, not increase it.
7. APIs should be designed around the Le Chateau client experience, not Gingr's internal terminology.
