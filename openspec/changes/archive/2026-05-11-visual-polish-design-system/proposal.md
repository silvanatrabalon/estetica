## Why

The current shell implementation is functionally complete but still visually generic and inconsistent across responsive breakpoints. This change is needed now to establish a distinctive, reusable UI foundation before protected routes and profile/admin features build on top of the same shell surfaces.

## What Changes

- Add a mobile-first visual polish pass for shell and navigation surfaces, including typography, spacing, color tokens, and interaction states.
- Introduce a design token layer in CSS variables for brand accents, semantic surfaces, motion timing, and focus styles.
- Replace default typography with a more distinctive font pairing and update Tailwind/font configuration accordingly.
- Standardize transition behavior for sidebar, backdrop, links, and user menu interactions.
- Add accessibility-focused visual validation for contrast, focus visibility, and ARIA-backed interactive affordances.

## Capabilities

### New Capabilities
- `visual-polish-design-system`: Defines mobile-first visual behavior, typography direction, tokenized color/motion rules, and accessibility acceptance criteria for shell/navigation UI.

### Modified Capabilities
None.

## Impact

- Affected frontend files: `src/index.css`, `tailwind.config.js`, shell/navigation components under `src/components/shell/`, and shell context styling hooks.
- Potential dependency impact: font package/provider import updates and Tailwind theme extension updates.
- No backend/API/RLS behavior changes.
