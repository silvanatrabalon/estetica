import { useUser } from '../hooks/useUser'
import { StaffDashboard } from '../components/staff/StaffDashboard'
import { CustomerDashboard } from '../components/customer/CustomerDashboard'

/** Inicio: a professional sees their agenda; a client sees theirs. Same layout, each with only their own appointments. */
export function DashboardPage() {
  const { activeRole } = useUser()

  if (activeRole === 'staff') {
    return <StaffDashboard />
  }

  return <CustomerDashboard />
}
