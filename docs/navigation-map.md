
# Navigation Map

## Purpose

This document defines the application structure, primary navigation, screen hierarchy, and major user flows for the Le Chateau Pet Resort mobile app.

The goal is to keep navigation shallow, intuitive, and hospitality-first.

Users should never feel like they are navigating kennel software.

---

# Primary Tabs

The app uses five primary tabs:

1. Home
2. Pets
3. Reservations
4. Explore
5. Profile

These tabs should remain stable unless there is a strong product reason to change them.

---

# Navigation Philosophy

## Shallow Navigation

The user should be able to reach important information within two taps whenever possible.

## Contextual Features

Certain features should appear only when relevant.

Example:

- Live Cameras appear during an active stay.
- Vaccine upload appears when records are missing or expiring.
- Stay updates appear when a pet is checked in.

## Hospitality Language

Use client-facing language.

Preferred:

- Reservations
- Explore the Resort
- Request a Reservation
- Preparing for Your Visit

Avoid:

- Kennels
- Boarding Units
- Reservation Types
- Internal Codes

---

# Tab 1: Home

## Purpose

The Home screen is the living dashboard for the client.

It should answer:

- What matters right now?
- What should I do next?
- What can I explore?

## Home Screen Sections

- Greeting
- Upcoming Reservation
- Current Reservation
- Stay Updates
- Vaccination Alerts
- Request a Reservation CTA
- Live Cameras CTA
- Featured Service
- Resort Announcement
- Explore Preview

## Home Navigation

```text
Home
├── Upcoming Reservation Card
│   └── Reservation Details
│       ├── Preparing for Your Visit
│       ├── Vaccination Status
│       ├── Deposit Status
│       └── Contact Resort
│
├── Current Reservation Card
│   └── Current Stay
│       ├── Stay Timeline
│       ├── Live Cameras
│       ├── Photos
│       └── Pickup Information
│
├── Stay Update Card
│   └── Stay Timeline Detail
│       ├── Photo Viewer
│       └── Update Detail
│
├── Vaccination Alert
│   └── Upload Vaccination Record
│
├── Request a Reservation
│   └── Request Flow
│
├── Live Cameras
│   └── Camera List
│       └── Camera Viewer
│
└── Featured Service
    └── Explore Detail
```

---

# Tab 2: Pets

## Purpose

The Pets tab gives clients a calm, clear view of their pets and care information.

Gingr owns pet profile data.

The app should display this data but not duplicate it.

## Pets Navigation

```text
Pets
├── Pet List
│   └── Pet Profile
│       ├── Profile Summary
│       ├── Vaccinations
│       │   └── Upload Vaccination Record
│       ├── Feeding Instructions
│       ├── Medication Instructions
│       ├── Care Preferences
│       ├── Stay History
│       │   └── Stay Details
│       └── Photos
│           └── Photo Viewer
```

## Pet Profile Sections

- Photo
- Name
- Breed
- Age
- Weight
- Vaccination Status
- Feeding Instructions
- Medication Instructions
- Care Notes
- Upcoming Reservation
- Past Reservations

---

# Tab 3: Reservations

## Purpose

The Reservations tab gives clients a clear, familiar place to view upcoming, current, past, and requested reservations without exposing Gingr's internal reservation types.

It includes current, upcoming, past, and requested reservations.

## Reservations Navigation

```text
Reservations
├── Current Reservation
│   └── Current Stay Detail
│       ├── Stay Timeline
│       ├── Photos
│       ├── Live Cameras
│       ├── Pickup Information
│       └── Contact Resort
│
├── Upcoming Reservations
│   └── Reservation Details
│       ├── Preparing for Your Visit
│       ├── Pet Details
│       ├── Vaccination Status
│       ├── Deposit Status
│       └── Contact Resort
│
├── Reservation Requests
│   └── Request Status Detail
│       ├── Submitted Details
│       ├── Status Timeline
│       └── Contact Resort
│
├── Past Reservations
│   └── Stay History Detail
│       ├── Photos
│       ├── Timeline
│       ├── Report Card
│       └── Request Similar Reservation
│
└── Request a Reservation
    └── Request Flow
```

---

# Request a Reservation Flow

## Purpose

The client submits a request.

Reception reviews the request and manually enters the reservation into Gingr.

The app should never imply instant confirmation.

## Flow

```text
Request a Reservation
├── Step 1: Select Pet(s)
├── Step 2: Choose Location
├── Step 3: Select Dates
├── Step 4: Choose Experience
│   ├── Classic
│   ├── Premium
│   ├── VIP
│   └── Let Le Chateau Recommend
├── Step 5: Add Services
│   ├── Daycare
│   ├── Spa
│   └── Special Add-ons
├── Step 6: Care Notes
│   ├── Feeding Updates
│   ├── Medication Updates
│   └── Special Requests
├── Step 7: Review Request
└── Confirmation
    └── Request Status Detail
```

## Request Statuses

Client-facing statuses:

- Submitted
- Under Review
- Action Required
- Confirmed
- Cancelled

Internal statuses may be more detailed, but they should not be exposed directly to clients.

---

# Tab 4: Explore

## Purpose

Explore is the digital resort experience.

It should be valuable even when the client does not have an active stay.

## Explore Navigation

```text
Explore
├── Accommodations
│   ├── Dog Suites
│   │   ├── Classic Collection
│   │   │   ├── Champion
│   │   │   ├── Olympian
│   │   │   ├── Royal
│   │   │   └── Chateau
│   │   └── Premium Collection
│   │       ├── Champion
│   │       ├── Olympian
│   │       ├── Royal
│   │       └── VIP
│   └── Cat Accommodations
│       ├── Condo
│       ├── Villa
│       └── Penthouse
│
├── Daycare
├── Spa
├── VIP Experience
├── Cat Resort
├── Live Cameras Preview
├── Meet the Team
├── Our Story
├── Services & Rates
├── FAQs
├── Policies
├── Locations
│   └── Location Detail
└── Contact
```

## Explore Principles

- Use immersive imagery.
- Avoid plain lists when a visual card would be better.
- Present accommodations like hotel rooms, not kennel units.
- Promote discovery between stays.

---

# Tab 5: Profile

## Purpose

Profile contains account, communication, and preference settings.

## Profile Navigation

```text
Profile
├── Account Details
├── Family Members
├── Notification Preferences
├── Documents
│   └── Uploaded Documents
├── Payment Methods
├── Communication Preferences
├── App Settings
├── Help & Support
├── Privacy
└── Sign Out
```

---

# Global Screens

These screens can be opened from multiple areas.

```text
Notification Center
Photo Viewer
Camera Viewer
Upload Vaccination Record
Contact Resort
Help & Support
Location Detail
Policy Detail
Promotion Detail
```

---

# Authentication Flow

```text
Launch App
├── Splash Screen
├── Welcome Screen
├── Sign In
├── Create Account
├── Link Gingr Account / Match Client Record
├── Onboarding
│   ├── Confirm Profile
│   ├── Confirm Pets
│   └── Notification Preferences
└── Home
```

Long-term goal:

Clients authenticate with Le Chateau.

The backend maps the Le Chateau account to Gingr client records.

---

# Empty States

Empty states should feel helpful, not sterile.

Examples:

## No Upcoming Reservation

Primary message:

- Ready for your next visit?

CTA:

- Request a Reservation

Secondary action:

- Explore Accommodations

## No Pets

Primary message:

- Let's add your pet to the Le Chateau family.

CTA:

- Contact Reception

Note:

Pet records are ultimately managed through Gingr/reception.

## No Active Stay

Hide live stay features and promote:

- Request a Reservation
- Explore the Resort
- View Past Reservations

---

# Deep Links

Future deep links should support:

```text
/reservations/:id
/pets/:id
/explore/accommodations
/explore/accommodations/dog/classic/champion
/request-reservation
/cameras
/profile/notifications
```

---

# Non-Negotiable Rules

1. Keep the five-tab structure stable.
2. Avoid exposing Gingr terminology.
3. Keep navigation shallow.
4. Surface contextual actions only when relevant.
5. Make the app useful even between stays.
6. Do not build admin workflows into the client app.
7. Every navigation path should feel intentional and calm.
