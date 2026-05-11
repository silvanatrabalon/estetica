# Estetica

A reusable SaaS template with runnable application base.

This repository combines:
- A functional application scaffold (React + Vite + TypeScript + TailwindCSS)
- BaaS-first architecture (Supabase)
- Spec-driven development workflow (OpenSpec)
- AI assistant tooling and agent definitions

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd estetica
npm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get values from your Supabase project:
- Go to **Project Settings → API**
- Copy `Project URL` → `VITE_SUPABASE_URL`
- Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

See [setup.md](setup.md) for detailed setup steps.

### 3. Start Development

```bash
npm run dev
```

Open http://localhost:5173/ in your browser.

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Compile and bundle for production |
| `npm run preview` | Serve the built distribution locally |
| `npm run lint` | Check code with ESLint |
| `npx supabase link --project-ref <ref>` | Link the repo to a hosted Supabase project |
| `npx supabase db push --dry-run` | Preview remote schema changes from local migrations |
| `npx supabase db push` | Apply local migrations to the linked Supabase project |

**Expected output from `npm run dev`:**
```
VITE v5.0.7  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

See [setup.md](setup.md) for troubleshooting and detailed configuration.

---

# Project Information

## Purpose

This template provides a production-ready foundation for:

- Functional SaaS applications
- Spec-driven development with OpenSpec
- AI-assisted architecture and development
- MVP-first iteration
- Reusable product baseline

## Core Philosophy

This template is built on:

- **Spec-driven development** — Features are defined and reviewed before implementation
- **MVP-first approach** — Launch fast with core functionality, expand iteratively
- **Feature-based architecture** — Organized by business domain, not technical layers
- **BaaS-first** — Supabase for auth, data, and storage; Vercel for hosting
- **Security-first** — Row-Level Security (RLS) enforced from the foundation
- **Reusability** — Template works across multiple products; no product-specific defaults
- **Production-ready** — Bootstrap includes configuration, validation, and error handling

## What's Included

This repository provides:

- **Runnable Application Base** — Scaffold, dependencies, config, and source structure ready for feature development
- **Environment Validation** — Startup checks for required configuration with actionable error messages
- **Supabase Integration** — Client bootstrap with readiness verification
- **OpenSpec Workflow** — Spec-driven development with templates and automation
- **Architecture Documentation** — Decision records and technical guidelines
- **AI Agent Definitions** — Assistant roles for architecture, frontend, backend, and QA
- **Development Tools** — Linting, TypeScript, Tailwind, etc., pre-configured

## Development Workflow

This project uses a **spec-driven, AI-assisted workflow** for building features systematically.

### Master Reference: BACKLOG.md

[BACKLOG.md](BACKLOG.md) is the **single source of truth** for all features.

- **36 features** ordered by logical dependency (Foundation → Deployment)
- **Status tracking** with checkboxes ([ ] pending, [x] complete)
- **OpenSpec mapping** linking each feature to its spec change and git commit

### The Process (Simplified)

```
1. Pick next feature from BACKLOG.md
2. Run /opsx:propose to create the spec
3. Review and refine with Copilot chat
4. Run /opsx:apply to implement
5. Commit with conventional-commit skill
6. Update BACKLOG.md (mark complete)
```

### For Contributors

See **[CONTRIBUTE.md](CONTRIBUTE.md)** for the complete workflow guide:
- Step-by-step instructions for each feature
- OpenSpec commands reference
- Agent roles (Architect, Backend, Frontend, QA)
- Best practices and real examples

---

## Target Stack (For Projects Created From This Template)

### Frontend

- React
- Vite
- TypeScript
- TailwindCSS

### Backend (BaaS)

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- Supabase Storage

### Hosting

- Vercel

### Email

- Resend

## Architecture Overview

See [docs/architecture/](docs/architecture/) for the full technical documentation:

- [00-overview.md](docs/architecture/00-overview.md) — System overview and architecture decisions
- [01-frontend.md](docs/architecture/01-frontend.md) — Frontend stack and structure
- [02-backend-supabase.md](docs/architecture/02-backend-supabase.md) — Supabase and data access layer
- [03-auth-security.md](docs/architecture/03-auth-security.md) — Auth flow and security model
- [04-database.md](docs/architecture/04-database.md) — Database schema and conventions
- [05-infra-deployment.md](docs/architecture/05-infra-deployment.md) — Infrastructure and deployment
- [06-product-prd.md](docs/architecture/06-product-prd.md) — Product definition (customize per project)

## OpenSpec

This repository uses OpenSpec to manage feature development through a spec-driven workflow.

Official docs and full reference: https://github.com/Fission-AI/OpenSpec

### Workflow

```text
Idea -> Spec -> Review -> Tasks -> Implementation -> Archive
```

### Rules

- Every feature must have a spec before implementation.
- Specs define behavior, data model, and acceptance criteria.
- Implementation must follow approved specs.

### Slash commands (AI chat interface)

These are invoked in GitHub Copilot chat (or any supported AI assistant).
In GitHub Copilot the syntax uses dashes: `/opsx-propose`, `/opsx-apply`, etc.

#### Core profile (default)

| Command | Description |
|---|---|
| `/opsx:propose` | Create a change and generate all planning artifacts in one step |
| `/opsx:explore` | Think through ideas and requirements before committing to a change |
| `/opsx:apply` | Implement tasks from an existing change |
| `/opsx:sync` | Merge delta specs from a change into main specs |
| `/opsx:archive` | Finalize and archive a completed change |

### CLI commands (terminal)

#### Browsing

```bash
# List active changes
openspec list

# List specs
openspec list --specs

# Show details of a change (JSON for agents)
openspec show add-user-auth --json
```

#### Workflow (used by agents)

```bash
# Check artifact progress for a change
openspec status --change "add-user-auth" --json

# Get instructions for the next artifact
openspec instructions --change "add-user-auth" --json

# Get implementation instructions
openspec instructions apply --change "add-user-auth" --json
```

#### Lifecycle

```bash
# Archive a completed change
openspec archive add-user-auth

# Validate changes and specs
openspec validate --all --json
```

### OpenSpec files in this repository

| Path | Purpose |
|---|---|
| openspec/config.yaml | Project configuration and domain rules |
| openspec/changes/ | Active changes being worked on |
| openspec/changes/archive/ | Completed and archived changes |
| openspec/specs/ | Baseline capability specs |

Note: This repository stores the OpenSpec workflow scaffolding itself. No implemented product features exist yet.

## Project Structure

```text
src/                # Application source code
  components/       # Reusable UI components
  features/         # Feature modules (organized by domain)
  pages/            # Page/screen components
  hooks/            # Custom React hooks
  services/         # API and external integrations
  lib/              # Utilities, helpers, constants
  App.tsx           # Main application component
  main.tsx          # Vite entry point
  index.css         # Global styles with Tailwind

.github/
  agents/           # Agent definitions
  prompts/          # OpenSpec workflow prompts
  skills/           # Reusable skills
  copilot-instructions.md

docs/
  architecture/     # Technical documentation

openspec/
  config.yaml       # OpenSpec configuration
  changes/          # Active changes
  specs/            # Capability specifications

index.html          # HTML entry point
package.json        # Dependencies and scripts
vite.config.ts      # Vite configuration
tsconfig.json       # TypeScript configuration
tailwind.config.js  # Tailwind configuration
postcss.config.js   # PostCSS configuration

README.md
setup.md
```

## AI Agents

This repo includes specialized development agents:

- Architect: system design and decisions
- Frontend: UI and client logic
- Backend: Supabase and data layer
- QA: testing and validation

## Development Flow

1. Define feature as a spec.
2. Review architecture implications.
3. Break work into tasks.
4. Implement incrementally.
5. Validate with QA.

## Design Principles

- Keep architecture simple.
- Prefer platform-native solutions.
- Avoid backend overengineering.
- Build vertical slices (UI + DB + logic).
- Optimize for iteration speed.

## Notes

This template is intentionally minimal in product definition.
It is designed to be reused across projects by changing AI tooling configuration and OpenSpec artifacts first, then optionally adding product code.