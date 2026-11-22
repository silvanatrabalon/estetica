import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListAdminUsers = vi.fn()
const mockAdminSetUserActive = vi.fn()
const mockListInvitations = vi.fn()
const mockInviteUser = vi.fn()
const mockDeleteInvitation = vi.fn()

vi.mock('../services/adminUsers', () => ({
  listAdminUsers: (...args: unknown[]) => mockListAdminUsers(...args),
  adminSetUserActive: (...args: unknown[]) => mockAdminSetUserActive(...args),
  adminListUserInvitations: (...args: unknown[]) => mockListInvitations(...args),
  adminInviteUser: (...args: unknown[]) => mockInviteUser(...args),
  adminDeleteUserInvitation: (...args: unknown[]) => mockDeleteInvitation(...args),
}))

const mockListStaff = vi.fn()
const mockListClients = vi.fn()
const mockLinkStaff = vi.fn()
const mockLinkedIds = vi.fn()
const mockNavigate = vi.fn()
vi.mock('../services/adminStaff', () => ({
  listAdminStaffMembers: (...a: unknown[]) => mockListStaff(...a),
  adminLinkStaffMember: (...a: unknown[]) => mockLinkStaff(...a),
  listLinkedStaffUserIds: (...a: unknown[]) => mockLinkedIds(...a),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../services/bookingClients', () => ({ listBookingClients: (...a: unknown[]) => mockListClients(...a) }))

function pickRole(label: RegExp | string) {
  fireEvent.click(screen.getByRole('button', { name: 'Filtrar por rol' }))
  fireEvent.click(screen.getByRole('menuitemradio', { name: label }))
}

function pickStatus(label: RegExp | string) {
  fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
  fireEvent.click(screen.getByRole('menuitemradio', { name: label }))
}

function renderPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/admin/users', state }]}>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <AdminUsersPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockListStaff.mockResolvedValue([])
  mockListClients.mockResolvedValue([])
  mockLinkedIds.mockResolvedValue([])
})

const ana = {
  userId: 'u-1',
  email: 'ana@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignInAt: null,
  name: 'Ana',
  phone: null,
  roles: ['customer'],
  isActive: true,
}

const admin = {
  userId: mockSessions.authenticatedAdmin.user.id,
  email: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastSignInAt: null,
  name: 'Admin',
  phone: null,
  roles: ['admin'],
  isActive: true,
}

describe('AdminUsersPage (simple directory)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListInvitations.mockResolvedValue([])
  })

  it('lists users with email, roles and status', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    expect(await screen.findByText('Ana')).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByText('Cliente')).toBeDefined()
    expect(screen.getByText('Administrador')).toBeDefined()
  })

  it('has a title that mentions roles and explains where to edit them', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Usuarios y roles' })).toBeDefined()
    expect(screen.getByText(/usá “Editar roles”/)).toBeDefined()
  })

  it('no longer edits roles or personal data inline', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage()
    await screen.findByText('Ana')

    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByText('Roles asignados')).toBeNull()
    expect(screen.queryByRole('button', { name: /Guardar perfil/ })).toBeNull()
    expect(screen.queryByLabelText(/Eliminar usuario/)).toBeNull()
  })

  it('each row has its own "Editar roles" button', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    expect(await screen.findByRole('button', { name: 'Editar roles de Ana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar roles de Admin' })).toBeInTheDocument()
  })

  it('deactivates a user after confirmation', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    mockAdminSetUserActive.mockResolvedValue({ user_id: 'u-1', role: 'customer', is_active: false })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAdminSetUserActive).toHaveBeenCalledWith('u-1', false))
    expect(await screen.findByText('Usuario desactivado correctamente.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reactivar a Ana' })).toBeDefined()
  })

  it('reactivates an inactive user (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([{ ...ana, isActive: false }, admin])
    mockAdminSetUserActive.mockResolvedValue({ user_id: 'u-1', role: 'customer', is_active: true })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(mockAdminSetUserActive).toHaveBeenCalledWith('u-1', true))
    expect(await screen.findByText('Usuario reactivado correctamente.')).toBeDefined()
  })

  it('blocks deactivating the last active admin (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Admin' }))

    expect(await screen.findByText('No podés desactivar al último administrador activo.')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
    expect(mockAdminSetUserActive).not.toHaveBeenCalled()
  })

  it('shows an error when the status change fails (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    mockAdminSetUserActive.mockRejectedValue(new Error('x'))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar a Ana' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(/No pudimos cambiar el estado del usuario/)).toBeDefined()
  })

  it('filters by name or email and says when nothing matches (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()
    await screen.findByText('Ana')

    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'admin@' } })
    expect(screen.queryByText('Ana')).toBeNull()
    expect(screen.getByText('Admin')).toBeDefined()

    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'zzz' } })
    expect(screen.getByText('No se encontraron usuarios con ese criterio.')).toBeDefined()
  })

  it('shows an empty state when there are no users (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No hay usuarios disponibles para administrar.')).toBeDefined()
  })

  it('shows an error when the directory cannot be loaded (edge case)', async () => {
    mockListAdminUsers.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText(/No pudimos cargar la gestión de usuarios/)).toBeDefined()
  })

  it('shows the notice passed after deleting a user (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana])
    renderPage({ notice: 'Usuario eliminado correctamente.' })
    expect(await screen.findByText('Usuario eliminado correctamente.')).toBeDefined()
  })

  describe('filters and retry', () => {
    const staffUser = { ...ana, userId: 'u-3', name: 'Sofía', email: 'sofia@example.com', roles: ['staff', 'customer'] }
    const inactive = { ...ana, userId: 'u-4', name: 'Inés', email: 'ines@example.com', isActive: false }

    it('has no "Reintentar" button when the directory loaded fine', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      renderPage()
      await screen.findByText('Ana')
      expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull()
    })

    it('offers "Reintentar" only when loading failed, and reloads on click (edge case)', async () => {
      mockListAdminUsers.mockRejectedValueOnce(new Error('down'))
      renderPage()
      await screen.findByText(/No pudimos cargar la gestión de usuarios/)
      mockListAdminUsers.mockResolvedValue([ana])
      fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))
      expect(await screen.findByText('Ana')).toBeDefined()
      expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull()
    })

    it('shows how many users each role filter has', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por rol' }))
      for (const name of ['Todos (3)', 'Administradores (1)', 'Staff (1)', 'Clientes (2)']) {
        expect(screen.getByRole('menuitemradio', { name })).toBeInTheDocument()
      }
      expect(screen.queryByRole('menuitemradio', { name: /Sin cuenta/ })).toBeNull() // that one lives in Estado
    })

    it('filters by role (a user with several roles appears in each)', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser])
      renderPage()
      await screen.findByText('Ana')
      pickRole(/^Staff/)
      expect(screen.getByText('Sofía')).toBeDefined()
      expect(screen.queryByText('Ana')).toBeNull()
      pickRole(/^Clientes/)
      expect(screen.getByText('Sofía')).toBeDefined()
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.queryByText('Admin')).toBeNull()
    })

    it('filters by status', async () => {
      mockListAdminUsers.mockResolvedValue([ana, inactive])
      renderPage()
      await screen.findByText('Ana')
      pickStatus('Inactivos')
      expect(screen.getByText('Inés')).toBeDefined()
      expect(screen.queryByText('Ana')).toBeNull()
      pickStatus('Activos')
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.queryByText('Inés')).toBeNull()
    })

    it('combines search, role and status, and says when nothing matches (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana, admin, staffUser, inactive])
      renderPage()
      await screen.findByText('Ana')
      pickRole(/^Clientes/)
      pickStatus('Inactivos')
      fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'sofia' } })
      expect(screen.getByText('No se encontraron usuarios con ese criterio.')).toBeDefined()
    })
  })

  describe('add a user (invitation)', () => {
    const pending = {
      id: 'i1',
      email: 'nora@mail.com',
      name: 'Nora Díaz',
      roles: ['admin', 'staff'],
      createdAt: '2026-11-21T00:00:00Z',
    }

    async function openForm() {
      mockListAdminUsers.mockResolvedValue([ana])
      renderPage()
      await screen.findByText('Ana')
      fireEvent.click(screen.getByRole('button', { name: '+ Agregar usuario' }))
    }

    it('offers email, name and the three roles, with "Cliente" checked by default', async () => {
      await openForm()
      expect(screen.getByLabelText('Email')).toBeDefined()
      expect(screen.getByLabelText(/Nombre/)).toBeDefined()
      expect(screen.getByRole('checkbox', { name: 'Cliente' })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Staff' })).not.toBeChecked()
      expect(screen.getByRole('checkbox', { name: 'Administrador' })).not.toBeChecked()
    })

    it('saves the invitation with the chosen roles and says what happens next', async () => {
      mockInviteUser.mockResolvedValue({ status: 'invited', invitationId: 'i1' })
      await openForm()
      mockListInvitations.mockResolvedValue([pending])
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Nora@Mail.com' } })
      fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'Nora Díaz' } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Administrador' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Staff' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      await waitFor(() => expect(mockInviteUser).toHaveBeenCalledWith('Nora@Mail.com', 'Nora Díaz', ['admin', 'staff']))
      expect(await screen.findByText(/Cuando nora@mail.com entre a la app, ya tiene sus roles/)).toBeDefined()
      expect(screen.getByText('Invitación pendiente')).toBeDefined()
    })

    it('needs at least one role (edge case)', async () => {
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Cliente' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Elegí al menos un rol.')).toBeDefined()
      expect(mockInviteUser).not.toHaveBeenCalled()
    })

    it('an email that already has an account points to "Editar roles" instead (edge case)', async () => {
      mockInviteUser.mockResolvedValue({ status: 'exists', userId: 'u-1' })
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText(/Ese email ya tiene cuenta/)).toBeDefined()
      expect(screen.getByRole('link', { name: 'Ir a Editar roles de esa cuenta' })).toHaveAttribute('href', '/admin/users/u-1')
    })

    it('shows the error and keeps the form open when the invitation fails (edge case)', async () => {
      mockInviteUser.mockRejectedValue(new Error('Ya hay una invitación pendiente para ese email.'))
      await openForm()
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
      expect(await screen.findByText('Ya hay una invitación pendiente para ese email.')).toBeDefined()
      expect(screen.getByLabelText('Email')).toBeDefined()
    })

    it('lists the pending invitations with their roles and removes one after confirming', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockResolvedValue([pending])
      mockDeleteInvitation.mockResolvedValue(undefined)
      renderPage()
      expect(await screen.findByText('Nora Díaz')).toBeDefined()
      expect(screen.getByText('Administrador, Staff')).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: 'Quitar la invitación de nora@mail.com' }))
      fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(mockDeleteInvitation).toHaveBeenCalledWith('i1'))
      expect(await screen.findByText('Invitación quitada.')).toBeDefined()
      expect(screen.queryByText('Nora Díaz')).toBeNull()
    })

    it('does not remove an invitation if the confirmation is cancelled (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockResolvedValue([pending])
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Quitar la invitación de nora@mail.com' }))
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(mockDeleteInvitation).not.toHaveBeenCalled()
    })

    it('the page still works if the invitations cannot be loaded (edge case)', async () => {
      mockListAdminUsers.mockResolvedValue([ana])
      mockListInvitations.mockRejectedValue(new Error('down'))
      renderPage()
      expect(await screen.findByText('Ana')).toBeDefined()
      expect(screen.queryByText('Invitaciones pendientes')).toBeNull()
    })
  })
})

describe('AdminUsersPage — compact on phones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana])
  })

  it('the Agregar button sits in the same row as the search box (edge case)', async () => {
    renderPage()
    await screen.findByText('Ana')
    const search = screen.getByLabelText('Buscar usuarios')
    const add = screen.getByRole('button', { name: '+ Agregar usuario' })
    expect(search.parentElement).toBe(add.parentElement)
    // and no longer next to the title
    expect(screen.getByRole('heading', { name: 'Usuarios y roles' }).parentElement).not.toContain(add)
  })

  it('the long explanation is hidden on phones and shown on larger screens', async () => {
    renderPage()
    await screen.findByText('Ana')
    expect(screen.getByText(/Quién tiene cuenta y si está activa/).className).toContain('hidden')
    expect(screen.getByText(/Quién tiene cuenta y si está activa/).className).toContain('sm:block')
  })

  it('the filters are two drop-downs in one row instead of rows of chips', async () => {
    renderPage()
    await screen.findByText('Ana')
    const role = screen.getByRole('button', { name: 'Filtrar por rol' })
    const status = screen.getByRole('button', { name: 'Filtrar por estado' })
    expect(role.parentElement?.parentElement).toBe(status.parentElement?.parentElement)
    expect(role).toHaveAttribute('aria-haspopup', 'menu')
    expect(screen.queryByRole('group', { name: 'Filtrar por rol' })).toBeNull()
    expect(role.textContent).toContain('Todos')
    expect(status.textContent).toContain('Estado')
  })

  it('the buttons show what is chosen and are highlighted only when filtering (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([ana, admin])
    renderPage()
    await screen.findByText('Ana')
    const role = screen.getByRole('button', { name: 'Filtrar por rol' })
    expect(role.className).not.toContain('border-brand-primary')
    pickRole(/^Administradores/)
    expect(screen.getByRole('button', { name: 'Filtrar por rol' }).textContent).toContain('Administradores')
    expect(screen.getByRole('button', { name: 'Filtrar por rol' }).className).toContain('border-brand-primary')
    pickStatus('Inactivos')
    expect(screen.getByRole('button', { name: 'Filtrar por estado' }).textContent).toContain('Inactivos')
  })

  it('the button disappears while the form is open, leaving the search alone (edge case)', async () => {
    renderPage()
    await screen.findByText('Ana')
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar usuario' }))
    expect(screen.queryByRole('button', { name: '+ Agregar usuario' })).toBeNull()
    expect(screen.getByLabelText('Buscar usuarios')).toBeInTheDocument()
  })
})

describe('AdminUsersPage — people without account are part of the list', () => {
  const lucia = { id: 'sm-1', profileUserId: null, displayName: 'Lucía Fernández', inviteEmail: null }
  const camila = { id: 'sm-2', profileUserId: null, displayName: 'Camila Torres', inviteEmail: 'camila@example.com' }
  const linked = { id: 'sm-3', profileUserId: 'u-9', displayName: 'Ya vinculada', inviteEmail: null }
  const rosa = { kind: 'guest', userId: null, name: 'Rosa Gómez', email: 'rosa@mail.com', phone: '1155', isActive: true }
  const withAccount = { kind: 'account', userId: 'u-1', name: 'Ana', email: 'ana@example.com', phone: null, isActive: true }
  const invitedAdmin = {
    id: 'i-1',
    email: 'jefa@mail.com',
    name: 'Jefa Nueva',
    roles: ['admin'],
    createdAt: '2026-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana])
    mockListInvitations.mockResolvedValue([invitedAdmin])
    mockListStaff.mockResolvedValue([lucia, camila, linked])
    mockListClients.mockResolvedValue([rosa, withAccount])
  })

  async function open() {
    renderPage()
    await screen.findByText('Ana')
    await screen.findByText('Rosa Gómez')
  }
  const openRoleMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Filtrar por rol' }))

  it('"Todos" lists accounts, invited people, professionals and clients without account, and counts all of them', async () => {
    await open()
    for (const text of ['Ana', 'Jefa Nueva', 'Lucía Fernández', 'Camila Torres', 'Rosa Gómez']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.queryByText('Ya vinculada')).toBeNull() // already has an account: not a "sin cuenta"
    openRoleMenu()
    expect(screen.getByRole('menuitemradio', { name: 'Todos (5)' })).toBeInTheDocument()
  })

  it('marks who has no account', async () => {
    await open()
    expect(screen.getAllByText('Sin cuenta')).toHaveLength(3) // Lucía, Camila, Rosa
    expect(screen.getByText('Invitación pendiente')).toBeInTheDocument()
  })

  it('an invited admin shows under Administradores', async () => {
    await open()
    pickRole(/^Administradores/)
    expect(screen.getByText('Jefa Nueva')).toBeInTheDocument()
    expect(screen.queryByText('Ana')).toBeNull()
    expect(screen.queryByText('Rosa Gómez')).toBeNull()
    openRoleMenu()
    expect(screen.getByRole('menuitemradio', { name: 'Administradores (1)' })).toBeInTheDocument()
  })

  it('professionals without account show under Staff, with their link to bind them', async () => {
    await open()
    pickRole(/^Staff/)
    expect(screen.getByText('Lucía Fernández')).toBeInTheDocument()
    expect(screen.getByText('Se vincula sola cuando entre con camila@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sin email guardado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vincular cuenta a Lucía Fernández' })).toBeInTheDocument()
    expect(screen.queryByText('Rosa Gómez')).toBeNull()
    expect(screen.queryByText('Jefa Nueva')).toBeNull()
  })

  it('clients without account show under Clientes, with email and phone and no actions', async () => {
    await open()
    pickRole(/^Clientes/)
    expect(screen.getByText('Rosa Gómez')).toBeInTheDocument()
    expect(screen.getByText('rosa@mail.com · 1155')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.queryByText('Lucía Fernández')).toBeNull()
    const row = screen.getByText('Rosa Gómez').closest('li')!
    expect(row.querySelector('a, button')).toBeNull()
  })

  it('"Sin cuenta" shows only the people without account, including invitations', async () => {
    await open()
    pickStatus(/^Sin cuenta/)
    for (const text of ['Jefa Nueva', 'Lucía Fernández', 'Camila Torres', 'Rosa Gómez']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.queryByText('Ana')).toBeNull()
    // the role filter is still there and still works
    expect(screen.getByRole('button', { name: 'Filtrar por rol' })).toBeInTheDocument()
  })

  it('"Sin cuenta" can be combined with a role: Staff + Sin cuenta, Clientes + Sin cuenta, Administradores + Sin cuenta', async () => {
    await open()
    pickStatus(/^Sin cuenta/)
    pickRole(/^Staff/)
    expect(screen.getByText('Lucía Fernández')).toBeInTheDocument()
    expect(screen.getByText('Camila Torres')).toBeInTheDocument()
    expect(screen.queryByText('Rosa Gómez')).toBeNull()
    expect(screen.queryByText('Jefa Nueva')).toBeNull()

    pickRole(/^Clientes/)
    expect(screen.getByText('Rosa Gómez')).toBeInTheDocument()
    expect(screen.queryByText('Lucía Fernández')).toBeNull()
    expect(screen.queryByText('Ana')).toBeNull()

    pickRole(/^Administradores/)
    expect(screen.getByText('Jefa Nueva')).toBeInTheDocument()
    expect(screen.queryByText('Rosa Gómez')).toBeNull()

    pickRole(/^Todos/)
    for (const text of ['Jefa Nueva', 'Lucía Fernández', 'Rosa Gómez']) expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('the Sin cuenta count in Estado follows the chosen role (edge case)', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
    expect(screen.getByRole('menuitemradio', { name: 'Sin cuenta (4)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' })) // close
    pickRole(/^Staff/)
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
    expect(screen.getByRole('menuitemradio', { name: 'Sin cuenta (2)' })).toBeInTheDocument()
  })

  it('a status filter leaves out the people without account, since they have no status (edge case)', async () => {
    await open()
    pickStatus('Activos')
    expect(screen.getByText('Ana')).toBeInTheDocument()
    for (const text of ['Jefa Nueva', 'Lucía Fernández', 'Rosa Gómez']) {
      expect(screen.queryByText(text)).toBeNull()
    }
  })

  it('the search covers the people without account (edge case)', async () => {
    await open()
    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'camila@' } })
    expect(screen.getByText('Camila Torres')).toBeInTheDocument()
    expect(screen.queryByText('Lucía Fernández')).toBeNull()
    expect(screen.queryByText('Rosa Gómez')).toBeNull()
    expect(screen.queryByText('Ana')).toBeNull()
    fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: '1155' } })
    expect(screen.getByText('Rosa Gómez')).toBeInTheDocument()
  })

  it('says there is nobody when everything is empty, and that nothing matches a search (edge cases)', async () => {
    mockListAdminUsers.mockResolvedValue([])
    mockListInvitations.mockResolvedValue([])
    mockListStaff.mockResolvedValue([])
    mockListClients.mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('No hay usuarios disponibles para administrar.')).toBeInTheDocument()
  })

  it('if the extra lists cannot be loaded the page still works with the accounts (edge case)', async () => {
    mockListStaff.mockRejectedValue(new Error('down'))
    mockListClients.mockRejectedValue(new Error('down'))
    mockListInvitations.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    openRoleMenu()
    expect(screen.getByRole('menuitemradio', { name: 'Todos (1)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
    expect(screen.getByRole('menuitemradio', { name: 'Sin cuenta (0)' })).toBeInTheDocument()
  })

  it('an invitation can still be removed from the list', async () => {
    mockDeleteInvitation.mockResolvedValue(undefined)
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar la invitación de jefa@mail.com' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(mockDeleteInvitation).toHaveBeenCalledWith('i-1'))
  })
})

describe('AdminUsersPage — link an account in a pop-up', () => {
  const lucia = { id: 'sm-1', profileUserId: null, displayName: 'Lucía Fernández', inviteEmail: null }
  const already = { id: 'sm-3', profileUserId: 'u-bruno', displayName: 'Bruno', inviteEmail: null }
  const bruno = { ...ana, userId: 'u-bruno', name: 'Bruno López', email: 'bruno@example.com', roles: ['staff'] }
  const maxi = { ...ana, userId: 'u-maxi', name: 'Maxi Insfran', email: 'maxi@example.com', roles: ['customer'] }

  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana, bruno, maxi])
    mockListInvitations.mockResolvedValue([])
    mockListStaff.mockResolvedValue([lucia, already])
    mockListClients.mockResolvedValue([])
    mockLinkStaff.mockResolvedValue({ ...lucia, profileUserId: 'u-maxi' })
    mockLinkedIds.mockResolvedValue(['u-bruno'])
  })

  async function openPopup() {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Vincular cuenta a Lucía Fernández' }))
    return screen.findByRole('dialog', { name: 'Vincular una cuenta a Lucía Fernández' })
  }

  it('opens a pop-up on the same screen, with a search box and the list of accounts', async () => {
    const dialog = await openPopup()
    expect(dialog).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Buscar cuenta')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Maxi Insfran/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Ana/ })).toBeInTheDocument()
  })

  it('shows the accounts that already belong to a professional, marked and not selectable (edge case)', async () => {
    await openPopup()
    const taken = screen.getByRole('option', { name: /Bruno López/ })
    expect(taken).toHaveAttribute('aria-disabled', 'true')
    expect(taken.textContent).toContain('Ya es profesional')
    fireEvent.click(taken)
    expect(taken).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('an administrator account can be linked like any other (edge case)', async () => {
    const boss = { ...ana, userId: 'u-boss', name: 'Jefa', email: 'jefa@example.com', roles: ['admin'] }
    mockListAdminUsers.mockResolvedValue([ana, boss])
    mockLinkStaff.mockResolvedValue({ ...lucia, profileUserId: 'u-boss' })
    await openPopup()
    const option = screen.getByRole('option', { name: /Jefa/ })
    expect(option).not.toHaveAttribute('aria-disabled')
    expect(option.textContent).toContain('Administrador')
    fireEvent.click(option)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockLinkStaff).toHaveBeenCalledWith('sm-1', 'u-boss'))
  })

  it('an administrator that already is a professional is shown as such, not hidden (edge case)', async () => {
    const boss = { ...ana, userId: 'u-boss', name: 'Jefa', email: 'jefa@example.com', roles: ['admin'] }
    mockListAdminUsers.mockResolvedValue([ana, boss])
    mockLinkedIds.mockResolvedValue(['u-boss'])
    await openPopup()
    const option = screen.getByRole('option', { name: /Jefa/ })
    expect(option).toHaveAttribute('aria-disabled', 'true')
    expect(option.textContent).toContain('Ya es profesional')
  })

  it('typing filters the list, ignoring accents and case; no match says so (edge cases)', async () => {
    await openPopup()
    fireEvent.change(screen.getByLabelText('Buscar cuenta'), { target: { value: 'MAXI@' } })
    expect(screen.getByRole('option', { name: /Maxi Insfran/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ana/ })).toBeNull()
    fireEvent.change(screen.getByLabelText('Buscar cuenta'), { target: { value: 'zzz' } })
    expect(screen.getByText('No encontramos cuentas con ese criterio.')).toBeInTheDocument()
  })

  it('Guardar needs an account chosen (edge case)', async () => {
    await openPopup()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  })

  it('saving links the account, closes the pop-up and asks whether to go to Profesionales', async () => {
    await openPopup()
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(mockLinkStaff).toHaveBeenCalledWith('sm-1', 'u-maxi'))
    expect(await screen.findByText('Cuenta vinculada: Lucía Fernández ahora usa la cuenta de Maxi Insfran.')).toBeInTheDocument()
    expect(await screen.findByText('Profesional vinculado')).toBeInTheDocument()
    expect(screen.getByText(/¿Querés ir a Profesionales para configurar a Lucía Fernández/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Vincular una cuenta a Lucía Fernández' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ir a Profesionales' }))
    expect(mockNavigate).toHaveBeenCalledWith('/admin/staff')
  })

  it('"Ahora no" stays on Usuarios y roles (edge case)', async () => {
    await openPopup()
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ahora no' }))
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.queryByText('Profesional vinculado')).toBeNull()
  })

  it('the list is refreshed after linking (edge case)', async () => {
    await openPopup()
    mockListStaff.mockResolvedValue([{ ...lucia, profileUserId: 'u-maxi' }, already])
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('Profesional vinculado')
    expect(screen.queryByRole('button', { name: 'Vincular cuenta a Lucía Fernández' })).toBeNull()
  })

  it('shows the error and keeps the pop-up open when linking fails (edge case)', async () => {
    mockLinkStaff.mockRejectedValue(new Error('Esa cuenta ya está vinculada a otro profesional.'))
    await openPopup()
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Esa cuenta ya está vinculada a otro profesional.')
    expect(screen.getByRole('dialog', { name: 'Vincular una cuenta a Lucía Fernández' })).toBeInTheDocument()
    expect(screen.queryByText('Profesional vinculado')).toBeNull()
  })

  it('Cancelar and Escape close it without linking (edge case)', async () => {
    await openPopup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: /Vincular una cuenta/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Vincular cuenta a Lucía Fernández' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /Vincular una cuenta/ })).toBeNull()
    expect(mockLinkStaff).not.toHaveBeenCalled()
  })

  it('says so when every account is already linked (edge case)', async () => {
    mockListAdminUsers.mockResolvedValue([bruno])
    await openPopup()
    expect(screen.getByText(/todas ya están vinculadas a un profesional/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('does not offer an account that already has a professional the Profesionales list hides (edge case)', async () => {
    // Maxi has a professional record but lost the staff role: the staff list does not return it,
    // only the dedicated list of linked accounts knows
    mockListStaff.mockResolvedValue([lucia])
    mockLinkedIds.mockResolvedValue(['u-maxi'])
    await openPopup()
    const maxiOption = screen.getByRole('option', { name: /Maxi Insfran/ })
    expect(maxiOption).toHaveAttribute('aria-disabled', 'true')
    expect(maxiOption.textContent).toContain('Ya es profesional')
    expect(screen.getByRole('option', { name: /Ana/ })).not.toHaveAttribute('aria-disabled')
  })

  it('if linking is rejected because the account was taken, the list is refreshed and the choice dropped (edge case)', async () => {
    mockListStaff.mockResolvedValue([lucia])
    mockLinkedIds.mockResolvedValue([])
    mockLinkStaff.mockRejectedValue(new Error('Esa cuenta ya tiene un profesional.'))
    await openPopup()
    fireEvent.click(screen.getByRole('option', { name: /Maxi Insfran/ }))
    mockLinkedIds.mockResolvedValue(['u-maxi']) // what the server knows now
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Esa cuenta ya tiene un profesional.')
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Maxi Insfran/ })).toHaveAttribute('aria-disabled', 'true'),
    )
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('works when the list of linked accounts cannot be loaded, using the professionals it has (edge case)', async () => {
    mockLinkedIds.mockRejectedValue(new Error('down'))
    mockListStaff.mockResolvedValue([lucia, already])
    await openPopup()
    expect(screen.getByRole('option', { name: /Bruno López/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('option', { name: /Maxi Insfran/ })).not.toHaveAttribute('aria-disabled')
  })

  it('opening the pop-up re-reads which accounts are taken, so a stale page does not offer or block wrongly (edge case)', async () => {
    mockLinkedIds.mockResolvedValue(['u-maxi']) // when the page loaded Maxi still had a professional
    renderPage()
    const open = await screen.findByRole('button', { name: 'Vincular cuenta a Lucía Fernández' })
    mockLinkedIds.mockResolvedValue([]) // meanwhile it was cleaned up in the database
    fireEvent.click(open)
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Maxi Insfran/ })).not.toHaveAttribute('aria-disabled'),
    )
  })
})

describe('AdminUsersPage — "Agregar usuario" is a pop-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana])
    mockListInvitations.mockResolvedValue([])
  })

  async function openInvitePopup() {
    renderPage()
    await screen.findByText('Ana')
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar usuario' }))
    return screen.findByRole('dialog', { name: 'Agregar usuario' })
  }

  it('opens as a modal dialog over the list, with the email field ready', async () => {
    const dialog = await openInvitePopup()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.parentElement?.className).toContain('fixed inset-0')
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('is a bottom sheet on phones and a centered card on larger screens', async () => {
    const dialog = await openInvitePopup()
    expect(dialog.parentElement?.className).toContain('items-end')
    expect(dialog.parentElement?.className).toContain('sm:items-center')
    expect(dialog.className).toContain('rounded-t-2xl')
    expect(dialog.className).toContain('sm:rounded-2xl')
    expect(dialog.className).toContain('max-h-[92dvh]')
  })

  it('Cancelar and Escape close it without saving (edge case)', async () => {
    await openInvitePopup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Agregar usuario' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar usuario' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Agregar usuario' })).toBeNull()
    expect(mockInviteUser).not.toHaveBeenCalled()
  })

  it('shows the errors inside the pop-up, not behind it (edge case)', async () => {
    mockInviteUser.mockRejectedValue(new Error('Ya hay una invitación pendiente para ese email.'))
    const dialog = await openInvitePopup()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(dialog).toHaveTextContent('Ya hay una invitación pendiente para ese email.'))
    expect(screen.getAllByText('Ya hay una invitación pendiente para ese email.')).toHaveLength(1)
  })

  it('an email that already has an account points to Editar roles from inside the pop-up (edge case)', async () => {
    mockInviteUser.mockResolvedValue({ status: 'exists', userId: 'u-1' })
    const dialog = await openInvitePopup()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    const link = await screen.findByRole('link', { name: 'Ir a Editar roles de esa cuenta' })
    expect(dialog).toContainElement(link)
    expect(link).toHaveAttribute('href', '/admin/users/u-1')
  })

  it('it closes by itself after saving and the success notice shows on the page', async () => {
    mockInviteUser.mockResolvedValue({ status: 'invited', invitationId: 'i1' })
    await openInvitePopup()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/Listo\. Cuando nora@mail\.com entre a la app/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Agregar usuario' })).toBeNull()
  })

  it('needs at least one role, saying so inside the pop-up (edge case)', async () => {
    const dialog = await openInvitePopup()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nora@mail.com' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cliente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(dialog).toHaveTextContent('Elegí al menos un rol.')
    expect(mockInviteUser).not.toHaveBeenCalled()
  })
})

describe('AdminUsersPage — "Editar roles" is a pop-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAdminUsers.mockResolvedValue([ana])
    mockListInvitations.mockResolvedValue([])
  })

  it('opens the editor over the list instead of navigating', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar roles de Ana' }))
    const dialog = await screen.findByRole('dialog', { name: 'Ana' })
    expect(dialog).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Cliente' })).toBeChecked()
  })

  it('closing it goes back to the list (edge case)', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar roles de Ana' }))
    await screen.findByRole('dialog', { name: 'Ana' })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog', { name: 'Ana' })).toBeNull()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('opening /admin/users/:userId shows the list with that editor already open, and closing returns to /admin/users (edge case)', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users/u-1']}>
        <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
          <Routes>
            <Route path="/admin/users/:userId" element={<AdminUsersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )
    await screen.findByRole('dialog', { name: 'Ana' })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(mockNavigate).toHaveBeenCalledWith('/admin/users', { replace: true })
  })
})
