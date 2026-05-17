# 📦 Estetica Backlog

Sistema de Turnos — Ordered by Dependency

---

## Phase 1: Foundation & Auth

### 1. App Initialization & Project Bootstrap
**Description:** Project scaffold with React, Vite, TypeScript, TailwindCSS, Supabase integration, and environment validation.
- [x] `project-bootstrap` (9d01ca2)

### 2. Supabase Setup & Database Schema
**Description:** Supabase hosted project setup, PostgreSQL foundation schema design, versioned migrations, explicit constraints/relations, and an initial indexing strategy for MVP query patterns (excluding auth flow implementation and full RLS policy design). OpenSpec change archived: `supabase-setup-database-schema`.
- [x] `supabase-setup-database-schema` (78a6f14)

### 3. Auth System Setup (Supabase Auth)
**Description:** Supabase Auth setup with Google OAuth, auth callback handling, and secure auth environment configuration.
- [x] `auth-system-setup-supabase-auth` (cc42507)

### 4. Role System & Row Level Security
**Description:** Define role model (customer/user, admin, staff) and implement Supabase RLS policies to separate public vs admin data access, preparing authorization foundations for protected routes and authenticated booking flows.
- [x] `role-system-row-level-security` (8a183a3)

### 5. User Session Management
**Description:** Implement Supabase session lifecycle management for authenticated users: deterministic session restoration on app load, token refresh handling (success/failure), explicit logout with local state cleanup, and expired-session recovery (clear state + sign-in redirect), excluding route guards and role authorization logic.
- [x] `user-session-management` (c30fa50)

---

## Phase 2: Core Infrastructure

### 6. Layout Shell & Navigation
**Description:** Foundational app shell with responsive navigation that adapts to user role (customer, staff, admin). Includes role-based navigation configuration, UserContext integration with session management, desktop sidebar + mobile menu, and role-specific shells (CustomerShell, StaffShell, AdminShell). Bold SaaS aesthetic with distinctive typography, smooth interactions, and accessible design patterns. Prepares architecture for future Protected Routes feature.

**Key Deliverables:**
- AppShell component with responsive grid layout (CSS Grid)
- UserContext for session + role state management
- ShellContext for navigation UI state (sidebar/mobile menu toggles)
- Role-based navigation config (`navigationByRole` mapping)
- Sidebar component (desktop hidden on mobile, full-width drawer on mobile)
- NavBar with user menu and logout
- Custom hooks: `useUser()`, `useUserRole()`, `useNavigation()`, `useShellContext()`
- Responsive design: mobile-first with Tailwind breakpoints
- Integration with existing Supabase session (App.tsx)
- Clean folder structure: `components/shell/`, `context/`, `hooks/`, `lib/navigation.ts`
- Aesthetic: modern SaaS, custom typography, subtle depth, accessible color scheme

**Architecture Decisions:**
- UserContext co-locates session + role (vertical concern across app)
- ShellContext isolates navigation UI state (sidebar toggle) - not global
- Navigation declarative in `lib/navigation.ts` (role → available routes mapping)
- Shells differentiated by role (different layouts, not just different nav)
- Prepares scalability for future features without premature abstraction

**Security & Design Considerations:**
- UI navigation filtered by role (UX) + RLS on BD (actual authorization)
- No route protection in this feature (that's #7) - only UI preparation
- Design avoids generic aesthetics: distinctive typography, intentional color choices, purposeful spacing
- Micro-interactions on nav items, smooth menu transitions

- [x] `layout-shell-navigation` (25b460a)

### 6a. Main Hooks Unit Tests
**Description:** Unit test coverage for core context hooks to ensure session + role logic works correctly.
- [x] `main-hooks-unit-tests` (904d305) — 39 tests across 4 files, Vitest + @testing-library/react, 80% coverage threshold

### 6b. Visual Polish & Design System
**Description:** Implement distinctive typography, color scheme, transitions, and micro-interactions to elevate aesthetic quality.
- [x] `visual-polish-design-system` (2a893f2) — mobile-first typography, shared visual tokens, shell transitions, navigation micro-interactions, and accessibility polish

### 7. Protected Routes System
**Description:** Implement SPA route protection with authentication and role-based authorization for UI routes. Includes deterministic redirect behavior, dedicated unauthorized experience, and not-found handling. Keeps data authorization in Supabase RLS out of scope.

**Key Deliverables:**
- Central route access matrix (public, authenticated, role-restricted)
- Auth guard for protected routes (unauthenticated -> sign-in)
- Role guard for restricted routes (`customer`, `staff`, `admin`)
- Deterministic redirects:
	- authenticated user on sign-in -> role home
	- role homes: customer `/dashboard`, staff `/staff/schedule`, admin `/admin/users`
- Unauthorized page at `/unauthorized`
- Not found route handling for unknown paths
- Placeholder pages for mapped routes not yet implemented (to validate guards end-to-end)

**Testing Scope:**
- Unit tests for route access policy and redirect resolution
- Unit tests for auth/role guards (loading, allowed, denied, null-role recovery)
- Integration tests with router for protected-route flows (guest, staff, admin)
- Navigation-vs-route-policy coherence tests to prevent drift

**Out of Scope:**
- Supabase RLS policy/database permission changes
- Advanced ACL/resource-level permissions
- Business feature implementation beyond routing placeholders
- [x] `protected-routes-system` (4ab5412)

### 8. User Profile (Create & Update)
**Description:** Implement profile bootstrap on first authenticated login (frontend upsert), a dedicated setup page (`/profile/setup`), profile update form, and profile page. MVP fields for this item: `name` (required for profile completion, prefilled from Google and editable) and `phone` (optional). Behavior is soft gate: users can continue using the app if profile is incomplete, with warning + CTA to complete setup. If profile load fails, allow app access and surface recoverable warning/CTA. Include basic admin profile editing (simple list + selector, edit name/phone only), explicitly excluding analytics, deactivation, and role management.

**Testing Scope:** Unit + integration tests for setup/update/admin-basic-edit flows, plus minimum SQL smoke coverage for profile ownership/first-login path.

**Out of Scope:** Avatar upload/storage, advanced admin user management, analytics, role changes.
- [x] `user-profile-create-update` (0f5e32f)

### 8a. Spanish UX Copy & Localization Baseline
**Description:** Translate the current user-facing application copy to Spanish and establish a lightweight localization baseline so future features do not reintroduce English UI text. Scope includes navigation labels, buttons, placeholders, form labels, validation messages, empty states, loading states, soft-gate notices, auth/session feedback, and route-level fallback screens.

**Implementation Notes:** Keep source code, tests, migrations, and technical documentation in English unless a requirement explicitly says otherwise. Prioritize a central copy strategy or shared constants where it reduces future drift, but avoid introducing unnecessary localization infrastructure for this MVP stage.
- [x] `spanish-ux-copy-localization-baseline` (d3e086c)

### 9. Admin User Management Panel
**Description:** Expand the existing admin users screen into an admin-only user management capability focused on operational essentials: user directory, global role assignment (`customer`, `staff`, `admin`), reversible user deactivation/reactivation, and lightweight operational analytics.

**Scope (MVP):**
- Admin-only user directory with clear loading, empty, success, and error states
- Role management for canonical global roles (`customer`, `staff`, `admin`)
- Reversible deactivate/reactivate flow with explicit confirmation
- Basic operational analytics (small KPI set for admin decisions)
- Spanish user-facing copy for panel states and feedback messages

**Out of Scope (for this item):**
- Advanced analytics/report builder
- Full audit logging platform (covered in #33)
- Multi-tenant org-scoped user administration (covered in #10+)
- Bulk automation workflows

**Testing Scope:**
- Unit tests for role/deactivation action policies and UI state transitions
- Integration tests for admin flows (list users, change role, deactivate/reactivate)
- Guard/authorization regression tests for non-admin access denial
- SQL smoke/RLS tests for admin-only mutation paths and denied non-admin operations

**Open Decisions (must be confirmed before OpenSpec proposal):**
1. Should "all users" include accounts without profile rows?
2. Is role management global-only in this item (not organization membership roles)?
3. Should self-demotion and "last admin" lockout be blocked?
4. Does deactivation mean global app access block, and must it be reversible in MVP?
5. Which exact analytics KPIs are in MVP (for example total users, active vs inactive, role distribution, recent signups)?
- [x] `admin-user-management-panel` (51d8109)

---

## Phase 3: Business Configuration (Single-Tenant)

### 10. Business Settings & Profile
**Description:** Configure the single business through an admin-only settings flow backed by the database as the canonical source of truth. Scope includes business identity, business timezone, weekly business hours, half-day and full-day closure exceptions, and basic branding.

**Scope (MVP):**
- Admin-only business settings page
- Single business identity: visible name
- Business timezone (IANA) used as canonical timezone for the product
- Weekly business hours for the business only (not per-staff availability)
- Closure exceptions supporting full-day and half-day closures
- Basic branding: name, logo, primary brand color, and booking header/subtitle text
- Readiness warning for incomplete business configuration without blocking the app
- Singleton business bootstrap/guarantee if no organization record exists yet

**Out of Scope (for this item):**
- Staff-specific schedules or exceptions
- Booking slot generation
- Advanced theming or full design customization
- Hard blocking reservations based on readiness state

**Testing Scope:**
- Unit tests for timezone and business-hours validation
- Unit tests for closure exception validation, including half-day closures
- Integration tests for admin-only load/update flows and readiness warning states
- SQL smoke/RLS tests for admin-only writes and canonical singleton business persistence
- [x] `business-settings-profile` (23eeabf)

### 11. Staff/Professionals Management
**Description:** Manage the professional directory through an admin-only panel. Every staff member must be linked to an existing app user account. Creating a staff member requires selecting an existing user; linking automatically assigns the `staff` role if not already set. Includes reversible deactivation and basic display name management.

**Scope (MVP):**
- Admin-only staff directory with active/inactive status and linked user indicator
- Create staff member by selecting an existing user and providing a display name
- Auto-assign `staff` role to the linked user if they don't have it already
- Edit staff member display name and active status
- Reversible deactivate/reactivate (no hard deletes)
- Admin-only RPC functions for all staff operations
- Spanish user-facing copy for all states and feedback

**Out of Scope (for this item):**
- Staff members without a linked user account
- Staff availability and weekly schedules (→ #12)
- Service-to-staff assignments (→ #14 or later)
- Creating new user accounts from this panel (uses existing users)
- Global role management beyond auto-assigning `staff` on link (→ #9)
- `organization_memberships` management (not needed for single-tenant MVP)

**Architecture Decisions:**
- `staff_members.profile_user_id` is required (not nullable in this flow)
- Linking a user assigns `user_roles.role = 'staff'` automatically if not already set
- Single-tenant: no org selection needed, always scoped to the singleton org
- Follow RPC pattern from `adminUsers.ts` for service layer

**Testing Scope:**
- Unit tests for display name validation (required, min 2 chars)
- Integration tests for admin flows (create, edit, deactivate/reactivate, link user)
- RLS smoke tests: admin can write, non-admin is denied
- Guard/authorization regression for non-admin access denial
- [x] `staff-professionals-management` (9ef6b83)

### 12. Staff Availability Configuration
**Description:** Allow admins to configure each staff member's recurring weekly availability template and one-off exception dates (days off, holidays, custom hours). The weekly template is set once and repeats indefinitely — it only changes when the admin updates it. This data feeds the slot generator (#16) so customers can see per-staff availability when choosing a service slot.

**Scope (MVP):**
- Recurring weekly template per staff member: which days they work and their start/end time — configured once, applies indefinitely until changed
- Exception dates per staff member: a specific date is a full day off or has custom hours (overrides the recurring weekly template for that date only)
- Admin-only configuration: no staff self-service in this MVP
- New route: `/admin/staff/:staffId/availability` accessible from the staff directory
- Weekly schedule is saved as a full 7-day unit via admin RPC
- Exception dates are added/removed individually
- All mutations via admin-only SECURITY DEFINER RPC functions (following #11 pattern)
- Spanish user-facing copy for all states and feedback

**Data Model:**
- New table `staff_schedules`: one row per staff per weekday (mirrors `business_hours` structure — `is_working`, `starts_at`, `ends_at`)
- New table `staff_schedule_exceptions`: one row per staff per date (`exception_type`: `day_off` or `custom_hours`, optional `starts_at`/`ends_at`)
- Both tables: authenticated SELECT, no direct DML — all writes through SECURITY DEFINER RPCs
- Two migrations: `_tables` (tables, indexes, grants, RLS) and `_rpc` (admin functions)

**Admin RPC Functions:**
- `admin_set_staff_schedule(staff_member_id, schedule_json)` — bulk replace all 7 days atomically
- `admin_upsert_staff_schedule_exception(staff_member_id, date, type, starts_at, ends_at, reason)` — insert or update one exception
- `admin_delete_staff_schedule_exception(staff_member_id, date)` — remove one exception

**Slot Generator Integration (for #16):**
- Slot generator reads: weekly pattern filtered by `is_working = true` + exceptions in the target date range
- Merge logic: exception wins if present for a date, else fall back to weekly pattern
- Timezone context: `organizations.timezone` must be used to convert wall-clock `time` values to UTC

**Out of Scope (for this item):**
- Service-to-staff assignment (→ #14)
- Slot generation and booking availability (→ #16)
- Staff self-service schedule editing
- Break or buffer times within a working day (→ #30)

**Testing Scope:**
- Unit tests: `TimeRangeInput` validation (start < end), weekly schedule validation (min one working day), duplicate exception date rejection, `useStaffAvailability` hook state transitions (load, save, add/remove exception, error states)
- Integration tests: admin can load, edit, and save weekly schedule; admin can add and remove exceptions; dirty-state indicator on unsaved changes; non-admin access denied (RoleGuard regression)
- SQL smoke/RLS tests: authenticated non-admin can SELECT but cannot directly INSERT/UPDATE/DELETE; admin RPCs succeed; non-admin RPC calls raise permission error; constraint violations on invalid hours
- [x] `staff-availability-configuration` (fe52155)

### 13. Multi-Role Users & Role-at-Login Selection
**Description:** Allow a single user account to hold multiple roles simultaneously (e.g., `admin` + `staff`). When a user with multiple roles signs in, they are presented with a role selector to choose which context to enter for that session. The active role governs the entire UI experience — navigation, route access, and data visibility — until they switch or sign out. A role switch option is available in the user menu without requiring a full sign-out.

**Motivation:**
Today `user_roles` enforces a single role per user (`user_id PRIMARY KEY`). An owner-operator who is both admin and staff must choose one role permanently, losing access to the other's UI without a role change by another admin. This feature enables the natural workflow of a business owner who administers the app and also works as a practitioner.

**Scope (MVP):**
- Migrate `user_roles` to a multi-role model: replace the single-row-per-user PK with a composite key `(user_id, role)` — one row per role assignment
- Admin panel: assign/revoke individual roles per user (replacing the current single-role dropdown)
- At login, if the authenticated user has exactly one role → enter directly (no selector shown)
- At login, if the user has multiple roles → show a role selector screen before entering the app
- Active role stored in session context (not persisted to DB) — resets on sign-out
- User menu includes a "Cambiar modo" option to switch active role mid-session without signing out
- All RLS helper functions (`is_admin()`, `is_staff_or_admin()`, `current_app_role()`) updated to work with the new multi-role table
- All existing RLS policies remain valid — they rely on the helper functions, not the table structure directly
- Default role on first sign-up remains `customer` (single row insert)

**Data Model Changes:**
- `user_roles`: drop `PRIMARY KEY (user_id)`, add `PRIMARY KEY (user_id, role)` composite key
- New unique index `ux_user_roles_user_role` on `(user_id, role)`
- Keep `granted_by_user_id`, `created_at`, `updated_at` per role assignment row
- `current_app_role()` remains useful for single-role checks; add `get_user_roles()` to return all assigned roles for the current user
- `is_admin()` / `is_staff_or_admin()`: update to query for role existence in the multi-row set

**Frontend Changes:**
- `UserContext`: extend `role` state to hold `activeRole` (the chosen role for this session) alongside `roles` (all assigned roles)
- New `RoleSelector` component: shown post-authentication when `roles.length > 1`; clean, minimal UI with role cards
- User menu: add "Cambiar modo" entry visible when `roles.length > 1`; switches `activeRole` in context
- `RoleGuard`, navigation config, routing policy: use `activeRole` instead of `role` (transparent after context refactor)
- Admin Users panel: replace role dropdown with multi-role checkboxes; show all assigned roles per user

**Security Considerations:**
- Active role selection is client-side UX only — RLS always enforces all assigned roles server-side (a user with admin role can always use admin RPCs regardless of which active role they chose)
- Admin cannot assign roles above their own privilege level
- "Last admin" lockout: block revoking the `admin` role if the target user is the only remaining admin

**Out of Scope:**
- Organization-scoped role assignments (multi-tenant)
- Role inheritance hierarchy (roles remain flat)
- Per-session role restriction at the DB level (RLS always reflects full assigned roles)
- Staff self-service role requests

**Testing Scope:**
- Unit tests: multi-role context state transitions, `RoleSelector` rendering and selection, role switch in user menu
- Integration tests: login flow with single role (no selector), login flow with multiple roles (selector shown), mid-session role switch
- RLS smoke tests: multi-role table migration; `is_admin()` and `is_staff_or_admin()` correctness; admin-only RPCs still enforced
- Admin panel tests: assign second role, revoke role, last-admin lockout

- [x] `multi-role-users-role-at-login` (163ec00)

### 13b. Fix: Role Switcher Excludes "Cliente" Role
**Description:** When an admin assigns the `customer` role to a user who also has `staff` or `admin`, the "Cambiar modo" menu in the app shell does not show the `customer` option — only `staff` and `admin` appear. The user cannot switch to the customer experience without signing out.

**Root Cause (suspected):** The `RoleSelector` or the "Cambiar modo" menu filters out `customer` from the switchable roles list, likely treating it as a non-switchable default role.

**Scope:**
- Show all assigned roles (including `customer`) in the "Cambiar modo" menu
- Switching to `customer` active role must redirect to the customer home (`/dashboard`) and apply the customer navigation and route guards
- No DB or RLS changes needed — this is a frontend context/navigation fix

- [ ]

---

## Phase 4: Services & Products

### 14. Services Catalog — Admin Management
**Description:** Implement admin-only CRUD for the service catalog. Services define what the business offers: name, duration, price, and an optional image URL. This is the canonical data source for the booking flow (#16).

**Scope (MVP):**
- Admin can create, edit, deactivate, and reactivate services (no hard deletes)
- Fields: `name` (required, ≥2 chars, unique per org), `duration_minutes` (required, 1–480), `price_cents` (required, ≥0), `image_url` (optional URL string), `is_active`
- Price of zero displays as `$0.00`; currency hardcoded as ARS in the frontend
- Active services are readable by all authenticated roles (customer, staff, admin) via RLS SELECT policy
- All mutations are admin-only via SECURITY DEFINER RPC functions
- `AdminServicesPage.tsx`: replace placeholder — service list with name, duration, price, image indicator, status badge; inline create/edit form (following `AdminStaffPage` pattern); deactivate/reactivate toggle
- `src/services/adminServices.ts`: TypeScript service layer with typed interfaces and mapper functions
- Spanish copy for all UI states

**Data Model:**
- No new tables — `services` table already exists in the foundation schema
- Schema addition: `image_url text` nullable column on `services`
- Two migrations: `_tables_grants_rls` (add `image_url` column + grants + RLS policies) and `_admin_rpc` (SECURITY DEFINER functions)

**RPC Functions (SECURITY DEFINER, admin-only):**
- `admin_list_services()` — returns all services for the org including `image_url`
- `admin_create_service(p_name, p_duration_minutes, p_price_cents, p_image_url)` — create new service
- `admin_update_service(p_service_id, p_name, p_duration_minutes, p_price_cents, p_image_url)` — update fields
- `admin_set_service_active(p_service_id, p_is_active)` — deactivate/reactivate

**Testing Scope:**
- Unit tests: field validation (name min 2 chars, duration 1–480, price ≥0, image_url optional/valid URL format)
- Integration tests: admin CRUD flows (create, edit, deactivate, reactivate, with and without image_url); non-admin access denied (RoleGuard regression)
- SQL smoke/RLS tests: admin RPCs succeed; non-admin RPC raises permission error; authenticated non-admin can SELECT but cannot DML directly; unique constraint enforced

**Architecture Decisions (resolved):**
- Staff-service assignment deferred → booking flow (#16) allows any active staff for any active service
- Currency hardcoded as ARS in the frontend (no `currency_code` column)
- Images via nullable `image_url text` column (URL only, no Supabase Storage upload)
- Price zero shown as `$0.00`

**Out of Scope (deferred):**
- Staff-service assignment (`staff_services` junction table) → new item between #14 and #16
- Image file upload (Supabase Storage) → post-MVP
- Customer-facing service catalog → part of #16
- Service categories/grouping → post-MVP
- Manual sort ordering → post-MVP
- Price ranges or multi-currency → post-MVP

- [x] `services-catalog-admin` (da36d46)

### 14b. Staff–Service Assignment
**Description:** Define which services each staff member offers. Not all staff provide the same services — a customer selecting a service should only be offered staff members who are assigned to that service. This is a prerequisite for the booking flow (#16).

**Scope (MVP):**
- New junction table `staff_services` (`staff_member_id` ↔ `service_id`) — no `is_active` flag; assignment exists or it doesn't
- Admin assigns/removes services per staff member via a dedicated sub-route `/admin/staff/:staffId/services`, consistent with the existing `/admin/staff/:staffId/availability` pattern
- "Gestionar servicios" link added per staff row in `AdminStaffPage` (alongside the availability link)
- Assignment panel shows: list of currently assigned services with a per-row "Quitar" button; a dropdown of active services not yet assigned with an "Asignar" button
- Unassignment = hard DELETE from the junction (no soft-delete)
- Only active services can be assigned; if a service is deleted, the FK CASCADE removes the junction row automatically
- All mutations via SECURITY DEFINER RPC functions (admin-only)
- Spanish copy for all UI states (loading, empty, success, error)

**Data Model:**
```
staff_services (
  staff_member_id  uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id       uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES organizations(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (staff_member_id, service_id)
)
```
Indexes: `(service_id, staff_member_id)` for booking flow reads; `(staff_member_id)` for admin panel reads.
RLS: SELECT to `authenticated`; no direct DML — all writes through admin RPCs.

**RPC Functions (SECURITY DEFINER, admin-only):**
- `admin_list_staff_services(p_staff_member_id)` — returns services currently assigned to the staff member
- `admin_list_assignable_services(p_staff_member_id)` — returns active services NOT yet assigned (for the selector)
- `admin_assign_service_to_staff(p_staff_member_id, p_service_id)` — inserts junction row
- `admin_unassign_service_from_staff(p_staff_member_id, p_service_id)` — hard deletes junction row

**Architecture Decisions:**
- No `is_active` on the junction — assignment is binary (exists or doesn't)
- Dedicated sub-route `/admin/staff/:staffId/services` (not inline panel in staff list)
- One service assigned/removed per action (no batch in MVP)
- Booking flow (#16) filters eligible staff by joining `staff_services` on `service_id`

**Out of Scope:**
- Per-staff pricing overrides (→ post-MVP)
- Staff self-service assignment
- Batch assign/unassign
- Booking flow integration test (→ deferred to #16)

**Testing Scope:**
- Unit tests: service layer parameter passing and camelCase mapping for all 4 RPCs
- Integration tests: loading state, empty state (no assignments), empty state (no assignable services), assign action calls RPC and updates list, unassign action calls RPC and removes row, RPC error shows Spanish error message
- RLS smoke tests: authenticated non-admin can SELECT; non-admin cannot directly INSERT/DELETE; admin RPCs succeed; non-admin RPC call raises "No autorizado"

- [x] `staff-service-assignment` (1d7810a)

### 15. Service Booking Configuration
**Description:** Introduce three configurable constraints that govern when and how services can be booked: per-service specific date availability (for equipment- or resource-limited services), per-service concurrent booking capacity, and global booking policy windows (minimum advance notice and maximum booking horizon). All three are read by the slot generator (#16) and booking flow (#17) to determine valid appointment slots. All three are prerequisites for a correctly specified #16.

**Scope (MVP):**

*15a — Per-service specific date availability:*
- New table `service_available_dates`: admin adds specific calendar dates when a service is available (e.g., the days the laser machine is on-site)
- Semantic: if the table has **no entries** for a service → no date restriction (service bookable any day, subject to other constraints); if it has entries → service is only bookable on those listed dates
- New admin sub-route `/admin/services/:serviceId/availability` with a date picker to add/remove dates
- "Gestionar disponibilidad" link per service row in `AdminServicesPage` (mirrors the availability link pattern in `AdminStaffPage`)
- All mutations via SECURITY DEFINER admin RPCs

*15b — Per-service concurrent booking capacity:*
- Add nullable `max_concurrent_bookings integer` column to `services` (null = no limit; ≥1 when set)
- Surface in the service create/edit form in `AdminServicesPage`
- Slot generator (#16) and booking flow (#17) enforce it: count existing bookings for the same `service_id` in overlapping slots and block if at capacity

*15c — Global booking policy (business-wide):*
- Add `booking_min_notice_minutes integer default 60` and `booking_max_horizon_days integer default 60` to `organizations`
- Expose in the Business Settings admin page under a new "Configuración de reservas" section
- Slot generator (#16) uses these as the query time boundaries
- Validation: notice 0–10080 minutes (0 = same-day allowed, max = 1 week); horizon 1–365 days

**Data Model:**
```sql
-- 15a: per-service specific date whitelist
create table public.service_available_dates (
  service_id       uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id),
  available_date   date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (service_id, available_date)
);
-- RLS: authenticated SELECT; no direct DML — all writes through admin RPCs

-- 15b: capacity limit on services
alter table public.services
  add column if not exists max_concurrent_bookings integer
    check (max_concurrent_bookings is null or max_concurrent_bookings >= 1);

-- 15c: booking policy on organizations
alter table public.organizations
  add column if not exists booking_min_notice_minutes integer default 60
    check (booking_min_notice_minutes >= 0 and booking_min_notice_minutes <= 10080),
  add column if not exists booking_max_horizon_days integer default 60
    check (booking_max_horizon_days >= 1 and booking_max_horizon_days <= 365);
```

**Admin RPC Functions (15a, SECURITY DEFINER, admin-only):**
- `admin_list_service_available_dates(p_service_id)` — returns all configured dates for a service
- `admin_add_service_available_date(p_service_id, p_date)` — adds a specific date
- `admin_remove_service_available_date(p_service_id, p_date)` — removes a specific date

**Out of Scope:**
- Per-service recurring weekly availability (already covered implicitly by staff schedules + staff-service assignment)
- Per-service booking policy overrides (MVP is global only)
- Customer-facing display of service date constraints
- Capacity waitlist
- Buffer/cleanup time between bookings (→ #30)

**Testing Scope:**
- Unit tests: `max_concurrent_bookings` validation (null or ≥1); notice/horizon boundary validation (0 and 10080; 1 and 365)
- Integration tests (15a): admin can add and remove dates; date list renders correctly; empty state shown with correct Spanish copy
- Integration tests (15b): capacity field renders in service create/edit form; saved value reflects in service list
- Integration tests (15c): "Configuración de reservas" section in Business Settings; validation errors shown in Spanish
- SQL smoke: CHECK constraint rejects invalid capacity values; PK rejects duplicate `(service_id, available_date)`; admin RPCs succeed; non-admin direct write denied

**Open Decisions:**
1. For 15a: if a service has past dates listed, should they be auto-removed or kept for historical reference? (affects admin UX — show or hide past dates in the list)
2. For 15b: when a service is at capacity for a time slot, should that slot be hidden entirely in the booking UI (#16) or shown as "sin disponibilidad"?

- [x] `service-booking-configuration` (7894e7f)

---

## Phase 5: Appointment Core

### 16. Availability System (Time Slot Generation)
**Description:** Implement a slot generator that computes all bookable time windows for a given service and calendar date. The generator is the single source of truth for "what is bookable" — it is the prerequisite for booking creation (#17) and double-booking prevention (#18).

**Scope (MVP):**

*16a — PostgreSQL RPC: core slot generator*
- New SECURITY DEFINER function `get_available_slots(p_service_id uuid, p_date date)` — granted to `authenticated`
- Returns `TABLE(starts_at timestamptz, ends_at timestamptz)` (UTC); a slot is returned if at least one active, assigned staff member is free at that time (any-staff model — no `p_staff_member_id` parameter)
- For each assigned staff member (`staff_services` joined to `staff_members WHERE is_active = true`), resolves their working window for `p_date`:
  - `staff_schedule_exceptions` wins if present: `day_off` → no slots for this staff; `custom_hours` → use exception times
  - Falls back to `staff_schedules WHERE day_of_week = extract(dow from p_date)`: `is_working = false` → skip; `is_working = true` → use schedule times
  - No schedule rows for this staff → skip (unavailable)
- Intersects each resolved staff window with `business_hours` for `day_of_week`:
  - `business_hours` row absent for that day → treat as business closed; return no slots
  - `is_closed = true` → return no slots for the date
  - Clip staff window to `[max(staff_start, business_opens), min(staff_end, business_closes)]`
- Applies `business_closure_exceptions` for `p_date`:
  - `full_day` → return no slots (entire date blocked)
  - `half_day` → remove the closure sub-window from the available range before clipping
- Converts the effective wall-clock window to UTC via `(p_date + wall_clock_time) AT TIME ZONE organizations.timezone`
- Generates candidate slots by stepping through the window at **30-minute intervals** (constant hardcoded in function); emits only slots where `slot_start + duration_minutes interval ≤ window_end` (overflow protection)
- Drops any slot where a `pending` or `confirmed` appointment for the same staff overlaps `[slot_start, slot_end)` using `starts_at < slot_end AND ends_at > slot_start`
- A slot is included in the result if at least one staff member survives all the above filters for that slot window

*16b — DB: service constraint filters*
- Extends 16a: if `service_available_dates` has any rows for `p_service_id`, only dates in the whitelist are eligible (empty = no date restriction)
- Extends 16a: if `services.max_concurrent_bookings IS NOT NULL`, count all `pending/confirmed` appointments for the service that overlap `[slot_start, slot_end)` across all staff; drop slot if count ≥ limit

*16c — DB + frontend: booking policy window and timezone display*
- Extends 16a: drops slots outside the booking policy window:
  - Earliest valid start = `now() + booking_min_notice_minutes minutes` evaluated in org timezone
  - Latest valid date = today (in org timezone) + `booking_max_horizon_days` days
- Frontend: `formatSlotTime(isoUtc: string, orgTimezone: string): string` utility using `Intl.DateTimeFormat` (no third-party date library); renders times in the business's IANA timezone

*16d — TypeScript: service layer and hooks*
- `src/services/availability.ts`:
  - `getAvailableSlots(serviceId: string, date: string): Promise<AvailableSlot[]>` — calls the RPC
  - `AvailableSlot { starts_at: string; ends_at: string }`
- `useAvailableSlots(serviceId, date)` hook — loading / error / slots state; re-fetches when deps change
- `useActiveServices()` hook — direct SELECT from `services WHERE is_active = true` for the booking wizard service selector

*16e — UI: customer booking wizard (slot selection)*
- Implements `/booking` route as a multi-step wizard:
  - Step 1 `ServiceSelector`: list of active services (name, duration, price in ARS)
  - Step 2 `BookingDatePicker`: calendar constrained to booking policy horizon; days outside `[today + min_notice, today + max_horizon]` are non-selectable
  - Step 3 `SlotGrid`: time slots for the selected date; slots displayed in org timezone using `formatSlotTime`
- Spanish copy for all UI states: loading, no slots available, service unavailable on date, error, no active services
- Selecting a slot navigates to booking creation step (#17 scope), passing `{ serviceId, startsAt, endsAt }`

**Architecture Decisions (resolved):**
- Slot interval: **30 minutes** (hardcoded constant in RPC — document as future config candidate)
- Staff model: **any staff** — `get_available_slots` aggregates across all assigned active staff; no customer-facing staff selection; auto-assignment happens at booking creation (#17)
- Business hours gate: **hard gate** — staff availability is always clipped to business open hours; missing `business_hours` row for a `day_of_week` = business closed (no slots)
- No staff schedule rows: treated as fully unavailable (no slots emitted for that staff)
- Slot conflict model: **optimistic** — no slot reservation; #17/#18 handle conflict detection atomically at INSERT time; customer re-selects on conflict

**Data Model:**
No new tables. New DB function: `get_available_slots`. A `slot_interval_minutes` constant (30) lives inside the RPC.

**Dependencies (all implemented and migrated):**
`staff_schedules` + `staff_schedule_exceptions` (#12) · `business_hours` + `business_closure_exceptions` (#10) · `service_available_dates` + `services.max_concurrent_bookings` (#15a/15b) · `organizations.booking_min_notice_minutes` + `booking_max_horizon_days` (#15c) · `staff_services` (#14b) · `appointments` (foundation schema)

**Out of Scope:**
- Booking creation and confirmation (#17)
- Double-booking atomicity and race condition prevention (#18)
- Customer-facing staff preference selection (any-staff model is sufficient for MVP)
- Break or buffer times within a working day (#30)
- Real-time slot refresh via Supabase Realtime (re-query on interaction is sufficient)
- Customer timezone preference (slots always displayed in org timezone)

**Testing Scope:**
- SQL tests: all schedule/exception permutations, slot overflow enforcement, cancelled appointments do NOT block slots, whitelist semantics (empty = unrestricted), capacity range overlap arithmetic, booking policy window boundaries, business closure exceptions, no-schedule-rows fallback, missing-business-hours-row = closed
- Unit tests: `formatSlotTime` covering DST dates in `America/Argentina/Buenos_Aires`; hook state transitions (loading, success, error, re-fetch); service layer RPC parameter mapping
- Integration tests: full BookingPage wizard steps, loading/empty/error states in Spanish, date picker respects horizon

- [x] `availability-slot-generation` (7aab9f1)

### 17. Appointment Booking (Core Flow)
**Description:** Implement the appointment creation flow that closes the booking wizard. The wizard delivers `{ serviceId, startsAt }` from Step 3 (#16). This item adds Step 4 (review/confirm screen) and the actual appointment INSERT, double-booking prevention, error handling, and post-booking navigation.

**Note:** #17 and #18 are implemented as a single OpenSpec change `appointment-booking`. The exclusion constraint (#18) must be migrated in the same batch as the `create_appointment` RPC (#17) — deploying the RPC without the constraint would leave a live double-booking window.

**Scope (MVP):**

*17a — DB: `appointments` grants and RLS*
- `GRANT SELECT ON public.appointments TO authenticated`
- Customer SELECT policy: `customer_user_id = auth.uid()`
- Staff/admin SELECT policy: `is_staff_or_admin() AND organization_id = singleton org`
- No direct INSERT/UPDATE/DELETE — all writes through SECURITY DEFINER RPCs

*17b / 18a — DB: double-booking exclusion constraint (prerequisite for 17c)*
- `CREATE EXTENSION IF NOT EXISTS btree_gist`
- Drop existing `ux_appointments_staff_exact_slot` unique index (superseded)
- Add exclusion constraint `excl_appointments_staff_no_overlap` using GIST on `(staff_member_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)` WHERE `status IN ('pending', 'confirmed')`
- Half-open interval `[)` semantics: back-to-back bookings (A ends 11:00, B starts 11:00) are allowed
- `cancelled`, `completed`, `no_show` appointments do NOT block new bookings in the same window

*17c — DB: `create_appointment` SECURITY DEFINER RPC*
- Function signature: `create_appointment(p_service_id uuid, p_starts_at timestamptz)` — granted to `authenticated`
- Computes `ends_at` server-side as `p_starts_at + service.duration_minutes` (never trusts client-passed value)
- Validates: service is active; slot is within booking policy window (`booking_min_notice_minutes`, `booking_max_horizon_days` from `organizations`)
- Enforces `max_concurrent_bookings`: `COUNT(*)` of overlapping `pending/confirmed` appointments for the service across all staff; raises `BOOKING_CAPACITY_EXCEEDED` if at limit
- Auto-assigns staff: selects the first active `staff_members` row assigned to the service (via `staff_services`) that has no overlapping `pending/confirmed` appointment for the slot, ordered by `staff_members.created_at ASC` for determinism; raises `BOOKING_NO_STAFF_AVAILABLE` if none found
- INSERTs with `status = 'confirmed'` (auto-confirmed — no manual approval step)
- Returns the created appointment row (`id`, `service_id`, `staff_member_id`, `starts_at`, `ends_at`, `status`, `created_at`)
- The exclusion constraint (17b/18a) provides atomic race protection at the index level

*17d — TypeScript: `src/services/appointments.ts`*
- `createAppointment(params: { serviceId: string; startsAt: string }): Promise<NewAppointment>`
- `NewAppointment { id, serviceId, staffMemberId, startsAt, endsAt, status, createdAt }`
- Error translation:
  - `23P01` (exclusion violation) → "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."
  - `P0001:BOOKING_NO_STAFF_AVAILABLE` → same message as above
  - `P0001:BOOKING_CAPACITY_EXCEEDED` → "El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro."
  - `P0001:BOOKING_OUTSIDE_POLICY_WINDOW` → "Este horario ya no está dentro del rango de reservas permitido."
  - `P0001:BOOKING_SERVICE_NOT_FOUND` → "El servicio seleccionado no está disponible."
- `isConflictError(err)` helper: detects `23P01`, `23505`, and `P0001` with message match

*17e — Frontend: BookingPage Step 4 + routing*
- Add Step 4 to `BookingPage.tsx`: review screen showing service name, formatted date and time (org timezone via `formatSlotTime`), duration, price; "Confirmar reserva" primary CTA; back button to Step 3 to change slot
- No notes field
- On success: `navigate('/booking/confirmation/:appointmentId')`
- On conflict or no-staff error: inline Spanish error message + "Elegir otro turno" CTA back to Step 3
- Register `/booking/confirmation/:appointmentId` in `routing.ts` as `role-restricted` for `customer`; register stub route in `App.tsx` (full page implemented in #19)
- All copy in Spanish

**Architecture Decisions (resolved):**
- Status on creation: **confirmed** (no manual approval step; the business sees bookings as immediately active)
- Notes field: **excluded** from the booking wizard
- Staff assignment: **first available by `created_at` ASC** (deterministic, simple, fair enough for MVP)
- `ends_at`: always computed server-side; client-passed value is discarded
- `#17 + #18` deployed as one OpenSpec change `appointment-booking`

**Data Model:**
No new tables. New DB function: `create_appointment`. New constraint: `excl_appointments_staff_no_overlap`. Existing `ux_appointments_staff_exact_slot` dropped.

**Dependencies:** #16 (`get_available_slots`, `BookingPage` steps 1–3, `formatSlotTime`) · #15 (`max_concurrent_bookings`, `booking_min_notice_minutes`, `booking_max_horizon_days`) · #14b (`staff_services`)

**Out of Scope:**
- Confirmation page content (#19)
- Email notifications (#27)
- Admin/staff appointment views (#20, #23)
- Customer cancellation (#22)
- Reschedule (#21)

**Testing Scope:**
- SQL smoke tests: successful booking returns `confirmed` appointment; `ends_at` equals `starts_at + duration_minutes`; unauthenticated caller denied; `BOOKING_NO_STAFF_AVAILABLE` raised when no staff is free; `BOOKING_CAPACITY_EXCEEDED` raised at capacity; `BOOKING_OUTSIDE_POLICY_WINDOW` raised for past or beyond-horizon slots; customer can SELECT own appointments; customer cannot SELECT other customers' appointments; staff/admin can SELECT all org appointments; exclusion constraint blocks concurrent overlapping bookings for same staff; back-to-back bookings at exact boundary both succeed; `cancelled` appointment does NOT block new booking in same window; `completed` appointment does NOT block; two different staff can have overlapping slots; capacity-null service has no limit enforced
- TypeScript unit tests: `createAppointment()` maps RPC response to `NewAppointment`; `isConflictError()` correctly identifies `23P01`, `P0001` variants, and `23505`; error codes translate to correct Spanish messages
- Integration tests: Step 4 renders service name, formatted date/time; "Confirmar reserva" calls service function; success navigates to `/booking/confirmation/:id`; conflict shows Spanish inline error and back CTA

- [x] `appointment-booking` (da3af57)

### 18. Prevent Double Booking
**Description:** Implemented as part of #17 (`appointment-booking` OpenSpec change). See #17 scope items 17b/18a for the `btree_gist` exclusion constraint and 17d for the `isConflictError()` TypeScript helper. The constraint ensures no two `pending/confirmed` appointments can occupy overlapping time ranges for the same staff member, using atomic GIST index locking that eliminates the race condition where two concurrent INSERTs would otherwise both succeed.

**Architecture Decision:** #17 and #18 are a single OpenSpec change. Deploying `create_appointment` without the exclusion constraint would create a live double-booking window — they must be in the same migration batch.

- [x] `appointment-booking` (da3af57)

### 19. Booking Confirmation Page
**Description:** Implement the post-booking confirmation experience: a dedicated page showing the confirmed appointment details and providing the customer with a clear booking reference and next-step navigation. Email notification is deferred to #27 (Notifications System).

**Scope (MVP):**

*19a — DB: `get_appointment` SECURITY DEFINER RPC*
- Function signature: `get_appointment(p_appointment_id uuid)` — granted to `authenticated`
- Returns a single row joined with: `services.name`, `services.duration_minutes`, `services.price_cents`; `staff_members.display_name`; `organizations.name`, `organizations.timezone`
- Authorization: returns data only when `customer_user_id = auth.uid()` OR `is_staff_or_admin()`; returns empty result if not found or unauthorized (no error raised — prevents ID enumeration)

*19b — Frontend: `BookingConfirmationPage.tsx`*
- Route: `/booking/confirmation/:appointmentId` (registered as stub in #17e; this task completes it)
- On mount: calls `get_appointment` RPC with `appointmentId` from route params
- Success state: service name; date formatted in org timezone; time formatted in org timezone (`formatSlotTime`); duration in minutes; staff display name; business name; status badge ("Confirmado"); booking reference (last 8 characters of the UUID)
- Loading state: spinner with "Cargando tu turno..."
- Not found / unauthorized state: "No encontramos tu turno. Verificá que el enlace sea correcto."
- Error state: "Ocurrió un error al cargar tu turno. Intentá de nuevo."
- CTAs: "Ver mis turnos" → `/appointments`; "Hacer otra reserva" → `/booking`
- Page is refreshable (appointment ID in route param, not navigation state)
- All copy in Spanish

**Architecture Decisions (resolved):**
- Email deferred to #27 — no Edge Function, no `pg_net`, no Resend integration in this item
- `get_appointment` RPC (not direct SELECT + JOIN from frontend) — avoids needing broad `staff_members` READ grants for customers
- Status shown as "Confirmado" (auto-confirmed per #17 decision; no "pendiente" state to handle)
- Email recipients and Resend integration design belong to #27

**Dependencies:** #17 (`create_appointment`, `/booking/confirmation` route stub, `appointments` SELECT RLS) · #16 (`formatSlotTime` utility)

**Out of Scope:**
- Email confirmation (#27)
- Customer cancellation action (#22)
- Staff/admin status management (#20, #23)
- Reschedule (#21)

**Testing Scope:**
- SQL smoke tests: `get_appointment` returns correct joined data for the owning customer; `get_appointment` returns empty for a different customer's appointment; `get_appointment` returns data for staff/admin; unauthenticated caller denied
- TypeScript unit tests: `BookingConfirmationPage` renders service name, formatted date/time, staff name, status badge, booking reference correctly; loading state renders spinner; not-found state renders Spanish error message; "Ver mis turnos" navigates to `/appointments`
- Integration tests: page fetches appointment by ID on mount; shows confirmed status copy; CTAs navigate correctly

- [x] `booking-confirmation-page` (e31e44e)

---

## Phase 6: Appointment Management

### 20. View Appointments (Customer & Staff)
**Description:** Customer views their own appointments at `/appointments`; staff views their assigned appointments at `/staff/appointments`. Both views include a chronological list and a calendar UI (weekly + monthly views with toggle). Calendar integration scoped here; drag-and-drop reschedule deferred to #25.

**Scope (MVP):**

*20a — DB: `list_appointments()` SECURITY DEFINER RPC*
- Function signature: `list_appointments()` — no params, role-aware internally — granted to `authenticated`
- Returns appointments joined with: `services.name`, `services.duration_minutes`, `services.price_cents`; `staff_members.display_name`; `organizations.name`, `organizations.timezone`; `profiles.full_name` as `customer_name` (for staff/admin view)
- Customer caller: returns own appointments (`customer_user_id = auth.uid()`)
- Staff/admin caller: returns appointments where `staff_members.profile_user_id = auth.uid()` (staff) or all org appointments (admin)
- Hard limit: 200 rows ordered by `starts_at DESC`; no cursor pagination in MVP

*20b — Frontend: `AppointmentsPage` (customer — `/appointments`)*
- Two tabs: **Próximos** (`pending`/`confirmed`, `starts_at > now()`) and **Historial** (past + `cancelled`/`completed`/`no_show`)
- Appointment card: service name, date/time formatted in org timezone, staff display name, status badge, booking reference (last 8 chars UUID)
- Card links to `/booking/confirmation/:id` (read-only detail)
- View toggle: **Lista** (tab-based list) ↔ **Calendario** (weekly/monthly calendar with toggle between week and month)
- Weekly calendar: columns per day, appointments as time blocks
- Monthly calendar: month grid, appointments as dots/event chips per day
- Loading, empty (per tab/view), and error states in Spanish

*20c — Frontend: `StaffAppointmentsPage` (staff — `/staff/appointments`)*
- Same tab and calendar structure as 20b
- Card shows customer name (from `profiles.full_name`) instead of staff name
- Staff-only fields visible: customer name, service, date/time, status badge

**Architecture Decisions:**
- SECURITY DEFINER RPC required — customers must not have direct SELECT grants on `staff_members` or `profiles`
- Consistent with `get_appointment` pattern (already in production)
- Calendar UI is read-only; reschedule via calendar drag deferred to #25

**Dependencies:** #17 (`appointments` table, RLS, SELECT grants) · #19 (`get_appointment`, `BookingConfirmationPage` — linked from each card) · #16 (`formatSlotTime` utility)

**Out of Scope:**
- Drag-and-drop reschedule → #25
- iCal / Google Calendar export
- Status filter controls (list-level)
- Cursor/offset pagination (add when volume requires)

**Testing Scope:**
- SQL smoke tests: customer sees only own appointments; staff sees assigned appointments; non-owner gets no data; admin sees all; joined fields correct
- TypeScript: `useAppointments` hook loading/success/error/empty transitions
- Page tests: lista tab switching, calendar renders correct week/month, empty state per tab/view in Spanish

- [x] `view-appointments` (ac22542)

### 21. Reschedule Appointment
**Description:** Customer, staff, and admin can reschedule `pending`/`confirmed` appointments to a new time slot. Entry point: "Reprogramar" CTA on the appointment card (from #20), which navigates to a dedicated `/appointments/:id/reschedule` route that reuses the slot picker from #16.

**Scope (MVP):**

*21a — DB: `reschedule_appointment(p_appointment_id uuid, p_new_starts_at timestamptz)` SECURITY DEFINER RPC*
- Granted to `authenticated`
- Authorization: customer can reschedule own (`customer_user_id = auth.uid()`); staff can reschedule assigned; admin can reschedule any
- Status guard: only `pending` or `confirmed` appointments — raises error for `cancelled`, `completed`, `no_show`
- Policy enforcement: for customer callers, validate `p_new_starts_at >= now() + org.booking_min_notice_minutes`; staff/admin bypass this check
- Conflict detection: `ends_at` recomputed server-side as `p_new_starts_at + service.duration_minutes`; existing `excl_appointments_staff_no_overlap` exclusion constraint enforces no overlap automatically on UPDATE
- Atomically updates `starts_at`, `ends_at`, `updated_at` in one transaction
- Returns updated appointment row on success; raises named error on policy/conflict violation

*21b — Frontend: `/appointments/:id/reschedule` route*
- RoleGuard: `customer`, `staff`, `admin`
- Loads existing appointment via `get_appointment(id)` on mount
- Pre-selects the same service and (if possible) same staff member in slot picker
- Reuses `BookingDatePicker` + `SlotGrid` components from #16
- On slot selection → confirmation step → calls `reschedule_appointment` RPC
- Success: navigates to `/booking/confirmation/:id` (shows updated details)
- Conflict error: inline Spanish message + "Elegir otro turno" CTA
- Policy window error: "No podés reprogramar con tan poca anticipación. Elegí un horario con al menos X horas de anticipación."
- Loading and error states in Spanish

**Architecture Decisions:**
- Separate route (not modal) for reschedule — allows direct link and browser back navigation
- `ends_at` always recomputed server-side — client cannot set it
- Notifications: NOT included in this item. Add a `// TODO(#27): trigger reschedule notification` comment at the hookup point in the RPC

**Dependencies:** #20 (`AppointmentsPage` provides entry CTA) · #16 (`get_available_slots`, `SlotGrid`, `BookingDatePicker` reused) · #17 (exclusion constraint, `appointments` UPDATE RLS)

**Out of Scope:**
- Email/SMS notification → #27
- Changing service or staff during reschedule (same service + same staff, new slot only)
- Admin force-reschedule with `bypass_policy` flag
- Reschedule limit (max N reschedules per appointment)

**Testing Scope:**
- SQL smoke tests: customer reschedules own confirmed appointment; customer cannot reschedule another's; policy window rejects too-soon slot for customer; staff bypasses policy; exclusion constraint blocks conflicting slot; `ends_at` equals `new_starts_at + duration`; cannot reschedule `cancelled` appointment
- TypeScript: `rescheduleAppointment()` error mapping to Spanish
- Page tests: slot picker renders pre-selected service; success navigates to confirmation; conflict error renders inline; policy window error renders with correct copy

- [x] `reschedule-appointment` (5f95472) — 316/316 tests pass; 25 new tests across service, page, and component layers

### 22. Cancel Appointment
**Description:** Customer, staff, and admin can cancel `pending`/`confirmed` appointments. Status is set to `cancelled` (no record deleted). Cancellations respect `booking_min_notice_minutes` for customers. Notifications deferred to #27.

**Scope (MVP):**

*22a — DB: `cancel_appointment(p_appointment_id uuid)` SECURITY DEFINER RPC*
- Granted to `authenticated`
- Authorization: customer can cancel own (`customer_user_id = auth.uid()`); staff can cancel assigned; admin can cancel any
- Status guard: only `pending` or `confirmed` — raises named error for already-`cancelled`, `completed`, `no_show`
- Cancellation policy: for customer callers, validate `appointment.starts_at >= now() + org.booking_min_notice_minutes`; staff/admin bypass this check
- Atomically updates `status = 'cancelled'`, `updated_at = now()`
- Returns updated appointment row on success; raises named error on policy/status violation

*22b — Frontend: Confirmation dialog (inline, not a new route)*
- "Cancelar" button on appointment card (from #20 list) opens a dialog
- Dialog copy: "¿Cancelar este turno? Esta acción no se puede deshacer." → "Sí, cancelar" / "Volver"
- On confirm: calls `cancel_appointment` RPC → optimistically updates status badge to "Cancelado" in list
- Policy window error: "No podés cancelar con tan poca anticipación. Podés cancelarlo con al menos X horas de anticipación."
- Cancelled appointments remain visible in **Historial** tab with "Cancelado" badge
- Error state renders in Spanish

**Architecture Decisions:**
- Status transition only — no record deletion. The `status = 'cancelled'` value already exists in the schema's CHECK constraint.
- Notifications: NOT included in this item. Add a `// TODO(#27): trigger cancellation notification` comment at the hookup point in the RPC
- No `cancellation_note` field in MVP (can be added later)
- Using same `booking_min_notice_minutes` for cancellation — no separate column needed in MVP

**Dependencies:** #20 (`AppointmentsPage` provides the "Cancelar" CTA on each card) · #17 (`appointments` table, UPDATE RLS, `booking_min_notice_minutes` in organizations)

**Out of Scope:**
- Email/SMS notification → #27
- Staff cancellation reason/notes field
- Admin-level force-cancel bypassing policy
- Separate `cancellation_min_notice_minutes` org config (reuses `booking_min_notice_minutes` for now)

**Testing Scope:**
- SQL smoke tests: customer cancels own confirmed appointment → status becomes `cancelled`; cannot cancel another's; policy window rejects cancellation too close to start; staff/admin bypass policy; cannot cancel already-cancelled appointment
- TypeScript: `cancelAppointment()` error mapping to Spanish
- Page/component tests: confirmation dialog renders; "Sí, cancelar" triggers service call; success updates status badge; policy error renders correct copy; error state in Spanish

- [x] `05b4028`

### 23. Admin View All Appointments
**Description:** Admin views all organization appointments at a new `/admin/appointments` route (separate from `/admin/reports`). Includes list view with server-side filtering by status and date range, and offset pagination. Analytics and KPIs deferred to #26.

**Scope (MVP):**

*23a — DB: `admin_list_appointments(p_statuses text[], p_date_from timestamptz, p_date_to timestamptz, p_page integer, p_page_size integer)` SECURITY DEFINER RPC*
- Granted to `authenticated`
- Authorization: raises permission error if caller is not admin (`is_admin()`)
- Returns all org appointments filtered by provided params (NULLs = no filter)
- Columns: `id`, `starts_at`, `ends_at`, `status`, `service_name`, `staff_display_name`, `customer_name` (from `profiles.full_name`, fallback to email or "—" if incomplete), `created_at`
- Default page size: 50; ordered by `starts_at DESC`
- Returns `total_count` for pagination UI

*23b — Frontend: `AdminAppointmentsPage` at `/admin/appointments`*
- New page registered in App.tsx under `RoleGuard allowedRoles={['admin']}`
- Table/list layout with columns: cliente, servicio, profesional, fecha/hora, estado
- Filters panel: status (multi-select chips), date range (two date inputs)
- Pagination: previous/next controls, current page indicator
- Status badges consistent with #20 color system
- Loading, empty, and error states in Spanish
- Navigation link added in admin sidebar/nav

**Architecture Decisions:**
- Separate route from `/admin/reports` — appointments management and reporting/analytics are distinct concerns
- SECURITY DEFINER RPC with server-side filtering prevents full table scans from the client
- Offset pagination (not cursor) — simpler for MVP volume; can migrate to cursor if needed
- `customer_name` from `profiles.full_name` — requires `profiles` SELECT inside SECURITY DEFINER context

**Dependencies:** #20 (`AppointmentSummary` TypeScript interface reused) · #17 (`appointments` table, admin SELECT RLS already covers this but RPC is safer for joins)

**Out of Scope:**
- Full-text search (requires `pg_trgm` or Supabase search — post-MVP)
- Analytics / KPIs → #26 Admin Dashboard
- CSV export
- Appointment detail inline expansion (link to `/booking/confirmation/:id` is sufficient)

**Testing Scope:**
- SQL smoke tests: admin sees all org appointments; non-admin raises permission error; status filter returns only matching rows; date range filter correct; pagination returns correct page; `customer_name` joined correctly; fallback for missing profile
- TypeScript: filter params map to RPC args; camelCase mapping; pagination state
- Page tests: list renders; status filter updates results; date range triggers re-fetch; pagination controls; empty state in Spanish; error state

- [x] `admin-view-appointments` (04df172)

---

## Phase 7: Advanced Features

### 25. Calendar System (UI)
**Description:** Enhance the existing weekly/monthly calendar views (from #20) with drag-and-drop appointment reschedule, staff availability overlay, admin calendar view, and timezone-correct date grouping. Daily time-axis view deferred to post-MVP.

**Scope (MVP):**

*25a — Bug fix: Timezone-correct date grouping (prerequisite)*
- Fix `WeeklyCalendar` and `MonthlyCalendar`: both currently group appointments by `apt.startsAt.slice(0, 10)` (UTC date), causing appointments to appear on the wrong calendar day for non-UTC timezones
- Use `Intl.DateTimeFormat` with `orgTimezone` to derive the correct local calendar date — no third-party date library
- No visual change — only moves appointments to the correct day. This is a prerequisite for DnD correctness.

*25b — Drag & Drop Reschedule (weekly calendar, all roles)*
- New npm dependencies: `@dnd-kit/core` + `@dnd-kit/modifiers`
- All roles (customer, staff, admin) can drag `pending` or `confirmed` appointments to a different day in the weekly calendar
- `cancelled`, `completed`, and `no_show` appointments: no drag handle rendered (cursor: not-allowed)
- On drop to a new day: opens a slot picker modal that calls `get_available_slots(serviceId, newDate)` and displays available slots in org timezone (`formatSlotTime`)
- User selects a slot → `rescheduleAppointment(appointmentId, newStartsAt)` is called → appointment card updates inline
- Conflict error (exclusion constraint or no staff available): inline modal error in Spanish with "Elegir otro horario" retry
- Customer policy violation (min-notice): Spanish error message explaining constraint
- Admin and staff bypass customer min-notice check (existing RPC behavior from #21)
- Dropping on the same day is a no-op
- Monthly calendar: DnD disabled (appointment chips are too small for practical drag interaction)

*25c — Availability overlay (staff weekly calendar only)*
- In the staff weekly calendar (`/staff/appointments`): shade working-hours windows as a light indigo background per day column; non-working hours rendered as neutral gray
- `day_off` exceptions in `staff_schedule_exceptions`: entire column grayed with "Día libre" label overlaid
- Custom hours exceptions: show the custom window instead of the weekly template for that date
- Business closure exceptions: gray column with "Cerrado" label (data already available from `getBusinessSettings()` loaded on mount)
- Data source: direct SELECT from `staff_schedules` WHERE `staff_member_id = logged-in staff's id` — no new RPC needed; `authenticated` SELECT policy already exists from #12
- Admin calendar (`/admin/calendar`): no availability overlay (multiple staff visible simultaneously — per-staff overlay is out of scope)

*25d — Admin calendar view*
- New route `/admin/calendar` (admin-only, `RoleGuard allowedRoles={['admin']}`)
- Admin navigation: "Calendario" link added after "Turnos" in admin sidebar
- Weekly calendar showing all org appointments, fetched via `adminListAppointments()` with `date_from`/`date_to` covering the visible week (no pagination — a week view has bounded volume, max ~50 appointments)
- Admin can drag any `pending` or `confirmed` appointment to a new day → slot picker modal → `rescheduleAppointment` RPC
- Appointment blocks show: customer name + service name (2-line, truncated)
- Loading, empty, and error states in Spanish

*25e — Responsive weekly calendar*
- At `< md` breakpoint: 7-column weekly grid collapses to a single-day vertical strip with prev/next day navigation arrows
- Today is shown by default; user navigates one day at a time
- Appointment blocks are full-width in single-day view
- Monthly calendar: minor touch-target improvements on navigation arrows only

**Data Model:** No new tables or migrations. Uses existing `staff_schedules`, `staff_schedule_exceptions`, `business_hours`, `business_closure_exceptions`, and `appointments` tables.

**New dependencies:** `@dnd-kit/core`, `@dnd-kit/modifiers`

**Architecture Decisions:**
- DnD library: `@dnd-kit/core` — modern, accessible, composable, tree-shakable (not `react-beautiful-dnd`, which is deprecated)
- Slot picker modal reuses `SlotGrid` component from `BookingPage` (#16e), wrapped in a modal dialog
- Admin calendar data: `adminListAppointments()` with week's `date_from`/`date_to` filters (no pagination needed for weekly view)
- Availability overlay data: direct SELECT from `staff_schedules` — no new SECURITY DEFINER RPC required

**Out of Scope (deferred):**
- Daily time-axis view (Google Calendar style) — post-MVP
- Real-time calendar updates via Supabase Realtime
- iCal / Google Calendar export
- Availability overlay in customer or admin calendar
- Batch drag (multiple appointments at once)
- Undo drag action

**Dependencies:**
- #12 (`staff_schedules`, `staff_schedule_exceptions`) — availability overlay data
- #16 (`get_available_slots`, `formatSlotTime`, `SlotGrid`) — slot picker modal
- #20 (`WeeklyCalendar`, `MonthlyCalendar`, `useAppointments` hook, `AppointmentSummary`) — components enhanced here
- #21 (`reschedule_appointment` RPC) — called on DnD drop
- #23 (`adminListAppointments`) — admin calendar data

**Testing Scope:**
- Unit tests: Timezone grouping fix — appointment at `01:00 UTC` in `America/Argentina/Buenos_Aires` appears on the correct prior local day (not the UTC day); DnD `onDrop` handler calls `rescheduleAppointment` with correct `appointmentId` and `newStartsAt`; cancelled appointment has no drag handle; slot picker modal opens with correct `serviceId` + `newDate`; conflict error renders in Spanish; availability overlay renders working-hours shading correctly; `day_off` exception shows "Día libre"; business closure shows "Cerrado"; admin calendar renders all org appointments for the visible week
- Integration tests: Customer drags appointment in weekly calendar → slot picker modal opens → selects slot → appointment updates inline; Staff drags assigned appointment → slot picker → updates; availability overlay visible in staff weekly calendar; Admin navigates to `/admin/calendar` → sees all org appointments; Admin drags appointment to new day → slot picker → updates; Conflict shows inline Spanish error; Customer min-notice policy violation shows Spanish error message

- [x] `calendar-system-ui` (0ccf745)

### 26. Admin Dashboard
**Description:** Implement the admin home experience: a dashboard page at `/admin/dashboard` that surfaces operational KPIs, today's appointment list, quick-access navigation to existing admin sections, and a booking analytics summary for the current month. This is the admin's primary landing page after login, replacing the current landing at `/admin/users`. The existing `/admin/reports` nav entry is removed — reports and dashboard are unified under this item.

**Scope (MVP):**

*26a — DB: `admin_get_dashboard_stats` SECURITY DEFINER RPC*
- New aggregate function `admin_get_dashboard_stats()` — granted to `authenticated`, admin-only via `is_admin()`
- Returns scalar fields (no rows): `today_count`, `week_count`, `month_count`, `pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `no_show_count`, `revenue_cents_month`
- All date windows (`today`, `this week`, `this month`) computed server-side using `organizations.timezone` — no UTC assumption
- `revenue_cents_month`: sum of `services.price_cents` joined to `completed` appointments created this month (price-at-query; document the caveat — no `total_price_cents` column on `appointments` in MVP)
- Non-admin caller raises named permission error
- All counts return `0` (not `null`) when no appointments exist

*26b — TypeScript: `src/services/adminDashboard.ts`*
- `AdminDashboardStats` interface with camelCase fields matching the RPC return shape
- `getAdminDashboardStats(): Promise<AdminDashboardStats>` — calls the RPC; throws on error
- Consistent with existing patterns in `adminAppointments.ts`, `adminStaff.ts`

*26c — Frontend: Route + page scaffold*
- New `src/pages/AdminDashboardPage.tsx`
- Route `/admin/dashboard` registered in `App.tsx` under `RoleGuard allowedRoles={['admin']}`
- New nav entry `id: 'dashboard'` with label "Inicio" as the **first** item in the admin section of `navigationByRole.admin` in `src/lib/navigation.ts`
- Remove the existing `reports` nav entry from `navigationByRole.admin` (route `/admin/reports` can remain in `routePolicies` but is no longer linked from nav)

*26d — Navigation: Change admin landing to `/admin/dashboard`*
- Update `roleHomeByRole.admin` in `src/lib/routing.ts` from `/admin/users` to `/admin/dashboard`
- Update the corresponding routing policy test that asserts the admin home

*26e — Frontend: KPI metric cards*
- 5 `StatCard` components arranged in a responsive grid, powered by `admin_get_dashboard_stats`:
  - "Turnos hoy" (`today_count`)
  - "Turnos esta semana" (`week_count`)
  - "Turnos este mes" (`month_count`)
  - "Confirmados + pendientes hoy" (`confirmed_count + pending_count` for today — derived client-side from today context or separate field)
  - "Ingresos estimados este mes" (`revenue_cents_month`, displayed as ARS currency)
- `useAdminDashboardStats` hook: loading / error / data state
- Loading skeleton and error state in Spanish

*26f — Frontend: Today's appointments widget*
- Compact list of up to 10 appointments for the current date in `organizations.timezone`, ordered by `starts_at ASC`
- Reuses `adminListAppointments` with `dateFrom`/`dateTo` computed from org timezone for "today"
- Each row: hora, cliente, servicio, profesional, estado badge
- "Ver todos los turnos" CTA → `/admin/appointments`
- Empty state: "No hay turnos para hoy."
- Loading and error states in Spanish

*26g — Frontend: Quick-access cards*
- 4 prominent link cards: "Turnos" → `/admin/appointments`, "Calendario" → `/admin/calendar`, "Profesionales" → `/admin/staff`, "Servicios" → `/admin/services`
- No embedded calendar widget — the full calendar is one click away

*26h — Frontend: Booking analytics section*
- Status-breakdown summary table for the current month: one row per status (Confirmado, Pendiente, Cancelado, Completado, No presentado) with count and percentage of total
- Data derived from `admin_get_dashboard_stats` scalar fields (no additional RPC needed)
- No charting library introduced in this item

**Data Model:**
- No new tables
- One new migration: `admin_get_dashboard_stats` SECURITY DEFINER function

**Architecture Decisions:**
- Aggregates computed server-side via dedicated RPC — no client-side aggregation over full row sets
- Revenue = price-at-query (`services.price_cents` at query time); no `total_price_cents` column on `appointments` in MVP; document caveat in code comment
- Weekly calendar: link card only (no embedded widget — `/admin/calendar` is fully built)
- Booking analytics: status-breakdown table only — no charting library
- `/admin/reports` removed from navigation; `AdminReportsPage` stub and route remain in code but are unlinked
- "Today" always computed in `organizations.timezone` on the server

**Dependencies:**
- #23 (`admin_list_appointments` RPC, `adminListAppointments` service — reused for today's widget)
- #25 (`AdminCalendarPage` — linked from quick-access card)
- #10 (`organizations.timezone` — required for timezone-correct date windows)

**Out of Scope:**
- Charting/visualization library — post-MVP
- `total_price_cents` column on `appointments` (price-at-booking tracking)
- Custom date range selector for metrics (today / week / month windows are fixed)
- Per-staff or per-service breakdown charts
- CSV or PDF export
- Admin appointment creation from dashboard
- Real-time updates via Supabase Realtime
- New customers metric (requires additional profile join not proven in aggregates)
- Expanding `/admin/reports` (unlinked stub; separate future item)

**Testing Scope:**
- SQL smoke tests: `admin_get_dashboard_stats` returns correct count per status; non-admin raises error; timezone-correct "today" boundary (appointment at `01:00 UTC` counted on correct local day); all counts return `0` (not `null`) when no appointments; `revenue_cents_month` sums only `completed` appointments
- Unit tests: `useAdminDashboardStats` hook loading / success / error transitions; `StatCard` renders label and value + loading skeleton; `getAdminDashboardStats()` camelCase mapping; today's date boundary computed correctly in `America/Argentina/Buenos_Aires`
- Integration tests: `AdminDashboardPage` mounts and renders metric cards; today's list populates; "Ver todos los turnos" CTA navigates to `/admin/appointments`; loading and error states in Spanish; non-admin accessing `/admin/dashboard` is redirected; admin landing after login resolves to `/admin/dashboard`
- Routing policy test update: `roleHomeByRole.admin === '/admin/dashboard'`

- [ ]

### 27. Notifications System
**Description:** Booking confirmation emails whit resend, cancellation emails, reschedule emails, templates.
- [ ]


---

## Phase 8: Settings & Configuration

### 30. Booking Rules Configuration
**Description:** Min notice time, max bookings per day, cancellation policies, buffer times.
- [ ]

### 31. Notification Preferences
**Description:** User controls for notification types, frequency, channels.
- [ ]

---

## Phase 10: Deployment & Ops

### 35. Deployment Pipeline (Vercel + Supabase)
**Description:** CI/CD setup, environment management, database migrations, production deployment.
- [ ]

### 36. Monitoring & Error Handling
**Description:** Error tracking, performance monitoring, health checks, alerting.
- [ ]

---

## Phase 11: Landing Page & Customer Experience

### 37. Public Business Landing Page
**Description:** Implement a public-facing landing page at `/` that showcases the business to anyone — no login required. Visitors see a photo carousel, business info, services catalog, social links, business hours, and a "Reservar" CTA. Admins configure all content (copy, colors, fonts, images, social links) from a new admin settings panel. Visual style: pastel / wellness / spa-like, modern and responsive.

**Scope (MVP):**

*37a — DB: Supabase Storage setup (prerequisite for 37 and 38)*
- New Supabase Storage bucket: `media` — public read, authenticated write
- Storage RLS policies: anyone can read (`public`); only admins can upload/delete
- Used by: landing carousel images (this item) and service images (#38)
- No new tables — bucket + policies only

*37b — DB: `landing_config` table*
- One row per organization (single-tenant), FK to `organizations`
- Columns: `hero_title text`, `hero_subtitle text`, `about_text text`, `instagram_url text`, `whatsapp_number text`, `primary_color text` (hex), `secondary_color text` (hex), `font_family text` (e.g. `'Inter'`, `'Playfair Display'`), `show_hours boolean default true`
- Carousel images stored as a separate `landing_carousel_images` table: `(id, organization_id, storage_path text, display_order int, alt_text text)` — allows ordered multi-image management
- RLS: `SELECT` for `anon` and `authenticated` (public read — landing is fully public); no direct DML — all writes via admin RPC

*37c — DB: Admin RPCs for landing config*
- `admin_get_landing_config()` — returns `landing_config` row joined with carousel images ordered by `display_order`; admin-only (`is_admin()`); granted to `authenticated`
- `admin_upsert_landing_config(p_hero_title, p_hero_subtitle, p_about_text, p_instagram_url, p_whatsapp_number, p_primary_color, p_secondary_color, p_font_family, p_show_hours)` — INSERT or UPDATE the config row for the org; admin-only SECURITY DEFINER
- `admin_add_carousel_image(p_storage_path, p_display_order, p_alt_text)` — inserts a carousel image row; admin-only
- `admin_remove_carousel_image(p_image_id uuid)` — deletes a carousel image row; admin-only
- `admin_reorder_carousel_images(p_ordered_ids uuid[])` — updates `display_order` for all images atomically; admin-only
- Public read function: `get_landing_config()` — granted to `anon` and `authenticated`; returns same shape as `admin_get_landing_config()` without auth check (used by the public landing page)

*37d — TypeScript: `src/services/landing.ts`*
- `LandingConfig` and `CarouselImage` interfaces (camelCase)
- `getLandingConfig(): Promise<LandingConfig>` — calls `get_landing_config()` RPC (unauthenticated-safe)
- `src/services/adminLanding.ts`: `getAdminLandingConfig()`, `upsertLandingConfig()`, `addCarouselImage()`, `removeCarouselImage()`, `reorderCarouselImages()`
- Supabase Storage helpers: `uploadMediaFile(file: File, path: string): Promise<string>` — uploads to `media` bucket, returns public URL; `deleteMediaFile(path: string): Promise<void>`

*37e — Frontend: Public `LandingPage` at `/`*
- Route: `{ path: '/', access: 'public' }` — already in `routePolicies`; replace the current redirect with the new page component
- Authenticated admin/staff visiting `/` are redirected to their `roleHomeByRole` path (via existing `readiness.ts` / App.tsx routing logic)
- Authenticated customers visiting `/` see the landing (with "Reservar" CTA going to `/booking`)
- Sections (in order):
  1. **Hero** — full-width with carousel of uploaded images (auto-play + manual nav arrows), overlay with `hero_title` and `hero_subtitle`, "Reservar turno" CTA button → `/signin?redirect=/booking` if unauthenticated, `/booking` if customer
  2. **Servicios** — public grid of active services (name, `price_cents` in ARS, `duration_minutes`, `description`, `image_url`); read from existing `services` SELECT RLS (no new RPC needed for anon read — check if anon grant exists, add if not); cards link to no-op (booking CTA at bottom of section)
  3. **Sobre nosotros** — `about_text` rendered as a text block with a soft background
  4. **Horarios** — `business_hours` rendered as a weekly schedule (Mon–Sun, opens/closes or "Cerrado"); visible only if `show_hours = true`; read from existing `business_hours` table (anon SELECT grant needed)
  5. **Contacto / Footer** — Instagram icon link (`instagram_url`), WhatsApp button (`whatsapp_number` → `https://wa.me/{number}`), address and phone from `organizations` if populated; styled footer
- All copy in Spanish; loading states in Spanish
- Design: pastel / wellness / spa-like — soft color palette derived from `primary_color` / `secondary_color`; CSS custom properties set dynamically from `landing_config`; responsive (mobile-first); `font_family` applied via Google Fonts dynamic `<link>` injection

*37f — Frontend: Admin Landing Config Panel at `/admin/settings/landing`*
- New route registered under `RoleGuard allowedRoles={['admin']}` in `App.tsx`
- Nav entry "Personalizar Landing" added to admin settings nav section (after "Configuración del negocio")
- Form sections:
  - **Textos hero**: `hero_title`, `hero_subtitle` text inputs
  - **Sobre nosotros**: `about_text` textarea
  - **Carrusel**: drag-to-reorder list of carousel images; each row shows thumbnail, alt text input, delete button; "Agregar foto" file input → uploads to Supabase Storage → calls `admin_add_carousel_image`
  - **Diseño**: `primary_color` and `secondary_color` color pickers; `font_family` select (3–5 curated options: Inter, Playfair Display, Lato, Nunito, Raleway)
  - **Redes sociales**: `instagram_url` text input, `whatsapp_number` text input
  - **Horarios**: `show_hours` toggle
- "Guardar cambios" → `admin_upsert_landing_config`; "Ver landing" → opens `/` in new tab
- Loading, success ("Cambios guardados"), and error states in Spanish

**Data Model:**
```sql
-- landing_config
create table public.landing_config (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id),
  hero_title       text,
  hero_subtitle    text,
  about_text       text,
  instagram_url    text,
  whatsapp_number  text,
  primary_color    text default '#f9a8d4',
  secondary_color  text default '#fbcfe8',
  font_family      text default 'Inter',
  show_hours       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id)
);

-- landing_carousel_images
create table public.landing_carousel_images (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id),
  storage_path     text not null,
  display_order    int not null default 0,
  alt_text         text,
  created_at       timestamptz not null default now()
);
```

**Architecture Decisions:**
- Public landing reads config via `get_landing_config()` RPC — avoids granting `anon` direct SELECT on `landing_config` table directly (prefer RPC for any future auth logic)
- Dynamic theming via CSS custom properties set inline on `<body>` or the page root — no build-time theme needed
- Google Fonts loaded dynamically based on `font_family` config value — only one font family at a time
- Service images and carousel images share the same `media` Storage bucket with path-based organization: `carousel/`, `services/`
- Anon read grants needed: `services`, `business_hours`, `organizations` — audit and add minimal grants in a migration
- `/` route stays `public` in routePolicies; redirect logic for authenticated admin/staff lives in App.tsx or the `ProtectedRoute` wrapper

**Dependencies:**
- #10 (`business_hours` table — rendered in hours section)
- #14 (`services` table with `is_active` — rendered in services section; `image_url` column)
- #38 (`description` column on `services` — needed for services section; image Storage upload — shared bucket)

**Out of Scope:**
- Blog or news section
- Online payments / pricing tiers
- Custom domain per organization (multi-tenant)
- SEO meta tags and Open Graph (post-MVP)
- Multi-language support
- Animations library (CSS transitions only, no Framer Motion)
- Video support in carousel
- Real-time config preview while editing

**Testing Scope:**
- SQL smoke tests: `get_landing_config()` accessible by anon (no auth); `admin_get_landing_config()` blocked for non-admin; `admin_upsert_landing_config()` persists and `get_landing_config()` reflects update; carousel image add/remove/reorder correct
- Unit tests: `getLandingConfig()` camelCase mapping; `uploadMediaFile()` returns public URL; carousel reorder produces correct `display_order` sequence; CSS custom properties applied correctly from config
- Integration tests: `LandingPage` renders hero with carousel and CTA; services section shows active services with price in ARS; hours section hidden when `show_hours = false`; unauthenticated visitor sees full page; admin/staff visiting `/` are redirected; admin config panel saves and shows success copy in Spanish; carousel upload calls Storage and inserts row
- [x] `public-business-landing-page` (58f0d7b)

### 38. Booking Experience & Service Catalog Redesign
**Description:** Redesign the customer booking wizard and admin services panel to be visually richer: service selection becomes a grid of cards with image, name, price, and description. Admins can upload service images directly (Supabase Storage, set up in #37) and add a description field per service. Requires #37 (Storage bucket) to be implemented first.

**Scope (MVP):**

*38a — DB: `description` column on `services`*
- Migration: `ALTER TABLE services ADD COLUMN description text` (nullable)
- Update `admin_list_services()` RPC to return `description`
- Update `admin_create_service()` and `admin_update_service()` RPCs to accept `p_description text`
- Public SELECT of `services` already includes `description` once column exists (no new policy needed — column is added to the table)

*38b — Frontend: Admin services panel — description field + image upload*
- Add `description` textarea to the create/edit service form in `AdminServicesPage`
- Replace `image_url` text input with a file upload component:
  - "Subir imagen" button → file picker (accepts `image/*`)
  - On select: uploads to Supabase Storage at path `services/{serviceId}` via `uploadMediaFile()` (from #37's storage helpers)
  - On success: stores the public URL in `image_url` via `admin_update_service()`
  - Shows thumbnail preview of current image; "Eliminar imagen" button removes from Storage and clears `image_url`
  - Text URL input removed (replaced by upload)
- Update `AdminService` TypeScript interface to include `description: string | null`

*38c — Frontend: Redesign BookingPage Step 1 — service selection*
- Replace the current plain list with a responsive grid of service cards
- Each card: service image (full card background or top half; fallback to a soft pastel placeholder if no image), service name (bold), duration in minutes, price in ARS, truncated description (2 lines, expandable on click)
- Card hover state: subtle scale + shadow; selected card: accent border + checkmark overlay
- Grid: 2 columns on mobile, 3 on desktop
- "Sin imagen" placeholder: uses `primary_color` from `landing_config` as background with service initial
- Selecting a card highlights it and enables the "Continuar" button
- Loading skeleton grid for the fetch state
- Error and empty states in Spanish

*38d — Frontend: Service detail drawer/modal (optional expand)*
- Clicking the description or an "i" icon on a service card opens a bottom drawer (mobile) or side panel (desktop) with full description, image, name, price, duration, and "Seleccionar este servicio" CTA
- Allows reading the full description before committing to the service

**Architecture Decisions:**
- `uploadMediaFile()` reused from #37 service helpers — no duplication
- Service image path in Storage: `services/{serviceId}.{ext}` — one image per service, overwrite on re-upload
- `image_url` column keeps its current type (`text`) — now populated with Storage public URLs instead of external URLs
- Description is nullable in DB and optional in the form (no validation required for empty)
- `landing_config.primary_color` is used as a fallback card background color — requires `getLandingConfig()` to be called once on app init or within the booking page (could be a shared context)

**Dependencies:**
- #37 (Supabase Storage `media` bucket + `uploadMediaFile()` helper)
- #16 (`BookingPage` steps 1–3, existing `useActiveServices()` hook, `ServiceSelector` component — replaced in this item)
- #14 (`services` table, `admin_list_services()`, `admin_create_service()`, `admin_update_service()`)

**Out of Scope:**
- Multiple images per service (single image per service in MVP)
- Video or 360° media for services
- Customer reviews / ratings per service
- Staff selection within the booking wizard (any-staff model stays from #16)
- Service categories or grouping (post-MVP)
- Booking wizard step 2–4 visual redesign (only Step 1 is redesigned in this item)

**Testing Scope:**
- SQL smoke tests: `description` column exists and is returned by `admin_list_services()`; `admin_create_service()` and `admin_update_service()` accept and persist `p_description`; null description is valid
- Unit tests: `AdminServicesPage` create/edit form renders description textarea; upload component calls `uploadMediaFile()` and then `admin_update_service()` with the returned URL; service card renders name, price in ARS, duration, truncated description; fallback placeholder renders when no `image_url`; card selection state applies accent border
- Integration tests: admin adds description and uploads image — service list reflects both; customer booking step 1 renders service grid with images and descriptions; selecting a card enables "Continuar"; empty state and loading skeleton render correctly in Spanish
- [ ]

---

## Summary

**Total Features:** 35
**Completed:** 21
**In Progress:** 0
**Pending:** 14

**Current Phase:** Phase 7 (Advanced Features)
**Next Feature:** #26 (Admin Dashboard) or #37 (Landing Page)

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- OpenSpec change name → Link to spec-driven change
- Commit hash → Git reference

