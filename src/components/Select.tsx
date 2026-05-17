import { SelectHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Extra classes applied to the wrapper div (e.g. "mt-1") */
  wrapperClassName?: string
}

export function Select({ className, wrapperClassName, style, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <select
        className={cn('w-full appearance-none', className)}
        // inline style ensures the right padding is never overridden by a px-* Tailwind class
        style={{ paddingRight: '2.25rem', ...style }}
        {...props}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400"
        aria-hidden="true"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  )
}
