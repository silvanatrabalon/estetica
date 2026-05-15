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

### 20. View Appointments
**Description:** User view own appointments, staff view assigned appointments, calendar integration.
- [ ]

### 21. Reschedule Appointment
**Description:** Change date/time, validation, conflict detection, notification.
- [ ]

### 22. Cancel Appointment
**Description:** Cancellation flow, soft delete, notification to staff/user.
- [ ]

### 23. Admin View All Appointments
**Description:** System-wide appointment overview, filtering, search, analytics.
- [ ]

---

## Phase 7: Advanced Features

### 24. Scheduling Engine (Advanced Logic)
**Description:** Buffer time handling, timezone conversion layer, complex availability rules.
- [ ]

### 25. Calendar System (UI)
**Description:** Monthly/daily/week view, drag & drop reschedule, availability overlay, responsive design.
- [ ]

### 26. Admin Dashboard
**Description:** Dashboard metrics, today's appointments, weekly calendar view, booking analytics.
- [ ]

### 27. Notifications System
**Description:** Booking confirmation emails whit resend, cancellation emails, reschedule emails, templates.
- [ ]


---

## Phase 8: Settings & Configuration

### 29. Business Settings Panel
**Description:** Central settings for business configuration, timezone, notifications.
- [ ]

### 30. Booking Rules Configuration
**Description:** Min notice time, max bookings per day, cancellation policies, buffer times.
- [ ]

### 31. Notification Preferences
**Description:** User controls for notification types, frequency, channels.
- [ ]

---

## Phase 9: Security & QA

### 32. Security & Data Integrity
**Description:** RLS audit, prevent unauthorized access, prevent tenant data leakage, rate limiting.
- [ ]

### 33. Audit Logging
**Description:** Track all critical actions, user activity log, changes history.
- [ ]

### 34. Edge Cases & Race Conditions (QA)
**Description:** Double booking scenarios, timezone edge cases, daylight saving, concurrent bookings, invalid sessions.
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

## Summary

**Total Features:** 38
**Completed:** 19
**In Progress:** 0
**Pending:** 19

**Current Phase:** Phase 5 (Booking & Scheduling)
**Next Feature:** #16 (Availability System — Time Slot Generation)

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- OpenSpec change name → Link to spec-driven change
- Commit hash → Git reference

