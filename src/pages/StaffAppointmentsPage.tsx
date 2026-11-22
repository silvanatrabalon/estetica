import { AdminAppointmentsPage } from './AdminAppointmentsPage'

/** Turnos for a professional: the same screen as the admin's, with only their own appointments. */
export function StaffAppointmentsPage() {
  return <AdminAppointmentsPage mode="staff" />
}
