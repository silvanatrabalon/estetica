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
- [x] `role-system-row-level-security`

### 5. User Session Management
**Description:** Session persistence, token refresh, logout flow, expired session handling.
- [ ]

---

## Phase 2: Core Infrastructure

### 6. Layout Shell & Navigation
**Description:** App shell component, navigation bar, sidebar, responsive layout structure.
- [ ]

### 7. Protected Routes System
**Description:** Route guards, role-based access control, redirect logic, unauthorized handling.
- [ ]

### 8. User Profile (Create & Update)
**Description:** User profile creation on first login, profile update form, profile page.
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

**Total Features:** 36  
**Completed:** 3  
**In Progress:** 0  
**Pending:** 33

**Current Phase:** Phase 1 (Foundation & Auth)  
**Next Feature:** #4 (Role System & Row Level Security)

---

## Legend

- `[x]` = Completed
- `[ ]` = Pending
- OpenSpec change name → Link to spec-driven change
- Commit hash → Git reference

