import { CaretDown } from '@phosphor-icons/react'

type ScrollHintProps = {
  className?: string
}

/**
 * Decorative chevron that hints at more content below the hero. Pure glyph,
 * not a button, so it reads as part of the composition rather than a control.
 * The next section also peeks into view, so the cue is reinforcement only.
 */
export function ScrollHint({ className }: ScrollHintProps) {
  return (
    <span
      className={`scroll-hint ${className ?? ''}`.trim()}
      aria-hidden="true"
    >
      <CaretDown size={44} weight="regular" />
    </span>
  )
}
