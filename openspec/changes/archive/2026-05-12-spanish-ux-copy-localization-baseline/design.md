## Context

The repository currently has a mixed-language user interface, with multiple user-facing flows still showing English text. Product direction now requires Spanish as the default language for end-user copy across customer, staff, and admin experiences. The codebase is in MVP stage and does not yet need a heavyweight multi-language framework, but it does need a consistent baseline to prevent regressions.

## Goals / Non-Goals

**Goals:**
- Normalize user-facing UI copy to Spanish across existing routes and feedback states.
- Establish a lightweight localization baseline that is simple enough for current MVP velocity.
- Reduce future language drift by centralizing repeated interface strings where practical.
- Keep implementation aligned with existing architecture and avoid unnecessary dependencies.

**Non-Goals:**
- Implement full runtime internationalization (multi-locale switching, translation files per locale, locale detection, etc.).
- Translate internal code symbols, tests, migration names, or technical architecture docs.
- Redesign product UX or route architecture beyond language updates.

## Decisions

1. Localization scope is user-facing copy only.
- Rationale: directly solves product-language inconsistency while preserving engineering clarity in internal artifacts.
- Alternative considered: translate all project artifacts. Rejected because it increases maintenance overhead without customer value.

2. Use a lightweight shared copy strategy instead of full i18n framework.
- Rationale: MVP-first approach favors minimal complexity; repeated UI text can be centralized in constants/modules where it prevents duplication.
- Alternative considered: introducing a complete i18n library now. Rejected as premature for current single-language requirement.

3. Prioritize high-visibility interface surfaces first.
- Rationale: shell navigation, auth/session feedback, profile/setup forms, fallback pages, and status messages are the most user-visible and most sensitive to language consistency.
- Alternative considered: broad opportunistic translation only when touching files. Rejected because it leaves inconsistent UI in active flows.

4. Enforce Spanish copy expectation in project guidance.
- Rationale: explicit conventions reduce regressions in future features and PRs.
- Alternative considered: rely on contributor memory. Rejected due to inconsistency risk.

## Risks / Trade-offs

- [Some English strings may remain hidden in low-frequency paths] -> Mitigation: include route-level and fallback-state review in implementation tasks and QA checks.
- [Copy centralization can become over-abstracted] -> Mitigation: centralize only repeated/shared strings, keep single-use copy colocated with components.
- [Future multi-language needs may outgrow baseline] -> Mitigation: document baseline as transitional and revisitable when multilingual support becomes a product requirement.
- [Translation choices may vary in tone across modules] -> Mitigation: define concise tone conventions and perform one pass focused on terminology consistency.

## Migration Plan

1. Audit current user-facing English copy across routes/components.
2. Translate prioritized surfaces to Spanish and standardize terminology.
3. Introduce lightweight shared copy constants for repeated labels/messages.
4. Update/align tests impacted by visible text changes.
5. Run UI and test verification to ensure no functional regressions.
6. Mark backlog item completion after acceptance criteria checks.

## Open Questions

- Should Spanish default use neutral LATAM vocabulary, Spain-specific wording, or a mixed neutral register?
- Do we want to reserve key names/IDs in English even when labels are Spanish for future analytics/event tracking consistency?
