# Layout Shell & Navigation

## What

Create the foundational App Shell component with responsive navigation system that adapts to user role (customer, staff, admin). Includes role-based navigation configuration, UserContext integration with session management, and role-specific shells (CustomerShell, StaffShell, AdminShell).

## Why

Currently, authenticated users have no way to navigate between different sections of the application. The app lacks a shell/layout structure and primary navigation UI. This foundational feature is critical for Phase 2 (Core Infrastructure) and blocks subsequent features like Protected Routes (#7), User Profile (#8), Admin Panel (#9), and all downstream features.

## Scope

✅ **Included:**
- App Shell component with responsive CSS Grid layout
- UserContext (session + role state co-location)
- ShellContext (navigation UI state: sidebar/mobile menu toggles)
- Role-based navigation configuration (`navigationByRole` mapping in `lib/navigation.ts`)
- Sidebar component (desktop fixed sidebar, mobile full-width drawer)
- NavBar with brand, mobile menu toggle, and user menu with logout
- Custom hooks: `useUser()`, `useUserRole()`, `useNavigation()`, `useShellContext()`
- Responsive design using Tailwind CSS (mobile-first with md: breakpoints)
- Three role-specific shells: CustomerShell, StaffShell, AdminShell
- Integration with existing Supabase session lifecycle (App.tsx)
- Clean folder structure: `components/shell/`, `context/`, `hooks/`, `lib/navigation.ts`

❌ **Excluded:**
- Protected route guards (separate feature: #7)
- Individual feature pages/views (dashboard, booking, etc.)
- Advanced animations or page transitions
- Multi-level nested navigation or submenu patterns
- Custom authentication (uses existing session management from #5)

## Key Outcomes

- [ ] AppShell renders when user is authenticated, conditionally shows loading/error states
- [ ] Navigation items change based on user role (customer, staff, admin)
- [ ] Desktop sidebar visible on md+ screens, hidden on mobile
- [ ] Mobile menu drawer functional and closes on navigation
- [ ] User menu with logout functionality works correctly
- [ ] Responsive layout works seamlessly on mobile/tablet/desktop
- [ ] UserContext and ShellContext properly integrated
- [ ] Prepared foundation for Protected Routes feature without blocking it
- [ ] Design executes bold SaaS aesthetic with distinctive typography

## Aesthetic Direction

**Bold, modern SaaS aesthetic** avoiding generic AI aesthetics:
- Clean hierarchy with generous whitespace and subtle depth
- Distinctive display font paired with refined body font (custom typography, NOT Inter/Roboto)
- Smooth, purposeful micro-interactions (nav hover states, menu transitions)
- Intentional color scheme with primary and accent colors (dark-aware)
- Subtle shadows, borders, and depth cues
- Accessible color contrast and semantic HTML

Design philosophy: intentional and premium feel, not cookie-cutter.

## Technical Foundation

- **Framework**: React 18 + TypeScript (strict mode)
- **Styling**: TailwindCSS v3+
- **State Management**: React Context (UserContext + ShellContext)
- **Integration Points**: 
  - Supabase session from App.tsx (existing session.ts service)
  - User roles from database (user_roles table via RLS)
- **Architecture Pattern**: Declarative navigation config, component composition
- **Responsive Strategy**: Mobile-first, CSS Grid + Tailwind breakpoints

## Success Criteria

1. All roles see appropriate navigation items
2. Sidebar/mobile menu state persists during navigation
3. Logout clears user context and redirects to login
4. Layout is fully responsive and accessible
5. No visual regressions or layout shifts
6. Code is modular, reusable, and maintainable
7. Integrates cleanly with existing session management
