## 1. Routing Foundation

- [x] 1.1 Add and configure SPA router integration at app entry level
- [x] 1.2 Define central route registry with access metadata (public/authenticated/role-restricted)
- [x] 1.3 Define role-home mapping (`customer`, `staff`, `admin`) in routing policy module

## 2. Guard Implementation

- [x] 2.1 Implement authentication guard with loading and unauthenticated redirect behavior
- [x] 2.2 Implement role guard for restricted routes with `/unauthorized` redirect on denial
- [x] 2.3 Implement recoverable null-role error state with retry action

## 3. Route Composition and Screens

- [x] 3.1 Compose protected routes inside app shell layout
- [x] 3.2 Add `/unauthorized` route and not-found route handling
- [x] 3.3 Add placeholder pages for mapped routes not yet implemented

## 4. Navigation Alignment

- [x] 4.1 Replace non-SPA navigation interactions with router navigation actions
- [x] 4.2 Ensure navigation visibility remains role-based and consistent with route policy

## 5. Automated Testing

- [x] 5.1 Add unit tests for route access policy evaluation
- [x] 5.2 Add unit tests for redirect resolution behavior
- [x] 5.3 Add unit tests for auth and role guards (loading, allowed, denied, null-role)
- [x] 5.4 Add integration tests for protected-route flows (guest, staff, admin)
- [x] 5.5 Add navigation-vs-route-policy coherence tests

## 6. Validation

- [x] 6.1 Run full test suite and fix regressions related to routing and guards
- [x] 6.2 Verify no RLS/database permission changes are introduced in this change
- [x] 6.3 Update backlog/traceability references after implementation is complete
