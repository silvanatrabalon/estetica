## 1. Project Scaffold

- [x] 1.1 Create `package.json` with baseline scripts (`dev`, `build`, `preview`, `lint`).
- [x] 1.2 Add React + Vite + TypeScript + TailwindCSS + Supabase dependencies.
- [x] 1.3 Create baseline config files (Vite, TypeScript, Tailwind, PostCSS).

## 2. Source Structure and Entrypoints

- [x] 2.1 Create `src` entrypoints (`main.tsx`, `App.tsx`, global styles).
- [x] 2.2 Create architecture-aligned base directories: `components`, `features`, `pages`, `hooks`, `services`, `lib`.
- [x] 2.3 Add minimal placeholder modules so folder intent is explicit and compilable.

## 3. Environment and Supabase Bootstrap

- [x] 3.1 Implement required env parsing/validation for Supabase keys.
- [x] 3.2 Add actionable error messages for missing or malformed env values.
- [x] 3.3 Add Supabase client bootstrap and a minimal readiness verification path.

## 4. Documentation Alignment

- [x] 4.1 Update `setup.md` with deterministic bootstrap steps from clean clone.
- [x] 4.2 Update `README.md` with install/run/build commands and expected outputs.
- [x] 4.3 Add troubleshooting guidance for env and Supabase readiness failures.

## 5. Verification

- [x] 5.1 Validate install and startup flow on a clean environment.
- [x] 5.2 Validate that missing env vars fail fast with actionable diagnostics.
- [x] 5.3 Validate readiness path behavior with both valid and invalid Supabase config.
