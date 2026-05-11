📦 OpenSpec Feature Inventory — Sistema de Turnos
🧠 0. Base del sistema (foundation specs)

Estos son los primeros sí o sí:

App initialization / project bootstrap
Auth system setup (Supabase Auth)
Role system (user / admin / staff)
Layout shell (app shell + navigation)
Protected routes system
User session management
🔐 1. Authentication & Users
User signup/login with Google OAuth
Email/password login (optional)
Session persistence handling
Logout flow
Role assignment system
User profile creation on first login
User profile update
Admin user management panel
User deactivation / soft delete
🧑‍💼 2. Roles & Permissions (RLS core)
Role model definition (user / admin / staff)
Row Level Security policies base setup
Permission rules engine (conceptual via RLS)
Admin-only route protection
Staff access restrictions
User data isolation rules
🏢 3. Business / Organization Layer (si es SaaS multi-tenant)
Create business entity
Edit business profile
Business settings configuration
Multi-tenant structure (user belongs to business)
Business branding (logo, name, settings)
Business timezone configuration
👨‍⚕️ 4. Staff / Professionals
Create staff member
Assign roles to staff
Staff profile management
Assign staff to services
Staff availability configuration
Staff schedule view
📅 5. Availability System (core del producto)
Define weekly availability rules
Create time slots generator
Block unavailable dates
Exception dates (holidays, overrides)
Dynamic availability calculation
Timezone normalization logic
🧾 6. Services (qué se puede reservar)
Create service type (e.g. haircut, consultation)
Service duration configuration
Service pricing (optional)
Assign services to staff
Service availability rules
📆 7. Appointment Booking (core flow)
View available slots
Select service + staff
Select date
Select time slot
Create booking
Prevent double booking (critical)
Booking confirmation flow
Booking validation rules
🔄 8. Appointment Management
View user appointments
Cancel appointment
Reschedule appointment
Admin view all appointments
Staff view assigned appointments
Appointment status system (pending, confirmed, cancelled)
⏰ 9. Scheduling Engine (hardcore logic)
Overlap detection algorithm
Time slot generation engine
Buffer time handling between appointments
Timezone conversion layer
Concurrency-safe booking logic
📧 10. Notifications System
Booking confirmation email
Cancellation email
Reschedule email
Reminder system (optional)
Email templates management
📊 11. Admin Dashboard
Dashboard overview metrics
Today’s appointments view
Weekly calendar view
Booking analytics
User management panel
Staff management panel
🗂️ 12. Calendar System (UI + logic)
Monthly calendar view
Daily schedule view
Week view
Drag & drop reschedule (optional)
Availability overlay rendering
⚙️ 13. Settings System
Business settings
Working hours configuration
Timezone settings
Notification preferences
Booking rules configuration (min notice, max bookings/day)
🔒 14. Security & Integrity
RLS policy set (critical base spec)
Prevent unauthorized booking
Prevent data leakage between tenants
Audit logging (optional)
Rate limiting (optional)
🧪 15. QA / Edge Cases (IMPORTANT)

Cada uno debería ser spec separado si querés calidad real:

double booking prevention
timezone edge cases
daylight saving changes
concurrent booking race condition
invalid slot selection
expired session during booking
permission bypass attempts
🧱 16. Infrastructure / System Specs
Supabase schema design
Database migration strategy
Indexing strategy
API (if edge functions exist)
Env variables management
Deployment pipeline (Vercel + Supabase)