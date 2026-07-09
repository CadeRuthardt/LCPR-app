

# API Architecture

## Purpose

This document defines the boundary between the Le Chateau Mobile App, the LCPR Backend, and Gingr.

The guiding principle is:

> Every piece of data has exactly one source of truth.

The backend should orchestrate data, not duplicate Gingr.

---

# System Architecture

```text
Mobile App
      │
      ▼
LCPR Backend (API)
      │
 ┌────┴───────────────┐
 │                    │
 ▼                    ▼
Gingr API        LCPR Services
(Read Only)      (Notifications, Requests,
                  Marketing, Cameras, etc.)
```

The mobile app never communicates directly with Gingr.

All requests flow through the LCPR Backend.

---

# Source of Truth

## Gingr Owns

- Client accounts
- Pet profiles
- Reservations
- Accommodations
- Vaccination records
- Feeding instructions
- Medication instructions
- Payments
- Deposits
- Reservation history
- Operational notes (when applicable)

These records are read from Gingr and never permanently duplicated.

## LCPR Backend Owns

- Reservation requests awaiting entry into Gingr
- Push notification tokens
- Notification preferences
- Marketing content
- App configuration
- Feature flags
- Camera metadata and access rules
- Analytics
- Client experience features

---

# Data Flow

## Read Flow

```text
Mobile App
    ↓
LCPR Backend
    ↓
Gingr API
    ↓
LCPR Backend
    ↓
Mobile App
```

The backend may cache responses briefly for performance, but Gingr remains authoritative.

## Reservation Request Flow

```text
Client
    ↓
Submit Request
    ↓
LCPR Backend
    ↓
Reception Queue
    ↓
Reception creates reservation in Gingr
    ↓
Backend marks request complete
    ↓
Client receives confirmation
```

After a reservation exists in Gingr, all reservation details should come from Gingr.

---

# Notification Architecture

Reception should perform one action.

Example:

```text
Upload Photo
      ↓
Backend stores experience content
      ↓
Backend sends push notification
      ↓
Optional SMS / Email
      ↓
Client opens app
```

Staff should never choose between multiple communication systems unless operationally required.

---

# API Design Principles

- The mobile app consumes only LCPR APIs.
- Gingr authentication and API details remain hidden from the client.
- Normalize Gingr responses into stable application models.
- Do not expose Gingr-specific terminology to the UI.
- Use consistent endpoint naming and versioning.

Example endpoint groups:

- /auth
- /pets
- /reservations
- /reservation-requests
- /vaccinations
- /notifications
- /explore
- /profile
- /cameras

---

# Phase 1 Gingr Discovery Boundary

Phase 1 should start with a read-only discovery layer before replacing temporary seed data.

The mobile app should call Supabase only. Gingr credentials must live in Supabase Edge Function secrets, never in Expo public environment variables.

Initial discovery actions:

- Locations
- Reservation types
- Services by reservation type
- Current signed-in owner by email
- Current signed-in owner reservation snapshot

Discovery rules:

- Use the authenticated Supabase user's email for owner lookup.
- Do not allow arbitrary client email searches from the app.
- Redact secret-like fields before returning responses.
- Inspect and normalize response shapes before wiring production UI.
- Do not persist Gingr-owned data as permanent app records.

---

# Future Integrations

Potential backend integrations:

- Gingr (read-only)
- Hikvision
- iDogCam
- Push Notification Service
- SMS Provider
- Email Provider
- Google Workspace
- Payment Provider (future)

Integrations should be isolated behind service layers so vendors can change without affecting the mobile app.

---

# Non-Negotiable Rules

1. Never create a second system of record for Gingr-managed data.
2. All mobile traffic flows through the LCPR Backend.
3. Keep Gingr implementation details hidden from the client.
4. Separate business logic from vendor integrations.
5. Build APIs around the client experience, not around Gingr's data model.
