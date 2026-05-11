## Context

This repository is a reusable SaaS template but currently does not contain a runnable app base. To make the template truly usable, bootstrap must include concrete code and configuration artifacts: package manager setup, dependencies, framework configuration, source structure, and initialization safeguards.

## Goals / Non-Goals

**Goals:**
- Produce a runnable baseline app with React + Vite + TypeScript + TailwindCSS.
- Create `package.json` with scripts for `dev`, `build`, and `lint`.
- Establish a baseline source structure ready for feature-based growth.
- Add deterministic startup checks for required environment variables.
- Provide a minimal Supabase bootstrap path that can fail fast with actionable diagnostics.

**Non-Goals:**
- Implementing domain features, pages, or product-specific business rules.
- Creating a custom backend outside Supabase.
- Adding advanced CI/CD, release automation, or non-essential tooling.

## Decisions

1. Bootstrap via concrete scaffold files in-repo, not docs-only guidance.
Rationale: implementation-ready templates require executable artifacts, not just process instructions.
Alternative considered: keep bootstrap as documentation checklist only; rejected because it does not produce a runnable baseline.

2. Keep dependency set minimal but sufficient for the declared architecture.
Rationale: reduce cognitive load and avoid premature tooling.
Alternative considered: adding testing, e2e, formatting, and commit tooling in the first pass; rejected for MVP-first scope.

3. Enforce env validation at initialization boundaries.
Rationale: missing Supabase config is the most common startup blocker and should fail fast.
Alternative considered: lazy runtime failures in feature code; rejected due to poor developer experience.

4. Include Supabase client bootstrap with optional readiness verification entry point.
Rationale: backend access pattern is foundational in this architecture and should be established immediately.
Alternative considered: postpone Supabase wiring until first feature; rejected because it delays integration risk detection.

5. Maintain product-agnostic placeholders in base structure.
Rationale: this template must be reusable across products.
Alternative considered: include sample product domain objects/pages; rejected as it introduces opinionated business context.

## Risks / Trade-offs

- [Risk] Tooling/version drift (Node/npm) can cause inconsistent setup -> Mitigation: document supported Node version and lock scripts in `package.json`.
- [Risk] Over-scaffolding introduces unused boilerplate -> Mitigation: create only baseline directories/files required by architecture.
- [Risk] Connectivity checks may fail in offline or unconfigured environments -> Mitigation: classify checks as readiness validation with clear recovery steps.

## Migration Plan

1. Add foundational project files (`package.json`, config files, `src` entrypoints).
2. Install and lock baseline dependencies.
3. Add environment parsing/validation and Supabase client bootstrap.
4. Update setup and verification docs to match executable bootstrap commands.
5. Validate bootstrap on a clean clone and document failure modes.

## Open Questions

- Should testing tooling (Vitest) be included in this bootstrap change or a follow-up change?
- Should linting be limited to ESLint default or include stricter project rules now?
