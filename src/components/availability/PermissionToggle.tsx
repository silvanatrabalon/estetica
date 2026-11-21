interface PermissionToggleProps {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Admin switch: lets a professional manage part of their own availability. */
export function PermissionToggle({ label, hint, checked, onChange }: PermissionToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-shell-border bg-shell-muted/30 px-3 py-2.5">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="text-sm font-medium text-shell-text">
        {label}
        <span className="block text-xs font-normal text-shell-subtleText">{hint}</span>
      </span>
    </label>
  )
}
