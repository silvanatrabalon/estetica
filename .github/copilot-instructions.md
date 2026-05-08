# Project Instructions

## Project Architecture

This project follows a modern SPA-first and serverless/BaaS-first architecture.

Primary stack:

* React
* Vite
* TypeScript
* TailwindCSS
* Supabase
* PostgreSQL
* Vercel
* Resend

The project is designed for incremental MVP-first development.

---

# General Development Principles

* Use TypeScript in all source files.
* Do not use `any` unless explicitly justified.
* Prefer explicit and readable code over clever abstractions.
* Keep implementations simple and production-ready.
* Avoid premature optimization and overengineering.
* Reuse existing patterns before introducing new ones.
* Keep functions and components small, focused, and composable.
* Prefer feature/module organization when appropriate.
* Design for incremental scalability.

---

# Frontend Guidelines

* Prefer reusable React components.
* Use functional components and hooks.
* Keep UI, business logic, and service access separated.
* Prefer local state before introducing global state.
* Use async/await instead of `.then()`.
* Handle loading, empty, and error states properly.
* Build responsive and accessible interfaces.
* Prefer composition over deeply nested component hierarchies.

---

# Supabase & Backend Guidelines

* Prefer Supabase native capabilities before creating custom backend logic.
* Avoid creating traditional REST APIs unless strictly necessary.
* Use Row Level Security (RLS) as the primary authorization layer.
* Never expose service-role keys to the frontend.
* Keep database access centralized and reusable.
* Create edge/serverless functions only when:

  * secrets are required
  * privileged operations are needed
  * external integrations are necessary
  * scheduled/background logic is required

---

# Database Guidelines

* Use clear and consistent naming conventions.
* Prefer normalized PostgreSQL schemas.
* Define constraints and indexes explicitly.
* Keep migrations organized and incremental.
* Avoid unnecessary complexity in early-stage schemas.

---

# Authentication & Security

* Use Supabase Auth for authentication.
* Prefer role-based authorization patterns.
* Handle environment variables securely.
* Never hardcode secrets or API keys.
* Ensure frontend-safe vs server-only environment variables are clearly separated.

---

# Error Handling

* Use proper error handling with try/catch where appropriate.
* Surface user-friendly frontend error states.
* Avoid silent failures.
* Log useful debugging information without leaking sensitive data.

---

# Code Quality

* Favor maintainability over abstraction.
* Keep files modular and readable.
* Prefer predictable folder structures.
* Minimize duplication.
* Write production-ready code by default.

---

# Testing

* When implementing features, suggest:

  * basic unit tests
  * integration tests
  * critical user-flow tests

Focus testing efforts on:

* authentication
* permissions
* scheduling/business logic
* edge cases

---

# Architectural Philosophy

Before introducing new technologies or patterns, evaluate:

* Is this necessary for the current stage?
* Does the platform already solve this problem?
* Does this reduce or increase complexity?
* Is the solution maintainable long-term?
* Does this align with MVP-first principles?

Prefer:

* simplicity
* composability
* modularity
* platform-native solutions

Avoid:

* unnecessary abstractions
* premature microservices
* excessive global state
* tightly coupled modules
