# Design: Layout Shell & Navigation

## Architecture Overview

```
App.tsx (Session lifecycle, render AppShell when authenticated)
  ↓
UserProvider (UserContext: user, role, isLoading, signOut)
  ↓
ShellProvider (ShellContext: sidebar/menu toggle state)
  ↓
AppShell (conditional shell by role or role-agnostic shell)
  ├── NavBar (top navigation, mobile menu toggle, user menu)
  ├── Sidebar (desktop sidebar, role-based nav items, mobile drawer)
  └── <main> (page content, children)
```

## Context Architecture

### UserContext
Co-locates session state (user, role) and exposes methods:
- `user: User | null` - Supabase auth user
- `role: AppRole | null` - User role from `user_roles` table
- `isLoading: boolean` - Session hydration status
- `signOut(): Promise<void>` - Logout with cleanup

**Implementation**: Moved from App.tsx logic, wraps entire app after auth check.

### ShellContext
Isolates navigation UI state (not global, local to shell):
- `isSidebarOpen: boolean` - Sidebar visible on desktop
- `toggleSidebar(): void` - Toggle desktop sidebar
- `isMobileMenuOpen: boolean` - Mobile drawer visible
- `toggleMobileMenu(): void` - Toggle mobile menu
- `closeMobileMenu(): void` - Close mobile menu

**Implementation**: Only consumed by shell components, prevents unnecessary re-renders.

## Component Structure

```
src/
├── context/
│   └── UserContext.tsx              # Session + role provider
├── components/
│   ├── index.ts                     # Barrel export
│   └── shell/
│       ├── AppShell.tsx             # Root shell wrapper
│       ├── CustomerShell.tsx        # Customer-specific layout
│       ├── StaffShell.tsx           # Staff-specific layout
│       ├── AdminShell.tsx           # Admin-specific layout
│       └── Navigation/
│           ├── index.ts
│           ├── NavBar.tsx           # Top bar with logo, mobile toggle, user menu
│           ├── Sidebar.tsx          # Desktop sidebar / mobile drawer
│           ├── NavLink.tsx          # Individual nav item
│           └── UserMenu.tsx         # User dropdown (avatar, profile, logout)
├── features/
│   └── shell/
│       ├── context.tsx              # ShellContext provider
│       ├── hooks/
│       │   ├── useShellContext.ts
│       │   ├── useUserRole.ts       # Query user role from db
│       │   └── useNavigation.ts     # Filter nav items by role
│       ├── navConfig.ts             # Declarative nav items by role
│       ├── types.ts                 # NavItem, UserRole types
│       └── index.ts                 # Barrel export
├── hooks/
│   ├── useUser.ts                   # Access UserContext
│   └── index.ts
└── lib/
    ├── navigation.ts                # navigationByRole mapping (replaces navConfig)
    └── index.ts
```

## State Flow

### Session Hydration on App Load

```
App renders
  ↓
1. Check localStorage for session
2. Call supabase.auth.getSession()
3. If session exists, restore auth state
4. Fetch user role from user_roles table (async)
5. setIsLoading(false)
  ↓
UserContext ready
  ↓
Render AppShell
```

### Navigation Item Filtering

```
useUserRole() → queries user_roles table → caches in hook state
  ↓
useNavigation(role) → filters navigationByRole by role
  ↓
<Sidebar items={navItems} />
  ↓
NavLink components render for each item
```

### Mobile Menu Lifecycle

```
NavBar renders:
  - Shows hamburger button on mobile (<md breakpoint)
  - Click toggleMobileMenu() → ShellContext updates
  
Sidebar renders:
  - Desktop: fixed aside, always visible (md+)
  - Mobile: fixed drawer, hidden (-translate-x-full), visible when open (translate-x-0)
  
User clicks nav item:
  - onNavigate → closeMobileMenu()
  - Drawer slides out
```

## Navigation Configuration

Declarative, role-based nav items in `lib/navigation.ts`:

```typescript
export type NavItem = {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  roles: AppRole[]  // customer | staff | admin
  children?: NavItem[]
}

export const navigationByRole: Record<AppRole | 'all', NavItem[]> = {
  all: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', 
      roles: ['customer', 'staff', 'admin'], icon: <HomeIcon /> },
    { id: 'profile', label: 'Profile', href: '/profile', 
      roles: ['customer', 'staff', 'admin'], icon: <UserIcon /> },
  ],
  customer: [
    { id: 'booking', label: 'Book Appointment', href: '/booking', 
      roles: ['customer'], icon: <CalendarIcon /> },
    { id: 'appointments', label: 'My Appointments', href: '/appointments', 
      roles: ['customer'], icon: <ListIcon /> },
  ],
  staff: [
    { id: 'schedule', label: 'Schedule', href: '/staff/schedule', 
      roles: ['staff', 'admin'], icon: <CalendarIcon /> },
    { id: 'clients', label: 'Clients', href: '/staff/clients', 
      roles: ['staff', 'admin'], icon: <UsersIcon /> },
  ],
  admin: [
    { id: 'users', label: 'Users', href: '/admin/users', 
      roles: ['admin'], icon: <UsersIcon /> },
    { id: 'services', label: 'Services', href: '/admin/services', 
      roles: ['admin'], icon: <SettingsIcon /> },
  ],
}
```

## Responsive Design Strategy

### Grid Layout
```typescript
// AppShell uses CSS Grid for layout
<div className="grid grid-cols-[250px_1fr] md:grid-cols-1 min-h-screen gap-0">
  {/* Desktop: 2-col, sidebar 250px fixed. Mobile: 1-col stack */}
  <Sidebar />
  <main>...</main>
</div>
```

### Sidebar Visibility
- **Desktop (md+)**: Fixed left sidebar, always visible, takes 250px
- **Mobile (-md)**: Overlay drawer, fixed positioned, transform-based slide
  - Closed: `-translate-x-full`
  - Open: `translate-x-0`

### NavBar
- Logo/brand always visible
- Mobile menu button: `hidden md:block` (hamburger on mobile)
- User menu: always visible in top-right

### Tailwind Breakpoints Used
- `md:` (768px) - Desktop threshold
- Responsive padding/margin adjustments
- Hidden/block utilities for conditional rendering

## Aesthetic Details

### Typography
- **Display Font**: Custom choice (NOT Inter/Roboto) - unique and distinctive
  - Used for: Logo, section headings, nav item labels
- **Body Font**: Refined choice that pairs well
  - Used for: Body text, descriptions, timestamps

### Color Scheme
- **Primary**: Brand accent color (CTA buttons, active nav items)
- **Secondary**: Subtle background/border color
- **Dark Mode**: Support with CSS variables
- **Text**: High contrast for accessibility
- **Borders**: Subtle, 1px, using border colors for definition

### Spacing & Whitespace
- Sidebar padding: generous (p-4 or p-6)
- Nav item spacing: 0.5rem between items (gap-2)
- Main content padding: 1rem mobile, 1.5rem desktop
- Negative space reinforces hierarchy

### Micro-Interactions
- NavLink hover: slight background tint + scale
- Mobile menu slide: smooth transform transition (0.3s ease)
- User menu dropdown: fade + subtle slide
- Active nav item: indicator (border-left or bg highlight)

### Accessibility
- Semantic HTML: `<nav>`, `<aside>`, `<main>`
- ARIA labels for interactive elements
- Focus states visible and accessible
- Color not sole differentiator (use icons + text)
- Mobile drawer has backdrop overlay with opacity

## Integration Points

### With Existing Session (App.tsx)
- UserContext reads from existing session.ts service
- User and role flow down to shell components
- Logout calls session.ts signOut() method

### With Supabase RLS
- Nav items filtered by role (UX layer)
- Actual data access controlled by RLS (security layer)
- No privileged queries from client

### With Future Protected Routes (#7)
- Shell structure prepared for router integration
- AppShell can wrap Router component
- Role context available for route guards
- No route protection in this feature

## Error & Loading States

### App Load
- `isLoading=true` → Show splash screen
- `error` → Show error with retry button
- `!user` → Show auth page

### Shell Initialization
- Role loading → Show placeholder nav (skeleton or plain list)
- Role fetch fails → Default to 'customer' role (safe default)

## File Locations & Implementation Order

1. **Context** (foundation)
   - `src/context/UserContext.tsx`
   - `src/features/shell/context.tsx` (ShellContext)

2. **Types & Config** (structure)
   - `src/features/shell/types.ts`
   - `src/lib/navigation.ts` (or `src/features/shell/navConfig.ts`)

3. **Hooks** (logic)
   - `src/hooks/useUser.ts`
   - `src/features/shell/hooks/useShellContext.ts`
   - `src/features/shell/hooks/useUserRole.ts`
   - `src/features/shell/hooks/useNavigation.ts`

4. **Components** (presentation)
   - `src/components/shell/Navigation/NavLink.tsx`
   - `src/components/shell/Navigation/UserMenu.tsx`
   - `src/components/shell/Navigation/Sidebar.tsx`
   - `src/components/shell/Navigation/NavBar.tsx`
   - `src/components/shell/CustomerShell.tsx` (and Staff, Admin)
   - `src/components/shell/AppShell.tsx`

5. **Integration** (wiring)
   - Update `App.tsx` to use UserProvider + AppShell
   - Add placeholder pages for testing (DashboardPage, etc.)

## Security Considerations

✅ **UI Layer**: Navigation items filtered by role (good UX)
✅ **DB Layer**: RLS policies enforce actual access (security)
✅ **Session**: Existing session.ts handles auth state and token refresh
✅ **Logout**: Clears user context and local state, redirects to login

⚠️ **Not in Scope**: Route protection (handled by #7)
