# AI Assistant Tools Template (OpenSpec + Agents + Skills)

This repository is a reusable template for AI assistant tooling and spec-driven workflow setup.

It is not an application and it contains no product source code.
It is a baseline to bootstrap assistant behaviors, prompts, skills, and OpenSpec conventions.

## Purpose

This template provides a baseline for:

- AI assistant instruction systems
- OpenSpec-based workflow orchestration
- Agent role definitions
- Prompt and skill standardization
- Reusable project governance for future products

## Core Philosophy

This project is built around:

- Spec-driven development with OpenSpec
- MVP-first iteration
- Feature-based modular architecture
- Serverless and BaaS-first approach
- Security-first design with Supabase RLS
- Reusability across multiple products

## Scope

This repository currently includes tooling and documentation only:

- AI agent definitions
- Prompt workflows
- Skill definitions
- OpenSpec configuration
- Architecture and setup documents

This repository does not include source code.

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
.github/
  agents/          # agent definitions (architect, frontend, backend, qa)
  prompts/         # OpenSpec workflow prompts
  skills/          # reusable skills
  copilot-instructions.md

docs/
  architecture/    # project architecture docs

openspec/
  config.yaml
  changes/
  specs/

README.md
setup.md
```

Note: There is no src/ directory yet because this template is focused on assistant tooling and process setup.

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