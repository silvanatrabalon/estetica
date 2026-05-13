import { useNavigate } from 'react-router-dom'
import type { AppRole } from '../../context/UserContext'
import { useUser } from '../../hooks/useUser'
import { resolveRoleHomePath } from '../../lib/routing'

const roleLabels: Record<AppRole, string> = {
  customer: 'Cliente',
  staff: 'Staff',
  admin: 'Administrador',
}

const roleDescriptions: Record<AppRole, string> = {
  customer: 'Reservar y gestionar tus turnos',
  staff: 'Gestionar tu agenda y clientes',
  admin: 'Administrar el negocio y el equipo',
}

const roleIcons: Record<AppRole, string> = {
  customer: '🗓',
  staff: '👤',
  admin: '⚙️',
}

export function RoleSelector() {
  const { roles, setActiveRole } = useUser()
  const navigate = useNavigate()

  const handleSelectRole = (role: AppRole) => {
    setActiveRole(role)
    navigate(resolveRoleHomePath(role), { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">¿Cómo querés ingresar?</h1>
          <p className="mt-2 text-sm text-gray-500">
            Tu cuenta tiene varios roles. Elegí con cuál querés continuar.
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleSelectRole(role)}
              className="w-full flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <span className="text-2xl" aria-hidden="true">
                {roleIcons[role]}
              </span>
              <div>
                <p className="font-semibold text-gray-900">{roleLabels[role]}</p>
                <p className="text-sm text-gray-500">{roleDescriptions[role]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
