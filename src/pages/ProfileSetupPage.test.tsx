import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProfileSetupPage } from './ProfileSetupPage'

const mockNavigate = vi.fn()
const mockUseUser = vi.fn()
const mockUpdateMyProfile = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../hooks/useUser', () => ({
  useUser: () => mockUseUser(),
}))

vi.mock('../services/profile', () => ({
  updateMyProfile: (...args: unknown[]) => mockUpdateMyProfile(...args),
}))

describe('ProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUser.mockReturnValue({
      user: {
        user_metadata: { name: 'Google User' },
      },
      profile: null,
      profileStatus: 'incomplete',
      refreshProfile: vi.fn(async () => {}),
    })
  })

  it('prefills name from Google metadata and allows submit', async () => {
    mockUpdateMyProfile.mockResolvedValue({})

    render(
      <MemoryRouter>
        <ProfileSetupPage />
      </MemoryRouter>,
    )

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement
    expect(nameInput.value).toBe('Google User')

    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))

    await waitFor(() => {
      expect(mockUpdateMyProfile).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true })
    })
  })

  it('shows load-error helper message and still renders form', () => {
    mockUseUser.mockReturnValue({
      user: { user_metadata: {} },
      profile: null,
      profileStatus: 'load-error',
      refreshProfile: vi.fn(async () => {}),
    })

    render(
      <MemoryRouter>
        <ProfileSetupPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Profile data could not be loaded. You can still submit this form.')).toBeDefined()
    expect(screen.getByLabelText('Name')).toBeDefined()
  })
})
