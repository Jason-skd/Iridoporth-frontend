import { CaretDown } from '@phosphor-icons/react'

type ScrollHintProps = {
  onClick?: () => void
  label?: string
  className?: string
}

export function ScrollHint({ onClick, label, className }: ScrollHintProps) {
  return (
    <button
      type="button"
      className={`scroll-hint ${className ?? ''}`.trim()}
      aria-label={label ?? 'Scroll down'}
      onClick={onClick}
    >
      <CaretDown size={24} weight="regular" aria-hidden="true" />
    </button>
  )
}
