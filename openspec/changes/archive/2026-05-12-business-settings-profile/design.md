## Context

The application already has a global admin role, protected admin routes, and a foundation `organizations` table, but it still lacks a canonical business settings workflow for the single salon. Future features such as service availability, slot generation, booking confirmation, and reminders depend on a single source of truth for the business timezone, weekly business hours, and closure exceptions. The current repo also has no seeded singleton organization, so the design must guarantee that the app can always resolve one editable business record without relying on frontend hardcoded IDs.

## Goals / Non-Goals

**Goals:**
- Persist business identity, branding basics, timezone, weekly business hours, and closure exceptions in Supabase as the canonical source of truth.
- Guarantee a singleton business record for the single-tenant product.
- Provide an admin-only settings experience with deterministic loading, empty, success, and recoverable warning/error states in Spanish.
- Support both full-day and half-day closure exceptions without introducing staff-level schedules.
- Produce a business readiness signal that can warn admins when configuration is incomplete without blocking app usage.

**Non-Goals:**
- Staff-specific schedules, vacations, breaks, or exception management.
- Slot generation, appointment scheduling rules, or booking enforcement.
- Advanced theming, design-system overrides, or full white-label branding.
- A hard booking lock based on readiness state in this change.

## Decisions

### Use the existing `organizations` table as the singleton business root
The business identity already maps naturally to `organizations`, so the singleton salon should be represented there instead of creating a second root entity. The design will extend `organizations` for branding and business-level metadata, then add child tables for weekly hours and closure exceptions.

Alternative considered: introduce a new `business_settings` root table. Rejected because it duplicates the existing business identity model and complicates joins for later service, staff, and appointment features.

### Split operational calendar into weekly hours and closure exception tables
Weekly recurring hours and ad hoc closures have different constraints and query patterns, so they should not live in the same JSON blob. A normalized weekly-hours table allows one row per weekday, while a closure table supports full-day and half-day exceptions with explicit local-date and time-range semantics.

Alternative considered: store hours and closures as JSON on `organizations`. Rejected because validation, uniqueness, and future scheduling queries would become harder to enforce and test.

### Make business timezone the canonical local-time context for business scheduling surfaces
The business timezone will be the canonical timezone for business hours, closure exceptions, future slot generation, and business-facing displays. UTC remains the canonical storage format for timestamped operational records, but the business timezone is used when interpreting local schedules.

Alternative considered: show booking and settings in the user's local timezone. Rejected for MVP because it increases ambiguity and complicates later scheduling behavior before the booking engine exists.

### Guarantee singleton resolution in the backend, not the frontend
The frontend should never hardcode organization IDs. The backend layer should guarantee that one business record exists, either through deterministic seed/bootstrap logic or a secure mutation/read path that creates the singleton if absent.

Alternative considered: let the frontend create the first organization ad hoc. Rejected because it makes authorization, race handling, and environment consistency weaker.

### Keep editing admin-only and expose readiness as a warning signal
This feature extends existing admin capabilities, so writes remain admin-only under RLS and route guards. Readiness is intentionally informational for now, allowing future booking and scheduling work to consume it without forcing blocking behavior prematurely.

Alternative considered: hard-block downstream flows immediately. Rejected because the current product stage still needs iterative setup and the user explicitly wants warning-only behavior.

## Risks / Trade-offs

- [Singleton bootstrap drift across environments] → Add deterministic bootstrap/guarantee behavior and SQL smoke coverage so local, preview, and production environments resolve the same business record model.
- [Half-day closure modeling becomes too narrow] → Represent closures with explicit type and optional start/end times so future partial closures can extend the same structure.
- [Business settings overlap with later settings features] → Keep this change focused on business identity and operating calendar; leave booking rules and notification preferences to later backlog items.
- [Admin route expansion causes navigation drift] → Update protected-route specs and navigation expectations together so admin route coverage stays coherent.

## Migration Plan

1. Add schema changes for singleton business metadata, weekly business hours, and closure exceptions.
2. Backfill or bootstrap the single organization record if missing.
3. Add RLS policies and secure read/write access patterns for admin-only editing.
4. Ship the admin settings route and UI against the new canonical data model.
5. Verify readiness computation and SQL smoke coverage before downstream features rely on the data.

Rollback strategy: revert the migration and UI changes together only before production data entry; after data exists, prefer forward-fix migrations to preserve canonical business settings.

## Open Questions

- No blocking open questions remain for proposal scope. Branding is defined in MVP as visible business name, logo, primary color, and booking header/subtitle text.