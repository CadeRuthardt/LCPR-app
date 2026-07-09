

# Le Chateau Pet Resort Mobile App

## Project Vision

The Le Chateau Pet Resort mobile app is the client-facing digital experience for Le Chateau Pet Resort.

This is **not** a kennel management application and it is **not** intended to replace Gingr.

The goal is to create a luxury hospitality experience that reflects the Le Chateau brand while using Gingr as the operational system of record.

Think of this project as building the digital equivalent of a luxury hotel app (Four Seasons, Ritz-Carlton, Auberge, etc.) designed specifically for pet owners.

---

# Guiding Principles

## Hospitality First

Every screen should feel like a luxury hospitality experience rather than kennel software.

## Brand First

Clients should interact with Le Chateau—not Gingr.

## Mobile First

This should feel like a native iPhone/Android application, not a website wrapped in an app.

## Simplicity

Every screen should have a clear purpose.
Avoid clutter.
Avoid operational terminology.

## Single Source of Truth

Never duplicate operational data.

If Gingr stores it, Gingr owns it.

---

# Architecture Philosophy

## Gingr (Source of Truth)

Gingr owns:

- Clients
- Pets
- Reservations
- Vaccinations
- Feeding Instructions
- Medication
- Payments
- Deposits
- Boarding History
- Suites

The app should read this information.

Do not build duplicate databases for Gingr-managed information.

Temporary caching for performance is acceptable.

## LCPR Backend

The LCPR backend only stores information Gingr does not manage.

Examples:

- Reservation Requests (before they become Gingr reservations)
- Push Notification Tokens
- Notification Preferences
- Marketing Content
- Feature Flags
- App Configuration
- Analytics
- Photo Timeline (if not stored in Gingr)
- Camera configuration

Once information exists in Gingr, Gingr becomes the source of truth.

---

# Reservation Philosophy

Clients should never think in terms of Gingr reservation types or internal scheduling records.

Instead, the app guides the guest through requesting a reservation with Le Chateau.

Example flow:

1. Select Pet(s)
2. Choose Travel Dates
3. Select Experience
4. Provide Trip Details
5. Submit Request

Reception reviews the request and manually creates the reservation in Gingr.

The app should communicate statuses such as:

- Submitted
- Under Review
- Action Required
- Confirmed
- Cancelled

Clients should never see Gingr terminology.

---

# Product Sections

## Home

A living dashboard.

Examples:

- Upcoming Reservation
- Current Reservation
- Stay Updates
- Live Cameras (only during active stays)
- Vaccination Alerts
- Promotions
- Resort News

## Pets

Read-only information from Gingr.

## Reservations

Upcoming reservations
Past reservations
Current reservation
Request a Reservation

## Explore

The digital resort experience.

Examples:

- Accommodations
- Daycare
- Spa
- Cat Resort
- VIP Experience
- Meet the Team
- About Us
- FAQ
- Contact

## Profile

Account settings and notification preferences.

---

# Accommodations

## Dog Suites

Classic Collection

- Champion
- Olympian
- Royal
- Chateau

Premium Collection

- Champion
- Olympian
- Royal
- VIP

## Cat Accommodations

- Condo
- Villa
- Penthouse

The client requests an experience.
Reception assigns the appropriate accommodation.

---

# Branding

Brand Colors

- Black Cherry: #711012
- Goldenrod: #D5A727
- Rich Mahogany: #360808
- Olive Bark: #795E16
- Ivory: #FAFAF0
- Onyx: #111111
- Graphite: #292929

Typography and UI should feel elegant, minimal, and premium.

Avoid generic kennel software aesthetics.

---

# Design System

## Brand Personality

The app should communicate:

- Luxury
- Hospitality
- Warmth
- Trust
- Calmness
- Simplicity

Avoid designs that resemble kennel management software.

## Visual Style

- Minimal, premium layouts
- Large photography
- Rounded corners
- Soft shadows
- High whitespace
- Elegant typography
- Smooth animations

The visual inspiration should feel closer to Apple, Four Seasons, Airbnb, or Mercedes than traditional pet boarding software.

## Motion

Animations should be subtle and purposeful.

Examples:

- Smooth screen transitions
- Fade-in content
- Gentle card elevation
- Interactive button feedback
- Skeleton loading states

Never use flashy or distracting animations.

---

# Navigation

Primary Navigation:

- Home
- Pets
- Reservations
- Explore
- Profile

Future navigation should remain shallow and intuitive.

The user should never need to hunt for information.

---

# Backend Responsibilities

## Gingr

Owns operational data.

## LCPR Backend

Owns client experience.

Responsibilities include:

- Reservation request intake
- Push notification delivery
- Marketing content
- Notification preferences
- Feature flags
- Camera access configuration
- Future loyalty and concierge features

The backend should avoid duplicating Gingr data whenever possible.

---

# Roadmap

## Phase 1 (MVP)

- Authentication
- Home
- Pets
- Reservations
- Explore
- Profile
- Read-only Gingr integration
- Reservation requests
- Vaccination uploads

## Phase 2

- Live cameras
- Stay timeline
- Daily photo updates
- Push notifications
- Rich stay history

## Phase 3

- Loyalty program
- AI concierge
- Personalized recommendations
- Digital check-in experience
- Future write integrations if supported by Gingr

---

# Non-Negotiable Rules

1. Gingr is the operational source of truth.
2. Never duplicate Gingr-managed data.
3. Favor composition over duplication in code.
4. Build reusable UI components before page-specific components.
5. Every feature should reinforce Le Chateau as a luxury hospitality brand.
6. If a design decision improves functionality but hurts the luxury experience, reconsider the design before implementing it.

---

# Technology

Current Stack

- React Native
- Expo
- TypeScript

Planned

- Expo Router
- NativeWind
- Supabase
- Expo Push Notifications

---

# Development Guidelines

- Favor reusable components.
- Build for scalability.
- Keep business logic separate from UI.
- Avoid hardcoded strings where possible.
- Build with future API integrations in mind.
- Never introduce duplicate data owned by Gingr.

---

# Long-Term Vision

The client should feel like they are interacting exclusively with Le Chateau.

Gingr should remain an invisible operational backend.

If the business ever migrates away from Gingr, the client experience should remain unchanged.

This application is intended to become the digital front door to Le Chateau Pet Resort and reinforce the company's identity as a luxury hospitality brand for pets.
