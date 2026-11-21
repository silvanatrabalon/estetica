# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences with equal weight, both on phone and desktop.

- **Clientas (customers).** People who book beauty and aesthetics services for themselves. They arrive from the public page or a link, sign in with Google, pick a service, a day and a time, and get an email confirmation. They later look at, reschedule or cancel their appointments ("Mis turnos"). Mostly on a phone; some on a computer.
- **The owner/admin and the team.** The owner manages services, categories, professionals, hours, closures, booking rules, users and roles, the public page and notifications. Professionals (staff) see their own agenda and, when the admin allows it, edit their own availability. The owner works mostly from a computer but also checks things from the phone.

## Product Purpose

An appointment system for a single aesthetics business, So Beauty. Customers book online without calling or messaging; the owner stops coordinating the agenda by hand. Success: a customer can book in a few taps and receives a confirmation, and the owner can run the schedule, the team and the public page without touching code.

## Positioning

Built for one real salon, not a generic marketplace: the owner decides who can do what (roles, per-professional permission to edit availability), which services exist, when the business is open or closed, how far ahead people can book, and how the public page looks, all from inside the app.

## Operating Context

- Customers book from their phones, usually on the go; the admin works at a desk and on the phone.
- Time zone is configured per business (default Buenos Aires); prices are shown in Argentine pesos.
- Sign-in is with Google only. A person can hold several roles at once (customer, staff, admin) and chooses how to enter.
- Emails are sent automatically on booking, rescheduling and cancellation, to the customer and to the professional; the business can receive a copy.
- Public page: hero, about text, image carousel, services, opening hours (optional), upcoming closures and configurable social links.

## Capabilities and Constraints

- Stack already in place: React, Vite, TypeScript, Tailwind, Supabase, deployed on Vercel. Redesign works inside it.
- Roles: customer, staff, admin. Admin screens: dashboard, appointments, calendar, services, professionals, users and roles, business rules (Negocio), appearance (Apariencia).
- Services have duration, price, optional category, optional image and a simultaneous-capacity limit (new services default to 1).
- All user-facing copy is in Spanish.
- The product is for one business. Reuse for other businesses is not planned.
- Privacy policy and terms pages exist with generic text that a lawyer has not reviewed.
- Undecided: final visual direction, typography and palette (see Brand Commitments).

## Brand Commitments

- The name **So Beauty** (shown as "Estética So Beauty") and its logo stay.
- The voice is warm, close and simple, in Rioplatense Spanish using "vos".
- The current pink palette is **not** binding; colors may change.

## Evidence on Hand

- Real services, categories, professionals and opening hours configured by the owner in the app.
- Carousel images and a logo uploaded by the owner through the app.
- No customer testimonials, ratings, case studies, press or statistics exist. Do not invent them.
- No pricing page or plans; the product is not sold to third parties.

## Product Principles

1. Both audiences matter equally: every screen works well on a phone and on a desktop.
2. The owner is not technical: settings are named in plain words and live where she would look for them.
3. Booking is fast and certain: few steps, clear next action, confirmation the customer can trust.
4. The business is the brand: the app should feel like So Beauty, close and warm, not like generic software.
5. Real data first: screens handle empty, loading and error states gracefully because the data is the owner's real data.

## Accessibility & Inclusion

Customers include people of all ages and varied phones; text must be readable and touch targets comfortable on small screens. No formal standard has been required yet.
