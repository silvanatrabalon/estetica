import { TodayTotalLink } from '../admin/TodayTotalLink'
import { TodayAgenda } from '../admin/TodayAgenda'
import { useMyAgenda } from '../../hooks/useMyAgenda'

const AGENDA_PATH = '/staff/appointments'
const detailHref = (id: string) => `${AGENDA_PATH}/${id}`

/** Inicio for a professional: what is on now or next and the day's total, only their own appointments. */
export function StaffDashboard() {
  const agenda = useMyAgenda()
  const formattedDate = (() => {
    const raw = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  })()

  return (
    <div className="mx-auto -mt-2 max-w-6xl space-y-3 sm:-mt-3">
      <TodayAgenda
        items={agenda.items}
        featured={agenda.featured}
        timezone={agenda.timezone}
        now={agenda.now}
        loading={agenda.loading}
        error={agenda.error}
        detailHref={detailHref}
        hideStaffName
        subtitle={<h1 className="text-xs font-normal leading-tight text-shell-subtleText sm:text-sm">{formattedDate}</h1>}
        headerRight={<TodayTotalLink count={agenda.stats.today} loading={agenda.loading} to={`${AGENDA_PATH}?periodo=today`} />}
      />
    </div>
  )
}
