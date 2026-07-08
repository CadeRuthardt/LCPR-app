

# Component Library

## Purpose

This document defines the reusable UI components for the Le Chateau Pet Resort mobile application.

Every new screen should be composed from these building blocks whenever possible.

Avoid creating one-off components unless there is a compelling reason.

---

# Design Philosophy

Components should feel:

- Elegant
- Calm
- Premium
- Spacious
- Consistent
- Native

Inspired by Apple, Airbnb, Four Seasons, and high-end hospitality—not enterprise software.

---

# Foundation

## Colors

Use only the shared theme tokens.

- Black Cherry
- Goldenrod
- Rich Mahogany
- Olive Bark
- Ivory
- Onyx
- Graphite

Never hardcode colors in components.

## Typography

Shared text styles:

- Display
- Heading
- Title
- Body
- Caption
- Label

Typography should be centralized.

---

# Layout Components

## Screen

Standard page wrapper.

Responsibilities:

- Safe areas
- Background
- Status bar
- Scroll behavior

## Section

Reusable content grouping.

Supports:

- Title
- Subtitle
- Action button
- Divider

## Card

Primary surface component.

Variants:

- Default
- Elevated
- Featured
- Interactive

---

# Navigation Components

- BottomNavigation
- TopNavigationBar
- BackButton
- ProfileAvatar
- NotificationBadge

---

# Buttons

- PrimaryButton
- SecondaryButton
- GhostButton
- IconButton
- FloatingActionButton

States:

- Default
- Pressed
- Disabled
- Loading

---

# Form Components

- TextField
- SearchField
- TextArea
- DatePicker
- TimePicker
- Toggle
- Checkbox
- RadioGroup
- StepIndicator

Reservation requests should be built from these reusable controls.

---

# Hospitality Components

## StayCard

Displays:

- Dates
- Status
- Pet
- Experience
- CTA

## PetCard

Displays:

- Photo
- Name
- Breed
- Age
- Vaccination summary

## AccommodationCard

Displays:

- Image
- Collection
- Name
- Description
- Amenities
- Starting price

## ExperienceCard

Used throughout Explore.

Examples:

- Boarding
- Spa
- Daycare
- VIP

## CameraCard

Displays active camera access.

Visible only during active stays.

## TimelineCard

Used for stay updates.

Supports:

- Photos
- Notes
- Activities
- Timestamp

## PromotionCard

Marketing component.

Examples:

- Seasonal promotions
- Spa specials
- Featured services

---

# Feedback Components

- StatusBadge
- EmptyState
- LoadingSkeleton
- Toast
- Modal
- BottomSheet
- ConfirmationDialog

---

# Media Components

- HeroImage
- GalleryCarousel
- FullscreenPhotoViewer
- VideoPlayer

---

# Profile Components

- PetHeader
- StayHeader
- ProfileHeader
- DetailRow
- InfoList

---

# Component Rules

1. Components should be reusable.
2. Business logic belongs outside components.
3. Components receive data via props.
4. Components should not directly call Gingr.
5. Components should not know where data originates.
6. Styling should use the shared design system.
7. Accessibility should be considered by default.

---

# Future Components

Potential additions:

- LoyaltyCard
- RewardProgress
- ConciergeMessage
- AIRecommendationCard
- ResortMap
- WeatherWidget
- EventTimeline

New components should only be introduced when existing components cannot reasonably satisfy the design.