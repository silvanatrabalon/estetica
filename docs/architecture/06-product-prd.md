# Product PRD (Project-Specific Layer)

This file contains product-specific requirements and must NOT be reused across projects.

## Purpose
Define the business logic and domain for the current SaaS application.

## Rules
- This is the ONLY product-specific document
- Everything else in /architecture is reusable framework
- This file can be replaced when reusing the template

---

## Product Overview

**Estetica** is a SaaS platform for managing beauty and wellness services. It enables beauty studios, spas, and salons to streamline appointment scheduling, staff management, and customer relationships.

---

## Problem

Beauty studios and salons struggle with:
- Manual appointment scheduling (spreadsheets, WhatsApp, phone calls)
- Double-bookings and scheduling conflicts
- Lack of visibility into availability and staff capacity
- Poor customer communication (confirmations, reminders, cancellations)
- No historical records or analytics on bookings
- Inefficient staff assignment and workload distribution
- Limited ability to manage multiple services and pricing

**Estetica** solves these problems with an integrated platform where customers book appointments online and staff manage their schedules efficiently.

---

## Users

### 1. **Customers**
- Browse available services and staff
- Book appointments online with preferred dates/times
- View their appointment history
- Reschedule or cancel appointments
- Receive confirmations and reminders
- Manage their profile

### 2. **Staff Members**
- View assigned appointments and schedule
- See upcoming appointments for the day
- Manage their availability and working hours
- Track their booked appointments
- View customer information before appointments
- Update their profile and specialties

### 3. **Administrators**
- Manage all users (customers, staff, admins)
- Add and manage services offered
- Configure pricing and packages
- Set business hours and holidays
- View system-wide analytics and insights
- Manage organization settings
- Create staff schedules and workloads
- View all appointments and reports
- Configure notifications and reminders
- Manage roles and permissions

---

## Core Features

### Phase 1: Foundation (MVP)
1. **User Authentication**
   - Google OAuth login
   - Email/password registration (future)
   - Role-based access (customer, staff, admin)

2. **User Profiles**
   - Create and edit user profiles
   - Store contact information
   - Profile preferences and settings

3. **Admin User Management**
   - Add/remove users
   - Assign roles and permissions
   - View user directory
   - Manage user information

### Phase 2: Service & Availability Management
4. **Service Management**
   - Create and manage services offered
   - Set pricing for each service
   - Set duration and requirements
   - Assign staff to services

5. **Staff Management**
   - Manage staff profiles
   - Set working hours
   - Assign staff to services
   - View staff capacity and workload
   - Manage staff availability

6. **Business Settings**
   - Configure business hours
   - Set timezone
   - Define holidays and days off
   - Customize notification preferences

### Phase 3: Appointment Booking
7. **Booking System**
   - Search available services
   - View available time slots
   - Book appointments with preferred staff
   - Instant confirmation
   - Booking history

8. **Appointment Management (Customers)**
   - View my appointments
   - Reschedule appointments
   - Cancel appointments
   - Download confirmation

9. **Appointment Management (Staff)**
   - View assigned appointments
   - View customer details
   - Update appointment status
   - Track daily schedule

10. **Appointment Management (Admin)**
    - View all appointments
    - Reschedule on behalf of users
    - Cancel appointments with notification
    - Override availability
    - View appointment analytics

### Phase 4: Communication & Reminders
11. **Notifications**
    - Booking confirmation emails
    - Cancellation notifications
    - Reschedule notifications
    - Template management

12. **Reminders**
    - Automated reminders before appointments
    - Customizable reminder timing
    - Email reminders (SMS future)
    - Opt-in/out preferences

### Phase 5: Calendar & Visualization
13. **Calendar System**
    - Month/week/day views
    - Color-coded appointments
    - Availability overlay
    - Drag & drop reschedule
    - Responsive design for mobile

14. **Admin Dashboard**
    - Today's appointments overview
    - Weekly schedule view
    - Booking analytics and metrics
    - Revenue insights
    - Staff performance metrics

---

## Domain Model

### Core Entities

**Users**
- `user_id` (unique identifier)
- `email` (unique)
- `name` (display name)
- `phone` (optional)
- `role` (customer, staff, admin)
- `created_at`, `updated_at`

**Services**
- `service_id`
- `name`
- `description`
- `duration` (in minutes)
- `price`
- `staff_assignment` (one or many)
- `active` (true/false)

**Appointments**
- `appointment_id`
- `customer_id` (who booked)
- `service_id` (what service)
- `staff_id` (assigned staff)
- `start_time`
- `end_time`
- `status` (confirmed, completed, cancelled)
- `notes` (customer or staff notes)
- `created_at`, `cancelled_at` (if cancelled)

**Staff**
- `staff_id` (references user)
- `specialties` (services they offer)
- `working_hours` (start/end times by day)
- `availability` (calendar of free slots)
- `bio` (professional bio)

**Business Settings**
- `business_hours` (open/close times)
- `timezone` (for scheduling)
- `holidays` (blocked dates)
- `notification_settings` (email templates, timing)

---

## User Workflows

### Workflow 1: Customer Books Appointment
1. Customer logs in via Google OAuth
2. Completes their profile (name, phone, preferences)
3. Browses available services
4. Selects service → sees available staff
5. Picks preferred staff → sees available time slots
6. Selects date/time → confirms booking
7. Receives confirmation email
8. Appointment appears in their calendar

### Workflow 2: Staff Manages Schedule
1. Staff member logs in
2. Views their appointments for today/week
3. Can see customer details before appointment
4. Can reschedule their own appointments
5. Receives reminder before appointments
6. Marks appointment as complete

### Workflow 3: Admin Sets Up Business
1. Admin logs in
2. Adds services with pricing and duration
3. Adds staff members and assigns to services
4. Sets business hours and timezone
5. Configures notification templates
6. Views dashboard with today's appointments
7. Can manually reschedule or cancel any appointment

### Workflow 4: Customer Reschedules Appointment
1. Customer views their appointments
2. Clicks reschedule on an appointment
3. Sees new available time slots
4. Selects new date/time
5. Receives reschedule confirmation
6. Staff is notified of change

---

## Business Rules & Constraints

### Booking Rules
- Customers can only book appointments during business hours
- Appointment duration cannot exceed staff's availability window
- Customers cannot book appointments in the past
- Each time slot can only be booked once
- Services must have at least one staff member assigned

### Staff Rules
- Staff members cannot have overlapping appointments
- Staff must set their working hours
- Staff cannot book other staff's time

### Admin Rules
- Only admins can create/edit services and staff
- Only admins can view all appointments and analytics
- Only admins can override availability
- Admins can act on behalf of customers (reschedule, cancel)

### Notification Rules
- Confirmations sent immediately after booking
- Reminders sent X hours before appointment (configurable)
- Cancellations sent immediately
- Rescheduling notifications for both parties

### Availability Rules
- Staff availability based on working hours
- Holidays/days-off block all appointments
- Lunch breaks can be defined as unavailable slots
- Buffer time between appointments (optional)

---

## Success Metrics

- **Adoption**: Number of businesses onboarded
- **Engagement**: Appointments booked per week
- **User Satisfaction**: Customer booking completion rate
- **Staff Efficiency**: Average appointments per staff per day
- **Business Growth**: Revenue insights and trends
- **Retention**: Monthly active users and churn rate

---

## Future Enhancements (Out of Scope MVP)

- SMS reminders and bookings
- Multi-location management
- Package/membership deals
- Waitlist management
- Customer feedback and ratings
- Payment processing integration
- Integrations with Google Calendar, Outlook
- WhatsApp integration
- Analytics and reporting dashboard
- Mobile native apps