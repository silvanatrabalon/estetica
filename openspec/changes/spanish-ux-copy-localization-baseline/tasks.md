## 1. Copy Audit And Baseline Definition

- [x] 1.1 Inventory all current user-facing English copy across routes, shell navigation, forms, notices, and fallback screens
- [x] 1.2 Define a consistent Spanish terminology baseline (tone, wording, repeated terms) for customer, staff, and admin UI contexts
- [x] 1.3 Identify repeated strings suitable for shared copy constants versus single-use colocated copy

## 2. Spanish UX Copy Implementation

- [x] 2.1 Translate high-visibility route-level and shell copy to Spanish (navigation labels, headers, primary actions)
- [x] 2.2 Translate form and feedback copy to Spanish (labels, placeholders, validation, loading, empty, warning, and error states)
- [x] 2.3 Translate route-level fallback and recovery experiences to Spanish (unauthorized, not-found, session/role recovery, soft-gate notices)

## 3. Lightweight Localization Structure

- [x] 3.1 Introduce or update a lightweight shared copy organization for repeated user-facing strings without adding heavyweight i18n runtime complexity
- [x] 3.2 Refactor duplicated repeated messages to use the shared copy baseline where practical while keeping single-use text colocated
- [x] 3.3 Ensure internal implementation artifacts remain in English unless explicitly required otherwise

## 4. Validation And Regression Safety

- [x] 4.1 Update affected UI tests and assertions to match Spanish user-facing copy
- [x] 4.2 Run targeted tests for routing, auth/session feedback, and profile/admin flows impacted by copy changes
- [x] 4.3 Perform manual QA sweep of key user journeys to confirm Spanish coverage and consistent terminology

## 5. Completion And Tracking

- [x] 5.1 Verify implemented behavior against all scenarios in `spanish-ux-copy-localization-baseline` spec
- [ ] 5.2 Mark backlog item 8a as complete with commit reference once implementation and checks are done
