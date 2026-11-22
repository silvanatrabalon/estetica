import { fireEvent, screen } from '@testing-library/react'

/** Opens the app's drop-down found by its label and chooses an option by its visible name. */
export async function pickOption(label: string | RegExp, option: string | RegExp) {
  fireEvent.click(await screen.findByLabelText(label))
  fireEvent.click(await screen.findByRole('option', { name: option }))
}

/** Opens the drop-down found by its label and returns the visible option names. */
export async function listOptions(label: string | RegExp): Promise<string[]> {
  fireEvent.click(await screen.findByLabelText(label))
  const list = await screen.findByRole('listbox')
  return Array.from(list.querySelectorAll('[role="option"]')).map((o) => o.textContent?.trim() ?? '')
}
