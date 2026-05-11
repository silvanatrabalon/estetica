## Context

The layout shell and role-based navigation are implemented and stable, but visual language is still close to scaffold defaults. Upcoming features (protected routes, profile flows, admin workflows) will reuse these shell surfaces, so a coherent design system baseline must be established now to avoid fragmented UI decisions and repeated restyling.

Constraints:
- Mobile-first behavior is required for all style decisions.
- Existing React + Tailwind + TypeScript architecture should be preserved.
- No backend, auth, or database behavior changes are in scope.
- Accessibility and contrast must remain acceptable while introducing stronger visual identity.

## Goals / Non-Goals

**Goals:**
- Define a consistent visual system for shell/navigation via CSS variables and Tailwind theme mapping.
- Introduce distinctive typography (non-default stack) and reusable spacing/motion tokens.
- Improve interactive polish for sidebar, nav links, and user menu with predictable animation durations.
- Enforce mobile-first styles with desktop enhancements layered via breakpoints.
- Preserve or improve accessibility for focus, contrast, and semantic navigation states.

**Non-Goals:**
- Redesigning product flows or adding new pages/routes.
- Implementing dark mode toggle logic or theming preference persistence.
- Refactoring auth/session logic or role authorization behavior.
- Building a complete enterprise design token pipeline (Figma sync, token build system).

## Decisions

### 1. Use CSS variable tokens as source of truth
Decision: Add visual tokens in `src/index.css` (`--color-*`, `--space-*`, `--motion-*`, `--radius-*`) and reference them from Tailwind extension where practical.

Rationale: This keeps styling centralized, easy to iterate, and framework-aligned while avoiding overengineering.

Alternative considered: Keep values directly in component class strings. Rejected because it increases duplication and weakens consistency.

### 2. Introduce a distinctive font pairing at app root
Decision: Import and apply a brand-forward heading/body pairing in global styles and Tailwind font families.

Rationale: Typography creates immediate visual differentiation with low structural risk.

Alternative considered: Keep system/default fonts. Rejected because it does not satisfy polish goals.

### 3. Standardize motion timings by interaction class
Decision: Use explicit motion tiers:
- Structural transitions: 300ms (sidebar open/close)
- Overlay transitions: 200ms (mobile backdrop)
- Micro-interactions: 200ms (nav hover/focus/user menu)

Rationale: Predictable motion makes interactions feel intentional and consistent.

Alternative considered: Per-component ad hoc timings. Rejected for inconsistency risk.

### 4. Mobile-first rule enforcement
Decision: Base classes target mobile defaults, with `md:`/`lg:` enhancements only where needed (spacing, layout density, menu behavior).

Rationale: Matches product usage profile and prevents desktop-first regressions.

Alternative considered: Desktop-first with overrides. Rejected because it increases override complexity and mobile drift.

### 5. Accessibility checks embedded in acceptance criteria
Decision: Include explicit contrast/focus/ARIA checks in tasks and validation pass.

Rationale: Visual polish must not degrade usability; quality gates should be explicit.

Alternative considered: Deferred accessibility pass. Rejected because fixes are costlier after styling spreads.

## Risks / Trade-offs

- [Risk] Font loading could affect perceived performance on low-end mobile devices.
  -> Mitigation: Use limited font weights, `font-display: swap`, and fallback stacks.

- [Risk] Token introduction may cause temporary inconsistencies while migrating classes.
  -> Mitigation: Migrate shell/navigation surfaces first and avoid broad global restyles in one step.

- [Risk] New color palette could reduce contrast in certain states.
  -> Mitigation: Validate key states (hover, active, focus, disabled) against WCAG-oriented contrast checks.

- [Risk] Added animations may feel excessive.
  -> Mitigation: Keep durations short, avoid chained motion, and prefer transform/opacity for smoothness.

## Migration Plan

1. Add global token definitions and font imports in `src/index.css`.
2. Extend Tailwind config with mapped font and color aliases.
3. Update shell/navigation components to consume new tokens and timing classes.
4. Validate mobile-first behavior and spacing hierarchy at mobile and desktop breakpoints.
5. Run manual accessibility pass for contrast, focus visibility, and ARIA on interactive shell elements.
6. Adjust and finalize with no functional behavior changes.

Rollback strategy: revert styling/token commits only; no data migrations or backend rollback required.

## Open Questions

- Should dark mode variables be scaffolded now (without UI toggle), or deferred fully?
- Which exact font pair best balances brand personality with multilingual readability?
- Do we want motion-reduction variants (`prefers-reduced-motion`) in this change or as a follow-up?
