# Tasks: Layout Shell & Navigation

## Overview

Implement the foundational app shell with responsive navigation. Tasks are organized in logical sequence: contexts first (foundation), then components (presentation), then integration.

## Task 1: Create UserContext & Move Session Logic

**Objective**: Create UserContext to co-locate session + role state and move session lifecycle logic from App.tsx.

**Deliverables**:
- [ ] Create `src/context/UserContext.tsx`
  - `UserContextValue` interface: `user`, `role`, `isLoading`, `signOut()`
  - `UserProvider` component that wraps session lifecycle logic
  - `useUser()` and `useUserRole()` hooks
- [ ] Move session bootstrap/hydration logic from App.tsx to UserProvider
- [ ] Integrate role fetching: call `user_roles` table to get role (with fallback to 'customer')
- [ ] Handle isLoading states for session + role
- [ ] Implement signOut() to clear user, role, and local storage
- [ ] Update App.tsx to wrap content with `<UserProvider>`

**Acceptance Criteria**:
- UserContext exports `UserProvider`, `useUser()`, `useUserRole()`
- Session boots correctly on app load
- Role is fetched from database for authenticated users
- Logout clears state and session
- Tests pass for UserContext

---

## Task 2: Create ShellContext & Navigation State

**Objective**: Create ShellContext to manage sidebar/mobile menu UI state independently.

**Deliverables**:
- [ ] Create `src/features/shell/context.tsx`
  - `ShellContextValue` interface: sidebar/menu toggle state
  - `ShellProvider` component
  - `useShellContext()` hook
- [ ] Implement `toggleSidebar()` (for future desktop sidebar collapse)
- [ ] Implement `toggleMobileMenu()` and `closeMobileMenu()`
- [ ] Use `useState` for UI state management

**Acceptance Criteria**:
- ShellContext exports `ShellProvider` and `useShellContext()`
- Sidebar and mobile menu toggles work correctly
- State is local to shell (not global)
- Tests pass for ShellContext

---

## Task 3: Define Types & Navigation Config

**Objective**: Define TypeScript types and declarative navigation configuration.

**Deliverables**:
- [ ] Create `src/features/shell/types.ts`
  - `NavItem` type: `id`, `label`, `href`, `icon`, `roles`, `children`
  - `AppRole` type: 'customer' | 'staff' | 'admin'
- [ ] Create `src/lib/navigation.ts` (or `src/features/shell/navConfig.ts`)
  - `navigationByRole` mapping: role → NavItem[]
  - Define nav items for each role (customer, staff, admin)
  - Share common items (e.g., dashboard, profile) across roles

**Acceptance Criteria**:
- Types are exported and used consistently
- Navigation config covers all roles
- Nav items have correct `roles` array
- Icons are imported/used correctly
- Config is easy to modify (scalable)

---

## Task 4: Create Reusable Hooks

**Objective**: Create custom hooks for accessing shell state and filtering navigation.

**Deliverables**:
- [ ] Create `src/hooks/useUser.ts`
  - Hook that accesses `UserContext`
  - Returns user, role, isLoading, signOut
- [ ] Create `src/features/shell/hooks/useShellContext.ts`
  - Hook that accesses `ShellContext`
- [ ] Create `src/features/shell/hooks/useUserRole.ts`
  - Fetches user role from database if not already in context
  - Caches in local state
  - Returns role or null
- [ ] Create `src/features/shell/hooks/useNavigation.ts`
  - Accepts role parameter
  - Returns filtered nav items for that role
  - Uses `useMemo` for performance

**Acceptance Criteria**:
- All hooks export correctly from `index.ts` files
- Hooks have proper TypeScript types
- `useNavigation()` filters correctly by role
- Tests pass for hooks

---

## Task 5: Create Navigation Components

**Objective**: Build navigation UI components (NavLink, UserMenu).

**Deliverables**:
- [ ] Create `src/components/shell/Navigation/NavLink.tsx`
  - Props: `item: NavItem`, `isActive: boolean`, `onNavigate?: () => void`
  - Renders icon + label
  - Active state styling: border-left, background highlight
  - Hover state: background tint, subtle scale
  - Click → navigate + call `onNavigate()`
  
- [ ] Create `src/components/shell/Navigation/UserMenu.tsx`
  - Props: `user: User`
  - Dropdown trigger: avatar + user name
  - Dropdown content: profile link, logout button
  - Logout calls `useUser().signOut()`
  - Use Radix UI Popover or custom dropdown
  
- [ ] Create `src/components/shell/Navigation/index.ts`
  - Barrel export: NavLink, UserMenu, NavBar, Sidebar (created next)

**Acceptance Criteria**:
- NavLink active/hover states work correctly
- UserMenu logout functionality works
- Components are responsive
- Typography and colors match aesthetic direction
- Accessibility: ARIA labels, focus states

---

## Task 6: Create NavBar Component

**Objective**: Build top navigation bar with logo, mobile toggle, and user menu.

**Deliverables**:
- [ ] Create `src/components/shell/Navigation/NavBar.tsx`
  - Render: Logo (left) | Title area (center, optional) | Mobile button + UserMenu (right)
  - Mobile button: hamburger icon, hidden on md+ breakpoint
  - Click hamburger → `useShellContext().toggleMobileMenu()`
  - Include UserMenu component
  - Sticky positioning: sticky top-0, z-30
  - Height: h-16, border-bottom
  
**Styling**:
- Navbar background: white (or dark mode aware)
- Logo text: distinctive font, brand color
- Mobile button: visible only on mobile (-md)
- User menu: visible always, right-aligned

**Acceptance Criteria**:
- Navbar renders with logo
- Mobile button appears on mobile, hidden on desktop
- UserMenu positioned correctly
- Sticky positioning works
- Z-index correct (above sidebar but below modals)

---

## Task 7: Create Sidebar Component

**Objective**: Build sidebar/drawer navigation with role-based items.

**Deliverables**:
- [ ] Create `src/components/shell/Navigation/Sidebar.tsx`
  - Props: `items: NavItem[]`
  - Desktop behavior (md+): fixed sidebar, 250px width, always visible
  - Mobile behavior (-md): overlay drawer, fixed position, hidden/visible via transform
  - Render nav items using NavLink component
  - On nav click → `closeMobileMenu()` on mobile
  - Active item detection: highlight/border current route
  
**Layout & Styling**:
- Fixed width: 250px (both desktop and mobile drawer)
- Height: 100vh (minus navbar on mobile)
- Padding: p-4
- Overflow: overflow-y-auto
- Desktop: visible (hidden on -md with `hidden md:block`)
- Mobile: fixed drawer with -translate-x-full / translate-x-0 transform
- Z-index: z-20 (desktop) or z-40 (mobile drawer)

**Mobile Drawer**:
- Fixed positioned (top-16 on mobile, accounting for navbar)
- Transform: -translate-x-full (hidden) / translate-x-0 (visible)
- Transition: smooth 0.3s ease
- Backdrop: semi-transparent overlay (onClick → closeMobileMenu)

**Acceptance Criteria**:
- Sidebar displays on desktop, hidden on mobile
- Mobile drawer slides in/out smoothly
- Nav items render correctly
- Active item highlighted
- Click nav item → close menu on mobile
- Scrolling works when items overflow

---

## Task 8: Create Role-Specific Shells

**Objective**: Create CustomerShell, StaffShell, AdminShell layout variants.

**Deliverables**:
- [ ] Create `src/components/shell/CustomerShell.tsx`
  - Render: Sidebar + NavBar + main
  - Pass `useNavigation('customer')` items to Sidebar
  
- [ ] Create `src/components/shell/StaffShell.tsx`
  - Similar structure, pass `useNavigation('staff')` items
  
- [ ] Create `src/components/shell/AdminShell.tsx`
  - Similar structure, pass `useNavigation('admin')` items

**Layout**:
```typescript
<div className="grid grid-cols-[250px_1fr] md:grid-cols-1 min-h-screen gap-0">
  <Sidebar items={useNavigation(role)} />
  <div className="flex flex-col">
    <NavBar />
    <main className="flex-1 overflow-auto p-4 md:p-6">
      {children}
    </main>
  </div>
</div>
```

**Acceptance Criteria**:
- Each shell renders with correct nav items for role
- Layout is responsive (2-col desktop, 1-col mobile)
- Main content area scrollable
- Padding correct on mobile/desktop
- CSS Grid works correctly

---

## Task 9: Create AppShell Root Component

**Objective**: Create AppShell that selects the correct shell variant based on user role.

**Deliverables**:
- [ ] Create `src/components/shell/AppShell.tsx`
  - Check `useUser()` hook
  - If `isLoading=true` → render LoadingShell (simple spinner)
  - If `!user` → handled by App.tsx, but could render error
  - If `user` and `role` → render role-specific shell:
    - 'customer' → CustomerShell
    - 'staff' → StaffShell
    - 'admin' → AdminShell
  - Else → ErrorShell with "invalid role" message
  
- [ ] Create `src/components/shell/LoadingShell.tsx`
  - Simple loading screen (spinner + message)
  
- [ ] Create `src/components/shell/ErrorShell.tsx`
  - Error message display
  - Retry/logout button

**Acceptance Criteria**:
- AppShell selects correct shell by role
- Loading state displays during hydration
- Error state displays with message
- No hydration mismatches

---

## Task 10: Create Barrel Exports & Index Files

**Objective**: Organize exports for clean imports.

**Deliverables**:
- [ ] Create/update `src/components/shell/index.ts`
  - Export: AppShell, CustomerShell, StaffShell, AdminShell
  
- [ ] Create/update `src/components/shell/Navigation/index.ts`
  - Export: NavBar, Sidebar, NavLink, UserMenu
  
- [ ] Create/update `src/features/shell/index.ts`
  - Export: ShellProvider, useShellContext
  
- [ ] Create/update `src/features/shell/hooks/index.ts`
  - Export: useShellContext, useUserRole, useNavigation
  
- [ ] Create/update `src/context/index.ts`
  - Export: UserProvider, useUser, useUserRole
  
- [ ] Create/update `src/hooks/index.ts`
  - Export: useUser

**Acceptance Criteria**:
- All exports work correctly
- No circular dependencies
- Imports are clean and concise

---

## Task 11: Integrate into App.tsx

**Objective**: Wire UserProvider and AppShell into the main App component.

**Deliverables**:
- [ ] Update `src/App.tsx`
  - Remove session logic (moved to UserContext)
  - Keep auth state check (loading, error)
  - Wrap with `<UserProvider>`
  - Wrap with `<ShellProvider>` inside UserProvider
  - Render `<AppShell>` when user is authenticated
  - Render login/error screens when not authenticated
  
**Structure**:
```typescript
export default function App() {
  const [authState, setAuthState] = useState<...>()
  
  // Session check logic (can stay in App.tsx or move to UserProvider)
  
  return (
    <>
      {isLoading && <LoadingScreen />}
      {error && <ErrorScreen />}
      {!user && <SignInPage />}
      {user && (
        <UserProvider initialUser={user}>
          <ShellProvider>
            <AppShell>
              <Routes>{/* routes here */}</Routes>
            </AppShell>
          </ShellProvider>
        </UserProvider>
      )}
    </>
  )
}
```

**Acceptance Criteria**:
- App boots without errors
- Session logic works
- Shell renders when authenticated
- Login page shows when not authenticated
- No console errors

---

## Task 12: Create Placeholder Pages for Testing

**Objective**: Create simple placeholder pages to test the shell navigation.

**Deliverables**:
- [ ] Create `src/pages/DashboardPage.tsx` (simple page with heading)
- [ ] Create `src/pages/ProfilePage.tsx`
- [ ] Create `src/pages/BookingPage.tsx` (customer only)
- [ ] Create `src/pages/StaffSchedulePage.tsx` (staff only)
- [ ] Create `src/pages/AdminUsersPage.tsx` (admin only)
- [ ] Create `src/pages/index.ts` (barrel export)

**Each Page**: Simple component with heading + description.

**Acceptance Criteria**:
- Pages render without errors
- Navigation to pages works
- Can verify role-based nav items

---

## Task 13: Test Navigation & Responsive Design

**Objective**: Manual testing of navigation, responsiveness, and user flows.

**Tests to Run**:
- [ ] **Desktop View**: 
  - Sidebar visible, nav items correct for role
  - Click nav items, pages load
  - User menu works, logout clears state
  - All pages accessible from nav

- [ ] **Mobile View** (md breakpoint):
  - Sidebar hidden initially
  - Mobile menu button visible
  - Click hamburger → drawer opens
  - Click nav item → drawer closes
  - Nav items correct for role

- [ ] **Role-Based Navigation**:
  - Log in as customer → customer nav items only
  - Log in as staff → staff nav items only
  - Log in as admin → admin nav items only
  - Switching roles → nav items update

- [ ] **Responsive Breakpoints**:
  - Test at mobile (375px), tablet (768px), desktop (1024px)
  - Sidebar/drawer behavior correct
  - Padding and spacing correct
  - No layout shifts

- [ ] **Accessibility**:
  - Tab through nav items, focus visible
  - Read with screen reader
  - Keyboard navigation works
  - Color contrast adequate

**Acceptance Criteria**:
- All tests pass
- No console errors or warnings
- Responsive on all breakpoints
- Nav state persists during navigation

---

## Task 14: Create Unit Tests (Optional but Recommended)

**Objective**: Write tests for hooks and components.

**Tests to Write**:
- [ ] `useUser()` hook test
- [ ] `useShellContext()` hook test
- [ ] `useUserRole()` hook test
- [ ] `useNavigation()` hook test
- [ ] `NavLink` component snapshot + interaction test
- [ ] `Sidebar` component test (renders items)
- [ ] `AppShell` component test (renders shell by role)

**Tools**: Jest + React Testing Library

**Acceptance Criteria**:
- Tests cover main logic paths
- Components render correctly
- User interactions work
- Coverage > 80% (target)

---

## Task 15: Add Aesthetic Polish & Micro-Interactions

**Objective**: Implement custom typography, colors, and smooth transitions.

**Deliverables**:
- [ ] Define custom fonts in `tailwind.config.js`
  - Display font: distinctive choice (NOT Inter/Roboto)
  - Body font: refined choice
  - Apply to relevant elements (logo, headings, body)
  
- [ ] Define color variables in `tailwind.config.js` or CSS
  - Primary accent color
  - Secondary background/border colors
  - Dark mode support
  
- [ ] Add smooth transitions
  - Sidebar drawer: 0.3s ease
  - Mobile menu backdrop: 0.2s ease
  - NavLink hover: 0.2s ease
  - Active nav item: immediate
  
- [ ] Implement micro-interactions
  - NavLink hover: background tint + subtle scale (1.02)
  - User menu dropdown: fade + slide
  - Sidebar open/close: smooth transform
  
- [ ] Responsive spacing
  - Mobile padding: p-4
  - Desktop padding: p-6
  - Consistent gaps in flex/grid

**Acceptance Criteria**:
- Custom fonts loaded and applied
- Colors are cohesive and accessible
- Transitions are smooth (no janky animations)
- Micro-interactions feel intentional and polished
- Dark mode works correctly

---

## Summary

**Total Tasks**: 15  
**Estimated Duration**: 2-3 days for experienced React dev

**Order of Implementation**:
1. Contexts (1-2)
2. Types & Config (3)
3. Hooks (4)
4. Components (5-10)
5. Integration (11)
6. Testing & Polish (12-15)

**Blockers**:
- Must have working session management (✅ completed in #5)
- Must have user_roles table in DB (✅ from #4)

**Success Criteria**:
- ✅ All tasks completed
- ✅ No console errors
- ✅ Responsive on all breakpoints
- ✅ Navigation works for all roles
- ✅ Logout clears state
- ✅ Design is polished and intentional
