## Context

The current application uses session gating in App-level composition and role-aware navigation rendering, but lacks a dedicated SPA routing layer and route authorization contract. This creates a mismatch risk: users can see role-filtered navigation but there is no authoritative route-level guard behavior. Backlog item #7 requires route guards, role-based access control for UI routes, deterministic redirect behavior, and explicit unauthorized handling.

Constraints:
- Keep MVP-first scope and avoid policy-engine overengineering.
- Keep Supabase RLS as the security source of truth for data access.
- Preserve existing UserContext responsibilities for session and role resolution.
- Build a testable route policy baseline to unblock later product pages.

## Goals / Non-Goals

**Goals:**
- Introduce SPA routing for authenticated and public pages.
- Define a single route access matrix for public/authenticated/role-restricted paths.
- Enforce route access through explicit auth and role guard components.
- Apply deterministic redirects:
  - unauthenticated access to protected route -> sign-in
  - authenticated access to sign-in -> role home
  - role homes: customer `/dashboard`, staff `/staff/schedule`, admin `/admin/users`
- Provide dedicated `/unauthorized` route experience.
- Provide not-found route handling for unknown paths.
- Add placeholders for mapped but not-yet-built pages to validate routing and guards.
- Add unit and integration tests for policy, guards, redirects, and coherence with navigation config.

**Non-Goals:**
- Changing Supabase RLS or DB authorization policies.
- Introducing resource-level ACLs or permission matrices beyond role-level route checks.
- Implementing business features behind placeholder routes.
- Reworking session lifecycle architecture.

## Decisions

1. Adopt React Router as the SPA routing foundation
- Decision: use a standard router dependency for route matching, nested layouts, and redirects.
- Rationale: minimizes custom logic and aligns with SPA-first architecture.
- Alternative considered: custom window.location-based routing.
- Why not: higher bug risk and weaker testability.

2. Introduce a centralized route policy registry
- Decision: define route metadata in one place (path, access type, allowed roles, fallback behavior).
- Rationale: single source of truth avoids drift between visible navigation and allowed access.
- Alternative considered: derive authorization from navigation menu only.
- Why not: menu visibility is UX, not an authorization contract.

3. Use layered guards instead of a combined all-in-one guard
- Decision: auth guard handles session presence/loading; role guard handles role authorization.
- Rationale: clearer responsibilities and easier isolated tests.
- Alternative considered: one guard with all branching.
- Why not: more complex branching and harder maintenance.

4. Keep unauthorized as explicit page route
- Decision: denied role access routes to `/unauthorized`.
- Rationale: clear feedback, predictable UX, and easier support/debugging.
- Alternative considered: silent redirect to role home.
- Why not: obscures authorization intent and reduces transparency.

5. Do not use return-to continuation for this MVP
- Decision: after sign-in, always redirect authenticated users to role home.
- Rationale: simpler deterministic flow and lower risk of redirect edge cases.
- Alternative considered: preserve and validate returnTo destination.
- Why not now: additional complexity not required for current phase.

6. Handle unresolved/null role with recoverable error UI
- Decision: when role resolution fails persistently, show retry-capable error state instead of fallback role assignment.
- Rationale: avoids accidental over-permission assumptions while preserving user recovery path.
- Alternative considered: temporary fallback to customer.
- Why not: can mask data/setup issues and create inconsistent behavior.

## Risks / Trade-offs

- [Route policy drift between navigation and guards] -> Add coherence tests that compare role-visible paths and policy-permitted paths.
- [Over-scoping via unfinished pages] -> Limit to placeholders only, defer feature logic to future backlog items.
- [Auth/role loading race conditions] -> Keep guard loading states explicit and test null-role recovery paths.
- [User friction on unauthorized route] -> Provide clear call-to-action to go to role home.

## Migration Plan

1. Add router dependency and integrate top-level router composition.
2. Add centralized route policy registry and role-home mapping.
3. Implement auth and role guard components with loading and denied states.
4. Register authorized app routes, unauthorized route, and not-found route.
5. Replace non-SPA navigation interactions with router navigation.
6. Add placeholder pages for route paths without implementations.
7. Add unit and integration tests for policy, redirects, guards, and coherence.
8. Validate with local test suite before marking change apply-ready.

Rollback strategy:
- Revert routing layer and guard components to current App-level session gating baseline if critical regressions appear.

## Open Questions

- Should `/unauthorized` render inside the authenticated shell or as a standalone layout?
- Should not-found use a single shared page for public/authenticated users or separate variants?
- What retry policy (count/timing) should be used in the null-role recoverable error state?

---

## Dev Utilities

### Dev Role Override (`?devRole=`)

Para simplificar el testing local sin modificar la base de datos, la app soporta un query string param dev-only que overridea el rol resuelto desde `user_roles`. El override **persiste en `localStorage`**, por lo que sobrevive la navegación SPA entre rutas.

**Activar:**
```
http://localhost:5173/?devRole=admin
http://localhost:5173/?devRole=staff
http://localhost:5173/?devRole=customer
```

**Desactivar:**
```
http://localhost:5173/?devRole=off
```

**Comportamiento:**
- Solo activo cuando `import.meta.env.DEV` es `true` (i.e., `npm run dev`).
- Completamente ignorado en builds de producción.
- Al visitar `?devRole=<rol>`, el valor se guarda en `localStorage` bajo la clave `__dev_role_override__`.
- Navegar entre rutas SPA no borra el override — persiste hasta desactivarlo con `?devRole=off`.
- Loguea un warning en consola: `[DEV] Role override active: "admin" (DB role: "customer")`.
- Valores válidos: `admin`, `staff`, `customer`. Valores inválidos se ignoran silenciosamente.

**Implementación:** `src/context/UserContext.tsx` → `getDevRoleOverride()`

### Dev Role Badge

Cuando hay un override activo, se muestra un badge visual fijo en la esquina inferior derecha de la app (solo en dev). Permite cambiar de rol sin usar el query string manualmente.

**Apariencia por rol:**
- `admin` → rojo
- `staff` → amarillo
- `customer` → azul

**Interacción:**
- Click en el badge abre un menú con los 3 roles disponibles.
- El rol activo se indica con un anillo blanco.
- Click en otro rol navega a `/?devRole=<rol>` para cambiar y persistir.
- Botón "desactivar override" navega a `/?devRole=off` y vuelve al rol real de la DB.

**Implementación:** `src/components/routing/DevRoleBadge.tsx`, montado en `ProtectedShellLayout`.
