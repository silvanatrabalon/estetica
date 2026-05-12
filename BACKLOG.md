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
- [ ]

### 9. Admin User Management Panel
**Description:** View all users, manage roles, deactivate users, user analytics.
- [ ]

---

## Phase 3: Multi-Tenant Organization

### 10. Business/Organization Layer
**Description:** Create business entity, multi-tenant structure, business belongs-to relationship.
- [ ]

### 11. Business Profile & Settings
**Description:** Edit business info, branding (logo/name), timezone config, working hours.
- [ ]

### 12. Staff/Professionals Management
**Description:** Create staff members, assign roles, staff profile, manage staff within business.
- [ ]

### 13. Staff Availability Configuration
**Description:** Define weekly availability rules, set working hours, block unavailable dates, exception dates (holidays).
- [ ]

---

## Phase 4: Services & Products

### 14. Services (Offerings)
**Description:** Create service types (e.g., haircut, consultation), set duration, pricing, assign to staff.
- [ ]

### 15. Service Availability Rules
**Description:** Define which services are available when, service-specific availability logic.
- [ ]

---

## Phase 5: Appointment Core

### 16. Availability System (Time Slot Generation)
**Description:** Dynamic availability calculation, time slot generator, timezone normalization, availability overlay.
- [ ]

### 17. Appointment Booking (Core Flow)
**Description:** View available slots, select service/staff/date/time, create booking, validation rules.
- [ ]

### 18. Prevent Double Booking
**Description:** Overlap detection algorithm, concurrency-safe booking logic, race condition prevention.
- [ ]

### 19. Booking Confirmation Flow
**Description:** Confirmation page, email confirmation, booking status system (pending/confirmed/cancelled).
- [ ]

---

## Phase 6: Appointment Management

### 20. View Appointments (User & Staff)
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
**Description:** Booking confirmation emails, cancellation emails, reschedule emails, templates.
- [ ]

### 28. Reminder System
**Description:** Automated reminders before appointments, customizable timing, email/SMS.
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

**Total Features:** 37  
**Completed:** 10  
**In Progress:** 0  
**Pending:** 27

**Current Phase:** Phase 2 (Core Infrastructure)  
**Next Feature:** #8a (Spanish UX Copy & Localization Baseline)

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- OpenSpec change name → Link to spec-driven change
- Commit hash → Git reference

