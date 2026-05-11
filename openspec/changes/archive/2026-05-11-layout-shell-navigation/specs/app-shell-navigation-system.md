# Spec: App Shell & Navigation System

## Overview

The App Shell is the main layout wrapper that renders when a user is authenticated. It provides responsive navigation (sidebar + navbar) that adapts to the user's role. The shell contains three role-specific variants: CustomerShell, StaffShell, and AdminShell.

## Components

### 1. AppShell Component

**Purpose**: Root shell wrapper that selects the appropriate shell variant based on user role.

**Props**:
```typescript
interface AppShellProps {
  children: React.ReactNode
}
```

**Behavior**:
- Wraps `ShellProvider`
- Checks `useUser()` hook for user and role
- If `isLoading=true`, renders LoadingShell
- If `!user`, renders UnauthenticatedLayout (or error handling from App.tsx)
- If user exists, renders role-specific shell:
  - `role === 'customer'` → `<CustomerShell>`
  - `role === 'staff'` → `<StaffShell>`
  - `role === 'admin'` → `<AdminShell>`
  - Else → `<ErrorShell>` (invalid role)

**Layout**: 
```
<div className="grid grid-cols-[250px_1fr] md:grid-cols-1 min-h-screen">
  <Sidebar />
  <div className="flex flex-col">
    <NavBar />
    <main className="flex-1 overflow-auto p-4 md:p-6">
      {children}
    </main>
  </div>
</div>
```

---

### 2. NavBar Component

**Purpose**: Top navigation bar with logo, mobile menu toggle, and user menu.

**Props**:
```typescript
interface NavBarProps {
  children?: React.ReactNode  // Optional: for custom actions
}
```

**Content**:
- **Left**: Logo/Brand name ("Estetica")
- **Center**: (Optional) Breadcrumbs or current page title
- **Right**: 
  - Mobile menu button (hamburger icon, hidden on md+)
  - User menu dropdown (avatar, name, logout)

**Mobile Button**:
- Shows on mobile (-md breakpoint)
- Icon: `<Menu />` or `<X />` (changes based on `isMobileMenuOpen`)
- Click → `toggleMobileMenu()`

**User Menu**:
- Avatar (user initials or image)
- Dropdown with:
  - Profile link
  - Logout button (calls `signOut()`)

**Styling**:
- Height: `h-16` (64px)
- Border-bottom: subtle border
- Background: white (or dark mode aware)
- Sticky/fixed at top
- Z-index: z-30 (above sidebar but below modals)

---

### 3. Sidebar Component

**Purpose**: Main navigation sidebar/drawer with role-based nav items.

**Props**:
```typescript
interface SidebarProps {
  items: NavItem[]
  isOpen?: boolean  // For mobile drawer
}
```

**Desktop Behavior** (md+ breakpoint):
- Always visible on left
- Fixed width: 250px
- Height: 100vh (minus navbar height)
- Overflow: overflow-y-auto
- Z-index: z-20

**Mobile Behavior** (-md breakpoint):
- Overlay drawer (fixed, full height)
- Width: 250px (or full-width minus margin)
- Positioned left: 0
- Transform: `translate-x-0` (open) / `-translate-x-full` (closed)
- Backdrop overlay: semi-transparent
- Z-index: z-40 (above main content)

**Content**:
- Padding: p-4
- Navigation items list
- Active item indicator (highlight or border-left color)
- Hover state: subtle background tint

**Navigation Item Rendering**:
```typescript
items.map(item => (
  <NavLink
    key={item.id}
    item={item}
    onNavigate={() => closeMobileMenu()}  // Close drawer on mobile
    isActive={isActiveRoute(item.href)}
  />
))
```

---

### 4. NavLink Component

**Purpose**: Individual navigation item with icon and label.

**Props**:
```typescript
interface NavLinkProps {
  item: NavItem
  isActive: boolean
  onNavigate?: () => void
}
```

**Content**:
- Icon (optional, rendered left)
- Label (text)

**States**:
- **Default**: Normal text, subtle icon
- **Hover**: Background tint, slight scale (1.02)
- **Active**: 
  - Border-left highlight (colored)
  - Background highlight (subtle)
  - Bold or different color text

**Styling**:
- Padding: px-3 py-2
- Rounded: rounded-md
- Transition: smooth (0.2s)
- Cursor: pointer
- Font-size: sm (14px)

**Nested Items**:
- If `item.children`, render collapsible submenu (stretch goal, not MVP)
- Default: no nesting for MVP

---

### 5. UserMenu Component

**Purpose**: Dropdown menu with user profile actions (profile, logout).

**Props**:
```typescript
interface UserMenuProps {
  user: User
}
```

**Trigger**:
- Avatar circle with user initials or gravatar
- Text: user email or name

**Dropdown Content**:
- Profile link: `/profile` (icon + "Profile")
- Logout button: triggers `signOut()` (icon + "Logout")

**Styling**:
- Dropdown positioned top-right
- Min-width: 180px
- Shadow: subtle drop shadow
- Background: white/elevated
- Smooth fade-in animation

---

### 6. Role-Specific Shells (CustomerShell, StaffShell, AdminShell)

**Purpose**: Layout variants for each role with role-appropriate content.

**Shared Structure**:
```typescript
export function CustomerShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[250px_1fr] md:grid-cols-1 min-h-screen">
      <Sidebar items={useNavigation('customer')} />
      <div className="flex flex-col">
        <NavBar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Differences** (currently same layout, can differ in future):
- Different nav items (from `useNavigation(role)`)
- Potentially different sidebar width or styling per role
- Potentially different main content area styling

---

## Context Providers

### UserContext
**Purpose**: Share authenticated user + role across the app.

**Value**:
```typescript
{
  user: User | null
  role: AppRole | null
  isLoading: boolean
  signOut: () => Promise<void>
}
```

**Provider Location**: Wraps `<App />` or `<AppShell />`

### ShellContext
**Purpose**: Manage sidebar/menu toggle state locally.

**Value**:
```typescript
{
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}
```

**Provider Location**: Inside `<AppShell />`

---

## Hooks

### useUser()
Returns `UserContext` value (user, role, isLoading, signOut).

### useShellContext()
Returns `ShellContext` value (sidebar/menu state).

### useUserRole()
Fetches user role from `user_roles` table if not already loaded.
- Returns: `AppRole | null`
- Caches in local state
- Default fallback: 'customer'

### useNavigation(role: AppRole)
Filters `navigationByRole` by role and returns nav items.
- Returns: `NavItem[]`
- Uses `useMemo` to prevent unnecessary re-renders

---

## Navigation Config

File: `src/lib/navigation.ts`

```typescript
export type NavItem = {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  roles: AppRole[]
  children?: NavItem[]
}

export const navigationByRole: Record<AppRole | 'all', NavItem[]> = {
  // Shared items for all roles
  all: [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', ... },
  ],
  // Role-specific items
  customer: [...],
  staff: [...],
  admin: [...],
}
```

---

## User Flows

### 1. App Load & Shell Render

```
User opens app
  ↓
App.tsx checks session (existing logic from #5)
  ↓
If no session → show login page
If session exists → hydrate user + role
  ↓
Render <UserProvider><AppShell>{children}</AppShell></UserProvider>
  ↓
AppShell checks useUser()
  - if isLoading → <LoadingShell />
  - if !user → handled by App.tsx (shouldn't reach here)
  - if user → render role-specific shell
  ↓
Shell renders with nav items for that role
```

### 2. Mobile Menu Toggle

```
User opens app on mobile
  ↓
NavBar renders hamburger button (mobile only)
  ↓
User clicks hamburger
  ↓
toggleMobileMenu() → ShellContext updates isMobileMenuOpen
  ↓
Sidebar re-renders with transform: translate-x-0
  ↓
User clicks nav item
  ↓
Navigation happens + closeMobileMenu() called
  ↓
Sidebar slides out (transform: -translate-x-full)
```

### 3. Logout Flow

```
User clicks logout in user menu
  ↓
signOut() called (from UserContext)
  ↓
Session cleared (existing session.ts logic)
  ↓
UserContext: user = null, role = null
  ↓
AppShell re-renders, user is null
  ↓
Redirect to login (handled by App.tsx)
```

---

## Responsive Behavior

| Aspect | Mobile (-md) | Desktop (md+) |
|--------|--|--|
| **Sidebar** | Hidden drawer, overlay | Fixed left column |
| **Layout** | `grid-cols-1` (stack) | `grid-cols-[250px_1fr]` (2-col) |
| **NavBar** | Hamburger button visible | Hamburger hidden |
| **Main padding** | p-4 | p-6 |
| **Sidebar width** | 250px (drawer) | 250px (column) |

---

## Accessibility

- Semantic HTML: `<nav>`, `<aside>`, `<main>`, `<header>`
- ARIA labels on buttons (menu toggle, user menu)
- Focus visible states on all interactive elements
- Color + icons for differentiation (not color alone)
- Mobile drawer has backdrop (prevents interaction with content below)
- Keyboard navigation: Tab through nav items, Enter to activate

---

## Error States

| State | Display |
|-------|---------|
| Role fetch fails | Default to 'customer' role, log error |
| User null | Don't render shell (handled by App.tsx) |
| Invalid role | Show error shell with message |

---

## Future Considerations

- Collapsible nav sections (children handling)
- Breadcrumb navigation
- Search in sidebar
- Dark mode toggle
- Customizable sidebar width
- Different layouts per role (beyond just nav)
