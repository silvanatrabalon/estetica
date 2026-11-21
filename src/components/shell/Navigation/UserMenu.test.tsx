import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { UserMenu } from './UserMenu'
import { TestUserProvider } from '../../../hooks/__test-utils__/test-providers'
import { ShellProvider } from '../../../features/shell/context'
import type { AppRole } from '../../../context/UserContext'

const PHOTO = 'https://lh3.googleusercontent.com/a/photo'

function makeUser(metadata: Record<string, unknown> = { avatar_url: PHOTO }): User {
  return { id: 'u1', email: 'ana@example.com', user_metadata: metadata } as unknown as User
}

function renderMenu(roles: AppRole[], user: User = makeUser()) {
  return render(
    <MemoryRouter>
      <TestUserProvider
        user={user}
        roles={roles}
        profile={{ userId: 'u1', name: 'Ana Pérez', phone: null }}
      >
        <ShellProvider>
          <UserMenu user={user} />
        </ShellProvider>
      </TestUserProvider>
    </MemoryRouter>,
  )
}

describe('UserMenu avatar', () => {
  it('shows the Google photo for admins', () => {
    renderMenu(['admin'])
    expect(screen.getByRole('img', { name: 'Ana Pérez' })).toHaveAttribute('src', PHOTO)
  })

  it('shows the Google photo for staff', () => {
    renderMenu(['staff'])
    expect(screen.getByRole('img', { name: 'Ana Pérez' })).toBeInTheDocument()
  })

  it('keeps initials for customers even if Google provides a photo', () => {
    renderMenu(['customer'])
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('AP')).toBeInTheDocument()
  })

  it('falls back to initials when the user has no photo (edge case)', () => {
    renderMenu(['admin'], makeUser({}))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('AP')).toBeInTheDocument()
  })

  it('falls back to initials when the photo fails to load (edge case)', () => {
    renderMenu(['admin'])
    fireEvent.error(screen.getByRole('img', { name: 'Ana Pérez' }))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('AP')).toBeInTheDocument()
  })

  it('does not load the image with a referrer, so Google does not block it', () => {
    renderMenu(['admin'])
    expect(screen.getByRole('img', { name: 'Ana Pérez' })).toHaveAttribute('referrerpolicy', 'no-referrer')
  })
})
