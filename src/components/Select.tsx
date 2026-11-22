import { Children, isValidElement, type ReactNode } from 'react'
import { Listbox, type ListboxOption } from './Listbox'

interface SelectChangeEvent {
  target: { name: string; value: string }
}

interface SelectProps {
  id?: string
  name?: string
  value: string | number
  /** Receives something shaped like a change event, so `e.target.value` keeps working. */
  onChange?: (event: SelectChangeEvent) => void
  disabled?: boolean
  /** Accessible name when there is no <label htmlFor>. */
  'aria-label'?: string
  /** Extra classes for the wrapper (e.g. "mt-1"). */
  wrapperClassName?: string
  /** Ignored: the drop-down has its own style. Kept so existing calls do not break. */
  className?: string
  /** <option value="...">Label</option> elements, like a native select. */
  children?: ReactNode
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

/** Options from <option> children (also inside fragments or arrays). */
function optionsFrom(children: ReactNode): ListboxOption[] {
  const options: ListboxOption[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) return
    if (child.type === 'option') {
      options.push({ value: String(child.props.value ?? textOf(child.props.children)), label: textOf(child.props.children) })
    } else if (child.props.children) {
      options.push(...optionsFrom(child.props.children))
    }
  })
  return options
}

/**
 * The app's drop-down: same API as a native <select> with <option> children, but the open list is
 * styled like the rest of the app instead of the browser's own menu.
 */
export function Select({ id, name = '', value, onChange, disabled, wrapperClassName, children, ...rest }: SelectProps) {
  return (
    <Listbox
      id={id}
      value={String(value)}
      disabled={disabled}
      className={wrapperClassName}
      ariaLabel={rest['aria-label']}
      options={optionsFrom(children)}
      onChange={(next) => onChange?.({ target: { name, value: next } })}
    />
  )
}
