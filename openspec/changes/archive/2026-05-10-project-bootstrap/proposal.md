## Why

The repository currently has architecture docs and OpenSpec workflow, but it does not contain a runnable application base. We need this change to explicitly bootstrap the real project foundation: create package management, install baseline dependencies, and scaffold the initial frontend structure.

## What Changes

- Create a concrete app scaffold using React + Vite + TypeScript + TailwindCSS in this repository.
- Add `package.json` with scripts and baseline dependencies needed to run, build, and lint the project.
- Create base configuration files (`tsconfig`, `vite`, Tailwind/PostCSS) and minimal entry files for the app.
- Create a feature-ready folder structure (`components`, `features`, `pages`, `hooks`, `services`, `lib`) with initial placeholders.
- Add environment validation and Supabase client bootstrap so misconfiguration fails early with actionable errors.
- Update setup documentation to match the new deterministic bootstrap and verification flow.

## Capabilities

### New Capabilities
- `app-bootstrap`: Concrete project bootstrap that creates a runnable application base (scaffold, dependencies, config, structure, and initialization checks).

### Modified Capabilities
- None.

## Impact

- New root-level project files are expected (for example: `package.json`, TypeScript/Vite/Tailwind configs).
- New source tree is expected under `src/` with baseline modules and initialization code.
- Setup and README documentation will be updated to reflect install/run/bootstrap verification.
- No product-specific feature logic is included in this change.
