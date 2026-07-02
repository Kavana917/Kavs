import { type CSSProperties } from 'react'
import './KineticMenuText.css'

type KineticMenuTextProps = {
  label: string
  active: boolean
  onClick: () => void
  tabIndex?: number
  phase?: number
  className?: string
}

function LetterGroup({ text }: { text: string }) {
  const chars = text.toUpperCase().split('')

  return (
    <>
      {chars.map((char, i) => (
        <span
          key={i}
          className="kinetic-menu-text__letter"
          style={{ '--i': i } as CSSProperties}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  )
}

export function KineticMenuText({
  label,
  active,
  onClick,
  tabIndex = 0,
  phase = 0,
  className = '',
}: KineticMenuTextProps) {
  const text = label.toUpperCase()

  return (
    <button
      type="button"
      className={`kinetic-menu-text${active ? ' kinetic-menu-text--active' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--phase': phase } as CSSProperties}
      onClick={onClick}
      tabIndex={tabIndex}
    >
      <span className="kinetic-menu-text__sr">{label}</span>

      <span className="kinetic-menu-text__stage" aria-hidden="true">
        <span className="kinetic-menu-text__ghost kinetic-menu-text__ghost--far">
          <LetterGroup text={text} />
        </span>
        <span className="kinetic-menu-text__ghost kinetic-menu-text__ghost--mid">
          <LetterGroup text={text} />
        </span>
        <span className="kinetic-menu-text__ghost kinetic-menu-text__ghost--near">
          <LetterGroup text={text} />
        </span>
        <span className="kinetic-menu-text__word">
          <LetterGroup text={text} />
        </span>
      </span>
    </button>
  )
}
