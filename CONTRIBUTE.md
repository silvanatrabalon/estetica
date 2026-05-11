# Contributing to Estetica

## Workflow Overview

This repository follows a **spec-driven development workflow** using OpenSpec, AI agents, and reusable skills to build features systematically.

### The Process

```
BACKLOG.md (feature #N)
    ↓
/opsx:propose (create spec)
    ↓
Review & adjust (chat with Copilot)
    ↓
Agent review (optional, request Architect/Backend/Frontend)
    ↓
/opsx:apply (implement tasks)
    ↓
conventional-commit skill (commit changes)
    ↓
Update BACKLOG.md (mark feature complete)
```

---

## Master Reference: BACKLOG.md

**BACKLOG.md** is the single source of truth for all features.

- **36 features** numbered and ordered by dependency
- **4 phases** organized logically (Foundation → Advanced → Deployment)
- **Status tracking** for each feature ([ ] pending, [x] complete)
- **OpenSpec mapping** (feature → change name → commit hash)

Every feature development starts and ends here.

---

## Step-by-Step Workflow

### 1. **Select Next Feature from BACKLOG.md**

Look at BACKLOG.md, find the next feature in dependency order that's marked `[ ]`.

Example: If #1 is done `[x]`, pick #2.

### 2. **Propose the Feature with OpenSpec**

```bash
/opsx:propose <feature-name>
```

This creates:
- **Proposal** — Why this feature matters
- **Specs** — Behavior and acceptance criteria
- **Design** — Architecture and implementation approach
- **Tasks** — Concrete implementation steps

### 3. **Review & Refine**

- Read the generated proposal, specs, and design
- Ask Copilot for clarifications or adjustments
- Use chat to refine requirements before implementation

### 4. **Optional: Request Agent Review**

For architectural decisions or complex logic, request review:

```bash
@architect review this design for multi-tenant isolation
@backend-developer review RLS strategy
@frontend-developer review component structure
```

Agents will provide feedback inline.

### 5. **Apply Implementation with OpenSpec**

Once satisfied with the spec:

```bash
/opsx:apply <feature-name>
```

This executes all tasks and generates the implementation.

### 6. **Commit with conventional-commit Skill**

After implementation is complete:

```bash
Use conventional-commit skill
```

This creates a standardized commit with:
- Type: `feat`, `fix`, `refactor`, etc.
- Scope: feature name or area
- Description: Clear summary
- Body: Details of changes
- Footer: References and verification notes

### 7. **Update BACKLOG.md**

Mark the feature as complete:

```markdown
### 2. Feature Name
...
- [x] `openspec-change-name` (commit-hash)
```

Include:
- OpenSpec change name in backticks
- Commit hash (first 7 chars)

---

## Tools Used

### OpenSpec Commands

| Command | Purpose |
|---|---|
| `/opsx:propose` | Create a new feature spec |
| `/opsx:explore` | Think through ideas before committing |
| `/opsx:apply` | Implement tasks from a spec |
| `/opsx:archive` | Finalize a completed change |

### AI Agents

Specialized roles for different aspects:

- **Architect** — System design, dependencies, multi-tenant patterns
- **Backend Developer** — Database, RLS, Supabase logic
- **Frontend Developer** — React components, UX, styling
- **QA Test Engineer** — Testing strategy, edge cases, validation

Request review with `@agent-name` in chat.

### Reusable Skills

- **conventional-commit** — Standardize commit messages
- **frontend-design** — Build polished UI components
- Other project-specific skills as needed

---

## Dependency Order

Features must be implemented in order to avoid breaking dependencies:

1. **Phase 1** — Foundation & Auth (required first)
2. **Phase 2** — Core Infrastructure
3. **Phase 3** — Multi-tenant
4. **Phase 4** — Services
5. **Phase 5** — Appointment Core
6. **Phase 6** — Appointment Management
7. **Phase 7** — Advanced Features
8. **Phase 8** — Settings
9. **Phase 9** — Security & QA
10. **Phase 10** — Deployment

See BACKLOG.md for the complete list.

---

## Example: Implementing Feature #2

```bash
# 1. Open BACKLOG.md, see Feature #2 is next

# 2. Propose the feature
/opsx:propose supabase-schema

# 3. Review the generated spec in chat
# Ask questions, request clarifications

# 4. Request Architect review (optional)
@architect review multi-tenant schema design

# 5. Apply when ready
/opsx:apply supabase-schema

# 6. Commit the changes
Use conventional-commit skill
# This creates: feat(database): implement Supabase schema...

# 7. Update BACKLOG.md
# Change "[ ] 2. Supabase Setup & Database Schema"
# To: "[x] `supabase-schema` (abc1234)"
```

---

## Best Practices

1. **Read BACKLOG.md first** — Know what's next, understand dependencies
2. **Follow dependency order** — Don't skip phases or features
3. **Use specs as source of truth** — All decisions documented before coding
4. **Request agent review for complex features** — Catch issues early
5. **Keep commits focused and descriptive** — One feature = one commit (or logical grouping)
6. **Update BACKLOG.md immediately after** — Keep it current
7. **Use chat with Copilot** — Clarify, explore, adjust before implementation

---

## Questions?

- Read BACKLOG.md for feature details
- Check docs/architecture/ for system design decisions
- Use `/opsx:explore` to think through complex features before proposing
- Request agent review for guidance on complex areas

Happy building! 🚀

