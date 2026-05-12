## Why

Authenticated users currently have no implemented profile workflow despite profile-related routing and placeholders already existing in the app. This change establishes a concrete MVP profile lifecycle now to unblock user-facing personalization and basic admin support without expanding into full user management.

## What Changes

- Add first-login profile bootstrap using frontend upsert logic for authenticated users.
- Add a dedicated profile setup route at `/profile/setup` with soft-gate behavior.
- Implement profile page and update form for self-service edits.
- Define MVP profile fields as `name` (required for completion, prefilled from Google and editable) and `phone` (optional).
- On profile load failure, allow app continuation and surface warning + retry/complete-profile CTA.
- Add basic admin profile editing scope (simple list + selector, edit `name` and `phone` only).
- Explicitly exclude avatar upload/storage, analytics, deactivation, and role management from this change.

## Capabilities

### New Capabilities
- `user-profile-create-update`: Introduces first-login profile bootstrap, profile setup flow, self-service profile editing, and basic admin profile editing for name/phone fields.

### Modified Capabilities
- None.

## Impact

- Affected areas include profile routing, user/session bootstrap orchestration, profile data access services, profile-related UI pages/forms, and admin basic profile edit UI flow.
- Adds new OpenSpec capability docs under this change for implementation and validation.
- Testing impact includes new/updated unit and integration tests, plus minimum SQL smoke coverage for profile ownership and first-login profile path.
