## ADDED Requirements

### Requirement: Admin Dashboard KPI stat cards are responsive on mobile
The KPI metric `StatCard` components on `AdminDashboardPage` SHALL render their title labels fully at all viewport widths, including mobile. Titles MUST NOT be truncated with ellipsis on narrow screens. The card layout SHALL use `text-sm` and allow text wrapping so that labels remain legible at all breakpoints.

#### Scenario: Stat card title does not truncate on a narrow mobile viewport
- **WHEN** the admin dashboard renders on a viewport of 375 px width
- **THEN** all stat card titles (e.g., "Ingresos estimados este mes") are fully visible without truncation or overflow clipping

#### Scenario: Stat card title wraps when needed
- **WHEN** a stat card title is longer than the available card width at a narrow breakpoint
- **THEN** the title wraps to the next line rather than being cut off
