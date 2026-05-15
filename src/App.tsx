import { Navigate, Route, Routes } from 'react-router-dom'
import { UserProvider, useUser } from './context'
import {
  AuthGuard,
  NullRoleRecovery,
  ProtectedShellLayout,
  PublicOnlyGuard,
  RoleGuard,
  RouteLoadingState,
} from './components/routing'
import { RoleSelector } from './components/auth/RoleSelector'
import { resolveRoleHomePath } from './lib/routing'
import {
  AdminReportsPage,
  AdminServicesPage,
  AdminStaffPage,
  AdminStaffServicesPage,
  AdminUsersPage,
  AppointmentsPage,
  BusinessSettingsPage,
  BookingPage,
  DashboardPage,
  NotFoundPage,
  ProfilePage,
  ProfileSetupPage,
  SignInPage,
  StaffAppointmentsPage,
  StaffAvailabilityPage,
  StaffClientsPage,
  StaffSchedulePage,
  UnauthorizedPage,
} from './pages'

function RootRedirect() {
  const { user, roles, activeRole, isLoading, retryRoleResolution } = useUser()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  // Multi-role user with no active selection → role selector
  if (roles.length > 1 && !activeRole) {
    return <Navigate to="/seleccionar-rol" replace />
  }

  if (!activeRole) {
    return <NullRoleRecovery onRetry={retryRoleResolution} />
  }

  return <Navigate to={resolveRoleHomePath(activeRole)} replace />
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyGuard />}>
        <Route path="/signin" element={<SignInPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        {/* Role selector — authenticated only, no RoleGuard (multi-role users) */}
        <Route path="/seleccionar-rol" element={<RoleSelector />} />

        <Route element={<ProtectedShellLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<RoleGuard allowedRoles={['customer']} />}>
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['staff', 'admin']} />}>
            <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
            <Route path="/staff/schedule" element={<StaffSchedulePage />} />
            <Route path="/staff/clients" element={<StaffClientsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin/settings/business" element={<BusinessSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/staff" element={<AdminStaffPage />} />
            <Route path="/admin/staff/:staffId/availability" element={<StaffAvailabilityPage />} />
            <Route path="/admin/staff/:staffId/services" element={<AdminStaffServicesPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}
