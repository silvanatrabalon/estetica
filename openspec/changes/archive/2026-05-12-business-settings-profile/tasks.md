## 1. Data Model And Contracts

- [x] 1.1 Define singleton business bootstrap strategy and document how the canonical organization record is resolved when absent
- [x] 1.2 Design the canonical persistence model for branding basics, weekly business hours, and full-day or half-day closure exceptions
- [x] 1.3 Define business readiness criteria for warning-only behavior based on name, timezone, and minimum weekly-hours completeness

## 2. Backend Schema And Authorization

- [x] 2.1 Add migrations for singleton business metadata, weekly business hours, and closure exception tables or columns with integrity constraints
- [x] 2.2 Implement admin-only read and update access patterns for business settings, including singleton resolution without frontend-hardcoded IDs
- [x] 2.3 Enforce RLS-safe admin-only mutation behavior for business settings, weekly hours, and closure exceptions

## 3. Frontend Admin Settings Experience

- [x] 3.1 Add admin route and navigation entry for the business settings page within the existing protected-route model
- [x] 3.2 Implement the business settings page with deterministic loading, empty, success, recoverable error, and readiness warning states in Spanish
- [x] 3.3 Implement editing flows for branding basics, timezone, weekly business hours, and full-day or half-day closure exceptions

## 4. Validation And Regression Safety

- [x] 4.1 Add unit tests for timezone validation, business-hours validation, closure exception validation, and readiness computation
- [x] 4.2 Add integration tests for admin-only access, canonical settings load or save flows, and readiness warning behavior
- [x] 4.3 Add SQL smoke or RLS tests for singleton persistence, schedule constraints, closure constraints, and non-admin denial paths
- [x] 4.4 Run targeted regression coverage for admin navigation and protected-route behavior after adding the new settings surface

## 5. Completion And Verification

- [x] 5.1 Verify the implemented feature against business-settings-profile scenarios and confirm warning-only readiness behavior
- [x] 5.2 Update backlog tracking with the change name and implementation commit reference when complete
  - Change name: `business-settings-profile`
  - Commit: `584acd8` (feat: implement business settings & profile management)