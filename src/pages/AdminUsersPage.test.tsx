import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminUsersPage } from './AdminUsersPage'

const mockListProfilesForAdmin = vi.fn()
const mockUpdateProfileByAdmin = vi.fn()

vi.mock('../services/profile', () => ({
  listProfilesForAdmin: (...args: unknown[]) => mockListProfilesForAdmin(...args),
  updateProfileByAdmin: (...args: unknown[]) => mockUpdateProfileByAdmin(...args),
}))

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads profile list and allows selecting a user', async () => {
    mockListProfilesForAdmin.mockResolvedValue([
      { userId: 'u-1', name: 'Ana', phone: null },
      { userId: 'u-2', name: 'Bruno', phone: '+54 11 9999 0000' },
    ])

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeDefined()
      expect(screen.getByText('Bruno')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /Bruno/ }))
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Bruno')
  })

  it('updates selected user profile fields', async () => {
    mockListProfilesForAdmin.mockResolvedValue([{ userId: 'u-1', name: 'Ana', phone: null }])
    mockUpdateProfileByAdmin.mockResolvedValue({ userId: 'u-1', name: 'Ana Maria', phone: null })

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ana')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Maria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil de usuario' }))

    await waitFor(() => {
      expect(mockUpdateProfileByAdmin).toHaveBeenCalledWith('u-1', {
        name: 'Ana Maria',
        phone: '',
      })
      expect(screen.getByText('Perfil de usuario actualizado correctamente.')).toBeDefined()
    })
  })
})
