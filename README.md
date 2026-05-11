# Estetica

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

Install OpenSpec globally (required for the spec-driven workflow):

```bash
npm install -g @fission-ai/openspec@latest
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

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


## Development Workflow

See [BACKLOG.md](BACKLOG.md) for the full feature list and [CONTRIBUTE.md](CONTRIBUTE.md) for the step-by-step workflow guide.

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

This repository uses OpenSpec for spec-driven feature development.

Official docs: https://github.com/Fission-AI/OpenSpec

| Path | Purpose |
|---|---|
| `openspec/config.yaml` | Project configuration and domain rules |
| `openspec/changes/` | Active changes being worked on |
| `openspec/changes/archive/` | Completed and archived changes |
| `openspec/specs/` | Baseline capability specs |

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

