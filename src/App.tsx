import { Navigate, Route, Routes } from 'react-router-dom'
import { UserProvider } from './context'
import {
  AuthGuard,
  ProtectedShellLayout,
  PublicOnlyGuard,
  RoleGuard,
} from './components/routing'
import { RoleSelector } from './components/auth/RoleSelector'
import {
  AdminAppointmentsPage,
  AdminCalendarPage,
  AdminDashboardPage,
  AdminReportsPage,
  AdminServiceAvailabilityPage,
  AdminServicesPage,
  AdminStaffPage,
  AdminStaffServicesPage,
  AdminUsersPage,
  AppointmentsPage,
  BookingConfirmationPage,
  BookingPage,
  BusinessSettingsPage,
  AppearancePage,
  DashboardPage,
  LandingPage,
  NotFoundPage,
  PrivacyPage,
  ProfilePage,
  ProfileSetupPage,
  ReschedulePage,
  SignInPage,
  StaffAppointmentsPage,
  StaffAvailabilityPage,
  StaffSchedulePage,
  TermsPage,
  UnauthorizedPage,
} from './pages'

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacidad" element={<PrivacyPage />} />
      <Route path="/terminos" element={<TermsPage />} />

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
            <Route path="/booking/confirmation/:appointmentId" element={<BookingConfirmationPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['customer', 'staff', 'admin']} />}>
            <Route path="/appointments/:id/reschedule" element={<ReschedulePage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['staff', 'admin']} />}>
            <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
            <Route path="/staff/schedule" element={<StaffSchedulePage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/settings/business" element={<BusinessSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/staff" element={<AdminStaffPage />} />
            <Route path="/admin/staff/:staffId/availability" element={<StaffAvailabilityPage />} />
            <Route path="/admin/staff/:staffId/services" element={<AdminStaffServicesPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/services/:serviceId/availability" element={<AdminServiceAvailabilityPage />} />
            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
            <Route path="/admin/calendar" element={<AdminCalendarPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/appearance" element={<AppearancePage />} />
            <Route path="/admin/settings/landing" element={<Navigate to="/admin/appearance" replace />} />
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
