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
import { resolveRoleHomePath } from './lib/routing'
import {
  AdminReportsPage,
  AdminServicesPage,
  AdminStaffPage,
  AdminUsersPage,
  AppointmentsPage,
  BusinessSettingsPage,
  BookingPage,
  DashboardPage,
  NotFoundPage,
  ProfilePage,
  ProfileSetupPage,
  SignInPage,
  StaffAvailabilityPage,
  StaffClientsPage,
  StaffSchedulePage,
  UnauthorizedPage,
} from './pages'

function RootRedirect() {
  const { user, role, isLoading, retryRoleResolution } = useUser()

  if (isLoading) {
    return <RouteLoadingState />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (!role) {
    return <NullRoleRecovery onRetry={retryRoleResolution} />
  }

  return <Navigate to={resolveRoleHomePath(role)} replace />
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicOnlyGuard />}>
        <Route path="/signin" element={<SignInPage />} />
      </Route>

      <Route element={<AuthGuard />}>
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
            <Route path="/staff/schedule" element={<StaffSchedulePage />} />
            <Route path="/staff/clients" element={<StaffClientsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin/settings/business" element={<BusinessSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/staff" element={<AdminStaffPage />} />
            <Route path="/admin/staff/:staffId/availability" element={<StaffAvailabilityPage />} />
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
