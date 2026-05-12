import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProfilePage } from './ProfilePage'

const mockUseUser = vi.fn()
const mockUpdateMyProfile = vi.fn()

vi.mock('../hooks/useUser', () => ({
  useUser: () => mockUseUser(),
}))

vi.mock('../services/profile', () => ({
  updateMyProfile: (...args: unknown[]) => mockUpdateMyProfile(...args),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue({
      profile: { userId: 'u-1', name: 'Ana', phone: null },
      profileStatus: 'incomplete',
      refreshProfile: vi.fn(async () => {}),
    })
  })

  it('shows setup CTA when profile is incomplete', () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Tu perfil está incompleto/)).toBeDefined()
    expect(screen.getByRole('link', { name: 'configuración de perfil' })).toBeDefined()
  })

  it('updates own profile data', async () => {
    mockUpdateMyProfile.mockResolvedValue({})

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Teléfono (opcional)'), {
      target: { value: '+54 9 11 0000 0000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => {
      expect(mockUpdateMyProfile).toHaveBeenCalled()
    })
  })
})
