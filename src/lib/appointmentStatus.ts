export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

/** Card colors by status, the same in every list of appointments. */
export const STATUS_CARD: Record<string, string> = {
  pending: 'border-amber-200 border-l-amber-400 bg-amber-50',
  confirmed: 'border-emerald-200 border-l-emerald-500 bg-emerald-50',
  cancelled: 'border-red-200 border-l-red-400 bg-red-50',
  completed: 'border-slate-200 border-l-slate-400 bg-slate-100',
}
