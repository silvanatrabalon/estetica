## Why

The product is intended for Spanish-speaking end users, but the current application still contains visible English copy across navigation, forms, status states, and recovery screens. This creates a fragmented product experience and increases the risk of future features shipping with inconsistent language unless the localization baseline is made explicit now.

## What Changes

- Translate existing user-facing application copy from English to Spanish across authenticated and unauthenticated flows.
- Define a lightweight localization baseline for MVP development so future UI work defaults to Spanish copy.
- Standardize common interface text categories such as navigation labels, buttons, form labels, placeholders, validation messages, empty states, loading states, notices, and route-level fallback screens.
- Keep internal implementation language in English for source code, tests, migrations, and technical documentation unless a feature explicitly requires otherwise.
- Avoid heavyweight i18n infrastructure unless needed for immediate product value; prefer a simple, maintainable copy strategy aligned with the current MVP stage.

## Capabilities

### New Capabilities
- `spanish-ux-copy-localization-baseline`: Defines Spanish as the default language for end-user interface copy and covers the minimum localization baseline for visible product text.

### Modified Capabilities
- None.

## Impact

- Affected areas include routing fallbacks, auth/session feedback, shell navigation, profile flows, placeholder pages, and shared UI text patterns across customer, staff, and admin experiences.
- The change will influence frontend copy conventions and may introduce a shared copy organization pattern to reduce future language drift.
- No API or database contract changes are expected.