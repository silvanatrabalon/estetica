import type { AdminManagedRole } from '../services/adminUsers'

export const ALL_ROLES: AdminManagedRole[] = ['customer', 'staff', 'admin']

export function roleLabel(role: AdminManagedRole): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'staff') return 'Staff'
  return 'Cliente'
}

export function formatRelativeDate(dateValue: string | null): string {
  if (!dateValue) {
    return 'Sin registro'
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin registro'
  }

  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
