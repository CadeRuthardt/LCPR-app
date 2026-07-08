@AGENTS.md

# AI Development Instructions

> This file defines the operating principles for all AI coding assistants working on the Le Chateau Pet Resort mobile application.

## Project Purpose

Build a premium, hospitality-first mobile experience for Le Chateau Pet Resort.

This application is **not** a kennel management system.

Gingr remains the operational system of record.

The app is the digital front door for Le Chateau clients.

## Core Principles

1. Hospitality over kennel software.
2. Gingr is the single source of truth for operational data.
3. Never duplicate Gingr-owned data.
4. Prefer reusable components over one-off implementations.
5. Favor clean architecture over quick solutions.
6. Build mobile-first experiences.
7. Every UI decision should reinforce the Le Chateau luxury brand.

## Data Ownership

### Gingr owns

- Clients
- Pets
- Reservations
- Vaccinations
- Feeding instructions
- Medications
- Payments
- Deposits
- Boarding history
- Accommodations

Read this data only.

### LCPR Backend owns

- Reservation requests
- Push notification tokens
- Notification preferences
- Marketing content
- Feature flags
- Client experience features
- App configuration
- Analytics

Do not introduce duplicate records for Gingr-managed entities.

## Coding Standards

- Use TypeScript throughout.
- Keep presentation, business logic, and networking separated.
- Create reusable UI components before building screens.
- Prefer composition over inheritance.
- Avoid unnecessary dependencies.
- Maintain consistent naming and folder structure.

## Design Direction

The experience should feel comparable to a luxury hotel app—not enterprise software.

Prioritize:

- Elegant typography
- Spacious layouts
- Smooth animations
- High-quality imagery
- Minimal visual clutter
- Calm interactions

## Before Implementing Features

Always ask:

- Does Gingr already own this data?
- Does this improve the hospitality experience?
- Can this be built as a reusable component?
- Is there a simpler solution?

When uncertain, preserve the existing architecture rather than introducing parallel systems.