## 1. Profile Domain Foundations

- [x] 1.1 Add/extend profile service layer for get/upsert/update operations using Supabase client
- [x] 1.2 Define profile completion helper logic (`name` required, `phone` optional)
- [x] 1.3 Map profile bootstrap result states (`complete`, `incomplete`, `load-error`) for UI consumption

## 2. First-Login Bootstrap and Setup Route

- [x] 2.1 Integrate frontend profile upsert into authenticated bootstrap flow
- [x] 2.2 Add `/profile/setup` route and wire it into protected authenticated routing
- [x] 2.3 Implement soft-gate behavior with warning + CTA instead of hard blocking
- [x] 2.4 Prefill setup `name` from Google metadata and keep it editable

## 3. Profile Pages and Forms

- [x] 3.1 Replace profile placeholder page with production-ready self profile form (`name`, optional `phone`)
- [x] 3.2 Implement loading/saving/success/error states on setup and profile pages
- [x] 3.3 Implement recoverable profile-load-failure UX that allows app continuation and offers retry/CTA
- [x] 3.4 Update user menu identity rendering to prefer profile name with email fallback

## 4. Basic Admin Profile Editing (Scoped)

- [x] 4.1 Add basic admin list + selector UI for choosing user profiles
- [x] 4.2 Add admin edit flow limited to `name` and `phone` fields
- [x] 4.3 Enforce explicit UI guardrails excluding role changes, deactivation, and analytics in this flow

## 5. Testing and Validation

- [x] 5.1 Add unit tests for profile service and profile completion logic
- [x] 5.2 Add integration tests for setup flow, self-update flow, and load-error soft-gate behavior
- [x] 5.3 Add integration tests for basic admin profile edit flow
- [x] 5.4 Add minimum SQL smoke tests for profile ownership and first-login profile path

## 6. Final Verification

- [x] 6.1 Verify acceptance criteria from spec scenarios against implemented behavior
- [x] 6.2 Run test suite segments related to profile, routing, and admin edit flow
- [x] 6.3 Update backlog progress status after implementation is complete
